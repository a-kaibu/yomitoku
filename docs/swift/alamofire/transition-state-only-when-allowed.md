---
title: "状態の変更が許されるかを、ロックの中で確かめてから行う"
description: "リクエストの状態を、ロックの中で遷移可能か確かめてから書き換える Alamofire の attemptToTransitionTo。許されない遷移は失敗として返す。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2020 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Protected.swift
lines: [136, 144]
function: "attemptToTransitionTo(_:)"
difficulty: 2
tags: [状態機械, 並行処理]
format: 2
---
## ひとことで

リクエストは、「作成済み」「実行中」「完了」のように、状態が決まった順番でしか変わりません。この関数は、ロックの中で「今の状態からその状態へ変えてよいか」を確かめ、よければ変更し、だめなら何もせず `false` を返します。

## コード

```swift:line-numbers=136
    func attemptToTransitionTo(_ state: Request.State) -> Bool {
        lock.around {
            guard value.state.canTransitionTo(state) else { return false }

            value.state = state

            return true
        }
    }
```

## 前提知識

- **状態機械**: 状態の集まりと、どの状態からどの状態へ移れるかの規則を決めた仕組みです。規則に合わない変更を防げます。
- **`Protected`**: 値をロックで守る箱です。`lock.around` で、その中の処理を 1 つずつ実行させます。
- **`canTransitionTo(_:)`**: 今の状態から、指定した状態へ移れるかを返す判定です。規則は `Request.State` の側に書かれています。
- **`guard ... else`**: 条件が満たされないときに、すぐに戻る書き方です。

## 何をしているか

### 1. ロックの中で、遷移できるかを確かめる

`around` の中で、現在の状態から指定の状態へ移れるかを調べます。移れなければ、ここで `false` を返して終わります。

```swift:line-numbers=137
        lock.around {
            guard value.state.canTransitionTo(state) else { return false }
```
### 2. 許されていれば、状態を書き換える

確かめが通ったら、状態を新しいものに変えます。判定と変更が同じロックの中にあるので、途中で別のスレッドに割り込まれません。

```swift:line-numbers=140
            value.state = state
```
### 3. 成功を表す `true` を返す

変更できたことを、戻り値で呼び出し側に知らせます。

```swift:line-numbers=142
            return true
```
## ここがすごい

- **判定と変更が分かれていない**: 「移れるか」を調べてから変えるまでの間に、ほかのスレッドが状態を変える隙間がありません。
- **不正な遷移を型で止める**: 規則を `canTransitionTo` に集めているので、どこから変えても同じ規則が使われます。
- **結果が呼び出し側に分かる**: 戻り値の `Bool` で、変更が起きたかどうかを確かめられます。二重に完了処理を走らせる事故を防げます。

## まとめ

- 状態を変える前に、規則で遷移できるかを確かめる。
- 確かめと変更を、同じロックの中で行う。
- 許されない変更は何もせず、`false` で知らせる。
