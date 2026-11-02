---
title: "通し番号を、ビットの 1 回の演算で配列の添字に変える"
description: "ZIO の RingBufferPow2.posToIdx。容量が 2 のべき乗なら、割り算の代わりに「下位ビットを取り出す」だけで、循環バッファの添字を求められる。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/internal/RingBufferPow2.scala"
lines: [23, 24]
format: 2
function: "RingBufferPow2.posToIdx"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

ZIO の内部には、同じ配列を円のように使い回す「循環バッファ」があります。`posToIdx` は、いつまでも増えていく通し番号（`pos`）を、配列の添字に変えるメソッドです。容量が 2 のべき乗のときは、ビットの「and」演算 1 回で添字が求まります。

## コード

```scala:line-numbers=23
  protected def posToIdx(pos: Long, capacity: Int): Int =
    (pos & (capacity - 1).toLong).toInt
```

## 前提知識

- 循環バッファは、末尾まで行ったら先頭に戻って書き込みを続ける、固定長の入れ物です。
- `pos` は、書き込みや読み出しの回数を数える通し番号です。どんどん増えるので、配列の長さをそのまま超えます。
- 配列の添字は、`0` から `容量 - 1` までの範囲に収める必要があります。そのために「余りを求める」操作が必要です。
- 2 進数では、2 のべき乗から 1 を引いた値（例: 8 - 1 = 7 は `0111`）は、下位のビットがすべて 1 になります。
- `&`（ビットの and）は、両方のビットが 1 のところだけを 1 にする演算です。

## 何をしているか

### 1. 容量から 1 を引いて、マスクを作る

`capacity - 1` は、容量が 2 のべき乗なら、下位ビットだけが 1 の値になります。これをマスクとして使います。

```scala:line-numbers=24
    (pos & (capacity - 1).toLong).toInt
```

### 2. 通し番号とマスクを `&` でまとめ、添字を得る

`pos & (capacity - 1)` は、`pos` の下位ビットだけを残します。その結果は必ず `0` から `容量 - 1` の範囲に入るので、そのまま配列の添字として使えます。

```scala:line-numbers=23
  protected def posToIdx(pos: Long, capacity: Int): Int =
    (pos & (capacity - 1).toLong).toInt
```

## ここがすごい

- 余りを求める `%` の代わりに、`&` を 1 回使うだけで済みます。割り算より軽い演算で、毎回の読み書きで効きます。
- 容量を 2 のべき乗に切り上げる（`RingBuffer.nextPow2`）ことで、この高速な方法が成り立つ前提を作っています。
- `pos` を `Long` で持っているので、長く動き続けても通し番号が溢れにくくなっています。
- 「2 のべき乗のときだけ使える」という制限を、型や名前で隠さず、クラス名 `RingBufferPow2` で示しています。

## まとめ

- `posToIdx` は、通し番号を循環バッファの添字に変えます。
- 容量が 2 のべき乗なら、`pos & (容量 - 1)` の 1 回の演算で済みます。
- 速さのために、容量を 2 のべき乗に揃えるという約束を、クラスの作り全体で守っています。
