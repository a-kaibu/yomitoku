---
title: "数字を桁そろえのゼロで埋める padInt"
description: "整数を指定した桁数になるまで先頭に 0 を足して、文字列の末尾に書き足す padInt。日付の「月」や「時」を 2 桁にそろえるために使われている。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2011 FasterXML, LLC"
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi-adapters/src/main/java/com/squareup/moshi/adapters/Iso8601Utils.kt
lines: [287, 293]
function: "StringBuilder.padInt"
difficulty: 1
tags: [文字列処理, イディオム, 日時]
format: 2
---

## ひとことで

`padInt()` は、整数を **指定した桁数になるまで先頭を 0 で埋めて** 、`StringBuilder` の末尾に書き足す関数です。たとえば `5` を 2 桁で書くと `05` になります。

Moshi（JSON を Kotlin や Java のオブジェクトに変換するライブラリ）の、ISO 8601 形式の日付を書き出す部分で使われています。日付では「月」や「時」を必ず 2 桁にそろえる決まりがあるので、この関数が役立ちます。

## コード

```kotlin:line-numbers=287
private fun StringBuilder.padInt(value: Int, length: Int) {
  val strValue = value.toString()
  for (i in length - strValue.length downTo 1) {
    append('0')
  }
  append(strValue)
}
```

## 前提知識

- **`StringBuilder`**: 文字列を少しずつ組み立てるための箱です。`append` で末尾に文字や文字列を足せます。
- **拡張関数 `StringBuilder.padInt`**: `StringBuilder` に後から足された関数です。`sb.padInt(5, 2)` のように呼べます。`private` なので、このファイルの中でだけ使えます。
- **`downTo`**: 大きい数から小さい数へ、順番に値を並べる範囲を作る書き方です。`5 downTo 1` は 5、4、3、2、1 を表します。
- **`toString()`**: 数値を文字列に変換するメソッドです。
- **`append('0')`**: 文字 `0` を 1 つ、末尾に足します。

## 何をしているか

### 1. 数字を文字列にする

```kotlin:line-numbers=288
  val strValue = value.toString()
```

整数を文字列にします。`5` なら `"5"`、`123` なら `"123"` になります。桁数を数えるために、まず文字列の形にしておきます。

### 2. 足りない桁の分だけ 0 を書く

```kotlin:line-numbers=289
  for (i in length - strValue.length downTo 1) {
```

目標の桁数から、今の桁数を引いた回数だけ繰り返します。たとえば目標が 2 桁で、数字が `5` の 1 桁なら、`2 - 1 = 1` 回です。

```kotlin:line-numbers=290
    append('0')
```

その回数だけ、0 を末尾に足します。

### 3. 数字そのものを書く

```kotlin:line-numbers=292
  append(strValue)
```

0 を書き終えたあとで、もとの数字を続けて書きます。これで `05` のような形になります。

## ここがすごい

- **桁が多いときは何もしない**: 数字がすでに目標より長ければ、`downTo` の範囲が空になり、ループは 1 回も回りません。例外を投げたり、数字を切り詰めたりせず、そのまま書き出します。
- **文字列の作り直しを避ける**: 0 を `StringBuilder` に直接足すので、0 だけの文字列を別に作ってつなぐ必要がありません。日付の書き出しのように、何度も呼ばれる場所で効率的です。
- **`for` の中身が 1 文だけ**: 数を数えるための変数が要らず、「0 を足す」という操作だけが残っています。
- **`private` で閉じている**: 日付の書き出し専用の補助関数なので、外からは見えません。小さな補助関数を、使う場所の近くに置く作り方です。

## まとめ

- `padInt` は、整数を指定の桁数にそろえ、足りない分を先頭の 0 で埋める。
- 桁数がすでに十分なら、ループが回らず、そのまま数字を書く。
- 日付のように桁のそろえが必要な書き出しで、小さく確実に使える。
