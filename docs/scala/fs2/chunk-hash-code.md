---
title: "中身の順番を混ぜながら、要素ごとのハッシュを 1 つにまとめる"
description: "fs2 の Chunk.hashCode。最初に型名から決めた値を用意し、要素のハッシュを順に混ぜていく。最後に要素の数を混ぜて仕上げる。同じ中身の Chunk は必ず同じハッシュ値になる。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [547, 552]
format: 2
function: "Chunk.hashCode"
difficulty: 3
tags: [ハッシュ, データ構造, 関数型]
---

## ひとことで

fs2 の `Chunk` は、要素をまとめて持つ不変の塊です。`hashCode` は、`Chunk` の中身から 1 つの整数を作ります。同じ要素が同じ順番で並んでいる `Chunk` なら、必ず同じ値になります。`Map` の鍵や、集合の要素として `Chunk` を使えるようにするための関数です。

## コード

```scala:line-numbers=547
  override def hashCode: Int = {
    import util.hashing.MurmurHash3
    var h = MurmurHash3.stringHash("Chunk")
    foreach(o => h = MurmurHash3.mix(h, o.##))
    MurmurHash3.finalizeHash(h, size)
  }
```

## 前提知識

- `hashCode` は、オブジェクトの内容から作る整数です。同じ内容なら同じ値を返す必要があります。
- 要素が 1 つずつ違うと、ハッシュも違う値になるように、要素を順に「混ぜて」いく方法がよく使われます。
- `MurmurHash3` は、Scala の標準ライブラリにあるハッシュの関数群です。`mix` は 1 つの値を既存のハッシュに混ぜ、`finalizeHash` は最後に長さを混ぜて仕上げます。
- `o.##` は、Scala の任意の値のハッシュを求める書き方です。`null` にも対応します。
- `stringHash("Chunk")` は、型名に当たる文字列から、最初の値を作ります。`Chunk` と他のコレクションを区別するためです。

## 何をしているか

### 1. 最初の値を、型名のハッシュで決める

`MurmurHash3.stringHash("Chunk")` で、初期のハッシュ `h` を作ります。こうすると、同じ要素でも、別の型のコレクションとは違う値になりやすくなります。

```scala:line-numbers=548
    import util.hashing.MurmurHash3
    var h = MurmurHash3.stringHash("Chunk")
```

### 2. 要素を順に混ぜる

`foreach` で各要素を取り出し、要素のハッシュ `o.##` を `mix` で既存の `h` に混ぜます。順番を変えると結果が変わるので、並びの違いも区別できます。

```scala:line-numbers=550
    foreach(o => h = MurmurHash3.mix(h, o.##))
```

### 3. 長さを混ぜて仕上げる

すべての要素を混ぜ終えたら、`finalizeHash` に要素の数を渡して仕上げます。長さも混ぜるので、同じ値が並んでいても、数が違えば別のハッシュになります。

```scala:line-numbers=551
    MurmurHash3.finalizeHash(h, size)
```

## ここがすごい

- 要素の順番と個数の両方が、ハッシュに反映されます。単なる足し算では、順番の違いが消えてしまいます。
- ハッシュの計算は `foreach` の 1 回の走査で終わり、新しいコレクションを作りません。大きな `Chunk` でも、余計なメモリを使いません。
- 型名のハッシュで始めることで、`List` や `Vector` と同じ中身でも、結果が違う値になる可能性を高めています。
- `equals` と組み合わせて、同じ中身なら同じハッシュ、という約束を守っています。

## まとめ

- 順番を区別するハッシュは、要素を 1 つずつ混ぜていく形で作ります。
- 最後に要素の数を混ぜると、長さの違いも区別できます。
- ハッシュと等しさの約束を揃えると、`Map` の鍵として安心して使えます。
