---
title: "要素数を、木の形のまま数えて、箱に包まずに足す"
description: "Cats の Chain.length。Chain は連結を木の形で持つので、葉の数を数えながら、大きさを足し合わせる。末尾再帰と、自分で管理するリストを使い、ループでたどる。値を箱に包まない（unboxed）最適化版。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Chain.scala"
lines: [836, 865]
format: 2
function: "Chain.length"
difficulty: 3
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

Cats の `Chain` は、要素の連結を木の形で持つデータ構造です。`length` は、全体の要素の数を求めます。木の葉をたどりながら、各葉の大きさを足し合わせます。`Chain` の要素の数を、先頭から数え直さずに求めることができます。

## コード

::: code-group

```scala:line-numbers=836 [日本語訳]
  final def length: Long = {
    // 値を箱（オブジェクト）に包まずに数える、最適化された実装です。
    // foldLeft と同じ処理の流れです。
    @annotation.tailrec
    def loop(head: Chain.NonEmpty[A], tail: List[Chain.NonEmpty[A]], acc: Long): Long =
      head match {
        case Append(l, r) => loop(l, r :: tail, acc)
        case Singleton(_) =>
          val nextAcc = acc + 1L
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
          }
        case Wrap(seq) =>
          val nextAcc = acc + seq.length.toLong
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
          }
      }

    this match {
      case ne: Chain.NonEmpty[A] =>
        loop(ne, Nil, 0L)
      case _ => 0L
    }
```

```scala:line-numbers=836 [原文]
  final def length: Long = {
    // This is an optimized (unboxed) implementation
    // of the same code as foldLeft
    @annotation.tailrec
    def loop(head: Chain.NonEmpty[A], tail: List[Chain.NonEmpty[A]], acc: Long): Long =
      head match {
        case Append(l, r) => loop(l, r :: tail, acc)
        case Singleton(_) =>
          val nextAcc = acc + 1L
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
          }
        case Wrap(seq) =>
          val nextAcc = acc + seq.length.toLong
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
          }
      }

    this match {
      case ne: Chain.NonEmpty[A] =>
        loop(ne, Nil, 0L)
      case _ => 0L
    }
```

:::

## 前提知識

- `Chain` は、`append` で後ろに足すと、元の要素を並べ直さずに木の枝として連結される型です。そのため、連結が速く行えます。
- 木の枝は `Append(l, r)`、1 つの要素は `Singleton`、要素の並びは `Wrap(seq)` で表されます。
- 「末尾再帰」は、関数の最後で自分自身を呼ぶ形です。コンパイラがループに変えるので、深さが増えません。
- `List[...]` の `tail` は、まだたどっていない枝を積んでおく、一時的なスタックです。
- `Long` は 64 ビットの整数です。要素の数が非常に多くなっても、溢れにくい型です。

## 何をしているか

### 1. 枝の左側へ進み、右側は後で数えるために積む

`Append(l, r)` の場合は、左の枝 `l` へ進みます。右の枝 `r` は、`tail` に積んでおきます。こうすると、今の枝が終わったら、積んだ右の枝から続けられます。

```scala:line-numbers=842
        case Append(l, r) => loop(l, r :: tail, acc)
```

### 2. 1 つの要素なら、数を 1 増やす

`Singleton` は要素が 1 つなので、`acc` を 1 増やします。積んでいる枝があれば、それを次にたどります。なければ、数え終わりです。

```scala:line-numbers=843
        case Singleton(_) =>
          val nextAcc = acc + 1L
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
          }
```

### 3. 要素の並びなら、その長さを足す

`Wrap(seq)` の場合は、中の並びの `seq.length` を `acc` に足します。ここでも、積んでいる枝があれば続けます。

```scala:line-numbers=851
        case Wrap(seq) =>
          val nextAcc = acc + seq.length.toLong
          tail match {
            case h1 :: t1 =>
              loop(h1, t1, nextAcc)
            case _ =>
              nextAcc
```

### 4. 空でなければ、たどり始める

最後に、`this` が空かどうかを確かめます。空なら 0 を返します。空でなければ、`loop` を開始し、残りの枝は空のリストから始めます。

```scala:line-numbers=861
    this match {
      case ne: Chain.NonEmpty[A] =>
        loop(ne, Nil, 0L)
      case _ => 0L
```

## ここがすごい

- 要素を 1 つずつ数えるのではなく、要素の並び（`Wrap`）は長さを 1 回で足します。大きな並びでも速く済みます。
- 積む枝を `List` で管理するので、木が深くても、関数の呼び出しの深さは増えません。
- コメントにあるように、`foldLeft` と同じ流れを、値を箱に包まずに行う最適化です。数を足すだけなので、`Long` のまま計算できます。
- 空の `Chain` は特別に 0 を返すので、`loop` に空の枝を渡さずに済みます。

## まとめ

- 木の形で持つ連結リストの大きさは、葉をたどりながら足し合わせると求まります。
- 積む枝をリストで持つと、深い木でも安全にたどれます。
- 同じ処理の最適化版は、値を箱に包まずに書くと、速く動きます。
