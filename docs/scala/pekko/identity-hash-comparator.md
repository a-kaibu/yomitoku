---
title: "番号が同じときだけ、本当の比較関数に任せる"
description: "Apache Pekko の Helpers.identityHashComparator。まず速い identityHashCode で比べ、同じ番号で別のオブジェクトのときだけ、本来の比較関数で比べる。速さと正しさを両立させる組み合わせ。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/Helpers.scala"
lines: [66, 71]
format: 2
function: "Helpers.identityHashComparator"
difficulty: 2
tags: [ソート, ハッシュ, 最適化]
---

## ひとことで

Apache Pekko の `Helpers.identityHashComparator` は、比較関数を作る関数です。まずオブジェクトの `identityHashCode` で速く比べ、番号が同じでオブジェクトが別々の場合だけ、利用者が渡した本来の比較関数で比べます。速さと、本来の順序の正しさの両方を取っています。

## コード

```scala:line-numbers=66
  def identityHashComparator[T <: AnyRef](comp: Comparator[T]): Comparator[T] =
    (a: T, b: T) =>
      compareIdentityHash(a, b) match {
        case 0 if a != b => comp.compare(a, b)
        case x           => x
      }
```

## 前提知識

- `Comparator` は Java の比較関数の型で、2 つの値の大小を返します。
- `compareIdentityHash` は、前の記事で読んだ関数で、オブジェクトの番号で大小を決めます。
- `case 0 if a != b` は、「結果が 0 かつ、2 つが等しくない」ときだけ、次の処理を行うパターンです。`!=` は値の等しさを比べます。
- `case x => x` は、それ以外の場合に、結果をそのまま返すパターンです。
- 比較関数は、等しいものには 0 を返すという約束があります。

## 何をしているか

### 1. まず番号で比べる

まず、`compareIdentityHash(a, b)` を呼び、番号で大小を調べます。番号が違えば、その結果をそのまま返します。

### 2. 番号が同じで、中身が違うときだけ本来の比較をする

番号が同じ（結果が 0）で、オブジェクトが等しくない場合は、利用者の比較関数で比べます。

```scala:line-numbers=69
        case 0 if a != b => comp.compare(a, b)
```

番号が同じでも、同じオブジェクトなら、0 をそのまま返します。同じものを比べているので、順序は決まっているからです。

## ここがすごい

- 多くの比較は番号の違いだけで決まるので、本来の比較関数（中身を見るかもしれない重い処理）を呼ぶ回数が減ります。
- 番号が同じでも、別のオブジェクトなら、本来の比較関数で順序を決めます。番号の衝突で順序が曖昧になることを防ぎます。
- 注釈のコメントにあるように、この比較関数は `equals` と矛盾しない比較関数を渡すことが前提です。そうでないと、番号による速い比較の意味がなくなります。
- 比較関数を関数で作って返すので、利用する側は普通の `Comparator` として使えます。

## まとめ

- 速い比較を先に行い、同じ結果のときだけ遅い比較に任せると、速さと正しさを両立できます。
- 「等しい」の判定を `!=` で行い、等しいものは 0 のまま返すと、順序が安定します。
- 比較関数を組み立てて返すと、使う側は違いを意識しなくて済みます。
