---
title: 余りと「割る数の半分」を比べて、あふれない四捨五入割り算
description: 割り算の結果を四捨五入する divideNearest。(n + d/2) / d と書かずに、余りを使って 0 か 1 を足すことでオーバーフローを避けている。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [450, 458]
function: llvm::divideNearest
difficulty: 1
tags: [数値計算, 防御的プログラミング, イディオム]
format: 2
---

## ひとことで

`divideNearest(N, D)` は、`N ÷ D` を**四捨五入**（ちょうど半分なら切り上げ）した整数を返します。

- `divideNearest(5, 4)` → `1`（1.25）
- `divideNearest(6, 4)` → `2`（1.5 はちょうど半分なので切り上げ）
- `divideNearest(8, 5)` → `2`（1.6）

符号なし整数専用で、コメントには「決してあふれない」と書かれています。

## コード

::: code-group

```cpp:line-numbers=450 [日本語訳]
/// (Numerator / Denominator) を四捨五入（半分は切り上げ）して返す。
/// 決してあふれないことが保証されている。
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T divideNearest(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  T Mod = Numerator % Denominator;
  return (Numerator / Denominator) +
         (Mod > (static_cast<T>(Denominator) - 1) / 2);
}
```

```cpp:line-numbers=450 [原文]
/// Returns (Numerator / Denominator) rounded by round-half-up. Guaranteed to
/// never overflow.
template <typename U, typename V, typename T = common_uint<U, V>>
constexpr T divideNearest(U Numerator, V Denominator) {
  assert(Denominator && "Division by zero");
  T Mod = Numerator % Denominator;
  return (Numerator / Denominator) +
         (Mod > (static_cast<T>(Denominator) - 1) / 2);
}
```

:::

## 前提知識

- **テンプレート**: `template <typename U, typename V, typename T = ...>` は、引数の型を呼び出し側から自動で受け取る書き方です。`T` は戻り値の型で、既定値として `common_uint<U, V>`（2 つの型を符号なしにして広いほうにそろえた型）が使われます。
- **`%`（剰余）**: 割り算の余りです。`6 % 4` は `2` です。
- **整数の `/`**: 小数点以下は切り捨てられます。
- **`bool` の足し算**: 比較 `A > B` の結果（`true`/`false`）を整数に足すと、`1` か `0` として扱われます。
- **`static_cast<T>(x)`**: `x` を型 `T` に明示的に変換します。

## 何をしているか

### 1. 余りを求める

```cpp:line-numbers=455
  T Mod = Numerator % Denominator;
```

`N = 6, D = 4` なら `Mod = 2` です。

### 2. 切り捨ての商に「0 か 1」を足す

```cpp:line-numbers=456
  return (Numerator / Denominator) +
         (Mod > (static_cast<T>(Denominator) - 1) / 2);
```

切り捨ての商 `N / D` は `1` です。あとは「余りが半分を超えているか」で 1 を足すかどうかを決めます。

比べる相手は `(D - 1) / 2` です。`D = 4` なら `3 / 2 = 1` なので、

```
Mod = 2 > 1  → true → 1 + 1 = 2
```

`N = 5` なら `Mod = 1 > 1` は偽なので、答えは `1` のままです。

### 3. 奇数で割る場合

`D = 5` なら `(5 - 1) / 2 = 2` です。

```
N = 7:  Mod = 2 > 2 → false → 1   （1.4 → 1）
N = 8:  Mod = 3 > 2 → true  → 2   （1.6 → 2）
```

奇数では「ちょうど半分」が起きないので、2 を境に正しく分かれます。

### なぜ `(D - 1) / 2` なのか

「余りが `D / 2` 以上なら切り上げ」と書くと、`D` が奇数のときに `D / 2` が切り捨てられてずれます。`Mod > (D - 1) / 2` は、`D` が偶数でも奇数でも「`2 * Mod >= D`」と同じ判定になるように作られた式です。`2 * Mod` を計算しないので、ここでもあふれる心配がありません。

## ここがすごい

四捨五入割り算の定番は `(N + D / 2) / D` です。しかし `N` が型の最大値に近いと、`N + D / 2` で**あふれます**。

`uint32_t`（最大 4294967295）で `N = 4294967290, D = 20` だと:

- 定番の式: `4294967290 + 10 = 4294967300` → 一周して `4`。`4 / 20 = 0` で大はずれ
- この関数: `4294967290 / 20 = 214748364`、余り `10 > 9` で `+1`、答え `214748365`（214748364.5 の切り上げ）。正しい

途中の値はどれも `N` か `D` 以下に収まるので、どんな入力でもあふれません。
足し算 1 つを「余りの比較」に置き換えるだけで安全性が手に入る、という見本です。

## まとめ

- 四捨五入割り算 `(N + D/2) / D` は大きな `N` であふれる。
- 「切り捨ての商 + (余りが半分を超えるか)」なら途中の値が大きくならない。
- `Mod > (D - 1) / 2` は偶数・奇数どちらの `D` でも `2 * Mod >= D` と同じ意味になる。
- 比較結果の `bool` を足し算に使うと、分岐を書かずに済む。
