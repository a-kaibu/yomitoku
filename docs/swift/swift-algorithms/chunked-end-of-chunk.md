---
title: "「隣と同じグループか」を見て、チャンクの終わりを見つける"
description: "swift-algorithms の chunked(by:) で、あるチャンクがどこで終わるかを求める関数。先頭の値を覚えておき、次の要素と順に比べて、同じグループが途切れる位置を探す。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Chunked.swift
lines: [79, 87]
function: "ChunkedByCollection.endOfChunk(startingAt:)"
difficulty: 2
tags: [イテレータ, アルゴリズム, 標準ライブラリ]
format: 2
---
## ひとことで

`chunked(by:)` は、隣り合う要素のうち「同じグループ」のものを 1 つのチャンク（まとまり）にする操作です。たとえば `[1, 1, 2, 3, 3]` を値で区切ると、`[1, 1]`、`[2]`、`[3, 3]` の 3 チャンクになります。
`endOfChunk(startingAt:)` は、ある位置から始まるチャンクが **どこで終わるか** を返します。

## コード

```swift:line-numbers=79
  internal func endOfChunk(startingAt start: Base.Index) -> Base.Index {
    var subject = projection(base[start])

    return base[base.index(after: start)...].endOfPrefix(while: { element in
      let nextSubject = projection(element)
      defer { subject = nextSubject }
      return belongInSameGroup(subject, nextSubject)
    })
  }
```

## 前提知識

- **`Base.Index`**: 元のコレクションの添字の型です。配列なら `Int`、文字列なら `String.Index` です。
- **`projection`**: 要素から「グループを決める値」を取り出す関数です。たとえば要素そのものを使うか、要素の一部を使うかを、呼び出し側が決めます。
- **`belongInSameGroup`**: 2 つのグループ値が同じかを判定する関数です。
- **`endOfPrefix(while:)`**: 条件を満たすあいだ進んだ位置を返す、コレクションのメソッドです。条件が偽になった最初の位置が返ります。
- **`defer`**: 関数（クロージャ）を抜けるときに実行されるブロックです。

## 何をしているか

### 1. 先頭の値を覚えておく

`subject` に、チャンクの先頭要素のグループ値を入れます。チャンクの中の要素は、すべてこの値と同じグループに入るはずです。

```swift:line-numbers=79
  internal func endOfChunk(startingAt start: Base.Index) -> Base.Index {
    var subject = projection(base[start])
```
### 2. 次の要素と比べながら進める

`base[start]` の次の位置から、要素を 1 つずつ見ていきます。`belongInSameGroup` が true なら、同じチャンクの続きです。

```swift:line-numbers=82
    return base[base.index(after: start)...].endOfPrefix(while: { element in
      let nextSubject = projection(element)
      defer { subject = nextSubject }
      return belongInSameGroup(subject, nextSubject)
    })
```
`defer { subject = nextSubject }` は、判定が終わったあとに「今見た要素」を次の比較の基準にする働きです。だから、比べる相手は常に隣の要素になります。

## ここがすごい

- **比べる相手を 1 つだけ覚える**: チャンクの先頭の値をずっと覚えておく方法もありますが、このコードは「直前の要素」と比べています。隣り合う要素が同じグループかどうかだけで判定できるので、状態は 1 つの変数で済みます。
- **`defer` で状態の更新を 1 か所に**: 判定のコードの中で基準を更新するので、更新を忘れる心配がありません。判定の戻り値を変えずに、比較対象だけを確実に進められます。
- **終わりを探すだけで済む**: 次のチャンクの先頭は、ここで見つけた終わりから始まります。チャンクの中身をコピーせず、添字の範囲だけを返します。

## まとめ

- 隣り合う要素の比較だけで、同じグループの範囲を求められる。
- 状態は 1 つの変数に絞り、`defer` で更新を確実にする。
- 結果は要素のコピーではなく、添字の範囲として返す。
