---
title: 10 の n 乗を「5 の n 乗 × シフト」で作る多倍長整数
description: 多倍長整数に 10 の exp 乗を代入する関数。10^n = 5^n × 2^n と分け、5^n は二乗と掛け算の繰り返しで、2^n はビットシフトだけで求める。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [3102, 3118]
function: bigint::assign_pow10
difficulty: 2
format: 2
tags: [アルゴリズム, 数値計算, ビット演算]
---

## ひとことで

`bigint` は {fmt} が浮動小数点数を正確に文字列にするとき（Dragon4 系のアルゴリズム）に使う、**いくらでも大きな整数** を表すクラスです。

`assign_pow10(exp)` は、この整数に 10^exp を代入します。`10^300` のような巨大な数でも、掛け算は数十回で済みます。

## コード

::: code-group

```cpp:line-numbers=3102 [日本語訳]
  // この bigint に pow(10, exp) を代入する。
  FMT_CONSTEXPR20 void assign_pow10(int exp) {
    FMT_ASSERT(exp >= 0, "");
    if (exp == 0) return *this = 1;
    int bitmask = 1 << (num_bits<unsigned>() -
                        countl_zero(static_cast<uint32_t>(exp)) - 1);
    // pow(10, exp) = pow(5, exp) * pow(2, exp)。まず pow(5, exp) を
    // 二乗と掛け算の繰り返しで求める。
    *this = 5;
    bitmask >>= 1;
    while (bitmask != 0) {
      square();
      if ((exp & bitmask) != 0) *this *= 5;
      bitmask >>= 1;
    }
    *this <<= exp;  // シフトで pow(2, exp) を掛ける。
  }
```

```cpp:line-numbers=3102 [原文]
  // Assigns pow(10, exp) to this bigint.
  FMT_CONSTEXPR20 void assign_pow10(int exp) {
    FMT_ASSERT(exp >= 0, "");
    if (exp == 0) return *this = 1;
    int bitmask = 1 << (num_bits<unsigned>() -
                        countl_zero(static_cast<uint32_t>(exp)) - 1);
    // pow(10, exp) = pow(5, exp) * pow(2, exp). First compute pow(5, exp) by
    // repeated squaring and multiplication.
    *this = 5;
    bitmask >>= 1;
    while (bitmask != 0) {
      square();
      if ((exp & bitmask) != 0) *this *= 5;
      bitmask >>= 1;
    }
    *this <<= exp;  // Multiply by pow(2, exp) by shifting.
  }
```

:::

## 前提知識

- **多倍長整数**: 1 つの整数を 32 ビットの「桁」（bigit と呼んでいます）の配列で表し、64 ビットに収まらない大きな数を扱う仕組みです。
- **`*this`**: 自分自身のオブジェクトです。`*this = 5` は自分に 5 を代入、`*this *= 5` は自分を 5 倍します。
- **演算子のオーバーロード**: `bigint` は `=`、`*=`、`<<=` を自前で定義しているので、普通の整数のように書けます。
- **`countl_zero`**: 2 進で先頭の 0 がいくつ続くかを返す関数です。
- **`return *this = 1;`**: このクラスの `operator=` は何も返さない（`void`）ので、「代入してから戻る」を 1 行で書いています。void を返す関数は、void の式を `return` できます。
- **`FMT_ASSERT`**: デバッグ時の条件チェックです。

## 何をしているか

### 1. 10^n を 5^n と 2^n に分ける

```cpp:line-numbers=3108
    // pow(10, exp) = pow(5, exp) * pow(2, exp)。まず pow(5, exp) を
    // 二乗と掛け算の繰り返しで求める。
```

10 = 5 × 2 なので、10^n = 5^n × 2^n です。2^n を掛けるのは **左シフト** なので、ほぼタダです。重いのは 5^n だけになります。

### 2. 二乗と掛け算で 5^n を作る

```cpp:line-numbers=3106
    int bitmask = 1 << (num_bits<unsigned>() -
                        countl_zero(static_cast<uint32_t>(exp)) - 1);
    // pow(10, exp) = pow(5, exp) * pow(2, exp)。まず pow(5, exp) を
    // 二乗と掛け算の繰り返しで求める。
    *this = 5;
    bitmask >>= 1;
    while (bitmask != 0) {
      square();
      if ((exp & bitmask) != 0) *this *= 5;
      bitmask >>= 1;
    }
```

`exp = 13` で追います。13 は 2 進で `1101` です。

- `bitmask` は最上位ビット `1000`（8）から始まります。最上位ビットのぶんとして、まず `*this = 5`。
- `bitmask = 4`: 二乗して 25、13 の 4 のビットは 1 なので ×5 → **125**（= 5^3）
- `bitmask = 2`: 二乗して 15625（= 5^6）、2 のビットは 0 なのでそのまま
- `bitmask = 1`: 二乗して 244140625（= 5^12）、1 のビットは 1 なので ×5 → **1220703125**（= 5^13）

指数の 2 進表記を上から読み、「二乗する、ビットが 1 なら 5 を掛ける」を繰り返すと、指数がちょうどできあがります。この方法を **繰り返し二乗法**（バイナリ法）と呼びます。

### 3. 2^n を掛ける

```cpp:line-numbers=3117
    *this <<= exp;  // シフトで pow(2, exp) を掛ける。
```

最後に `*this <<= exp` で 13 ビット左シフトして 5^13 × 2^13 = 10^13 です。`bigint` は「32 ビット桁の何個分ずらすか」という指数 `exp_` も持っているので、大きなシフトも桁の配列をほとんど動かさずに済みます。

## ここがすごい

- **掛け算の回数が対数**: 10 を 300 回掛けると 300 回の多倍長の掛け算です。繰り返し二乗法なら、300 は 9 ビットなので二乗が 8 回、×5 が数回で済みます。
- **2 の部分を分離して軽くする**: 5^n は 10^n よりずっと小さい（ビット数が約 7 割）ので、二乗のコストも小さくなります。2^n はシフトに回すだけです。
- **小さい数を掛けるのは安い**: 「×5」は bigint × 32 ビット整数なので、桁の数に比例する軽い処理です。重い bigint 同士の掛け算は、二乗（`square`）だけです。

## まとめ

- べき乗は「指数の 2 進表記を上から読み、二乗と掛け算を繰り返す」で速く求まる。
- 10^n = 5^n × 2^n と分けると、2 の部分はシフトに回せる。
- 演算子をオーバーロードすると、多倍長整数も普通の整数のように書ける。
- 重い演算と軽い演算を見分けて、重いものの回数を減らす。
