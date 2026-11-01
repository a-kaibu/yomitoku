---
title: あふれたら最大値で止まる足し算と、ダミー参照で null チェックを消す技
description: 符号なし整数を足して、あふれたら最大値に張り付かせる SaturatingAdd。結果が元より小さいかであふれを検出し、可変長引数版で何個でも足せる。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/MathExtras.h
lines: [604, 631]
function: llvm::SaturatingAdd
difficulty: 2
tags: [数値計算, ジェネリクス, イディオム]
format: 2
---

## ひとことで

`SaturatingAdd(X, Y)` は、符号なし整数の足し算で、**あふれたら型の最大値で止める**関数です。このような足し算を「飽和加算」と呼びます。

`uint8_t`（最大 255）なら、`SaturatingAdd(200, 100)` は `255` になります。普通の足し算なら一周して `44` になるところです。

LLVM では、実行回数の見積もりなどの「カウンタ」で使われます。カウンタがあふれて 0 付近に戻るより、最大値で止まるほうがずっと安全だからです。

## コード

::: code-group

```cpp:line-numbers=604 [日本語訳]
/// 型 T の 2 つの符号なし整数 X と Y を足す。あふれたら結果を
/// T で表せる最大値に抑える。ResultOverflowed は、結果が型 T の
/// 表せる最大値より大きかったかどうかを示す。
template <typename T>
std::enable_if_t<std::is_unsigned_v<T>, T>
SaturatingAdd(T X, T Y, bool *ResultOverflowed = nullptr) {
  bool Dummy;
  bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;
  // 『Hacker's Delight』29 ページ
  T Z = X + Y;
  Overflowed = (Z < X || Z < Y);
  if (Overflowed)
    return std::numeric_limits<T>::max();
  else
    return Z;
}

/// 型 T の符号なし整数を複数足す。あふれたら結果を
/// T で表せる最大値に抑える。
template <class T, class... Ts>
std::enable_if_t<std::is_unsigned_v<T>, T> SaturatingAdd(T X, T Y, T Z,
                                                         Ts... Args) {
  bool Overflowed = false;
  T XY = SaturatingAdd(X, Y, &Overflowed);
  if (Overflowed)
    return SaturatingAdd(std::numeric_limits<T>::max(), T(1), Args...);
  return SaturatingAdd(XY, Z, Args...);
}
```

```cpp:line-numbers=604 [原文]
/// Add two unsigned integers, X and Y, of type T.  Clamp the result to the
/// maximum representable value of T on overflow.  ResultOverflowed indicates if
/// the result is larger than the maximum representable value of type T.
template <typename T>
std::enable_if_t<std::is_unsigned_v<T>, T>
SaturatingAdd(T X, T Y, bool *ResultOverflowed = nullptr) {
  bool Dummy;
  bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;
  // Hacker's Delight, p. 29
  T Z = X + Y;
  Overflowed = (Z < X || Z < Y);
  if (Overflowed)
    return std::numeric_limits<T>::max();
  else
    return Z;
}

/// Add multiple unsigned integers of type T.  Clamp the result to the
/// maximum representable value of T on overflow.
template <class T, class... Ts>
std::enable_if_t<std::is_unsigned_v<T>, T> SaturatingAdd(T X, T Y, T Z,
                                                         Ts... Args) {
  bool Overflowed = false;
  T XY = SaturatingAdd(X, Y, &Overflowed);
  if (Overflowed)
    return SaturatingAdd(std::numeric_limits<T>::max(), T(1), Args...);
  return SaturatingAdd(XY, Z, Args...);
}
```

:::

## 前提知識

- **`std::enable_if_t<条件, T>`**: 条件が真のときだけ型 `T` になり、偽ならこの関数自体が候補から消えます。ここでは「`T` が符号なし整数のときだけ使える」という制限です。
- **`std::numeric_limits<T>::max()`**: 型 `T` の最大値です。
- **ポインタ `bool *` と既定引数 `= nullptr`**: `ResultOverflowed` は「あふれたかどうかを書き込む先」です。呼び出し側が要らなければ省略でき、そのときは `nullptr`（どこも指さないポインタ）になります。
- **参照 `bool &`**: 別の変数に付けた「別名」です。参照に代入すると、元の変数に書き込まれます。
- **可変長テンプレート `class... Ts` と `Args...`**: 任意の個数の引数を受け取れる仕組みです。`Args...` と書くと、受け取った引数を並べて展開します。

## 何をしているか

### 1. ダミー変数への参照で null チェックを消す

```cpp:line-numbers=610
  bool Dummy;
  bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;
```

```cpp
bool Dummy;
bool &Overflowed = ResultOverflowed ? *ResultOverflowed : Dummy;
```

呼び出し側がポインタを渡せばその先を、渡さなければローカルの `Dummy` を、`Overflowed` という別名で指します。以降は `Overflowed = ...` と書くだけでよく、「ポインタが null かどうか」を毎回確かめる必要がなくなります。

### 2. 足して、小さくなっていたらあふれ

```cpp:line-numbers=613
  T Z = X + Y;
  Overflowed = (Z < X || Z < Y);
  if (Overflowed)
    return std::numeric_limits<T>::max();
  else
    return Z;
```

`uint8_t` で `X = 200, Y = 100` の場合:

```
Z = 200 + 100 = 300 → 255 を超えて一周し 44
Z < X  →  44 < 200  →  true（あふれ）
```

符号なしの足し算があふれると、結果は `X + Y - 256` になります。`Y` は 256 未満なので、この値は必ず `X` より小さくなります。だから「結果が元の値より小さければあふれ」と判定できます。コメント `// Hacker's Delight, p. 29` は、この方法の出典『Hacker's Delight』（ビット演算の名著）の該当ページです。

あふれていれば最大値を、そうでなければ `Z` を返します。

### 3. 3 個以上を足す版

```cpp:line-numbers=621
/// 型 T の符号なし整数を複数足す。あふれたら結果を
/// T で表せる最大値に抑える。
template <class T, class... Ts>
std::enable_if_t<std::is_unsigned_v<T>, T> SaturatingAdd(T X, T Y, T Z,
                                                         Ts... Args) {
  bool Overflowed = false;
  T XY = SaturatingAdd(X, Y, &Overflowed);
  if (Overflowed)
    return SaturatingAdd(std::numeric_limits<T>::max(), T(1), Args...);
  return SaturatingAdd(XY, Z, Args...);
}
```

`SaturatingAdd(a, b, c, d)` と書くと、こちらが選ばれます。

1. まず `X + Y` を飽和加算します。
2. あふれていなければ、その結果と `Z` と残りの引数で**自分自身をもう一度呼びます**。引数が 1 つ減るので、最後は 2 引数版に行き着きます。
3. あふれていたら、答えは最大値に決まっています。`SaturatingAdd(std::numeric_limits<T>::max(), T(1), Args...)` では「最大値 + 1 + 残り」を計算させて、確実に最大値を返しています。

## ここがすごい

- **比較 1 回であふれを検出**: 足す前に「`X > max - Y` か」を調べる方法もありますが、引き算と比較が要ります。この関数は足してから比べるだけです。符号なしの一周は規格で決まった動作なので、先に足してしまっても安全です。
- **参照によるダミーの差し替え**: 出力用ポインタを任意にする API はよくありますが、関数の中が `if (ptr) *ptr = ...` だらけになりがちです。参照で 1 度だけ振り分けておくと、本体のコードがすっきりします。同じ技は `SaturatingMultiply` でも使われています。
- **可変長引数を再帰でほどく**: 何個の引数でも、2 引数版を繰り返し使うだけで処理できます。型チェックもすべてコンパイル時に済みます。

なお、判定の式は `Z < X || Z < Y` と両方を調べていますが、上の説明のとおり片方だけでも判定できます。両方を書いておくと対称で読みやすい、という書き方です。

## まとめ

- 符号なしの足し算は、結果が元より小さくなったらあふれている。
- 飽和演算は、あふれたときに一周させず最大値で止める。カウンタに向いている。
- 任意の出力ポインタは、ダミー変数への参照で受けると null チェックが要らない。
- 可変長テンプレートは、引数を 1 つずつ減らす再帰で処理できる。
