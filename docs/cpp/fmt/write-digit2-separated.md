---
title: 「12:34:56」を 64 ビット整数 1 個の中で組み立てて 8 バイト一気書き
description: 2 桁の数 3 つを区切り文字でつないで書く chrono の関数。3 つの値を 64 ビット整数に詰め、BCD 変換・ニブルの並べ替え・ASCII 化をすべて同時に行って memcpy 1 回で出力する。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/chrono.h
lines: [613, 644]
function: detail::write_digit2_separated
difficulty: 3
format: 2
tags: [ビット演算, 日時, 最適化, ハック]
---

## ひとことで

`write_digit2_separated(buf, 12, 34, 56, ':')` は `buf` に `"12:34:56"` の 8 文字を書きます。時刻（`%T`）や日付（`%D`）の書式化で使われます。

ふつうは 6 回の割り算と 8 回の書き込みになりそうですが、この関数は **3 つの値を 1 つの 64 ビット整数に詰めて、全部を同時に変換** します。

## コード

::: code-group

```cpp:line-numbers=613 [日本語訳]
// 2 桁の数 a, b, c を sep で区切って buf に書き込む。
// Pavel Novikov による方法で、次の記事に基づく:
// https://johnnylee-sde.github.io/Fast-unsigned-integer-to-time-string/
inline void write_digit2_separated(char* buf, unsigned a, unsigned b,
                                   unsigned c, char sep) {
  ullong digits = a | (b << 24) | (static_cast<ullong>(c) << 48);
  // それぞれの値を BCD に変換する。
  // x = a * 10 + b を BCD の y = a * 16 + b に変換したい。
  // その差は
  //   y - x = a * 6
  // a は x から求められる:
  //   a = floor(x / 10)
  // よって
  //   y = x + a * 6 = x + floor(x / 10) * 6
  // floor(x / 10) は (x * 205) >> 11 で求まる（16 ビット必要）。
  digits += (((digits * 205) >> 11) & 0x000f00000f00000f) * 6;
  // 下位ニブルを上位バイトへ、上位ニブルを下位バイトへ移す。
  digits = ((digits & 0x00f00000f00000f0) >> 4) |
           ((digits & 0x000f00000f00000f) << 8);
  auto usep = static_cast<ullong>(sep);
  // 各数字のバイトに ASCII の '0' を足し、区切り文字を入れる。
  digits |= 0x3030003030003030 | (usep << 16) | (usep << 40);

  constexpr size_t len = 8;
  if (is_big_endian()) {
    char tmp[len];
    std::memcpy(tmp, &digits, len);
    std::reverse_copy(tmp, tmp + len, buf);
  } else {
    std::memcpy(buf, &digits, len);
  }
}
```

```cpp:line-numbers=613 [原文]
// Writes two-digit numbers a, b and c separated by sep to buf.
// The method by Pavel Novikov based on
// https://johnnylee-sde.github.io/Fast-unsigned-integer-to-time-string/.
inline void write_digit2_separated(char* buf, unsigned a, unsigned b,
                                   unsigned c, char sep) {
  ullong digits = a | (b << 24) | (static_cast<ullong>(c) << 48);
  // Convert each value to BCD.
  // We have x = a * 10 + b and we want to convert it to BCD y = a * 16 + b.
  // The difference is
  //   y - x = a * 6
  // a can be found from x:
  //   a = floor(x / 10)
  // then
  //   y = x + a * 6 = x + floor(x / 10) * 6
  // floor(x / 10) is (x * 205) >> 11 (needs 16 bits).
  digits += (((digits * 205) >> 11) & 0x000f00000f00000f) * 6;
  // Put low nibbles to high bytes and high nibbles to low bytes.
  digits = ((digits & 0x00f00000f00000f0) >> 4) |
           ((digits & 0x000f00000f00000f) << 8);
  auto usep = static_cast<ullong>(sep);
  // Add ASCII '0' to each digit byte and insert separators.
  digits |= 0x3030003030003030 | (usep << 16) | (usep << 40);

  constexpr size_t len = 8;
  if (is_big_endian()) {
    char tmp[len];
    std::memcpy(tmp, &digits, len);
    std::reverse_copy(tmp, tmp + len, buf);
  } else {
    std::memcpy(buf, &digits, len);
  }
}
```

:::

## 前提知識

- **`ullong`**: {fmt} での `unsigned long long`（64 ビット符号なし整数）の別名です。
- **バイトとニブル**: 8 ビットが 1 バイト、その半分の 4 ビットがニブルです。16 進数の 1 桁が 1 ニブルにあたります。
- **BCD（2 進化 10 進）**: 10 進の各桁を 1 ニブルずつで表す方法です。`12` を BCD にすると `0x12` です。
- **リトルエンディアン**: 多くの CPU では、整数の下位バイトがメモリの前に置かれます。64 ビット整数をそのまま `memcpy` すると、バイト 0 が先頭の文字になります。
- **`std::memcpy` / `std::reverse_copy`**: メモリのコピーと、逆順のコピーです。
- **ASCII**: 数字 `'0'`〜`'9'` の文字コードは `0x30`〜`0x39` なので、0〜9 の値に `0x30` を足せば数字の文字になります。

## 何をしているか

`a = 12, b = 34, c = 56, sep = ':'` で追います。

### 1. 3 つの値を 1 つの整数に詰める

```cpp:line-numbers=618
  ullong digits = a | (b << 24) | (static_cast<ullong>(c) << 48);
```

`a` をバイト 0、`b` をバイト 3、`c` をバイト 6 に置きます。それぞれの間には 2 バイトの空きがあります。

### 2. 10 進を BCD にする

```cpp:line-numbers=628
  digits += (((digits * 205) >> 11) & 0x000f00000f00000f) * 6;
```

コメントにあるとおり、2 桁の数 `x` を BCD にするには `x + floor(x / 10) × 6` です。`12` なら `12 + 1 × 6 = 18 = 0x12` です。

`floor(x / 10)` は `(x × 205) >> 11` で求めます（205 / 2048 ≒ 0.1）。3 つの値は離れて置いてあるので、64 ビット全体に 205 を掛けても互いに混ざりません。`& 0x000f00000f00000f` で各値の十の位だけを取り出し、6 倍して足すと、3 つ同時に BCD になります。

### 3. 十の位と一の位を別々のバイトに分ける

```cpp:line-numbers=630
  digits = ((digits & 0x00f00000f00000f0) >> 4) |
           ((digits & 0x000f00000f00000f) << 8);
```

BCD の `0x12` は 1 バイトの上下のニブルに `1` と `2` が入っています。上のニブル（十の位）を下のバイトへ、下のニブル（一の位）を次のバイトへ移します。これで、バイト 0 が `1`、バイト 1 が `2`、バイト 2 が空き、となります。

### 4. ASCII にして区切りを入れる

```cpp:line-numbers=632
  auto usep = static_cast<ullong>(sep);
  // 各数字のバイトに ASCII の '0' を足し、区切り文字を入れる。
  digits |= 0x3030003030003030 | (usep << 16) | (usep << 40);
```

数字のバイトに `0x30` を OR し、空いているバイト 2 と 5 に `':'` を入れます。整数のバイトは下から `'1' '2' ':' '3' '4' ':' '5' '6'` になりました。

### 5. 8 バイトを一度に書く

```cpp:line-numbers=636
  constexpr size_t len = 8;
  if (is_big_endian()) {
    char tmp[len];
    std::memcpy(tmp, &digits, len);
    std::reverse_copy(tmp, tmp + len, buf);
  } else {
    std::memcpy(buf, &digits, len);
  }
```

リトルエンディアンならそのまま `memcpy` すれば、メモリ上の順に `"12:34:56"` が並びます。ビッグエンディアンではバイト順が逆なので、いったん一時配列に写してから逆順にコピーします。

## ここがすごい

- **SWAR（1 つのレジスタで複数の値を同時に計算）**: 3 つの 2 桁の数を、64 ビット整数の中の別々の場所に置くことで、掛け算・マスク・足し算をそれぞれ 1 回ずつで 3 つ同時に処理しています。
- **割り算がない**: 10 で割る処理は「205 を掛けて 11 ビットシフト」で近似しています。0〜99 の範囲ならこの近似は正確です。
- **書き込みが 1 回**: 1 文字ずつ 8 回書く代わりに、8 バイトを `memcpy` 1 回で書きます。固定長の `memcpy` は 1 回の 64 ビットストアにコンパイルされるのが普通です。
- **出典が明記されている**: コメントに、Pavel Novikov による方法で、元になった記事があることが書かれています。
- **エンディアンにも対応**: バイト順の違いを最後の 1 か所だけで吸収しています。

## まとめ

- 小さな値を 1 つの整数の別々の位置に詰めると、まとめて計算できる（SWAR）。
- 2 桁の数は `x + floor(x/10) × 6` で BCD に変換できる。
- `floor(x/10)` は小さな範囲なら `(x × 205) >> 11` で求まる。
- 出力を整数の中で組み立てて一度に書けば、書き込み回数が減る。
