---
title: 指数部「e+05」を 2 桁の表で手早く書く
description: 浮動小数点数の指数部を「+05」「-123」の形で書き出す関数。符号を書いてから、0〜99 の 2 桁表を使って百の位以上と下 2 桁に分けて出力する。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1790, 1815]
function: detail::write_exponent
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, 最適化]
---

## ひとことで

`1.5e+05` や `2.0e-123` のような指数表記で、`e` のうしろの部分（`+05` や `-123`）を書く関数です。

C の `printf` と同じく、**指数は最低 2 桁**（5 なら `05`）で書きます。0〜99 を 2 文字に変える表 `digits2` を使って、ほとんど計算せずに出力します。

## コード

::: code-group

```cpp:line-numbers=1790 [日本語訳]
// 指数 exp を "[+-]d{2,3}" の形でバッファに書き込む。
template <typename Char, typename OutputIt>
FMT_CONSTEXPR auto write_exponent(int exp, OutputIt out) -> OutputIt {
  FMT_ASSERT(-10000 < exp && exp < 10000, "exponent out of range");
  if (exp < 0) {
    *out++ = static_cast<Char>('-');
    exp = -exp;
  } else {
    *out++ = static_cast<Char>('+');
  }
  auto uexp = static_cast<uint32_t>(exp);
  if (is_constant_evaluated()) {
    if (uexp < 10) *out++ = '0';
    return format_decimal<Char>(out, uexp, count_digits(uexp));
  }
  if (uexp >= 100u) {
    const char* top = digits2(uexp / 100);
    if (uexp >= 1000u) *out++ = static_cast<Char>(top[0]);
    *out++ = static_cast<Char>(top[1]);
    uexp %= 100;
  }
  const char* d = digits2(uexp);
  *out++ = static_cast<Char>(d[0]);
  *out++ = static_cast<Char>(d[1]);
  return out;
}
```

```cpp:line-numbers=1790 [原文]
// Writes the exponent exp in the form "[+-]d{2,3}" to buffer.
template <typename Char, typename OutputIt>
FMT_CONSTEXPR auto write_exponent(int exp, OutputIt out) -> OutputIt {
  FMT_ASSERT(-10000 < exp && exp < 10000, "exponent out of range");
  if (exp < 0) {
    *out++ = static_cast<Char>('-');
    exp = -exp;
  } else {
    *out++ = static_cast<Char>('+');
  }
  auto uexp = static_cast<uint32_t>(exp);
  if (is_constant_evaluated()) {
    if (uexp < 10) *out++ = '0';
    return format_decimal<Char>(out, uexp, count_digits(uexp));
  }
  if (uexp >= 100u) {
    const char* top = digits2(uexp / 100);
    if (uexp >= 1000u) *out++ = static_cast<Char>(top[0]);
    *out++ = static_cast<Char>(top[1]);
    uexp %= 100;
  }
  const char* d = digits2(uexp);
  *out++ = static_cast<Char>(d[0]);
  *out++ = static_cast<Char>(d[1]);
  return out;
}
```

:::

## 前提知識

- **テンプレート `<typename Char, typename OutputIt>`**: `Char` は文字の型、`OutputIt` は出力先の型です。出力先は配列のポインタでも、バッファの末尾に追加するイテレータでも構いません。
- **`*out++ = c`**: 「`out` の指す場所に `c` を書いて、`out` を 1 つ進める」という、C++ でよく使う出力の書き方です。
- **`static_cast<Char>('-')`**: `char` の `'-'` を、`wchar_t` など目的の文字型に変換しています。
- **`digits2(n)`**: 0〜99 の数 n の 2 桁の文字列（`"05"` など）へのポインタを返す関数です（同じファイルにあります）。`[0]` が十の位、`[1]` が一の位です。
- **`is_constant_evaluated()`**: コンパイル時に実行されているかを返します。
- **`%=`**: 割った余りを代入します。`uexp %= 100` は下 2 桁だけを残します。

## 何をしているか

### 1. 符号を書く

```cpp:line-numbers=1793
  FMT_ASSERT(-10000 < exp && exp < 10000, "exponent out of range");
  if (exp < 0) {
    *out++ = static_cast<Char>('-');
    exp = -exp;
  } else {
    *out++ = static_cast<Char>('+');
```

負なら `-` を書いて絶対値にし、0 以上なら `+` を書きます。指数表記では `+` も省略しないのが決まりです。

### 2. 百の位以上

```cpp:line-numbers=1804
  }
  if (uexp >= 100u) {
    const char* top = digits2(uexp / 100);
    if (uexp >= 1000u) *out++ = static_cast<Char>(top[0]);
    *out++ = static_cast<Char>(top[1]);
    uexp %= 100;
```

`exp = -123` の例で追います。符号 `-` を書いたあと `uexp = 123` です。

- `123 >= 100` なので、`top = digits2(123 / 100)` = `digits2(1)` = `"01"`。
- `123 < 1000` なので千の位は書かず、`top[1]`（`'1'`）だけ書きます。
- `uexp` は `123 % 100 = 23` になります。

指数が 4 桁（1000 以上）のときだけ `top[0]` も書きます。

### 3. 下 2 桁は必ず書く

```cpp:line-numbers=1810
  }
  const char* d = digits2(uexp);
  *out++ = static_cast<Char>(d[0]);
  *out++ = static_cast<Char>(d[1]);
```

`digits2(23)` で `"23"` を書きます。結果は `-123` です。

`exp = 5` なら、百の位の処理を飛ばして `digits2(5)` = `"05"` を書くので、`+05` になります。**最低 2 桁** の決まりが、表の性質から自然に満たされます。

### 4. コンパイル時は別の道

```cpp:line-numbers=1800
  auto uexp = static_cast<uint32_t>(exp);
  if (is_constant_evaluated()) {
    if (uexp < 10) *out++ = '0';
    return format_decimal<Char>(out, uexp, count_digits(uexp));
```

`digits2` の表は `static constexpr` を使っており、コンパイル時の評価では使えない場合があります。そこでコンパイル時には、1 桁なら `'0'` を補ってから普通の整数変換を使います。

## ここがすごい

- **最低 2 桁が自然に満たされる**: 「1 桁なら 0 を足す」という場合分けを書かなくても、2 桁の表から必ず 2 文字書くので `05` になります。
- **桁数を数えない**: 指数は最大でも 4 桁（`FMT_ASSERT` で ±10000 未満を保証）です。一般の整数変換のように桁数を数えるより、「100 以上か」「1000 以上か」の比較 2 回で決めるほうが速く単純です。
- **割り算は 2 回だけ**: `/ 100` と `% 100` の 2 回で済み、あとは表引きです。定数での割り算なのでコンパイラが掛け算に変換しやすく、さらに軽くなります。
- **文字型を問わない**: `static_cast<Char>` で 1 文字ずつ変換しているので、`char` でも `wchar_t` でも同じコードが使えます。

## まとめ

- 出力の最低桁数は、桁数ぶんの表を使うと自然に満たせる。
- 値の範囲が小さく決まっているなら、桁数を数えずに比較で場合分けするほうが速い。
- `*out++ = c` は C++ でよく使う「書いて進める」書き方。
- コンパイル時と実行時で道を分けると、`constexpr` 対応と速さを両立できる。
