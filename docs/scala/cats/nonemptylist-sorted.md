---
title: "並べ替えても空にならないと分かっているので、非空のまま返す"
description: "Cats の NonEmptyList.sorted。Order に従って並べ替える。空にならないリストを並べ替えても空にならない、という理由で、非空のまま fromListUnsafe で作り直す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [515, 517]
format: 2
function: "NonEmptyList.sorted"
difficulty: 2
tags: [ソート, 型システム, 防御的プログラミング]
---

## ひとことで

Cats の `NonEmptyList` は、必ず一つ以上の要素を持つリストです。`sorted` は、その要素を `Order`（大小の比べ方）に従って並べ替えます。並べ替えた結果も非空のままなので、安全な形で作り直せます。

## コード

::: code-group

```scala:line-numbers=515 [日本語訳]
  def sorted[AA >: A](implicit AA: Order[AA]): NonEmptyList[AA] =
    // 安全です。非空のリストを並べ替えても、空のリストにはならないからです。
    NonEmptyList.fromListUnsafe(toList.sorted(using AA.toOrdering))
```

```scala:line-numbers=515 [原文]
  def sorted[AA >: A](implicit AA: Order[AA]): NonEmptyList[AA] =
    // safe: sorting a NonEmptyList cannot produce an empty List
    NonEmptyList.fromListUnsafe(toList.sorted(using AA.toOrdering))
```

:::

## 前提知識

- `Order[AA]` は、二つの値の大小を比べる方法の約束です。`toOrdering` で、標準の `Ordering` に変えられます。
- `toList.sorted` は、通常のリストを並べ替える標準の操作です。
- `fromListUnsafe` は、リストから `NonEmptyList` を作る操作です。空のリストを渡すと、例外になります。「Unsafe」は、その前提を呼び出し側が守る必要があるという意味です。
- `AA >: A` は、型 `AA` が `A` と同じか、それより広い型であることを表します。
- 「`using`」は、Scala 3 で暗黙の引数を明示的に渡す書き方です。

## 何をしているか

### 1. 要素を、`Order` の大小で並べ替える

まず `toList` で標準のリストにし、`AA.toOrdering` の大小の比べ方で `sorted` します。

```scala:line-numbers=517
    NonEmptyList.fromListUnsafe(toList.sorted(using AA.toOrdering))
```

## ここがすごい

- 「非空のリストを並べ替えても空にはならない」という事実を根拠に、`fromListUnsafe` を使っています。コメントで理由が書かれているので、読み手が安全性を確かめられます。
- 並べ替えの仕組みは、標準のリストの `sorted` に任せています。新しいソートを書く必要がありません。
- 比べ方は `Order` で渡されるので、数、文字列、独自の型など、どの型でも同じ形で並べ替えられます。
- 結果の型が `NonEmptyList[AA]` なので、並べ替えた後も、先頭を安全に取り出せます。

## まとめ

- `sorted` は、`Order` に従って、要素を並べ替えます。
- 結果は非空のままなので、`fromListUnsafe` で安全に作り直せます。
- 安全性の根拠は、コメントの一行で説明されています。
