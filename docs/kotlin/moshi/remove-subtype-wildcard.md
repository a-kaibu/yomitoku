---
title: "? extends を取り除いて、中の型だけを取り出す"
description: "Java の型の中の「? extends 型」という書き方を、中にある型そのものに置き換える removeSubtypeWildcard。上限の型だけを持つワイルドカードが対象。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/internal/Util.kt
lines: [196, 203]
function: "Type.removeSubtypeWildcard"
difficulty: 3
tags: [型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`removeSubtypeWildcard` は、Java の型の中に出てくる **「? extends 型」というワイルドカードを、その中の型そのものに置き換える** 関数です。たとえば `List<? extends Number>` を扱うとき、要素の型として `Number` を取り出します。

Moshi は、クラスの型情報をもとに JSON の変換器（アダプター）を探します。型が `? extends Number` のままだと、変換器を探す手がかりとして使いにくいので、この関数で型を素直な形に直しています。

## コード

```kotlin:line-numbers=196
internal fun Type.removeSubtypeWildcard(): Type {
  if (this !is WildcardType) return this
  val lowerBounds = lowerBounds
  if (lowerBounds.isNotEmpty()) return this
  val upperBounds = upperBounds
  require(upperBounds.size == 1)
  return upperBounds[0]
}
```

## 前提知識

- **ワイルドカード（`?`）**: Java のジェネリクスで、「どんな型でもよい」や「ある型の子孫である」を表す書き方です。`? extends Number` は「Number かその子孫」、`? super Int` は「Int かその親」を表します。
- **`WildcardType`**: Java の反射（リフレクション）で、ワイルドカードを表す型です。`lowerBounds`（下限）と `upperBounds`（上限）を持ちます。
- **`lowerBounds` と `upperBounds`**: ワイルドカードの下限と上限の型の配列です。`? extends Number` は上限が `Number`、下限は空です。
- **`require(条件)`**: 条件が偽なら `IllegalArgumentException` を投げます。前提が破られていないかを確かめるための関数です。
- **`Type`**: Java の型全体を表す、反射の基本のインターフェースです。クラス、ジェネリクス、ワイルドカードなどが、すべてこの型で表されます。

## 何をしているか

### 1. ワイルドカードでなければ、そのまま返す

```kotlin:line-numbers=197
  if (this !is WildcardType) return this
```

型がワイルドカードでなければ、何もせずにそのまま返します。`String` や `List<String>` は、この分岐で変わりません。

### 2. 下限があれば、そのまま返す

```kotlin:line-numbers=199
  if (lowerBounds.isNotEmpty()) return this
```

`? super Int` のように下限が付いたワイルドカードは、この関数では取り除きません。下限は「この型より上の型」という意味で、上限と同じように型を 1 つに決められないからです。

### 3. 上限の型を取り出す

```kotlin:line-numbers=202
  return upperBounds[0]
```

下限がなく、上限だけがあるワイルドカードなら、その上限の型を返します。`require(upperBounds.size == 1)` で、上限がちょうど 1 つであることも確かめています。Java の文法では、上限は 1 つの型しか書けないので、この前提は通常は満たされます。

## ここがすごい

- **変換する場合を限定する**: 「上限だけを持つワイルドカード」だけを変換し、それ以外はそのまま返します。何でも変換しようとすると、型の意味を壊してしまうので、対象を絞ったのが安全です。
- **前提を `require` で確かめる**: 上限が 1 つでないという「ありえない状態」を見つけたら、すぐに例外で知らせます。おかしな型が静かに通ってしまうことを防ぎます。
- **型を直して、後の処理を簡単にする**: 変換器を探す処理は、ワイルドカードの扱いを知らなくても、素直な型だけを相手にできます。前処理で型を整えておくのは、よくある設計です。
- **分岐は 3 つだけ**: 「ワイルドカードか」「下限があるか」「上限を返すか」という順番で、読むだけで対象の範囲が分かります。

## まとめ

- ワイルドカードは、上限だけを持つものだけを中の型に置き換える。
- 下限を持つものは、型を 1 つに決められないので、そのまま残す。
- 前提は `require` で確かめると、おかしな状態をすぐ見つけられる。
