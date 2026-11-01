---
title: INT_MIN でも壊れない絶対値は「先に符号なしにしてから」反転する
description: std::abs(INT_MIN) は未定義動作になる。AbsoluteValue は符号なし型に変換してからマイナスを付けることで、どんな値でも正しい絶対値を返す。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [588, 595]
function: llvm::AbsoluteValue
difficulty: 1
tags: [防御的プログラミング, 型システム, 数値計算]
format: 2
---

## ひとことで

`AbsoluteValue(X)` は、符号付き整数 `X` の絶対値を、**対応する符号なし整数型で**返します。

`AbsoluteValue(-5)` は `5u`、`AbsoluteValue(INT32_MIN)`（-2147483648）は `2147483648u` です。

後者がポイントです。標準ライブラリの `std::abs(INT32_MIN)` は**未定義動作**になってしまいます。この関数はその穴をふさぎます。

## コード

::: code-group

```cpp:line-numbers=588 [日本語訳]
/// 符号付き整数の絶対値を、対応する符号なし整数型に
/// 変換して返す。INT_MIN などを渡したときの std::abs の
/// 未定義動作を避けられる。
template <typename T, typename U = std::make_unsigned_t<T>>
constexpr U AbsoluteValue(T X) {
  // X が負なら、マイナスを付ける「前に」符号なし型へ変換する。
  return X < 0 ? -static_cast<U>(X) : X;
}
```

```cpp:line-numbers=588 [原文]
/// Return the absolute value of a signed integer, converted to the
/// corresponding unsigned integer type. Avoids undefined behavior in std::abs
/// when you pass it INT_MIN or similar.
template <typename T, typename U = std::make_unsigned_t<T>>
constexpr U AbsoluteValue(T X) {
  // If X is negative, cast it to the unsigned type _before_ negating it.
  return X < 0 ? -static_cast<U>(X) : X;
}
```

:::

## 前提知識

- **テンプレートの既定引数**: `typename U = std::make_unsigned_t<T>` は、「`U` を指定しなければ、`T` の符号なし版を使う」という意味です。`T` が `int32_t` なら `U` は `uint32_t` になります。
- **`static_cast<U>(X)`**: `X` を型 `U` に明示的に変換します。符号付きの負の値を符号なしにすると、2^N を足した値（N はビット数）になります。`int32_t` の `-5` は `uint32_t` の `4294967291` です。
- **符号なし整数の単項マイナス**: 符号なしの `-x` は `2^N - x` になります（0 なら 0）。あふれではなく、規格で決まった「一周」です。
- **未定義動作**: 規格が「何が起きても知らない」とする動作です。符号付き整数のあふれはその代表で、コンパイラが予想外の最適化をすることがあります。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` の値になります。

## 何をしているか

### 1. 負でなければそのまま

```cpp:line-numbers=594
  return X < 0 ? -static_cast<U>(X) : X;
```

`X = 7` なら `7` を `U` に変換して返します。

### 2. 負なら「符号なしにしてから」マイナス

```cpp:line-numbers=594
  return X < 0 ? -static_cast<U>(X) : X;
```

`X = -5`（`int32_t`）の場合:

```
static_cast<uint32_t>(-5)   = 4294967291   （= 2^32 - 5）
-(4294967291)               = 2^32 - 4294967291 = 5
```

`X = INT32_MIN`（-2147483648）の場合:

```
static_cast<uint32_t>(-2147483648) = 2147483648   （= 2^31）
-(2147483648)                      = 2^32 - 2^31 = 2147483648
```

符号なしの世界では `2147483648` は普通に表せる値なので、正しい絶対値が得られます。

コード中のコメント「負なら、マイナスを付ける**前に**符号なし型へ変換する」が、この関数の要点をそのまま述べています。

## ここがすごい

なぜ `std::abs` ではだめなのでしょうか。

`int32_t` の範囲は `-2147483648` から `2147483647` で、**負のほうが 1 つ多い**です。`-(-2147483648)` は `2147483648` ですが、これは `int32_t` に入りません。符号付き整数のあふれは未定義動作なので、`std::abs(INT32_MIN)` は結果が保証されません。

順番を逆にした `static_cast<U>(-X)` もだめです。`-X` を計算する時点で、まだ符号付きなのであふれてしまいます。

この関数は、

- **戻り値を符号なし型にする**ことで、最大の絶対値 2^31 を表せるようにし、
- **変換を先、反転を後**にすることで、計算をすべて「一周が許される」符号なしの世界で行う

という 2 つの工夫で、どんな入力でも正しく動きます。たった 1 行ですが、「どの型で計算するか」を意識することの大切さがよくわかる例です。

## まとめ

- 2 の補数では負の数が 1 つ多いため、`std::abs(INT_MIN)` は未定義動作。
- 絶対値の結果は符号なし型で受けると、すべての値を表せる。
- 「符号なしへの変換」を「マイナス」より先にすれば、あふれない。
- 符号付きのあふれは未定義、符号なしの一周は定義済み。この違いを使い分ける。
