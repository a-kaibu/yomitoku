---
title: "時間の長さを、いちばん読みやすい単位に決める"
description: "Apache Pekko の PrettyDuration.chooseUnit。ナノ秒の長さを、日、時、分、秒、ミリ秒、マイクロ秒の順に見て、初めて 1 以上になる単位を選ぶ。単位が大きい順に並べて、最初に当たったものを返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/PrettyDuration.scala"
lines: [63, 73]
format: 2
function: "PrettyDuration.chooseUnit"
difficulty: 2
tags: [日時, 数値計算, 文字列処理]
---

## ひとことで

Apache Pekko の `PrettyDuration` は、時間の長さを人が読みやすい形で表示するための部品です。`chooseUnit` は、その時間を表すのに最もふさわしい単位を選びます。たとえば 90 秒なら「分」、3 日なら「日」を選びます。

## コード

```scala:line-numbers=63
    def chooseUnit(nanos: Long): TimeUnit = {
      val d = nanos.nanos

      if (d.toDays > 0) DAYS
      else if (d.toHours > 0) HOURS
      else if (d.toMinutes > 0) MINUTES
      else if (d.toSeconds > 0) SECONDS
      else if (d.toMillis > 0) MILLISECONDS
      else if (d.toMicros > 0) MICROSECONDS
      else NANOSECONDS
    }
```

## 前提知識

- 単位は、日（DAYS）、時（HOURS）、分（MINUTES）、秒（SECONDS）、ミリ秒、マイクロ秒、ナノ秒の順に、だんだん小さくなります。
- `nanos.nanos` は、ナノ秒の数から `Duration` を作る書き方です。`toDays` や `toHours` などで、各単位に直した値を取り出せます。
- `toDays > 0` は、その単位で 1 以上（切り捨て後）あるかを調べます。1 日未満なら `toDays` は 0 になります。
- `TimeUnit` は、時間の単位を表す Java の列挙型です。`DAYS` などの値として使います。
- 条件が上から順に調べられるので、最初に真になったものが答えになります。

## 何をしているか

### 1. 変換用の Duration を作る

`nanos.nanos` で、ナノ秒の値を `Duration` にします。以後の判定は、この `d` の単位変換で行います。

```scala:line-numbers=64
      val d = nanos.nanos
```

### 2. 大きい単位から順に、1 以上かを調べる

`if (d.toDays > 0) DAYS` から始めて、大きい単位から順に調べます。1 日以上なら日、そうでなければ次に時間、という順番です。

```scala:line-numbers=65

      if (d.toDays > 0) DAYS
      else if (d.toHours > 0) HOURS
      else if (d.toMinutes > 0) MINUTES
      else if (d.toSeconds > 0) SECONDS
```

### 3. どれにも当たらなければ、最小の単位を返す

ミリ秒にもマイクロ秒にも届かないときは、ナノ秒の単位を返します。最後の `else` が、残りの場合をまとめて受け持ちます。

```scala:line-numbers=70
      else if (d.toMillis > 0) MILLISECONDS
      else if (d.toMicros > 0) MICROSECONDS
      else NANOSECONDS
```

## ここがすごい

- 単位を大きい順に並べて、最初に当たった単位を返すので、判定の回数が少なくて済みます。
- `if` の連なりが、単位の表そのものになっています。単位を増やすときも、1 行を足すだけです。
- 1 以上かどうかの判定だけで、単位の選択が決まります。小数の丸めで迷う必要がありません。
- 結果を `TimeUnit` で返すので、後の表示処理で、単位の名前を分けて扱えます。

## まとめ

- 時間の表示単位は、大きい単位から順に 1 以上かを調べると決められます。
- 単位の表を `if` の連なりで書くと、ルールがそのまま読めます。
- 小さすぎる値は、最小の単位に任せると、どんな長さにも対応できます。
