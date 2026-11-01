---
title: "終わったら先頭へ戻る、無限に続くイテレータ"
description: "cycled() で作られる無限列のイテレータ。末尾に達したら添字を先頭へ戻し、defer で「返したあとに進める」順番を守る。空のコレクションでは nil を返して止まる。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Cycle.swift
lines: [39, 49]
function: "CycledSequence.Iterator.next()"
difficulty: 2
tags: [イテレータ, アルゴリズム, 標準ライブラリ]
format: 2
---
## ひとことで

`cycled()` は、コレクションの要素を先頭から順に繰り返す、終わらない列を作ります。たとえば `[1, 2, 3]` なら、`1, 2, 3, 1, 2, 3, …` と続きます。
この記事の `next()` は、その列を 1 つずつ返すイテレータの本体です。末尾に来たら添字を先頭へ戻すという、ごく単純な仕組みで無限の列を作っています。

## コード

```swift:line-numbers=39
    @inlinable
    public mutating func next() -> Base.Element? {
      guard !base.isEmpty else { return nil }

      if current == base.endIndex {
        current = base.startIndex
      }

      defer { base.formIndex(after: &current) }
      return base[current]
    }
```

## 前提知識

- **`IteratorProtocol`**: `next()` を呼ぶと次の要素を返し、もう要素がなければ `nil` を返すプロトコルです。
- **`Base.Index`**: 元のコレクションの添字です。
- **`endIndex` と `startIndex`**: 最初の要素の位置と、最後の要素のひとつ後ろの位置です。
- **`defer`**: 関数を抜ける直前に実行されるブロックです。
- **`formIndex(after:)`**: 添字を 1 つ進めます。

## 何をしているか

### 1. 空なら終わり

`base` が空なら、いくら繰り返しても要素がありません。最初に `nil` を返して止まります。

```swift:line-numbers=41
      guard !base.isEmpty else { return nil }
```
### 2. 末尾に来たら先頭へ戻す

`current` が `endIndex` に達していたら、`startIndex` に戻します。この 1 行で、列が循環します。

```swift:line-numbers=43
      if current == base.endIndex {
        current = base.startIndex
      }
```
### 3. 要素を返してから進める

`defer` は、`base[current]` を返す「あと」に `current` を 1 つ進めます。だから、次の呼び出しでは次の要素が返ります。

```swift:line-numbers=47
      defer { base.formIndex(after: &current) }
      return base[current]
```
## ここがすごい

- **終わりを戻すだけで無限になる**: 状態は `current` という 1 つの添字だけです。末尾で先頭へ戻すので、呼ばれ続けるかぎり要素が出続けます。
- **`defer` で順番を正しく保つ**: 返す値を先に決めてから、添字を進めます。`defer` を使うと、「返すのに使う添字」と「次に進める添字」の順番が間違いにくくなります。
- **空の場合を先に弾く**: 空のコレクションで末尾への戻しを繰り返すと、無限に空回りします。最初の `guard` で止めるので、この心配がありません。

## まとめ

- 無限の列は、末尾に来たら先頭へ戻す添字 1 つで表せる。
- 「返す」と「進める」の順番は `defer` で明確にする。
- 空の入力は、無限ループに入る前に `nil` で止める。
