---
title: 割って掛ける切り上げを「足して下位ビットを消す」に変える
description: サイズを整列単位の倍数に切り上げる alignTo。整列単位が 2 の累乗だと保証された Align 型を受け取るので、割り算なしの AND 1 回で書ける。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Alignment.h
lines: [148, 161]
function: llvm::alignTo
difficulty: 1
tags: [ビット演算, メモリ管理, 最適化]
format: 2
---

## ひとことで

`alignTo(Size, A)` は、`Size` を**アラインメント `A` の倍数に切り上げ**ます。

`alignTo(13, Align(8))` は `16`、`alignTo(16, Align(8))` は `16`、`alignTo(0, Align(8))` は `0` です。
構造体のメンバーの配置やメモリ確保で、「この大きさを 8 バイト単位にそろえると何バイトか」を求めるのに使います。

## コード

::: code-group

```cpp:line-numbers=148 [日本語訳]
/// `Size` バイトを格納するのに必要な、A の倍数を返す。
constexpr inline uint64_t alignTo(uint64_t Size, Align A) {
  const uint64_t Value = A.value();
  // 次の行は `(Size + Value - 1) / Value * Value` と同じ意味。

  // 割り算の後に掛け算をするのは、右シフトの後に左シフトをするのと
  // 同じだと考えられる。それにより、切り上げで生じた余分なビットが 0 になる。
  // `~(Value - 1)` は、0 にしたいビットがすべて
  // 0 になっているマスクである。

  // 多くのコンパイラはこのコードを生成できるが、複数の関数がインライン展開
  // されたときにはこのパターンを見逃すことがある。
  return (Size + Value - 1) & ~(Value - 1U);
}
```

```cpp:line-numbers=148 [原文]
/// Returns a multiple of A needed to store `Size` bytes.
constexpr inline uint64_t alignTo(uint64_t Size, Align A) {
  const uint64_t Value = A.value();
  // The following line is equivalent to `(Size + Value - 1) / Value * Value`.

  // The division followed by a multiplication can be thought of as a right
  // shift followed by a left shift which zeros out the extra bits produced in
  // the bump; `~(Value - 1)` is a mask where all those bits being zeroed out
  // are just zero.

  // Most compilers can generate this code but the pattern may be missed when
  // multiple functions gets inlined.
  return (Size + Value - 1) & ~(Value - 1U);
}
```

:::

## 前提知識

- **`Align`**: LLVM の型で、2 の累乗であることが保証されたアラインメント（整列単位）を表します。`A.value()` で 1, 2, 4, 8… といった値を取り出せます。
- **`constexpr inline`**: `constexpr` はコンパイル時にも計算できること、`inline` はヘッダに書いた関数を複数のファイルから使ってよいことを示します。
- **`&` と `~`**: ビットごとの AND と、ビット反転です。
- **`1U`**: 符号なしの `1` です。`Value - 1U` は符号なしのまま計算されます。
- **2 の累乗の性質**: `Value` が 2 の累乗なら、`Value - 1` は下位のビットがすべて 1 になります。8（`1000`）なら 7（`0111`）です。

## 何をしているか

### 1. 一般的な切り上げの式

```cpp:line-numbers=151
  // 次の行は `(Size + Value - 1) / Value * Value` と同じ意味。
```

コメントにある通り、この計算は本来 `(Size + Value - 1) / Value * Value` と同じです。「`Value - 1` を足してから割る」と切り上げになり、掛け戻すと倍数になります。

### 2. ビット演算に置き換える

```cpp:line-numbers=160
  return (Size + Value - 1) & ~(Value - 1U);
```

`Size = 13`、`Value = 8` で追います。

```
Size + Value - 1   = 13 + 7 = 20  = 1 0100
Value - 1          = 7            = 0 0111
~(Value - 1)       =              = 1 1000  （下位 3 ビットだけ 0）
20 & ~7            =                1 0000  = 16
```

`Value` が 2 の累乗なので、「`Value` で割って掛ける」は「**下位 log2(Value) ビットを 0 にする**」のと同じです。コメントは、これを「割り算は右シフト、掛け算は左シフト。右に出して左に戻すと下位ビットが 0 になる。`~(Value - 1)` はちょうどそのビットだけ 0 のマスク」と説明しています。

`Size = 16` なら `16 + 7 = 23`、`23 & ~7 = 16` です。すでに倍数なら変わりません。

### 3. なぜわざわざ書くのか

```cpp:line-numbers=158
  // 多くのコンパイラはこのコードを生成できるが、複数の関数がインライン展開
  // されたときにはこのパターンを見逃すことがある。
```

コメントによれば、多くのコンパイラは割り算の式でも同じコードを作れます。しかし、**複数の関数がインライン展開されたときに、このパターンを見逃すことがある**ため、最初からビット演算で書いているそうです。

## ここがすごい

この関数が割り算なしで書けるのは、引数が `uint64_t` ではなく **`Align` 型**だからです。`Align` は作るときに「2 の累乗であること」を検査しているので、この関数の中ではもう確かめる必要がありません。

- 生の整数を受け取る版では、2 の累乗かどうかが分からないので、一般の割り算を使うか、毎回チェックするしかありません。
- `Align` を受け取る版では、**型が前提条件を保証している**ので、最速の書き方を安心して選べます。

つまり、「正しさの検査は型を作るときに 1 回」「使う側は検査なしで速く」という分担ができています。型設計がそのまま性能につながっている例です。

また、コメントで「本来の式」と「ビット演算に変える理由」の両方を書いているので、マジックナンバーのような式が何をしているのか、読者が迷いません。

## まとめ

- 2 の累乗 `A` への切り上げは `(x + A - 1) & ~(A - 1)` で書ける。
- 2 の累乗での割り算・掛け算は、下位ビットを落とす操作と同じ。
- 前提条件（2 の累乗）を型で保証すると、関数の中で安心して高速化できる。
- コンパイラ任せにせず書き換えるなら、その理由をコメントに残す。
