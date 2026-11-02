---
title: "待ち時間を、回数ごとに倍々に長くする"
description: "ZIO の Schedule.exponential。繰り返しの待ち時間を、基準の時間に、回数の累乗の倍率をかけて決める。既定では 2 倍ずつ長くなる。失敗が続く相手に、少しずつ間隔を空けて再試行するときの定番の方法。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Schedule.scala"
lines: [1266, 1269]
format: 2
function: "Schedule.exponential"
difficulty: 2
tags: [並行処理, 数値計算, 遅延評価]
---

## ひとことで

ZIO の `Schedule` は、処理を繰り返すタイミングを決める仕組みです。`exponential` は、待ち時間を倍々に増やす方式です。最初は短く、回数が増えるほど長く待つので、失敗が続く相手に負担をかけずに再試行できます。

## コード

```scala:line-numbers=1266
  def exponential(base: Duration, factor: Double = 2.0)(implicit
    trace: Trace
  ): Schedule.WithState[Long, Any, Any, Duration] =
    delayed[Any, Any](forever.map(i => base * math.pow(factor, i.doubleValue)))
```

## 前提知識

- 「指数的な増加」は、一定の倍率を何回もかけて、値を急に大きくする増え方です。
- `math.pow(factor, i)` は、`factor` の `i` 乗を計算する関数です。`factor` が 2 なら、2、4、8 と増えます。
- `base * ...` は、基準の時間に倍率をかけて、実際の待ち時間を作ります。`Duration` の掛け算に対応しています。
- `forever` は、永久に繰り返すスケジュールで、各回の回数を値として渡します。
- `delayed` は、繰り返しの間隔を、与えた時間に置き換える関数です。

## 何をしているか

### 1. 回数を、倍率の指数として使う

`forever.map(i => ...)` で、各回の回数 `i` を受け取ります。`math.pow(factor, i.doubleValue)` は、倍率 `factor` を `i` 回かけた値です。`factor` の既定値は 2.0 です。

```scala:line-numbers=1269
    delayed[Any, Any](forever.map(i => base * math.pow(factor, i.doubleValue)))
```

### 2. 基準の時間に倍率をかけて、待ち時間にする

倍率を `base` に掛けると、その回の待ち時間になります。`base` が 1 秒なら、1 秒、2 秒、4 秒と増えていきます（`i` が 0 から数えられる場合）。

### 3. 待ち時間の列を、繰り返しの間隔として使う

`delayed` で、その列を繰り返しの間隔に設定します。結果として、再試行のたびに、待ち時間が倍々に伸びます。

```scala:line-numbers=1268
  ): Schedule.WithState[Long, Any, Any, Duration] =
```

## ここがすごい

- 倍率を `factor` で変えられるので、2 倍でも 1.5 倍でも、同じ関数で増え方を決められます。
- 時間の計算を `Duration` のまま行うので、単位の変換で迷うことがありません。
- 待ち時間を `forever` と `map` で作るので、ループや状態の変数を書かずに済みます。
- 失敗が続くほど間隔が伸びるので、相手のサーバーへの負担を自然に減らせます。

## まとめ

- 再試行の待ち時間は、基準の時間に回数の累乗をかけると、倍々に伸ばせます。
- 倍率を引数にしておくと、増え方を用途に合わせて変えられます。
- 待ち時間の列を繰り返しの間隔に渡すと、タイミングの管理を 1 か所にまとめられます。
