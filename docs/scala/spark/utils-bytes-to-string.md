---
title: "バイト数を、読みやすい単位（KB、MB など）の数に直す"
description: "Apache Spark の Utils.bytesToString。バイト数を、単位の大きい順に見て、2 倍以上になる最初の単位で割る。小数 1 桁の数と単位の記号を組み立てる。単位が足りないときは B（バイト）のまま表す。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/Utils.scala"
lines: [1142, 1146]
format: 2
function: "Utils.bytesToString"
difficulty: 3
tags: [数値計算, 文字列処理, 標準ライブラリ]
---

## ひとことで

Spark の `Utils.bytesToString` は、`1073741824` のような大きなバイト数を、`1.0 GB` のような読みやすい表記にします。大きすぎず小さすぎない単位を選び、小数 1 桁で表します。ログや画面の表示で使われます。

## コード

```scala:line-numbers=1142
  def bytesToString(size: Long): String = {
    var i = 0
    while (i < siByteSizes.length - 1 && size < 2 * siByteSizes(i)) i += 1
    "%.1f %s".formatLocal(Locale.US, size.toDouble / siByteSizes(i), siByteSuffixes(i))
  }
```

## 前提知識

- 1 KB は 1024 バイト、1 MB は 1024 KB のように、単位は 1024 倍ずつ上がります。
- 単位の表は、大きい順（EB、PB、TB、GB、MB、KB、B）に並んでいます。ここでは、単位ごとのバイト数を持つ配列と、記号を持つ配列を使います。
- `size < 2 * siByteSizes(i)` は、今の単位の 2 倍より小さいかを調べます。2 倍以上なら、その単位で表すのにちょうどよい大きさです。
- `"%.1f %s".formatLocal(...)` は、小数 1 桁の数と記号を組み立てる書式です。`Locale.US` を使うので、小数点が必ず「.」になります。
- `size.toDouble` は、整数を小数に直す操作です。割り算を小数で行うために必要です。

## 何をしているか

### 1. 単位を、大きい順に見ていく

`i` は、今見ている単位の番号です。先頭（EB）から始め、`size` が今の単位の 2 倍より小さいあいだ、より小さい単位へ進みます。

```scala:line-numbers=1143
    var i = 0
    while (i < siByteSizes.length - 1 && size < 2 * siByteSizes(i)) i += 1
```

### 2. 2 倍以上になる単位で割って、表記を作る

ループが止まった位置の単位で `size` を割ります。その値を小数 1 桁で表し、単位の記号を続けて返します。

```scala:line-numbers=1145
    "%.1f %s".formatLocal(Locale.US, size.toDouble / siByteSizes(i), siByteSuffixes(i))
```

## ここがすごい

- 「2 倍以上なら、その単位」という単純な規則で、表記が大きすぎても小さすぎてもならないように選べます。
- 単位の表を配列にまとめているので、単位を増やすときも、この関数は変えずに済みます。
- `Locale.US` を指定しているので、どの国の設定でも同じ表記になります。ログを比べやすくなります。
- 単位が一番小さい B のときは、ループが自然に終わるので、特別な分岐がいりません。

## まとめ

- 数の表記は、単位を大きい順に見て、適切な大きさの単位を選ぶと読みやすくなります。
- 表示用の書式は、地域の設定に左右されないように、ロケールを指定します。
- 単位の表をデータとして持つと、単位の追加や変更が簡単になります。
