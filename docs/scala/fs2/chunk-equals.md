---
title: "2 つの Chunk を、型と要素の並びが同じかで比べる"
description: "fs2 の Chunk.equals。相手が Chunk であり、大きさが同じで、要素の並びも同じときだけ真を返す。比べるには、両方の Iterator を使って sameElements で順に比べる。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [554, 559]
format: 2
function: "Chunk.equals"
difficulty: 2
tags: [データ構造, 型システム, 関数型]
---

## ひとことで

fs2 の `Chunk` は、要素を並べて持つ不変の塊です。`equals` は、2 つの `Chunk` が同じかどうかを決めます。相手が `Chunk` で、大きさが同じで、要素が同じ順番で並んでいるときだけ、同じだと判定します。

## コード

```scala:line-numbers=554
  override def equals(a: Any): Boolean =
    a match {
      case c: Chunk[?] =>
        size == c.size && iterator.sameElements(c.iterator: Iterator[Any])
      case _ => false
    }
```

## 前提知識

- `equals` は、2 つのオブジェクトが「同じ内容か」を判定する関数です。`==` の判定で使われます。
- `a match { case c: Chunk[?] => ... }` は、`a` が `Chunk` かを型で調べる書き方です。`Chunk[?]` は、中身の型を問わない `Chunk` を表します。
- `iterator` は、要素を 1 つずつ取り出す仕組みです。2 つの `Iterator` を使えば、配列の内部を直接見なくても比べられます。
- `sameElements` は、2 つの `Iterator` が同じ要素を同じ順番で返すかを確かめる関数です。
- `c.iterator: Iterator[Any]` は、型の違いを越えて比べるために、型を `Any` として扱う書き方です。

## 何をしているか

### 1. 相手の型を確かめる

まず、比べる相手 `a` が `Chunk` かを調べます。`Chunk` でなければ、同じ内容ではないので、後の判定へは進みません。

```scala:line-numbers=555
    a match {
      case c: Chunk[?] =>
```

### 2. 大きさを比べ、並びを順に比べる

大きさが同じかを先に確かめます。大きさが違えば、中身を調べる前に偽になります。大きさが同じときだけ、2 つの `iterator` を `sameElements` で比べます。

```scala:line-numbers=557
        size == c.size && iterator.sameElements(c.iterator: Iterator[Any])
```

### 3. 相手が Chunk でなければ、偽を返す

型が違う場合は、`case _ => false` で偽を返します。これで、`List` などと比べても、等しいと判定されません。

```scala:line-numbers=558
      case _ => false
    }
```

## ここがすごい

- 大きさを先に比べるので、大きさが違う場合は要素を 1 つも読まずに答えが出ます。速さのための順番です。
- 配列の中身を直接覗かず、`iterator` だけで比べるので、`Chunk` の内部の作り（配列の種類や位置）に左右されません。
- 要素が途中で違えば、そこで比べるのを止めます。一致しない場合の無駄な読みが起きません。
- `equals` とハッシュ値（`hashCode`）の約束を守って作られているので、`Map` や集合の中で正しく動きます。

## まとめ

- 2 つのコレクションを比べるときは、型、大きさ、中身の順に確かめると速く判定できます。
- 内部の配列に頼らず、`Iterator` で比べると、表現の違いを気にせず済みます。
- `equals` を決めたら、`hashCode` も同じ基準で揃えておくことが大切です。
