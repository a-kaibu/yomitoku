---
title: "空と 1 要素のリストを、余分な箱を作らずに表す"
description: "ZIO の FastList.cons。空のリストは null、1 要素のリストはその値そのもの、2 要素以上は (先頭, 残り) のタプルで表し、メモリの割り当てを減らす。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2022-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/internal/FastList.scala"
lines: [39, 44]
format: 2
function: "FastList.cons"
difficulty: 3
tags: [データ構造, 低レイヤ, 最適化]
---

## ひとことで

ZIO の内部には、リストを軽く作るための `FastList` があります。普通のリストは、要素ごとに箱（オブジェクト）を作ります。`FastList` は、空のリストを `null`、1 要素のリストを値そのもの、2 要素以上のリストを `(先頭, 残り)` のタプルで表します。箱の数を減らして、メモリの割り当てを抑えます。

## コード

```scala:line-numbers=39
      def empty[A]: List[A] = null
      def cons[A](a: A, as: List[A]): List[A] =
        as match {
          case null => a
          case as   => (a, as)
        }
```

## 前提知識

- `null` は「何もない」ことを表す特別な値です。ここでは、空のリストを表すのに使っています。
- タプル `(a, as)` は、2 つの値をまとめた箱です。
- `as match { case null => ... case as => ... }` は、値が `null` かどうかで処理を分ける書き方です。
- `cons` は、先頭に要素を 1 つ足して新しいリストを作る操作です。
- 「割り当て」は、プログラムが新しい箱をメモリ上に作ることです。作る回数が多いと、速さが落ちやすくなります。

## 何をしているか

### 1. 空のリストに足すと、値そのものが 1 要素のリストになる

`as` が `null`（空）のとき、`cons(a, null)` は `a` を返します。箱を作らず、値そのものが 1 要素のリストになります。

```scala:line-numbers=42
          case null => a
```

### 2. 1 要素以上のリストに足すと、タプルで先頭と残りをまとめる

`as` が空でないときは、`(a, as)` のタプルを作ります。先頭が `a`、残りが `as` です。

```scala:line-numbers=43
          case as   => (a, as)
```

### 3. `isEmpty` は、`null` かどうかだけを見る

空かどうかは `null` で判定します。箱を開けずに済むので、とても軽い判定です。

```scala:line-numbers=47
          case null => true
          case _    => false
```

## ここがすごい

- 1 要素のリストに箱を作らないので、よく使われる短いリストで、メモリの割り当てが減ります。
- 空の判定が `null` の比較だけなので、速く終わります。
- 型は `List[+A] = Any` として隠されています。使う側は決まった型の操作だけを通して扱い、中の表現に頼れません。
- 代わりに、この表現は内部用に限られています。要素がタプルだと、1 要素のリストと 2 要素のリストを区別できなくなるからです。だから `ListModule` の外へは公開されていません。

## まとめ

- `FastList` は、空を `null`、1 要素を値そのもの、2 要素以上をタプルで表します。
- `cons` の中身は、`null` かどうかの判定と、タプルを作る一つの分岐だけです。
- 軽さを得る代わりに、要素の型に制約がある、内部用の設計です。
