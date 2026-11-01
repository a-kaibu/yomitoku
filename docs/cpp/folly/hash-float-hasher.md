---
title: 0.0 と -0.0 を同じハッシュにする、浮動小数点数のハッシュ
description: double や float をハッシュ値に変える float_hasher。等しいとみなされる 0 と -0 のビット列の違いを先に吸収し、memcpy でビット列を取り出してから整数用のミキサーにかける。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/hash/Hash.h
lines: [329, 344]
function: folly::detail::float_hasher
difficulty: 2
format: 2
tags: [ハッシュ, 防御的プログラミング, 数値計算]
---

## ひとことで

`float_hasher<F>` は、`float` や `double` の値からハッシュ値を作る関数オブジェクトです。
やっていることは「数値のビット列を 64 ビット整数として取り出し、整数用のハッシュ関数で混ぜる」だけですが、その前に **`0.0` と `-0.0` を必ず同じハッシュ値にする** という 1 行が入っています。

## コード

::: code-group

```cpp:line-numbers=329 [日本語訳]
template <typename F>
struct float_hasher {
  using folly_is_avalanching = std::true_type;

  size_t operator()(F const& f) const noexcept {
    static_assert(sizeof(F) <= 8, "Input type is too wide");

    if (f == F{}) { // 0 と -0 が同じハッシュになるようにする。
      return 0;
    }

    uint64_t u64 = 0;
    memcpy(&u64, &f, sizeof(F));
    return static_cast<size_t>(hash::twang_mix64(u64));
  }
};
```

```cpp:line-numbers=329 [原文]
template <typename F>
struct float_hasher {
  using folly_is_avalanching = std::true_type;

  size_t operator()(F const& f) const noexcept {
    static_assert(sizeof(F) <= 8, "Input type is too wide");

    if (f == F{}) { // Ensure 0 and -0 get the same hash.
      return 0;
    }

    uint64_t u64 = 0;
    memcpy(&u64, &f, sizeof(F));
    return static_cast<size_t>(hash::twang_mix64(u64));
  }
};
```

:::

## 前提知識

- **関数オブジェクト**: `operator()` を持つ構造体は、`hasher(3.14)` のように関数として呼べます。ハッシュテーブルは、このような「ハッシュ関数役の型」をテンプレート引数として受け取ります。
- **`template <typename F>`**: `F` に `float` や `double` が入るテンプレートです。
- **`F{}`**: 型 `F` の値を初期化した値で、浮動小数点数なら `0.0` です。
- **符号付きゼロ**: IEEE 754 という浮動小数点数の規格では、`+0.0` と `-0.0` は **ビット列が違う**（先頭の符号ビットだけが違う）のに、`==` で比べると **等しい** とされます。
- **`memcpy(&u64, &f, sizeof(F))`**: `f` のメモリの中身を、そのまま `u64` にコピーします。`double` のビット列を整数として読むための、C++ で定義された安全な方法です。
- **`using folly_is_avalanching = std::true_type;`**: 「このハッシュは出力のビットがよく混ざっている（アバランシェ性がある）」という印です。Folly のハッシュテーブル（F14）はこの印を見て、ハッシュ値をさらに混ぜ直す処理が必要かどうかを決めます。
- **`static_assert`**: コンパイル時のチェックです。8 バイトを超える型（`long double` など）は `uint64_t` に収まらないので拒否しています。

## 何をしているか

### 1. ゼロを特別扱いする

```cpp:line-numbers=336
    if (f == F{}) { // Ensure 0 and -0 get the same hash.
      return 0;
    }
```

`f == F{}` は「`f` が 0 と等しいか」です。`+0.0` も `-0.0` もここで真になり、どちらも `0` を返します。

### 2. ビット列を整数に写す

```cpp:line-numbers=340
    uint64_t u64 = 0;
    memcpy(&u64, &f, sizeof(F));
```

`u64` を 0 で初期化してから、`f` のバイトをコピーします。`float`（4 バイト）のときは、残りのバイトは 0 のままです。

`double` の `1.0` なら、ビット列は `0x3FF0000000000000` です。

### 3. 整数ミキサーにかける

```cpp:line-numbers=342
    return static_cast<size_t>(hash::twang_mix64(u64));
```

`twang_mix64` は、64 ビット整数のビットを全体に行き渡るように混ぜる関数です。`1.0` と `2.0` のようにビット列の一部しか違わない値でも、まったく違うハッシュ値になります。

## ここがすごい

### 「等しいならハッシュも等しい」を守る

ハッシュテーブルには「`a == b` なら `hash(a) == hash(b)` でなければならない」という約束があります。これが破れると、入れたはずのキーが見つからなくなります。

ビット列をそのままハッシュにする素直な実装だと、

- `+0.0` → `0x0000000000000000`
- `-0.0` → `0x8000000000000000`

と別のハッシュ値になってしまいます。`map[0.0] = 1;` としたあと `map[-0.0]` を探すと、等しいキーなのに見つからない、という不具合です。`-0.0` は `-1.0 * 0.0` のような計算で普通に現れるので、現実に起こりうる問題です。

`if (f == F{})` の 1 行は、まさにこの問題を防いでいます。コメントも「0 と -0 が同じハッシュになるように」と目的を明記しています。

### ポインタのキャストを使わない

`*(uint64_t*)&f` のように書いてもビット列は読めそうに見えますが、C++ では型の別名規則に違反する未定義動作です。`memcpy` を使えば正しく、しかもコンパイラは最適化で単なるレジスタ間の移動に変えてくれます。

### 注意: NaN は別問題

NaN（非数）は `NaN == NaN` が偽になる特殊な値なので、そもそもハッシュテーブルのキーとして扱いにくい値です。この関数は NaN を特別扱いしていません。「等しいのにハッシュが違う」という問題を起こすのはゼロだけなので、ゼロだけを直しているわけです。

## まとめ

- ハッシュ関数は「等しい値は同じハッシュ」を必ず守る必要がある。
- 浮動小数点数の `+0.0` と `-0.0` は、等しいのにビット列が違う。
- 値のビット列を別の型として読むなら、ポインタのキャストではなく `memcpy` を使う。
- ビット列を取り出したら、整数用のよく混ぜる関数にかけて偏りをなくす。
