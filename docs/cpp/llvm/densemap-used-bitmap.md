---
title: 32 ビットの束で使用中バケツを管理し、1 のビットだけ高速に巡回する
description: DenseMap はどのバケツが使用中かを uint32_t のビット配列で持ちます。I>>5 と I&31 でビットを指し、Bits &= Bits-1 で 1 のビットだけを順に訪ねます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/DenseMap.h
lines: [108, 142]
function: densemap::detail::forEachUsed
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

DenseMap は、どのバケツに要素が入っているかを **1 バケツ 1 ビットの配列** で覚えています。
ここではそのビット配列を読む・立てる・下ろす小さな関数と、**使用中のバケツだけを順に訪ねる `forEachUsed`** が定義されています。

## コード

::: code-group

```cpp:line-numbers=108 [日本語訳]
using UsedT = uint32_t;

// N 個のバケツを支える使用中フラグの語数。N は 0 か 2 のべき乗。
constexpr size_t usedWords(size_t N) {
  assert((N == 0 || isPowerOf2_64(N)) &&
         "bucket count must be zero or a power of two");
  return (N + 31) / 32;
}

inline bool used(const UsedT *U, size_t I) {
  return (U[I >> 5] >> (I & 31)) & 1;
}
inline void setUsed(UsedT *U, size_t I) { U[I >> 5] |= UsedT(1) << (I & 31); }
inline void unsetUsed(UsedT *U, size_t I) {
  U[I >> 5] &= ~(UsedT(1) << (I & 31));
}
inline void clearUsed(UsedT *U, unsigned Num) {
  std::memset(U, 0, usedWords(Num) * sizeof(UsedT));
}

// [0, N) の使用中のバケツ番号 I ごとに Func(I) を呼ぶ。always_inline にしておく。
// そうしないと、moveFrom の再ハッシュのような重い呼び出し元では、インライン化されずに
// 関数呼び出しのまま残り、要素ごとの呼び出しが本来の処理より重くなってしまう。
template <typename Fn>
LLVM_ATTRIBUTE_ALWAYS_INLINE void forEachUsed(const UsedT *U, unsigned N,
                                              Fn Func) {
  const unsigned NW = usedWords(N);
  for (unsigned W = 0; W != NW; ++W) {
    UsedT Bits = U[W];
    while (Bits) {
      Func((W << 5) + llvm::countr_zero(Bits));
      Bits &= Bits - 1;
    }
  }
}
```

```cpp:line-numbers=108 [原文]
using UsedT = uint32_t;

// Number of used words backing N buckets where N is zero or a power of two.
constexpr size_t usedWords(size_t N) {
  assert((N == 0 || isPowerOf2_64(N)) &&
         "bucket count must be zero or a power of two");
  return (N + 31) / 32;
}

inline bool used(const UsedT *U, size_t I) {
  return (U[I >> 5] >> (I & 31)) & 1;
}
inline void setUsed(UsedT *U, size_t I) { U[I >> 5] |= UsedT(1) << (I & 31); }
inline void unsetUsed(UsedT *U, size_t I) {
  U[I >> 5] &= ~(UsedT(1) << (I & 31));
}
inline void clearUsed(UsedT *U, unsigned Num) {
  std::memset(U, 0, usedWords(Num) * sizeof(UsedT));
}

// Invoke Func(I) for each occupied bucket index I in [0, N). Set always_inline;
// otherwise, for a heavy caller such as moveFrom's rehash, the inliner can
// leave it out of line and the per-element call dwarfs the work.
template <typename Fn>
LLVM_ATTRIBUTE_ALWAYS_INLINE void forEachUsed(const UsedT *U, unsigned N,
                                              Fn Func) {
  const unsigned NW = usedWords(N);
  for (unsigned W = 0; W != NW; ++W) {
    UsedT Bits = U[W];
    while (Bits) {
      Func((W << 5) + llvm::countr_zero(Bits));
      Bits &= Bits - 1;
    }
  }
}
```

:::

## 前提知識

- **`using UsedT = uint32_t;`**: 型に別名を付けます。`uint32_t` は 32 ビットの符号なし整数です。
- **`constexpr` 関数**: コンパイル時にも計算できる関数です。
- **`inline`**: ヘッダに関数本体を書いても、複数のファイルから読み込んでエラーにならないようにする指定です。
- **ラムダと `Fn Func`**: 呼び出し側は `[&](unsigned I) { ... }` のような無名関数を渡します。`Fn` はその型を受け取るテンプレート引数です。
- **ビット演算**: `>>` は右シフト、`&` は AND、`|=` は OR して代入、`~` は全ビット反転です。
- **`llvm::countr_zero(x)`**: `x` の下から何ビット 0 が続くか、つまり最も下の 1 の位置を返します。

## 何をしているか

### 1. 何語ぶん必要か

```cpp:line-numbers=111
constexpr size_t usedWords(size_t N) {
  assert((N == 0 || isPowerOf2_64(N)) &&
         "bucket count must be zero or a power of two");
  return (N + 31) / 32;
}
```

`(N + 31) / 32` は「`N` ビットを 32 ビットの語に入れると何語か」の切り上げです。バケツ 64 個なら 2 語です。

### 2. 1 ビットを指す

```cpp:line-numbers=117
inline bool used(const UsedT *U, size_t I) {
  return (U[I >> 5] >> (I & 31)) & 1;
}
inline void setUsed(UsedT *U, size_t I) { U[I >> 5] |= UsedT(1) << (I & 31); }
inline void unsetUsed(UsedT *U, size_t I) {
  U[I >> 5] &= ~(UsedT(1) << (I & 31));
}
```

バケツ番号 `I` のビットは、`I >> 5` 番目の語の、`I & 31` 番目のビットです。`>> 5` は 32 で割る、`& 31` は 32 で割った余りと同じです。

例: `I = 37` なら、語 1（`37 >> 5`）のビット 5（`37 & 31`）です。

- `used` はそのビットを右端までずらして `& 1` で取り出します。
- `setUsed` は `1 << (I & 31)` を OR して立てます。
- `unsetUsed` はそのビットだけ 0 のマスクを AND して下ろします。

### 3. 全部を 0 にする

```cpp:line-numbers=124
inline void clearUsed(UsedT *U, unsigned Num) {
  std::memset(U, 0, usedWords(Num) * sizeof(UsedT));
}
```

`memset` で必要な語数ぶんを一気に 0 にします。表の初期化はこれだけです。

### 4. 1 のビットだけを訪ねる

```cpp:line-numbers=131
template <typename Fn>
LLVM_ATTRIBUTE_ALWAYS_INLINE void forEachUsed(const UsedT *U, unsigned N,
                                              Fn Func) {
  const unsigned NW = usedWords(N);
  for (unsigned W = 0; W != NW; ++W) {
    UsedT Bits = U[W];
    while (Bits) {
      Func((W << 5) + llvm::countr_zero(Bits));
      Bits &= Bits - 1;
    }
  }
}
```

各語 `Bits` について、0 になるまで次を繰り返します。

1. `countr_zero(Bits)` で最も下の 1 の位置を得て、`(W << 5) + 位置` でバケツ番号にし、`Func` を呼びます。
2. `Bits &= Bits - 1` で、その最も下の 1 を消します。

`Bits = 0b10100` で追うと、位置 2 → `Bits` は `0b10000` → 位置 4 → `Bits` は `0` で終了です。0 のビットは 1 回も調べません。

## ここがすごい

- **空きを特別な値で表さない**: 古い DenseMap は「空き」を表す特別なキー（空キー）を型ごとに用意する必要がありました。ビット配列なら、どんなキーの型でも同じ仕組みで空きを判定できます。
- **疎な表で速い**: 全バケツを 1 つずつ見る代わりに、32 個ぶんを 1 語で判定し、1 のビットだけ訪ねます。空きが多い表の巡回やデストラクタが速くなります。
- **`x & (x-1)` の定番テクニック**: 「最も下の 1 を消す」古典的なビット演算で、ループ回数が「1 の個数」になります。
- **インライン化を強制する理由を書く**: `forEachUsed` の前のコメントには、`always_inline` にしないと重い呼び出し元でインライン化されず、要素ごとの関数呼び出しが本体の処理より重くなる、と書かれています。性能上の判断と理由がセットで残っています。

## まとめ

- フラグの集まりは整数のビット配列にすると、省メモリで一括処理もできる。
- 2 のべき乗での割り算・余りはシフトと AND で書ける。
- `x &= x - 1` と「最下位の 1 の位置」で、立っているビットだけを巡回できる。
- 小さな関数でも、インライン化の有無が性能を左右することがある。

