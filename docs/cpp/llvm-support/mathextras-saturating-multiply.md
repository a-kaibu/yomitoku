---
title: 桁数の足し算で「あふれるか」を先読みする飽和乗算
description: 符号なし整数の掛け算で、あふれたら最大値に張り付かせる SaturatingMultiply。log2 の和で大半を即決し、際どい場合だけ半分ずつ掛けて確かめる。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [633, 676]
function: llvm::SaturatingMultiply
difficulty: 3
tags: [数値計算, ビット演算, 防御的プログラミング]
format: 2
---

## ひとことで

`SaturatingMultiply(X, Y)` は、符号なし整数の掛け算で、**あふれたら型の最大値を返す**関数です（飽和乗算）。

`uint8_t`（最大 255）なら、`SaturatingMultiply(12, 20)` は `240`、`SaturatingMultiply(13, 20)` は本来 260 なので `255` になります。

割り算を使わずに「あふれるかどうか」を判定するために、**2 進数の桁数**を使った先読みをしているのが特徴です。

## コード

::: code-group

```cpp:line-numbers=633 [日本語訳]
/// 型 T の 2 つの符号なし整数 X と Y を掛ける。あふれたら結果を
/// T で表せる最大値に抑える。ResultOverflowed は、結果が型 T の
/// 表せる最大値より大きかったかどうかを示す。
template <typename T>
std::enable_if_t<std::is_unsigned_v<T>, T>
SaturatingMultiply(T X, T Y, bool *ResultOverflowed = nullptr) {
  bool Dummy;
  bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;

  // 『Hacker's Delight』30 ページには別のアルゴリズムがあるが、使わない。
  // uint16_t では（int への昇格のせいで掛け算が未定義動作に
  // なりうるため）失敗するうえ、掛け算に加えて
  // 割り算も必要になるからだ。

  Overflowed = false;

  // Log2(Z) は Log2Z か Log2Z + 1 のどちらか。
  // 特別な場合: X か Y が 0 なら Log2_64 は -1 を返し、Log2Z は
  // 期待どおり必ず Log2Max より小さくなる。
  int Log2Z = Log2_64(X) + Log2_64(Y);
  const T Max = std::numeric_limits<T>::max();
  int Log2Max = Log2_64(Max);
  if (Log2Z < Log2Max) {
    return X * Y;
  }
  if (Log2Z > Log2Max) {
    Overflowed = true;
    return Max;
  }

  // 最上位ビットを使い、さらに 1 ビットはみ出すかもしれない。
  // そこで最下位ビット以外を掛けてから、
  // 最後にその分を足す。
  T Z = (X >> 1) * Y;
  if (Z & ~(Max >> 1)) {
    Overflowed = true;
    return Max;
  }
  Z <<= 1;
  if (X & 1)
    return SaturatingAdd(Z, Y, ResultOverflowed);

  return Z;
}
```

```cpp:line-numbers=633 [原文]
/// Multiply two unsigned integers, X and Y, of type T.  Clamp the result to the
/// maximum representable value of T on overflow.  ResultOverflowed indicates if
/// the result is larger than the maximum representable value of type T.
template <typename T>
std::enable_if_t<std::is_unsigned_v<T>, T>
SaturatingMultiply(T X, T Y, bool *ResultOverflowed = nullptr) {
  bool Dummy;
  bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;

  // Hacker's Delight, p. 30 has a different algorithm, but we don't use that
  // because it fails for uint16_t (where multiplication can have undefined
  // behavior due to promotion to int), and requires a division in addition
  // to the multiplication.

  Overflowed = false;

  // Log2(Z) would be either Log2Z or Log2Z + 1.
  // Special case: if X or Y is 0, Log2_64 gives -1, and Log2Z
  // will necessarily be less than Log2Max as desired.
  int Log2Z = Log2_64(X) + Log2_64(Y);
  const T Max = std::numeric_limits<T>::max();
  int Log2Max = Log2_64(Max);
  if (Log2Z < Log2Max) {
    return X * Y;
  }
  if (Log2Z > Log2Max) {
    Overflowed = true;
    return Max;
  }

  // We're going to use the top bit, and maybe overflow one
  // bit past it. Multiply all but the bottom bit then add
  // that on at the end.
  T Z = (X >> 1) * Y;
  if (Z & ~(Max >> 1)) {
    Overflowed = true;
    return Max;
  }
  Z <<= 1;
  if (X & 1)
    return SaturatingAdd(Z, Y, ResultOverflowed);

  return Z;
}
```

:::

## 前提知識

- **`std::enable_if_t<std::is_unsigned_v<T>, T>`**: `T` が符号なし整数のときだけこの関数を有効にし、戻り値の型を `T` にする書き方です。
- **`bool *ResultOverflowed = nullptr` と `bool &`**: あふれたかを書き込む任意の出力先と、その別名（参照）です。関数の最初の 2 行は、出力先が無ければダミーに書く、という定番の技です。
- **`Log2_64(x)`**: 同じファイルの関数で、`x` の 2 進数での最上位ビットの位置（切り捨ての log2）を返します。`Log2_64(12)` は `3`（12 は `1100`）です。`x = 0` のときは一周して大きな値になり、`int` に入れると `-1` として扱われます（コード中のコメントにも書かれています）。
- **整数の昇格**: `uint16_t` 同士の掛け算は、計算前に `int` に広げられます。`65535 * 65535` は `int` に入りきらず、**符号付きのあふれ（未定義動作）**になります。冒頭の `Hacker's Delight, p. 30 ...` のコメントはこの問題を指しています。

## 何をしているか

### 1. 桁数で大まかに判定する

```cpp:line-numbers=652
  int Log2Z = Log2_64(X) + Log2_64(Y);
  const T Max = std::numeric_limits<T>::max();
  int Log2Max = Log2_64(Max);
  if (Log2Z < Log2Max) {
    return X * Y;
  }
  if (Log2Z > Log2Max) {
    Overflowed = true;
    return Max;
  }
```

`X` が `a+1` 桁、`Y` が `b+1` 桁（`a = Log2(X)`、`b = Log2(Y)`）なら、積は `a+b+1` 桁か `a+b+2` 桁になります。コメント「Log2(Z) は Log2Z か Log2Z + 1」はこのことです。

`uint8_t` なら `Log2Max = 7` です。

- `X = 3, Y = 5`: `1 + 2 = 3 < 7` → 確実に収まるので、そのまま `X * Y` を返す。
- `X = 16, Y = 16`: `4 + 4 = 8 > 7` → 確実にあふれるので `Overflowed = true` にして最大値を返す。

### 2. 際どい場合は「半分」で確かめる

```cpp:line-numbers=666
  T Z = (X >> 1) * Y;
  if (Z & ~(Max >> 1)) {
    Overflowed = true;
    return Max;
  }
  Z <<= 1;
  if (X & 1)
    return SaturatingAdd(Z, Y, ResultOverflowed);

  return Z;
```

`Log2Z == Log2Max` のときは、収まるかどうかが微妙です。`X = 13`（log2 = 3）、`Y = 20`（log2 = 4）で追います。

```
X >> 1          = 6
Z = 6 * 20      = 120   = 0111 1000
Z & ~(Max >> 1) = 120 & 1000 0000 = 0   ← 最上位が空いている
Z <<= 1         = 240
X は奇数        → SaturatingAdd(240, 20) = 260 → 255
```

考え方は `X * Y = (X >> 1) * Y * 2 + (X & 1) * Y` です。

- まず `X` の最下位ビットを除いた半分で掛けます。際どい範囲では、この積は必ず型に収まります。
- `if (Z & ~(Max >> 1))` で最上位ビットが立っていれば、2 倍した時点であふれるので最大値を返します。
- 立っていなければ `Z <<= 1` で 2 倍し、`X` が奇数なら残りの `Y` を飽和加算で足します。

`X = 12` なら偶数なので、`240` がそのまま答えです。

## ここがすごい

一般的なあふれ判定は `X != 0 && Y > Max / X` です。しかし冒頭のコメントが述べる通り、

- **割り算が必要**で、掛け算より遅い
- `uint16_t` では「とりあえず掛けてみる」と `int` への昇格で未定義動作になる

という欠点があります。

この関数は、

- ほとんどの入力を **log2（最上位ビットの位置。多くの CPU で 1 命令）の和だけで即決**し、
- 微妙な場合だけ、**必ず収まる半分の掛け算**と 1 回のビット検査で確かめる

という二段構えです。直接 `X * Y` を計算するのは「確実に収まる」と分かったときだけなので、`uint16_t` の昇格問題も起きません。

あふれ判定を「桁数」という粗い指標でふるいにかけ、残りだけを精密に調べる、という考え方は他の場面でも使える発想です。

## まとめ

- 積の桁数は「桁数の和」か「その + 1」。これで大半のあふれは即判定できる。
- 際どい場合は、半分を掛けてから 2 倍し、端数を足すと安全に確かめられる。
- 小さな符号なし型の掛け算は `int` に昇格し、未定義動作になることがある。
- 粗い判定で大半を片付け、残りだけ精密に調べると速くて安全。
