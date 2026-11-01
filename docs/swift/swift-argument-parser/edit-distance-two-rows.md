---
title: "2 つの文字列の違いを、2 行だけの表で数える"
description: "2 つの文字列の編集距離（1 文字の挿入・削除・置換で一致させるのに必要な回数）を求める関数。表の 2 行だけを使い、前後の共通部分を先に取り除いて計算を減らす。コマンド名の打ち間違いの候補を出すのに使われる。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Utilities/StringExtensions.swift
lines: [199, 235]
function: "StringProtocol.editDistance(to:)"
difficulty: 3
tags: [文字列処理, アルゴリズム, CLI]
format: 2
---
## ひとことで

`editDistance(to:)` は、2 つの文字列がどれだけ違うかを数えます。1 文字の挿入、削除、置換の回数の最小値です。たとえば `kitten` を `sitting` にするには、3 回で足ります。
コマンドライン引数で打ち間違えたとき、「もしかして `--verbose` ですか？」と候補を出すために使われます。

## コード

::: code-group

```swift:line-numbers=199 [日本語訳]
    let newSelf = self[selfStartTrim..<selfEndTrim]
    let newTarget = target[targetStartTrim..<targetEndTrim]

    let m = newSelf.count
    let n = newTarget.count

    // 表を、2 行だけで持ちます。
    // 「今の行」と「前の行」です。
    var previousRow = [Int](repeating: 0, count: n + 1)
    var currentRow = [Int](0...n)

    var sourceIdx = newSelf.startIndex
    for i in 1...m {
      swap(&previousRow, &currentRow)
      currentRow[0] = i

      var targetIdx = newTarget.startIndex
      for j in 1...n {
        // 文字が同じなら、レーベンシュタイン法では、
        // 最小値は必ず置換の費用になるので、
        // min の呼び出しを避けて、先に次へ進みます。
        if newSelf[sourceIdx] == newTarget[targetIdx] {
          currentRow[j] = previousRow[j - 1]
        } else {
          let deletion = previousRow[j]
          let insertion = currentRow[j - 1]
          let substitution = previousRow[j - 1]
          currentRow[j] =
            Swift.min(deletion, Swift.min(insertion, substitution)) + 1
        }
        // j += 1
        newTarget.formIndex(after: &targetIdx)
      }
      // i += 1
      newSelf.formIndex(after: &sourceIdx)
    }
    return currentRow[n]
```

```swift:line-numbers=199 [原文]
    let newSelf = self[selfStartTrim..<selfEndTrim]
    let newTarget = target[targetStartTrim..<targetEndTrim]

    let m = newSelf.count
    let n = newTarget.count

    // Initialize the levenshtein matrix with only two rows
    // current and previous.
    var previousRow = [Int](repeating: 0, count: n + 1)
    var currentRow = [Int](0...n)

    var sourceIdx = newSelf.startIndex
    for i in 1...m {
      swap(&previousRow, &currentRow)
      currentRow[0] = i

      var targetIdx = newTarget.startIndex
      for j in 1...n {
        // If characteres are equal for the levenshtein algorithm the
        // minimum will always be the substitution cost, so we can fast
        // path here in order to avoid min calls.
        if newSelf[sourceIdx] == newTarget[targetIdx] {
          currentRow[j] = previousRow[j - 1]
        } else {
          let deletion = previousRow[j]
          let insertion = currentRow[j - 1]
          let substitution = previousRow[j - 1]
          currentRow[j] =
            Swift.min(deletion, Swift.min(insertion, substitution)) + 1
        }
        // j += 1
        newTarget.formIndex(after: &targetIdx)
      }
      // i += 1
      newSelf.formIndex(after: &sourceIdx)
    }
    return currentRow[n]
```

:::

## 前提知識

- **編集距離（レーベンシュタイン距離）**: 文字列 A を文字列 B にするのに必要な、挿入・削除・置換の最小回数です。
- **動的計画法**: 大きな問題を、小さな問題の答えを表に書き込みながら解く方法です。ここでは表の各マスが、「先頭の一部どうしの距離」になります。
- **`min`**: 2 つ以上の値の最小値を返す関数です。`Swift.min` と書いているのは、同じ名前の別の関数と区別するためです。

## 何をしているか

### 1. 前後の共通部分を取り除く

先頭と末尾の同じ文字は、距離に関係しません。先に取り除いて、計算する範囲を狭めます。

```swift:line-numbers=153
    // 前後の共通部分を取り除きます。
    var selfStartTrim = self.startIndex
    var targetStartTrim = target.startIndex
    while selfStartTrim < self.endIndex && targetStartTrim < target.endIndex
      && self[selfStartTrim] == target[targetStartTrim]
    {
      self.formIndex(after: &selfStartTrim)
      target.formIndex(after: &targetStartTrim)
    }
```
### 2. 表は 2 行だけ持つ

表の行は、「前の行」と「今の行」の 2 つだけを使います。最初の行は、空の文字列から目標の先頭 `j` 文字を作る費用で、`0` から `n` までの値です。

```swift:line-numbers=205
    // 表を、2 行だけで持ちます。
    // 「今の行」と「前の行」です。
    var previousRow = [Int](repeating: 0, count: n + 1)
    var currentRow = [Int](0...n)

```
### 3. 1 文字ずつ比べて、最小値を求める

2 つの文字が同じなら、左上の値をそのまま使います。違うなら、削除（上）、挿入（左）、置換（左上）の 3 つの中の最小値に 1 を足します。

```swift:line-numbers=210
    var sourceIdx = newSelf.startIndex
    for i in 1...m {
      swap(&previousRow, &currentRow)
      currentRow[0] = i

      var targetIdx = newTarget.startIndex
      for j in 1...n {
        // 文字が同じなら、レーベンシュタイン法では、
        // 最小値は必ず置換の費用になるので、
        // min の呼び出しを避けて、先に次へ進みます。
        if newSelf[sourceIdx] == newTarget[targetIdx] {
          currentRow[j] = previousRow[j - 1]
        } else {
          let deletion = previousRow[j]
          let insertion = currentRow[j - 1]
          let substitution = previousRow[j - 1]
          currentRow[j] =
            Swift.min(deletion, Swift.min(insertion, substitution)) + 1
        }
```
### 4. 右下の値が答え

最後の行の最後の値が、2 つの文字列全体の距離です。

```swift:line-numbers=235
    return currentRow[n]
```
## ここがすごい

- **メモリが 2 行分だけ**: 表は本来、行と列の大きさの二次元です。今の行と前の行だけを持つので、メモリは文字列の長さに比例する程度で済みます。
- **共通部分を先に捨てる**: 前後が同じなら、距離は変わりません。先に取り除くと、表が小さくなり、計算が速くなります。
- **一致のときは min を呼ばない**: 文字が同じなら、置換の費用は 0 なので、左上の値をそのまま使えます。`min` の呼び出しを 1 回省けます。

## まとめ

- 編集距離は、挿入・削除・置換の最小回数で、2 つの文字列の違いを数える。
- 表は 2 行だけ持てば、今の行の計算に必要な分は足りる。
- 前後の共通部分を先に取り除くと、表が小さくなる。
