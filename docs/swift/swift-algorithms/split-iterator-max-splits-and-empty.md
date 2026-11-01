---
title: "区切り文字で分けるとき、空の部分列と分割数の上限をどう扱うか"
description: "列を区切り文字で分ける swift-algorithms の SplitSequence の反復処理。分割数の上限と、空の部分列を省く設定を、1 回の next() の中で判断する。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Split.swift
lines: [102, 139]
function: "SplitSequence.Iterator の next()"
difficulty: 3
tags: [アルゴリズム, イテレータ]
format: 2
---
## ひとことで

`a,,b` を `,` で分けると、`a`、空、`b` の 3 つになります。空の部分を残すか省くか、区切りを何回までにするかは、呼ぶ側が決められます。この `next()` は、次の部分列を 1 つ返すたびに、その設定に従って判断します。

## コード

::: code-group

```swift:line-numbers=102 [日本語訳]
  @inlinable
  public mutating func next() -> Element? {
    var nextElement = base.next()
    var subsequence: Element = []

    // 次の区切り文字まで、要素を部分列に足していきます。
    // ただし、最大の分割数に達していれば、区切り文字では止まりません。
    // どの場合も、元の列の終わりで止まります。
    while let currentElement = nextElement {
      if splitCount < maxSplits && isSeparator(currentElement) {
        if omittingEmptySubsequences && subsequence.isEmpty {
          // 空の部分列を返さない設定なら、次の要素へ進みます。
          nextElement = base.next()
          continue
        } else {
          splitCount += 1
          break
        }
      } else {
        subsequence.append(currentElement)
        nextElement = base.next()
      }
    }

    // 元の列を読み終わったら、反復を終えるかを判断します。
    // 返せる部分列の最大数（区切り文字の数より 1 多い）に達したとき、
    // または、残りの部分列が空で、それを省く設定のとき、
    // 反復を終えます。
    if nextElement == nil
      && (sequenceLength == splitCount + 1
        || omittingEmptySubsequences && subsequence.isEmpty)
    {
      return nil
    } else {
      sequenceLength += 1
      return subsequence
    }
  }
```

```swift:line-numbers=102 [原文]
  @inlinable
  public mutating func next() -> Element? {
    var nextElement = base.next()
    var subsequence: Element = []

    // Add the next elements of the base sequence to this subsequence, until we
    // reach a separator, unless we've already split the maximum number of
    // times. In all cases, stop at the end of the base sequence.
    while let currentElement = nextElement {
      if splitCount < maxSplits && isSeparator(currentElement) {
        if omittingEmptySubsequences && subsequence.isEmpty {
          // Keep going if we don't want to return an empty subsequence.
          nextElement = base.next()
          continue
        } else {
          splitCount += 1
          break
        }
      } else {
        subsequence.append(currentElement)
        nextElement = base.next()
      }
    }

    // We're done iterating when we've reached the end of the base sequence,
    // and we've either returned the maximum number of subsequences (one more
    // than the number of separators), or the only subsequence left to return is
    // empty and we're omitting those.
    if nextElement == nil
      && (sequenceLength == splitCount + 1
        || omittingEmptySubsequences && subsequence.isEmpty)
    {
      return nil
    } else {
      sequenceLength += 1
      return subsequence
    }
  }
```

:::

## 前提知識

- **部分列（subsequence）**: 元の列の一部分を表す列です。ここでは、区切り文字の間の要素を、新しい配列に集めて返します。
- **`maxSplits`**: 区切り文字で分ける最大の回数です。上限に達すると、残りの要素は区切られずに、そのまま最後の部分列になります。
- **`omittingEmptySubsequences`**: 空の部分列を返すかどうかを決める設定です。`true` なら、空の部分は飛ばします。
- **イテレータ**: 要素を 1 つずつ返す仕組みです。`next()` が呼ばれるたびに、次の部分列を返します。

## 何をしているか

### 1. 次の要素を取り出し、部分列を空で始める

元の列から次の要素を読み、区切りを探すための部分列を空で用意します。

```swift:line-numbers=103
  public mutating func next() -> Element? {
    var nextElement = base.next()
    var subsequence: Element = []
```
### 2. 区切り文字まで、要素を足していく

区切り文字に出会ったら、部分列を返す準備ができたことを示して止まります。ただし、空の部分列を省く設定で、今の部分列が空のときは、区切りを飛ばして次へ進みます。

```swift:line-numbers=110
    while let currentElement = nextElement {
      if splitCount < maxSplits && isSeparator(currentElement) {
        if omittingEmptySubsequences && subsequence.isEmpty {
          // 空の部分列を返さない設定なら、次の要素へ進みます。
          nextElement = base.next()
          continue
        } else {
          splitCount += 1
          break
        }
```
### 3. 区切り文字でなければ、部分列に足す

区切り文字でない要素は、部分列に加えて、次の要素を読みます。

```swift:line-numbers=120
      } else {
        subsequence.append(currentElement)
        nextElement = base.next()
      }
```
### 4. 列の終わりなら、反復を終える

元の列を読み切り、もう返すべき部分列がなければ `nil` を返します。そうでなければ、部分列を 1 つ返して、数を 1 増やします。

```swift:line-numbers=126
    // 元の列を読み終わったら、反復を終えるかを判断します。
    // 返せる部分列の最大数（区切り文字の数より 1 多い）に達したとき、
    // または、残りの部分列が空で、それを省く設定のとき、
    // 反復を終えます。
    if nextElement == nil
      && (sequenceLength == splitCount + 1
        || omittingEmptySubsequences && subsequence.isEmpty)
    {
      return nil
    } else {
      sequenceLength += 1
      return subsequence
```
## ここがすごい

- **設定が 1 つの流れに収まる**: 分割数の上限と、空の部分列を省く設定を、同じ `while` の中の条件で判断しています。
- **列を一度だけ読む**: 区切りを探すために、先読みや、あとで戻る処理をしません。大きな列でも、1 回の走査で済みます。
- **終わりの条件が 2 つ**: 元の列が尽きたことと、返すべき部分列がもうないことを、別々に確かめています。

## まとめ

- 区切り文字まで要素を足し、見つかったら部分列を返す。
- 分割数の上限に達したら、区切りを無視して残りをまとめる。
- 空の部分列は、設定によって省くか返すかを決める。
