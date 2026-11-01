---
title: (Val & -Val) - 1 で「末尾の 0 の数」を popcount に変える
description: 下位から続く 0 の個数を数える countr_zero の constexpr 版です。最下位の 1 だけを取り出し、1 引いてマスクにしてから、その 1 の数を数えます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/bit.h
lines: [182, 196]
function: llvm::countr_zero_constexpr
difficulty: 2
format: 2
tags: [ビット演算, ハック, 標準ライブラリ]
---

## ひとことで

`countr_zero_constexpr` は、整数の **下位ビットから数えて 0 が何個続くか** を返します。
例: `40` は 2 進数で `101000` なので、答えは 3 です。`0` を渡すと、その型のビット数（32 ビットなら 32）を返します。

この関数はループを使わず、**「最下位の 1 を取り出して 1 引くと、下に 1 が並んだマスクになる」** という性質で、問題を popcount（1 の個数を数える）に変えて解きます。

## コード

::: code-group

```cpp:line-numbers=182 [日本語訳]
/// 最下位ビットから最上位に向かって 0 の数を数え、
/// 最初の 1 で止まる。
///
/// countr_zero の constexpr 版。
///
/// 符号なし整数型だけを受け付ける。
///
/// 入力が 0 のときは std::numeric_limits<T>::digits を返す。
template <typename T> [[nodiscard]] constexpr int countr_zero_constexpr(T Val) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  // "(Val & -Val) - 1" は、Val の最下位の 1 のビットの手前まで（そのビットは
  // 含まない）がすべて 1 のマスクを作る。
  return llvm::popcount(static_cast<std::make_unsigned_t<T>>((Val & -Val) - 1));
}
```

```cpp:line-numbers=182 [原文]
/// Count number of 0's from the least significant bit to the most
/// stopping at the first 1.
///
/// A constexpr version of countr_zero.
///
/// Only unsigned integral types are allowed.
///
/// Returns std::numeric_limits<T>::digits on an input of 0.
template <typename T> [[nodiscard]] constexpr int countr_zero_constexpr(T Val) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  // "(Val & -Val) - 1" generates a mask with all bits set up to (but not
  // including) the least significant set bit of Val.
  return llvm::popcount(static_cast<std::make_unsigned_t<T>>((Val & -Val) - 1));
}
```

:::

## 前提知識

- **`constexpr` 関数**: コンパイル時にも計算できる関数です。定数の計算やテンプレート引数の中で使えます。
- **`template <typename T>`**: どの整数型でも使えるようにする仕組みです。
- **符号なし整数の `-Val`**: 符号なし整数にマイナスを付けると、`2^n - Val` という「巻き戻った」正の数になります。2 の補数表現では「全ビット反転して 1 足す」と同じです。
- **整数昇格**: `uint8_t` や `uint16_t` のような小さい型は、計算のときに自動で `int` に広げられます。
- **`std::make_unsigned_t<T>`**: 型 `T` の符号なし版です。
- **`llvm::popcount`**: 1 のビットの個数を返す関数です。

## 何をしているか

### 1. 最下位の 1 だけを残す: `Val & -Val`

```cpp:line-numbers=195
  return llvm::popcount(static_cast<std::make_unsigned_t<T>>((Val & -Val) - 1));
```

`Val = 40`（8 ビットで `0010 1000`）とします。

```
 Val        = 0010 1000
-Val        = 1101 1000   （反転 1101 0111 に 1 を足す）
Val & -Val  = 0000 1000   ← 最下位の 1 だけが残る
```

`-Val` は「反転して 1 足す」なので、最下位の 1 より下は `Val` と同じ 0、最下位の 1 の位置も同じ 1、それより上はすべて反転しています。AND をとると、最下位の 1 だけが残ります。

### 2. 1 引いてマスクにする: `- 1`

```
0000 1000 - 1 = 0000 0111
```

最下位の 1 より **下のビットがすべて 1** になりました。この 1 の個数こそ、末尾に続いていた 0 の個数です。

### 3. 1 の個数を数える

```cpp:line-numbers=195
  return llvm::popcount(static_cast<std::make_unsigned_t<T>>((Val & -Val) - 1));
```

`popcount(0000 0111)` = 3。これが答えです。

### 4. 0 を渡したとき

`0 & -0 = 0`、`0 - 1` は全ビット 1 になります。popcount は型のビット数（8 ビットなら 8）を返し、ドキュメント通りの結果になります。特別扱いの `if` が要りません。

### 5. `static_cast` が必要な理由

`T` が `uint8_t` だと、`-Val` や `- 1` の計算は `int` に昇格して行われます。`0 - 1` は `int` の `-1` です。
`static_cast<std::make_unsigned_t<T>>` で `uint8_t` に戻すと `0xFF` になり、popcount が正しく 8 を返します。

## ここがすごい

- **問題の言い換え**: 「0 が何個続くか」を「マスクの 1 は何個か」に変えることで、すでにある popcount を使い回しています。ループで 1 ビットずつ調べる必要がありません。
- **0 の特別扱いが自然に消える**: 多くの実装は `if (Val == 0) return 32;` を書きますが、この式はそれも含めて正しい値になります。
- **constexpr 版と高速版の分担**: すぐ下の `countr_zero`は CPU 命令になる組み込み関数を使いますが、それらは `constexpr` で使えないことがあります。この関数は、コンパイル時計算用の代わりと、組み込み関数がない環境の最終手段を兼ねています。
- **コメントが式の意味を説明**: 関数の中のコメントに「最下位の 1 の手前までが 1 のマスクになる」と書かれていて、トリックが読み解けるようになっています。

## まとめ

- `x & -x` は最下位の 1 だけを取り出す定番の式。
- そこから 1 引くと、その下がすべて 1 のマスクになる。
- 問題を既存の関数（ここでは popcount）に言い換えると、実装が短くなる。
- 小さい整数型は計算時に `int` に昇格するので、結果を元の型に戻すキャストが要ることがある。

