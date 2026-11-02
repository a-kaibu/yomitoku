---
title: "部分関数に合う要素だけを、先読みしながら返すイテレータ"
description: "Apache Pekko の PartialImmutableValuesIterable.iterator。元のイテレータを先読みして、部分関数が定義されている要素だけを値に変えて返す。hasNext は末尾再帰で次の候補を探す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/Collections.scala"
lines: [59, 88]
format: 2
function: "PartialImmutableValuesIterable.iterator"
difficulty: 3
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

Apache Pekko の `Collections` にある `PartialImmutableValuesIterable` は、ある要素が「対象かどうか」を部分関数で決めて、対象の要素だけを値に変えて並べるコレクションです。その `iterator` は、元のイテレータを 1 つずつ先読みし、次の対象が見つかるまで飛ばしながら返します。

## コード

::: code-group

```scala:line-numbers=59 [日本語訳]
    final def iterator: Iterator[To] = {
      val superIterator = valuesIterator
      new Iterator[To] {
        private var _next: To = null.asInstanceOf[To]
        private var _hasNext = false

        override final def hasNext: Boolean = {
          @tailrec def tailrecHasNext(): Boolean = {
            if (!_hasNext && superIterator.hasNext) { // 次の値が必要で、探すことができるなら
              val potentiallyNext = superIterator.next()
              if (isDefinedAt(potentiallyNext)) {
                _next = apply(potentiallyNext)
                _hasNext = true
                true
              } else tailrecHasNext() // 次の値を探し直します
            } else _hasNext // 見つかっていればそれを返します
          }

          tailrecHasNext()
        }

        override final def next(): To =
          if (hasNext) {
            val ret = _next
            _next = null.asInstanceOf[To] // 使ったことを示します（GC に優しく、最後に返した値を保持しないため）
            _hasNext = false // 使ったことを示します（次の値を探す必要があるため）
            ret
          } else throw new java.util.NoSuchElementException("next")
      }
    }
```

```scala:line-numbers=59 [原文]
    final def iterator: Iterator[To] = {
      val superIterator = valuesIterator
      new Iterator[To] {
        private var _next: To = null.asInstanceOf[To]
        private var _hasNext = false

        override final def hasNext: Boolean = {
          @tailrec def tailrecHasNext(): Boolean = {
            if (!_hasNext && superIterator.hasNext) { // If we need and are able to look for the next value
              val potentiallyNext = superIterator.next()
              if (isDefinedAt(potentiallyNext)) {
                _next = apply(potentiallyNext)
                _hasNext = true
                true
              } else tailrecHasNext() // Attempt to find the next
            } else _hasNext // Return if we found one
          }

          tailrecHasNext()
        }

        override final def next(): To =
          if (hasNext) {
            val ret = _next
            _next = null.asInstanceOf[To] // Mark as consumed (nice to the GC, don't leak the last returned value)
            _hasNext = false // Mark as consumed (we need to look for the next value)
            ret
          } else throw new java.util.NoSuchElementException("next")
      }
    }
```

:::

## 前提知識

- イテレータは、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを調べ、`next()` で取り出します。
- 部分関数（PartialFunction）は、一部の入力にだけ値を返す関数です。`isDefinedAt` で対象かどうかを調べられます。
- 「先読み」は、次の値をあらかじめ見つけておく方法です。`hasNext` を呼んだ時点で、次の対象を探します。
- `null.asInstanceOf[To]` は、まだ値がないときの初期値です。
- `NoSuchElementException` は、要素がないのに取り出そうとしたときの例外です。

## 何をしているか

### 1. 次の対象が見つかるまで、要素を飛ばす

`hasNext` の中で、次の対象がまだなければ、元のイテレータから要素を 1 つ取り出します。`isDefinedAt` で対象かどうかを確かめ、対象なら値に変えて `_next` に入れます。

```scala:line-numbers=67
            if (!_hasNext && superIterator.hasNext) { // If we need and are able to look for the next value
```

対象でなければ、同じ関数を再帰で呼んで、次の要素を探します。この再帰は末尾にあるので、`@tailrec` でループになります。

```scala:line-numbers=69
              if (isDefinedAt(potentiallyNext)) {
```

### 2. next は、先読みした値を返す

`next()` は、`hasNext` で次の値を用意してから、`_next` を取り出します。取り出したあとは、`_next` を空にして、次の `hasNext` で新しい値を探すようにします。

```scala:line-numbers=83
            _next = null.asInstanceOf[To] // Mark as consumed (nice to the GC, don't leak the last returned value)
```

### 3. 対象が 1 つも残っていなければ終わり

元のイテレータが尽きたら、`_hasNext` が偽のまま返り、`hasNext` は偽になります。

## ここがすごい

- 対象の判定を `isDefinedAt`、変換を `apply` で分けているので、フィルタと変換を 1 つの部品で行えます。
- 次の値を先読みして、ぴったりの 1 個だけ保持するので、要素を全部コピーせずに済みます。
- 取り出した値を `null` にするのは、GC に参照を残さないためです。コメントにもある、メモリ管理への配慮です。
- 再帰を末尾に置いて `@tailrec` にしているので、対象でない要素が大量に続いても、スタックは増えません。

## まとめ

- 対象を部分関数で決めると、フィルタと変換を 1 つにまとめられます。
- 先読みの値を 1 つだけ持つと、余計なコピーを避けられます。
- 対象探しを末尾再帰で書くと、飛ばす要素が多くても安全です。
