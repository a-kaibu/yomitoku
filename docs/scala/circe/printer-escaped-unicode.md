---
title: "文字を \\uXXXX の 4 桁の 16 進数で書き出す"
description: "circe の Printer が、JSON の文字列で制御文字などを \\uXXXX の形で書くための関数。文字の 16 ビットを 4 つの 4 ビットに分け、それぞれを 16 進数の 1 桁に変える。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Printer.scala"
lines: [310, 318]
format: 2
function: "Printer.writeEscapedChar"
difficulty: 2
tags: [文字列処理, ビット演算, 標準ライブラリ]
---

## ひとことで

circe は Scala の JSON ライブラリです。JSON の文字列に、文字を `é` のような 4 桁の 16 進数の形で書き出すときに使う関数が、`writeEscapedChar` と `toHex` です。文字の値を 4 つの 4 ビットに分け、それぞれを 16 進数の 1 桁にして並べます。

## コード

```scala:line-numbers=310
  private[this] final def writeEscapedChar(writer: Appendable, c: Char): Unit =
    writer
      .append('u')
      .append(toHex((c >> 12) & 15))
      .append(toHex((c >> 8) & 15))
      .append(toHex((c >> 4) & 15))
      .append(toHex(c & 15))

  private[this] final def toHex(nibble: Int): Char = (nibble + (if (nibble >= 10) 87 else 48)).toChar
```

## 前提知識

- JSON の文字列では、制御文字や一部の記号を `\n` のような書き方や、`\u` で始まる 4 桁の 16 進数で表せます。
- 16 進数は、0 から 9 と a から f の 16 種類の数字で表す方法です。1 桁で 4 ビット（0 から 15）を表せます。
- Scala の `Char` は 16 ビットの値で、Unicode の 1 文字を表します。
- `>>` は、ビットを右にずらす演算です。`& 15` は、下位 4 ビットだけを取り出す演算です。15 は二進数で `1111` です。
- `Appendable` は、文字を後ろに足していける入れ物の型です。`StringBuilder` などが当てはまります。

## 何をしているか

### 1. 4 桁の 16 進数を、上の桁から順に書く

`writeEscapedChar` は、まず `u` を書き、続けて 4 つの 16 進数の桁を書きます。上の桁から順番に書くので、文字の値がそのまま 16 進数として読めます。

```scala:line-numbers=310
  private[this] final def writeEscapedChar(writer: Appendable, c: Char): Unit =
    writer
      .append('u')
      .append(toHex((c >> 12) & 15))
      .append(toHex((c >> 8) & 15))
      .append(toHex((c >> 4) & 15))
      .append(toHex(c & 15))
```

### 2. 4 ビットごとに取り出す

`(c >> 12) & 15` は、上位 4 ビットを取り出す式です。`>> 8`、`>> 4`、そのままの `c & 15` で、残りの 4 ビットも取り出します。

### 3. 0 から 15 の値を、16 進数の文字に変える

`toHex` は、0 から 15 の数を 1 文字の 16 進数にします。10 未満は `'0'` の文字コード 48 を足し、10 以上は `'a'` から始まるように 87 を足します。`'a'` の文字コードは 97 で、97 − 10 = 87 だからです。

```scala:line-numbers=318
  private[this] final def toHex(nibble: Int): Char = (nibble + (if (nibble >= 10) 87 else 48)).toChar
```

`if` を 1 回だけ使うので、表を持たずに済みます。

## ここがすごい

- 表を作らず、足し算とビット演算だけで 16 進数の文字を作ります。短く速い書き方です。
- 数字と英字の差を、足す数（48 と 87）で調整しています。2 つの場合を 1 行にまとめています。
- 常に 4 桁を書くので、出力の長さが文字に関係なく一定です。読む側は位置で文字を探せます。
- `private[this] final` で隠しているので、外から使えるのは `Printer` が公開している機能だけです。

## まとめ

- 16 ビットの文字は、4 つの 4 ビットに分けると、16 進数の 4 桁になります。
- 数字と英字の文字コードの差を足して、16 進数の文字を作れます。
- 常に同じ桁数で書くと、出力の形が安定します。
