---
title: "1 回ずつ引いて入れ替える、偏りのないシャッフル"
description: "配列をランダムに並べ替える shuffle の実装。Fisher-Yates（フィッシャー・イェーツ）法を、添字の型を問わないコレクション向けに書いている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2023 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CollectionAlgorithms.swift
lines: [602, 618]
function: "MutableCollection.shuffle(using:)"
difficulty: 1
tags: [乱数, アルゴリズム, 標準ライブラリ]
---
## ひとことで

`array.shuffle()` は配列の要素をランダムな順番に並べ替えます。この関数はその本体で、**Fisher-Yates（フィッシャー・イェーツ）法** と呼ばれる方法を使っています。
たとえば `[A, B, C, D]` なら、24 通りあるすべての並び方が、ちょうど同じ確率で出ます。

## コード

```swift:line-numbers=602
  @inlinable
  public mutating func shuffle<T: RandomNumberGenerator>(
    using generator: inout T
  ) {
    guard count > 1 else { return }
    var amount = count
    var currentIndex = startIndex
    while amount > 1 {
      let random = Int.random(in: 0 ..< amount, using: &generator)
      amount -= 1
      swapAt(
        currentIndex,
        index(currentIndex, offsetBy: random)
      )
      formIndex(after: &currentIndex)
    }
  }
```

## 前提知識

- **`<T: RandomNumberGenerator>`**: 乱数生成器の型をジェネリクスで受け取ります。テストでは毎回同じ乱数を出す生成器を渡せます。
- **`inout T` と `&generator`**: `inout` 引数は、関数の中での変更が呼び出し元の変数に反映されます。乱数生成器は乱数を出すたびに内部状態が進むので、`inout` で受け取ります。渡すときは `&` を付けます。
- **`Int.random(in: 0 ..< amount, using: &generator)`**: 0 以上 `amount` 未満の乱数を作ります。
- **`index(currentIndex, offsetBy: random)`**: `currentIndex` から `random` 個進んだ位置の添字を返します。
- **`guard count > 1 else { return }`**: 要素が 0 個か 1 個なら何もしません。

## 何をしているか

`[A, B, C, D]` で追います。

1. `amount = 4`、`currentIndex = 0`。0〜3 の乱数（たとえば 2）を引き、位置 0 と位置 0+2 を交換 → `[C, B, A, D]`。
2. `amount = 3`、`currentIndex = 1`。0〜2 の乱数（たとえば 2）を引き、位置 1 と 3 を交換 → `[C, D, A, B]`。
3. `amount = 2`、`currentIndex = 2`。0〜1 の乱数（たとえば 0）なら、位置 2 は自分自身と交換（変化なし）。
4. `amount = 1` になったのでループ終了。最後の 1 つは残った要素で確定です。

各ステップで「まだ決まっていない残りの中から 1 つ選んで、今の位置に置く」をしています。くじ引きの箱から 1 枚ずつ引いて並べるのと同じです。

## ここがすごい

- **すべての並びが等確率**: 1 回目は 4 通り、2 回目は 3 通り、3 回目は 2 通りの選び方があり、組み合わせは 4 × 3 × 2 = 24 通り。並び方の総数（4! = 24）とぴったり一致し、どれも 1 回ずつ対応するので、偏りがありません。
- **ありがちな間違いを避けている**: よくある誤りは、毎回「全体（0〜3）から」乱数を引いて交換する方法です。これだと 4^4 = 256 通りの引き方になり、24 で割り切れないため、特定の並びが出やすくなります。この実装は `amount` を 1 つずつ減らしているので正しく偏りがありません。
- **O(n) で追加メモリなし**: 新しい配列を作らず、交換だけで終わります。
- **最後の 1 回を省く**: `while amount > 1` なので、残り 1 つのときの「自分自身との交換」はしません。小さなことですが無駄がありません。
- **乱数生成器を差し替えられる**: `using:` で生成器を渡せる設計なので、テストやゲームのリプレイのように「同じシードなら同じ結果」が欲しい場面にも使えます。ただし 597〜601 行目のコメントにあるとおり、Swift のバージョンが変わると同じシードでも結果が変わる可能性があります。

## まとめ

- Fisher-Yates 法は「残りの中から 1 つ選んで前に置く」を繰り返す、偏りのないシャッフル。
- 毎回全体から選んで交換すると偏る。選ぶ範囲を 1 つずつ狭めるのがポイント。
- 乱数生成器を引数で受け取ると、テストしやすい API になる。
