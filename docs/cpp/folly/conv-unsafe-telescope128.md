---
title: 128 ビット整数を「19 桁ずつ 3 つ」に割って文字列にする
description: 128 ビット整数を 10 進文字列にする unsafeTelescope128。重い 128 ビット演算は最大 2 回の割り算だけにして、残りは 64 ビットの高速な変換に任せる。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/Conv.h
lines: [355, 400]
function: folly::detail::unsafeTelescope128
difficulty: 3
format: 2
tags: [数値計算, 文字列処理, 最適化]
---

## ひとことで

`unsafeTelescope128` は、**128 ビットの符号なし整数** を 10 進数の文字列にして `outb` から書き込み、書いた文字数を返します。
128 ビットの最大値は 39 桁にもなります。この関数は数を **「10^19 を基数とした最大 3 つの部品」** に分け、それぞれを 64 ビット整数として変換してつなげます。

## コード

::: code-group

```cpp:line-numbers=355 [日本語訳]
inline size_t unsafeTelescope128(char* outb, char* oute, unsigned __int128 x) {
  using Usrc = unsigned __int128;

  // 入力を、64 ビット符号なし整数に収まる最大の 10 のべき乗を基数として
  // 最大 3 つの部品に分解し、各部品を 64 ビット演算で変換して
  // つなげる。
  constexpr static auto kBase = UINT64_C(10'000'000'000'000'000'000);
  constexpr static size_t kBaseDigits = 19;

  size_t p = 0;
  const auto leading = [&](Usrc v) {
    assert(v >> 64 == 0);
    p = detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb, oute, static_cast<uint64_t>(v));
  };
  const auto append = [&](uint64_t v) {
    assert(v < kBase);
    assert(outb + p + kBaseDigits <= oute);
    auto v64 = static_cast<uint64_t>(v);
    detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb + p, kBaseDigits, v64);
    p += kBaseDigits;
  };

  if (x >> 64 > 0) {
    const auto rem = static_cast<uint64_t>(x % kBase);
    x /= kBase;

    if (x >> 64 > 0) {
      const auto rem2 = static_cast<uint64_t>(x % kBase);
      x /= kBase;

      leading(x);
      append(rem2);
      append(rem);
      return p;
    }

    leading(x);
    append(rem);
    return p;
  }

  leading(x);
  return p;
}
```

```cpp:line-numbers=355 [原文]
inline size_t unsafeTelescope128(char* outb, char* oute, unsigned __int128 x) {
  using Usrc = unsigned __int128;

  // Decompose the input into at most 3 components using the largest power-of-10
  // base that fits in a 64-bit unsigned integer, and then convert the
  // components using 64-bit arithmetic and concatenate them.
  constexpr static auto kBase = UINT64_C(10'000'000'000'000'000'000);
  constexpr static size_t kBaseDigits = 19;

  size_t p = 0;
  const auto leading = [&](Usrc v) {
    assert(v >> 64 == 0);
    p = detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb, oute, static_cast<uint64_t>(v));
  };
  const auto append = [&](uint64_t v) {
    assert(v < kBase);
    assert(outb + p + kBaseDigits <= oute);
    auto v64 = static_cast<uint64_t>(v);
    detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb + p, kBaseDigits, v64);
    p += kBaseDigits;
  };

  if (x >> 64 > 0) {
    const auto rem = static_cast<uint64_t>(x % kBase);
    x /= kBase;

    if (x >> 64 > 0) {
      const auto rem2 = static_cast<uint64_t>(x % kBase);
      x /= kBase;

      leading(x);
      append(rem2);
      append(rem);
      return p;
    }

    leading(x);
    append(rem);
    return p;
  }

  leading(x);
  return p;
}
```

:::

## 前提知識

- **`unsigned __int128`**: GCC/Clang が提供する 128 ビットの符号なし整数型です。標準 C++ の型ではありません。64 ビット CPU では 128 ビットの割り算は遅く、ライブラリ関数の呼び出しになることが多いです。
- **`using Usrc = unsigned __int128;`**: 型に短い別名を付けています。
- **`UINT64_C(10'000'000'000'000'000'000)`**: 64 ビット符号なし整数の定数を作るマクロです。`'` は数字の区切りで、値には影響しません（C++14 以降）。これは `10^19` で、64 ビット（最大約 `1.8 × 10^19`）に収まる最大の 10 のべき乗です。
- **`constexpr static`**: コンパイル時に決まる定数です。
- **ラムダ式 `[&](Usrc v) { ... }`**: その場で作る無名関数です。`[&]` は「外側の変数を参照で使う」という意味で、中から `p` や `outb` を読み書きできます。
- **`x >> 64 > 0`**: 128 ビット値を 64 ビット右にずらして、上位 64 ビットに何か残っているか、つまり「64 ビットに収まらないか」を調べています。
- **`assert(条件)`**: デバッグビルドで条件をチェックし、偽なら停止します。
- **`to_ascii_with_route`**: Folly 内部の 64 ビット整数→文字列変換です。`(outb, oute, v)` の形は必要な桁数だけ書いて桁数を返し、`(outb, 桁数, v)` の形は指定した桁数ぴったりに **左を 0 で埋めて** 書きます。

## 何をしているか

### 1. 2 つの部品を作るラムダ

```cpp:line-numbers=364
  size_t p = 0;
  const auto leading = [&](Usrc v) {
    assert(v >> 64 == 0);
    p = detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb, oute, static_cast<uint64_t>(v));
  };
  const auto append = [&](uint64_t v) {
    assert(v < kBase);
    assert(outb + p + kBaseDigits <= oute);
    auto v64 = static_cast<uint64_t>(v);
    detail::to_ascii_with_route<10, to_ascii_alphabet_lower>(
        outb + p, kBaseDigits, v64);
    p += kBaseDigits;
  };
```

- `leading(v)`: 先頭の部品です。先頭の 0 は不要なので、必要な桁数だけ書きます（`p` に桁数が入る）。
- `append(v)`: 2 つ目以降の部品です。**必ず 19 桁** で書きます。たとえば部品が `42` なら `0000000000000000042` です。書いた分だけ `p` を進めます。

### 2. 大きさで 3 通りに分ける

```cpp:line-numbers=379
  if (x >> 64 > 0) {
    const auto rem = static_cast<uint64_t>(x % kBase);
    x /= kBase;

    if (x >> 64 > 0) {
      const auto rem2 = static_cast<uint64_t>(x % kBase);
      x /= kBase;

      leading(x);
      append(rem2);
      append(rem);
      return p;
    }

    leading(x);
    append(rem);
    return p;
  }

  leading(x);
  return p;
```

`B = 10^19` とします。

- **64 ビットに収まる場合**: `leading(x)` だけで終わりです。
- **上位がある場合**: `rem = x % B`、`x = x / B` として下 19 桁を取り分けます。
  - 割った残りが 64 ビットに収まれば、`leading(x)` と `append(rem)` の 2 部品。
  - まだ収まらなければ、もう一度割って `rem2` を取り分け、`leading(x)`、`append(rem2)`、`append(rem)` の 3 部品。

具体例として `x = 12340000000000000000042`（23 桁、64 ビットに収まらない）を考えます。

- `rem = x % 10^19 = 42`、`x / 10^19 = 1234`
- `1234` は 64 ビットに収まるので、`leading` で `"1234"` を書く
- `append(42)` で `"0000000000000000042"`（0 で埋めて 19 桁）を続ける

結果は `"12340000000000000000042"` で、元の数と一致します。

## ここがすごい

- **重い 128 ビット演算は最大 2 回**: 1 桁ずつ 128 ビットのまま 10 で割ると、39 桁なら 39 回の遅い割り算になります。ここでは 128 ビットの割り算は多くて 2 回で、残りはすべて 64 ビットの高速な変換です。
- **最大の基数を使う**: `10^19` は 64 ビットに入る最大の 10 のべき乗です。1 回の 128 ビット割り算で取り出せる桁数が最も多くなるので、部品の数と遅い割り算の回数を最小にできます。
- **0 埋めの使い分け**: 先頭の部品だけは 0 埋めなし、途中の部品は必ず 19 桁で 0 埋め、という区別が正しい結果の鍵です。`append` で 0 埋めを忘れると、上の例は `"123442"` になってしまいます。
- **ラムダで重複を消す**: 3 通りの分岐で同じ処理を繰り返すので、`leading` と `append` に切り出しています。どの分岐も「leading → append…」と読めるので、流れが明快です。
- **名前に `unsafe`**: 書き込み先の大きさは呼び出し側が保証する前提であることを、名前と `assert` で示しています。

## まとめ

- 大きな整数は「機械が得意なサイズに収まる最大の基数」で分割すると速く処理できる。
- 分割した部品をつなぐときは、途中の部品を固定長で 0 埋めする。
- 遅い演算（128 ビットの割り算）の回数を最小にするよう処理を組み立てる。
- 繰り返し出てくる処理は、外側の変数を参照するラムダにまとめると読みやすい。
