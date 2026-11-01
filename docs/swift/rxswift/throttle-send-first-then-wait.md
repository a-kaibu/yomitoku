---
title: "最初の値はすぐ送り、その後は一定時間ごとに 1 つずつ送る"
description: "前回の送信から一定時間が経つまで、次の値を遅らせて送る RxSwift の throttle の中心部分。最新の値だけを覚えておき、予約された時刻に送る。"
language: swift
project: "RxSwift"
repo: https://github.com/ReactiveX/RxSwift
license: MIT
copyright: "Copyright © 2015 Shai Mishali, Krunoslav Zaher"
commit: "3e33f90c1bcd3cdea25bdb49bd4a594a50c3ab84"
file: RxSwift/Observables/Throttle.swift
lines: [69, 100]
function: "synchronized_on(_:) の next の処理"
difficulty: 3
tags: [非同期, 並行処理]
format: 2
---
## ひとことで

短い間隔で次々に届く値を、一定の間隔に間引いて送ります。前回の送信から時間が経っていれば、すぐに送ります。まだ経っていなければ、残りの時間だけ待ってから、最新の値を送ります。

## コード

```swift:line-numbers=69
        case let .next(element):
            let now = parent.scheduler.now

            let reducedScheduledTime: RxTimeInterval = if let lastSendingTime = lastSentTime {
                parent.dueTime.reduceWithSpanBetween(earlierDate: lastSendingTime, laterDate: now)
            } else {
                .nanoseconds(0)
            }

            if reducedScheduledTime.isNow {
                sendNow(element: element)
                return
            }

            if !parent.latest {
                return
            }

            let isThereAlreadyInFlightRequest = lastUnsentElement != nil

            lastUnsentElement = element

            if isThereAlreadyInFlightRequest {
                return
            }

            let scheduler = parent.scheduler

            let d = SingleAssignmentDisposable()
            cancellable.disposable = d

            d.setDisposable(scheduler.scheduleRelative(0, dueTime: reducedScheduledTime, action: propagate))
```

## 前提知識

- **Observable**: 時間をおいて値を流す「流れ」です。`subscribe` で購読すると、値が届くたびに処理が呼ばれます。
- **スケジューラ**: 処理を、指定した時間の後に実行する仕組みです。`scheduleRelative` は、今から何秒後かを指定して予約します。
- **`dueTime`**: 送信の間隔を表す時間です。
- **`latest`**: 待っている間に届いた値のうち、最新のものを送るかどうかの設定です。`false` なら、待っている間の値は捨てます。

## 何をしているか

### 1. 前回の送信から、残りの待ち時間を求める

前回の送信時刻がなければ、待たずに送れるので 0 秒です。あれば、間隔から経過時間を引いた残りを求めます。

```swift:line-numbers=70
            let now = parent.scheduler.now

            let reducedScheduledTime: RxTimeInterval = if let lastSendingTime = lastSentTime {
                parent.dueTime.reduceWithSpanBetween(earlierDate: lastSendingTime, laterDate: now)
            } else {
                .nanoseconds(0)
            }
```
### 2. 待ち時間がなければ、すぐに送る

残りが 0 なら、その場で値を送って終わります。

```swift:line-numbers=78
            if reducedScheduledTime.isNow {
                sendNow(element: element)
                return
            }
```
### 3. 待つ必要があるときの値の扱い

`latest` が `false` なら、この値は捨てます。`true` なら、待っている値として覚えておきます。すでに予約が入っているときは、覚えるだけで終わります。

```swift:line-numbers=83
            if !parent.latest {
                return
            }

            let isThereAlreadyInFlightRequest = lastUnsentElement != nil

            lastUnsentElement = element

            if isThereAlreadyInFlightRequest {
                return
            }
```
### 4. 残りの時間のあとに送る予約を入れる

まだ予約がなければ、残りの時間のあとに送る処理を予約します。予約の時点で、待っている値が最新のものになっています。

```swift:line-numbers=95
            let scheduler = parent.scheduler

            let d = SingleAssignmentDisposable()
            cancellable.disposable = d

            d.setDisposable(scheduler.scheduleRelative(0, dueTime: reducedScheduledTime, action: propagate))
```
## ここがすごい

- **最初の値を遅らせない**: 間隔が空いていれば、値はすぐに届きます。利用者が操作した直後の反応が遅くなりません。
- **無駄な送信をまとめる**: 待っている間に届いた値は、最後の 1 つだけを覚えておきます。連続した入力は、最新の状態にまとめられます。
- **予約を 1 つにする**: `lastUnsentElement` が空でないかを見て、予約が重ならないようにしています。

## まとめ

- 前回の送信から経った時間で、待ち時間を決める。
- 待ち時間がなければすぐ送り、あれば最新の値だけ覚えて予約する。
- 予約は 1 つだけにして、送信の間隔を守る。
