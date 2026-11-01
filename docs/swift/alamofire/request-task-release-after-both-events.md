---
title: "2 つの終わりの合図がそろうまで、タスクの参照を残す"
description: "通信タスクの完了と、メトリクス取得の 2 つの通知の両方が届いたときだけ、タスクとリクエストの対応を消す Alamofire の RequestTaskMap の処理。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/RequestTaskMap.swift
lines: [115, 129]
function: "disassociateIfNecessaryAfterGatheringMetricsForTask(_:)"
difficulty: 3
tags: [状態機械, 並行処理]
format: 2
---
## ひとことで

通信のタスクには、「完了した」と「メトリクスを取得した」という 2 つの通知が届きます。どちらが先に来るかは決まっていません。この関数は、2 つのうち届いた状態を記録し、両方がそろったときだけ、タスクとリクエストの対応を消します。

## コード

::: code-group

```swift:line-numbers=115 [日本語訳]
    mutating func disassociateIfNecessaryAfterGatheringMetricsForTask(_ task: URLSessionTask) -> Bool {
        guard let events = taskEvents[task] else {
            fatalError("RequestTaskMap consistency error: no events corresponding to task found.")
        }

        switch (events.completed, events.metricsGathered) {
        case (_, true):
            // 新しい Network.framework の URLSession は、メトリクスの通知を重複して送ることがあります。
            // そのため、DEBUG ビルドでだけ警告し、重複したメトリクスは無視します。
            assertionFailure("RequestTaskMap consistency error: duplicate metricsGatheredForTask call.")
            return false
        case (false, false): taskEvents[task] = (completed: false, metricsGathered: true); return false
        case (true, false): self[task] = nil; return true
        }
    }
```

```swift:line-numbers=115 [原文]
    mutating func disassociateIfNecessaryAfterGatheringMetricsForTask(_ task: URLSessionTask) -> Bool {
        guard let events = taskEvents[task] else {
            fatalError("RequestTaskMap consistency error: no events corresponding to task found.")
        }

        switch (events.completed, events.metricsGathered) {
        case (_, true):
            // Newer Network.framework-based URLSession (usesClassicLoadingMode == false) can issue duplicate metrics
            // delegate callbacks, so only assert in DEBUG and ignore the duplicate metrics.
            assertionFailure("RequestTaskMap consistency error: duplicate metricsGatheredForTask call.")
            return false
        case (false, false): taskEvents[task] = (completed: false, metricsGathered: true); return false
        case (true, false): self[task] = nil; return true
        }
    }
```

:::

## 前提知識

- **`URLSessionTask`**: Foundation の通信タスクです。完了やメトリクス取得などの通知が、デリゲートに届きます。
- **メトリクス（metrics）**: 通信にかかった時間や経路などの計測結果です。取得の通知は、完了の通知と前後することがあります。
- **`taskEvents`**: タスクごとに「完了したか」「メトリクスを取得したか」の 2 つの状態を持つ辞書です。
- **`fatalError` と `assertionFailure`**: `fatalError` は必ず止める検査です。`assertionFailure` は、開発中だけ止める検査です。

## 何をしているか

### 1. タスクに対応する状態を取り出す

このタスクの状態が見つからなければ、対応関係が壊れているので、`fatalError` で止めます。

```swift:line-numbers=116
        guard let events = taskEvents[task] else {
            fatalError("RequestTaskMap consistency error: no events corresponding to task found.")
        }
```
### 2. メトリクスの通知が重複したら、無視する

すでにメトリクスが取得済みなら、同じ通知が再び届いたことになります。開発中だけ警告し、何もせず `false` を返します。

```swift:line-numbers=121
        case (_, true):
            // 新しい Network.framework の URLSession は、メトリクスの通知を重複して送ることがあります。
            // そのため、DEBUG ビルドでだけ警告し、重複したメトリクスは無視します。
            assertionFailure("RequestTaskMap consistency error: duplicate metricsGatheredForTask call.")
            return false
```
### 3. 完了がまだなら、メトリクス取得済みを記録して残す

完了していなければ、メトリクスだけが届いた状態です。記録を更新して、タスクの参照は残します。

```swift:line-numbers=126
        case (false, false): taskEvents[task] = (completed: false, metricsGathered: true); return false
```
### 4. 完了済みなら、参照を消す

完了が先に届いていて、今回のメトリクスで両方がそろいました。タスクとリクエストの対応を消して、`true` を返します。

```swift:line-numbers=127
        case (true, false): self[task] = nil; return true
```
## ここがすごい

- **到着の順番に依存しない**: 完了が先でも、メトリクスが先でも、最後に届いた方が参照を消します。順番を決め打ちしません。
- **重複を許す設計**: 新しい通信の仕組みでは、通知が重複することがあるので、警告だけにして処理を続けます。
- **状態の組み合わせを表で書く**: 「完了」と「メトリクス」の 2 つの真偽の組み合わせを、`switch` のケースとして並べています。どの組み合わせで何が起きるかが一目で分かります。

## まとめ

- 完了とメトリクス取得の 2 つの通知を、タスクごとに記録する。
- 両方がそろったときだけ、参照を消す。
- 届く順番が違っても、正しく後始末できるように組み合わせで分岐する。
