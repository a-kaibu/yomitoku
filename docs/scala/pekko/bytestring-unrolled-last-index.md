---
title: "短い範囲を、ループを使わずに手で展開して探す"
description: "Apache Pekko の ByteString が使う unrolledLastIndexOf。後ろから最大 7 バイトを、if の連続で 1 つずつ確かめる。ループの管理を省いて、短い範囲を速く探す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/ByteString.scala"
lines: [357, 366]
format: 2
function: "unrolledLastIndexOf"
difficulty: 3
tags: [最適化, イディオム, 低レイヤ]
---

## ひとことで

Apache Pekko の `ByteString` で、バイト列の末尾側から特定のバイトを探す `unrolledLastIndexOf` です。探す範囲が 7 バイト以下のとき、`while` のループを使わず、`if` を 7 段並べて手で展開しています。短い範囲を何度も探す場面を速くするための書き方です。

## コード

```scala:line-numbers=357
    private def unrolledLastIndexOf(fromIndex: Int, byteCount: Int, value: Byte): Int = {
      if (byteCount >= 7 && bytes(fromIndex + 6) == value) fromIndex + 6
      else if (byteCount >= 6 && bytes(fromIndex + 5) == value) fromIndex + 5
      else if (byteCount >= 5 && bytes(fromIndex + 4) == value) fromIndex + 4
      else if (byteCount >= 4 && bytes(fromIndex + 3) == value) fromIndex + 3
      else if (byteCount >= 3 && bytes(fromIndex + 2) == value) fromIndex + 2
      else if (byteCount >= 2 && bytes(fromIndex + 1) == value) fromIndex + 1
      else if (bytes(fromIndex) == value) fromIndex
      else -1
    }
```

## 前提知識

- `ByteString` は、バイトの不変な列を扱うためのクラスです。Pekko ではネットワークの通信などで使われます。
- 「ループ展開（loop unrolling）」は、繰り返しを手で書き並べて、ループの判定と分岐の回数を減らす最適化です。
- `byteCount` は、探す範囲の長さです。`fromIndex` はその範囲の先頭の位置です。
- `Byte` は 8 ビットの整数で、比較は `==` で行えます。
- `else if` は、前の条件が false のときだけ次の条件を調べる分岐です。

## 何をしているか

### 1. 一番後ろの位置から順に確かめる

この関数は、範囲の末尾に近い位置から先に確かめます。最後に見つかったものを返すため、後ろから探すのが正しい順番です。

```scala:line-numbers=358
      if (byteCount >= 7 && bytes(fromIndex + 6) == value) fromIndex + 6
      else if (byteCount >= 6 && bytes(fromIndex + 5) == value) fromIndex + 5
```

`byteCount >= 7` のように、範囲の長さを条件に入れているので、範囲外の要素を読むことはありません。

### 2. 前の位置へ、同じ形で進む

同じ形の `if` が、位置を 1 つずつ前に戻りながら並んでいます。

```scala:line-numbers=361
      else if (byteCount >= 4 && bytes(fromIndex + 3) == value) fromIndex + 3
      else if (byteCount >= 3 && bytes(fromIndex + 2) == value) fromIndex + 2
      else if (byteCount >= 2 && bytes(fromIndex + 1) == value) fromIndex + 1
```

### 3. 見つからなければ -1

最後の `else` で、先頭の位置を確かめます。それでも見つからなければ `-1` を返します。

```scala:line-numbers=364
      else if (bytes(fromIndex) == value) fromIndex
      else -1
```

## ここがすごい

- ループなら毎回、添字の増減と終了判定が必要です。手で展開すると、その処理がなくなり、CPU が分岐の予測をしやすくなります。
- 範囲の長さを `byteCount >= n` の条件で確かめているので、短い範囲でも配列の外を読まないようにしています。安全性を崩さずに速くしています。
- 7 バイトで区切っているのは、短い範囲を速く処理し、長い範囲は別の関数に任せるという割り切りです。用途に合わせて手で書き分けています。
- 書くのは面倒ですが、性能が重要な場所だけに手で展開するという判断は、低レイヤのライブラリでよく見られます。

## まとめ

- 短い範囲の検索は、ループを手で展開すると速くなることがあります。
- 範囲の長さを条件に入れると、配列の外を読む危険を防げます。
- 手で展開するのは、性能が本当に必要な場所だけにします。
