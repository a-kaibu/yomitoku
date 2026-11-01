---
title: "失敗した通信を、待ち時間を倍々にして再試行する"
description: "Alamofire の再試行で、失敗した回数に応じて待ち時間を指数的に伸ばす計算。上限の回数を超えたら、再試行せずに失敗を返す。サーバーが混雑しているときに、続けて負荷をかけないための仕組み。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2019-2020 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Features/RetryPolicy.swift
lines: [308, 317]
function: "RetryPolicy.retry(_:for:dueTo:completion:)"
difficulty: 2
tags: [並行処理, ネットワーク, 数値計算]
format: 2
---
## ひとことで

通信が失敗したとき、すぐに同じ要求を送り直すと、混雑しているサーバーにさらに負荷をかけます。そこで、再試行のたびに待ち時間を長くします。
この関数は、再試行してよいかを判定し、よければ **待ち時間** を返します。待ち時間は、再試行の回数に応じて、倍々に伸びます。これを **指数バックオフ** と呼びます。

## コード

```swift:line-numbers=308
    open func retry(_ request: Request,
                    for session: Session,
                    dueTo error: any Error,
                    completion: @escaping @Sendable (RetryResult) -> Void) {
        if request.retryCount < retryLimit, shouldRetry(request: request, dueTo: error) {
            completion(.retryWithDelay(pow(Double(exponentialBackoffBase), Double(request.retryCount)) * exponentialBackoffScale))
        } else {
            completion(.doNotRetry)
        }
    }
```

## 前提知識

- **指数（累乗）**: `base^n` のように、同じ数を n 回掛けた値です。ここでは `base` が 2 なので、回数が増えるたびに 2 倍になります。
- **`retryCount`**: そのリクエストが、これまでに再試行された回数です。
- **`RetryResult`**: 再試行の結果を伝える型です。待ってから再試行する `retryWithDelay` と、再試行しない `doNotRetry` があります。
- **`completion`**: 結果を、非同期に受け取るための関数です。判定が終わったときに呼ばれます。

## 何をしているか

### 1. 上限を超えず、再試行できる失敗かを確かめる

再試行の回数が上限より少なく、かつ `shouldRetry` が `true` のときだけ、再試行します。

```swift:line-numbers=312
        if request.retryCount < retryLimit, shouldRetry(request: request, dueTo: error) {
```
### 2. 待ち時間は、2 の累乗に係数をかける

待ち時間は `base^retryCount × scale` です。最初の再試行は `2^0 × 0.5 = 0.5` 秒、次は `2^1 × 0.5 = 1` 秒、というように伸びていきます。

```swift:line-numbers=313
            completion(.retryWithDelay(pow(Double(exponentialBackoffBase), Double(request.retryCount)) * exponentialBackoffScale))
```
### 3. 上限を超えたら、再試行しないと返す

再試行の条件を満たさないときは、`doNotRetry` を返します。失敗の結果が、そのまま呼び出し元に返ります。

```swift:line-numbers=314
        } else {
            completion(.doNotRetry)
        }
```
既定の上限は 2 回なので、この設定では、0.5 秒後と 1 秒後に再試行します。どちらも失敗すると、あきらめます。

## ここがすごい

- **待ち時間が自然に伸びる**: 回数を増やすだけで、待ち時間は倍々になります。待つ時間の計算を、回数だけに頼れます。
- **上限と判定を 1 行で確かめる**: 「回数が残っているか」と「その失敗を再試行してよいか」を、同じ `if` でまとめて判定しています。
- **係数の下限を決めている**: 初期化のとき、`exponentialBackoffBase` が 2 以上であることを `precondition` で確かめています。1 だと待ち時間が増えないので、この前提が必要です。

## まとめ

- 失敗した通信の待ち時間は、`base^回数 × scale` で、倍々に伸ばす。
- 再試行の回数に上限を決め、超えたら再試行せずに失敗を返す。
- この仕組みで、混雑したサーバーへの負荷を自然に減らせる。
