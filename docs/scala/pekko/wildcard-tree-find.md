---
title: "ワイルドカードを含む名前を、木をたどって探す"
description: "Apache Pekko の WildcardTree.findWithSingleWildcard。名前の要素を 1 つずつ子の木へ進む。完全一致、「*」、接尾辞のワイルドカードの順に試し、見つからなければ空の木を返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/WildcardIndex.scala"
lines: [77, 96]
format: 2
function: "WildcardTree.findWithSingleWildcard"
difficulty: 3
tags: [データ構造, 探索, 再帰]
---

## ひとことで

Apache Pekko の `WildcardIndex` は、ドットで区切られた名前（たとえば `a.b.c`）に、ワイルドカードを含む登録名を照らし合わせる仕組みです。その中の `findWithSingleWildcard` は、名前の要素を 1 つずつ木の子へ進めて、一致する枝を探します。

## コード

```scala:line-numbers=77
  @tailrec def findWithSingleWildcard(elems: Iterator[String]): WildcardTree[T] =
    if (!elems.hasNext) this
    else {
      val nextElement = elems.next()
      children.get(nextElement) match {
        case Some(branch) => branch.findWithSingleWildcard(elems)
        case None         =>
          children.get("*") match {
            case Some(branch) => branch.findWithSingleWildcard(elems)
            case None         =>
              val maybeWildcardSuffixMatchingBranch = wildcardSuffixChildren.collectFirst {
                case (key, branch) if nextElement.startsWith(key) => branch
              }
              maybeWildcardSuffixMatchingBranch match {
                case Some(branch) => branch.findWithSingleWildcard(elems)
                case None         => WildcardTree[T]()
              }
          }
      }
    }
```

## 前提知識

- `WildcardTree` は、名前の要素を枝にした木です。各ノードが、子の名前の枝を持っています。
- `Iterator[String]` は、名前の要素を 1 つずつ取り出す仕組みです。`hasNext` と `next()` で使います。
- ワイルドカード `*` は、どんな要素にも一致する印です。ここでは子の名前に `"*"` という枝があれば、それを使います。
- `collectFirst` は、条件に合う最初の要素を取り出して、その結果を返す関数です。
- `startsWith(key)` は、文字列が接頭辞 `key` で始まるかを調べます。接尾辞のワイルドカードの判定に使います。

## 何をしているか

### 1. まず完全一致の枝を探す

要素が残っていれば、次の要素 `nextElement` を取り出し、子の中に同じ名前の枝があるかを調べます。あれば、その枝で再帰的に続けます。

```scala:line-numbers=81
      children.get(nextElement) match {
        case Some(branch) => branch.findWithSingleWildcard(elems)
```

### 2. 次に、ワイルドカードの枝を試す

完全一致がなければ、`"*"` という枝を試します。あれば、その枝で続けます。

```scala:line-numbers=84
          children.get("*") match {
            case Some(branch) => branch.findWithSingleWildcard(elems)
```

### 3. 最後に、接尾辞のワイルドカードを試す

それもなければ、`wildcardSuffixChildren` の中から、名前が接頭辞で始まるものを探します。見つからなければ、空の木 `WildcardTree[T]()` を返して、不一致を示します。

```scala:line-numbers=87
              val maybeWildcardSuffixMatchingBranch = wildcardSuffixChildren.collectFirst {
                case (key, branch) if nextElement.startsWith(key) => branch
```

## ここがすごい

- 完全一致を先に、ワイルドカードを後に試すことで、より具体的な登録を優先します。ルーティングのような「一番近いもの」を選ぶ仕組みに向いた順番です。
- 名前の要素を 1 回ずつ進むので、探索は名前の長さに比例します。登録の数が多くても、木の深さだけ見れば済みます。
- 再帰の呼び出しが末尾にあるため、`@tailrec` でループに変わり、長い名前でもスタックを増やしません。
- 不一致のときは例外ではなく、空の木を返します。呼び出し側は、空かどうかで判定するだけで済みます。

## まとめ

- 名前を木で持つと、要素の列を 1 つずつたどって照合できます。
- 具体的な一致を先に試すと、優先順位のある照合ができます。
- 末尾再帰で書くと、深い名前にも強くなります。
