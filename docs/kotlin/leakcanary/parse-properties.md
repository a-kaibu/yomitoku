---
title: "getprop の出力を、名前と値の対応表にする"
description: "Android の getprop の表示を、「[名前]: [値]」の行ごとに正規表現で読み取り、名前から値を引ける Map にする parseProperties。"
language: kotlin
project: "LeakCanary"
repo: https://github.com/square/leakcanary
license: Apache-2.0
copyright: "Copyright 2015 Square, Inc."
commit: "eb60b0be53732aa016c79b7774b497770ad1e4f3"
file: shark/shark-dive/shark-dive-core/src/main/java/shark/dive/Adb.kt
lines: [251, 253]
function: "parseProperties"
difficulty: 2
tags: [文字列処理, パース, 正規表現]
format: 2
---

## ひとことで

`parseProperties` は、Android の `getprop` コマンドの出力を、**「名前から値を引ける `Map`」に変換する** 関数です。

`getprop` は、端末の設定値（プロパティ）を、`[ro.product.model]: [Pixel 8]` のような行で一覧にします。この関数は、その行を 1 つずつ正規表現で読み取り、名前と値を対応させます。`shark-dive` が、端末の情報をもとに画面に表示する値を取るときに使われます。

## コード

```kotlin:line-numbers=251
internal fun parseProperties(output: String): Map<String, String> = output.lines()
  .mapNotNull { PROPERTY_LINE.matchEntire(it.trim()) }
  .associate { it.groupValues[1] to it.groupValues[2] }
```

## 前提知識

- **`getprop`**: Android 端末の設定値を表示するコマンドです。行の形は `[名前]: [値]` で、名前にも値にも角かっこが付きます。
- **正規表現（Regex）**: 文字列の形を記号で書いた検索パターンです。`(` と `)` で囲んだ部分は、後で取り出せるグループになります。
- **`matchEntire`**: 文字列全体がパターンに一致したときだけ結果を返す関数です。一部だけ一致した場合は `null` になります。
- **`groupValues`**: 一致した結果のグループの値をリストで返します。`groupValues[0]` は一致した全体、`groupValues[1]` 以降が `()` で囲んだ部分です。
- **`associate`**: 各要素から「キーと値の組」を作り、`Map` にまとめる標準関数です。

## 何をしているか

### 1. 行を正規表現で読む

```kotlin:line-numbers=257
private val PROPERTY_LINE = Regex("\\[(.+?)]: \\[(.*)]")
```

正規表現は、`[` で囲まれた名前、`]: `、`[` で囲まれた値、という形を表しています。名前の部分は `.+?` で、できるだけ短く一致するように書かれています。これは、値の中に `]` が含まれていても、名前の終わりを正しく見つけるためです。

### 2. 一致した行だけを取り出す

```kotlin:line-numbers=252
  .mapNotNull { PROPERTY_LINE.matchEntire(it.trim()) }
```

各行の前後の空白を取り、正規表現で全体が一致するかを確かめます。一致しない行（空の行や見出しなど）は `null` になり、`mapNotNull` が捨てます。

### 3. 名前と値の組にする

```kotlin:line-numbers=253
  .associate { it.groupValues[1] to it.groupValues[2] }
```

一致した結果から、1 番目のグループ（名前）と 2 番目のグループ（値）を取り出し、`to` で組にします。`associate` が、その組を `Map` にまとめます。同じ名前が複数あると、後の行の値で上書きされます。

## ここがすごい

- **形で判断する**: 「この行は設定値か」を、行の中身を 1 つずつ調べずに、正規表現 1 つで判定しています。行の形が決まっている出力には、とても合った方法です。
- **最短一致で境界を決める**: `.+?` の `?` は、できるだけ短く一致させる指定です。これで、名前と値の境界を誤らずに見つけられます。
- **読み取りと変換が 1 本の流れ**: 行を読む、一致を取る、組にする、`Map` にする、という処理が、そのまま上から下へ並んでいます。
- **正規表現を名前で持つ**: 正規表現を `PROPERTY_LINE` という名前の定数にしておくと、何を読んでいるかが分かりやすくなります。

## まとめ

- 形が決まった行の出力は、正規表現で 1 行ずつ読むと短く書ける。
- `(` `)` で囲んだ部分を `groupValues` で取り出し、`associate` で `Map` にまとめる。
- 最短一致の `?` を使うと、区切りの位置を正しく見つけやすい。
