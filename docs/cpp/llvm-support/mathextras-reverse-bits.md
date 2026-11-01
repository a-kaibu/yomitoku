---
title: マクロ 3 段で 256 個の表を生む、ビット反転の二段構え
description: 整数のビットの並びを左右逆にする reverseBits。使えればコンパイラ組み込み関数、なければマクロで作った 256 要素の表を引く、という二段構えの実装。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [105, 143]
function: llvm::reverseBits
difficulty: 2
tags: [ビット演算, マクロ, 移植性]
format: 2
---

## ひとことで

`reverseBits` は、整数のビットの並びを**左右反転**する関数です。
たとえば 8 ビットの `00000001` は `10000000` に、`00001101` は `10110000` になります。

コンパイラが専用の組み込み関数を持っていればそれを使い、なければ「1 バイト分の答えを全部並べた表」を引いて計算します。その表をマクロでわずか数行で生成しているのが見どころです。

## コード

::: code-group

```cpp:line-numbers=105 [日本語訳]
/// マクロで圧縮して書いた、256 通りのビット反転表。
///
/// http://graphics.stanford.edu/~seander/bithacks.html#BitReverseTable
static const unsigned char BitReverseTable256[256] = {
#define R2(n) n, n + 2 * 64, n + 1 * 64, n + 3 * 64
#define R4(n) R2(n), R2(n + 2 * 16), R2(n + 1 * 16), R2(n + 3 * 16)
#define R6(n) R4(n), R4(n + 2 * 4), R4(n + 1 * 4), R4(n + 3 * 4)
  R6(0), R6(2), R6(1), R6(3)
#undef R2
#undef R4
#undef R6
};

/// \p Val のビットを反転する。
template <typename T> constexpr T reverseBits(T Val) {
#if __has_builtin(__builtin_bitreverse8)
  if constexpr (std::is_same_v<T, uint8_t>)
    return __builtin_bitreverse8(Val);
#endif
#if __has_builtin(__builtin_bitreverse16)
  if constexpr (std::is_same_v<T, uint16_t>)
    return __builtin_bitreverse16(Val);
#endif
#if __has_builtin(__builtin_bitreverse32)
  if constexpr (std::is_same_v<T, uint32_t>)
    return __builtin_bitreverse32(Val);
#endif
#if __has_builtin(__builtin_bitreverse64)
  if constexpr (std::is_same_v<T, uint64_t>)
    return __builtin_bitreverse64(Val);
#endif

  unsigned char in[sizeof(Val)];
  unsigned char out[sizeof(Val)];
  std::memcpy(in, &Val, sizeof(Val));
  for (unsigned i = 0; i < sizeof(Val); ++i)
    out[(sizeof(Val) - i) - 1] = BitReverseTable256[in[i]];
  std::memcpy(&Val, out, sizeof(Val));
  return Val;
```

```cpp:line-numbers=105 [原文]
/// Macro compressed bit reversal table for 256 bits.
///
/// http://graphics.stanford.edu/~seander/bithacks.html#BitReverseTable
static const unsigned char BitReverseTable256[256] = {
#define R2(n) n, n + 2 * 64, n + 1 * 64, n + 3 * 64
#define R4(n) R2(n), R2(n + 2 * 16), R2(n + 1 * 16), R2(n + 3 * 16)
#define R6(n) R4(n), R4(n + 2 * 4), R4(n + 1 * 4), R4(n + 3 * 4)
  R6(0), R6(2), R6(1), R6(3)
#undef R2
#undef R4
#undef R6
};

/// Reverse the bits in \p Val.
template <typename T> constexpr T reverseBits(T Val) {
#if __has_builtin(__builtin_bitreverse8)
  if constexpr (std::is_same_v<T, uint8_t>)
    return __builtin_bitreverse8(Val);
#endif
#if __has_builtin(__builtin_bitreverse16)
  if constexpr (std::is_same_v<T, uint16_t>)
    return __builtin_bitreverse16(Val);
#endif
#if __has_builtin(__builtin_bitreverse32)
  if constexpr (std::is_same_v<T, uint32_t>)
    return __builtin_bitreverse32(Val);
#endif
#if __has_builtin(__builtin_bitreverse64)
  if constexpr (std::is_same_v<T, uint64_t>)
    return __builtin_bitreverse64(Val);
#endif

  unsigned char in[sizeof(Val)];
  unsigned char out[sizeof(Val)];
  std::memcpy(in, &Val, sizeof(Val));
  for (unsigned i = 0; i < sizeof(Val); ++i)
    out[(sizeof(Val) - i) - 1] = BitReverseTable256[in[i]];
  std::memcpy(&Val, out, sizeof(Val));
  return Val;
```

:::

## 前提知識

- **`#define` マクロ**: コンパイル前にテキストを置き換える仕組みです。`R2(n)` と書くと、`n, n + 2 * 64, ...` に機械的に展開されます。`#undef` で定義を取り消します。
- **`static const unsigned char 配列[256]`**: 書き換えない 256 要素のバイト配列です。`static` はこのファイルの中だけで使う、という意味です。
- **`#if __has_builtin(...)`**: コンパイラがその組み込み関数（コンパイラが特別に知っている関数）を持っているか、コンパイル前に調べます。
- **`if constexpr`**: 条件をコンパイル時に判定し、偽の側のコードを捨てる `if` です。型ごとに処理を切り替えるときに使います。
- **`std::is_same_v<T, uint8_t>`**: 型 `T` が `uint8_t` と同じなら `true` になるコンパイル時の値です。
- **`std::memcpy`**: メモリをバイト単位でコピーします。整数をバイト列として扱いたいときの安全な方法です。

## 何をしているか

### 1. 表をマクロで作る

```cpp:line-numbers=108
static const unsigned char BitReverseTable256[256] = {
#define R2(n) n, n + 2 * 64, n + 1 * 64, n + 3 * 64
#define R4(n) R2(n), R2(n + 2 * 16), R2(n + 1 * 16), R2(n + 3 * 16)
#define R6(n) R4(n), R4(n + 2 * 4), R4(n + 1 * 4), R4(n + 3 * 4)
  R6(0), R6(2), R6(1), R6(3)
#undef R2
#undef R4
#undef R6
};
```

`BitReverseTable256[i]` には「`i` のビットを反転した値」が入ります。256 個を手で書く代わりに、マクロを 3 段重ねています。

いちばん内側の `R2(n)` は `n, n+128, n+64, n+192` の 4 つに展開されます。128 は `10000000`、64 は `01000000` なので、これは「下位 2 ビットが 00, 01, 10, 11 の数を反転すると、上位 2 ビットが 00, 10, 01, 11 になる」ことをそのまま書いたものです。

`R4` は入力の 3〜2 ビット目を担当し、出力の 32・16 の位を決めます（`+ 2 * 16` や `+ 1 * 16`）。`R6` は入力の 5〜4 ビット目を担当し、出力の 8・4 の位を決めます。そして配列の中身として書かれた `R6(0), R6(2), R6(1), R6(3)` が入力の最上位 2 ビットを担当し、出力の 2・1 の位を決めています。

試しに `i = 1` を追うと、`R6(0)` → `R4(0)` → `R2(0)` の 2 番目、つまり `0 + 128 = 128`（`10000000`）になります。`00000001` の反転として正しい値です。

### 2. 組み込み関数があれば即座に返す

```cpp:line-numbers=120
#if __has_builtin(__builtin_bitreverse8)
  if constexpr (std::is_same_v<T, uint8_t>)
    return __builtin_bitreverse8(Val);
#endif
#if __has_builtin(__builtin_bitreverse16)
  if constexpr (std::is_same_v<T, uint16_t>)
    return __builtin_bitreverse16(Val);
#endif
#if __has_builtin(__builtin_bitreverse32)
  if constexpr (std::is_same_v<T, uint32_t>)
    return __builtin_bitreverse32(Val);
#endif
#if __has_builtin(__builtin_bitreverse64)
  if constexpr (std::is_same_v<T, uint64_t>)
    return __builtin_bitreverse64(Val);
#endif
```

Clang などには `__builtin_bitreverse32` のような組み込み関数があり、CPU の反転命令に変換されることがあります。`T` が `uint32_t` なら `if constexpr (std::is_same_v<T, uint32_t>)` が真になり、そのまま返ります。

### 3. なければ表を引く

```cpp:line-numbers=137
  unsigned char in[sizeof(Val)];
  unsigned char out[sizeof(Val)];
  std::memcpy(in, &Val, sizeof(Val));
  for (unsigned i = 0; i < sizeof(Val); ++i)
    out[(sizeof(Val) - i) - 1] = BitReverseTable256[in[i]];
  std::memcpy(&Val, out, sizeof(Val));
  return Val;
```

`uint16_t` の `0x0102` で考えます。最初の `memcpy` でバイト列 `in` にコピーし、`for` ループで「バイトの順番を逆にしながら、各バイトを表で反転」します。

- バイト `0x01` → 表で `0x80`
- バイト `0x02` → 表で `0x40`

置き場所も前後逆にするので、全体として 16 ビットがきれいに反転します。最後の `memcpy` で整数に書き戻して完成です。

## ここがすごい

- **表を「計算でなく展開」で作る**: 256 個の数字を手書きすると打ち間違いが怖いですが、マクロなら規則そのものを書くだけです。数行で済み、しかもコンパイル時に全部埋まるので実行時の初期化コストもありません。
- **1 バイトずつ表を引く**: 素直に書くと「1 ビットずつ取り出して逆側に置く」ループになり、64 ビットなら 64 回まわります。表を使えば 8 回の表引きで済みます。256 要素（256 バイト）なら表も小さく、キャッシュにも乗りやすい大きさです。
- **移植性と速さの両立**: `__has_builtin` で「使えるなら最速の道、なければ確実な道」を選びます。どのコンパイラでも同じ結果が得られます。
- **`memcpy` でバイトに分解**: ポインタを別の型に読み替えるより安全で、コンパイラもうまく最適化できる定番の書き方です。

## まとめ

- 規則のある大きな表は、マクロの入れ子で短く生成できる。
- ビット単位の処理は「バイト単位の表引き」にすると繰り返しが 8 分の 1 になる。
- `__has_builtin` と `if constexpr` で、環境ごとに最適な実装を選べる。
- バイト列への分解は `memcpy` を使うと安全。
