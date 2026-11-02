---
title: "容量が 2 のべき乗でなくても、余りで添字を求める"
description: "ZIO の RingBufferArb.posToIdx。容量が任意の値でも使えるように、通し番号を容量で割った余りを添字にする。RingBufferPow2 の & より一般的だが、割り算がかかる。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/internal/RingBufferArb.scala"
lines: [22, 22]
format: 2
function: "RingBufferArb.posToIdx"
difficulty: 1
tags: [データ構造, 最適化, 数値計算]
---

## ひとことで

ZIO の `RingBufferArb` は、容量が任意の値でも使える循環バッファです。`posToIdx` は、いつまでも増える通し番号 `pos` を、容量で割った余りに変えて、配列の添字にします。前に見た `RingBufferPow2` の `&` と比べると、容量の制限がない代わりに、割り算がかかります。

## コード

```scala:line-numbers=22
  protected def posToIdx(pos: Long, capacity: Int): Int = (pos % capacity.toLong).toInt
```

## 前提知識

- 循環バッファは、末尾まで行ったら先頭に戻って書き続ける、固定長の入れ物です。
- `pos` は、書き込みや読み出しの回数を数える通し番号で、どんどん増えます。
- `%`（余り）は、割り算の余りを求める演算です。`7 % 3` は `1` になります。
- 配列の添字は、`0` から `容量 - 1` の範囲に収める必要があります。余りを使うと、その範囲に必ず収まります。
- 割り算は、ビットの `&` より重い演算です。

## 何をしているか

### 1. 通し番号を容量で割った余りを、添字として返す

`pos % capacity.toLong` は、`0` から `capacity - 1` までの値を返します。その値を `Int` に変えて、配列の添字にします。

```scala:line-numbers=22
  protected def posToIdx(pos: Long, capacity: Int): Int = (pos % capacity.toLong).toInt
```

## ここがすごい

- 容量が 2 のべき乗である必要がないので、ちょうどの大きさを指定できます。`RingBufferPow2` では、切り上げでメモリが余りやすいという問題がありました。
- 余りの計算は、どんな正の整数に対しても正しく動きます。
- 2 つの実装（`Arb` と `Pow2`）が、同じ親クラス `RingBuffer` を共有し、添字の求め方だけを差し替えています。
- 速さを取るか、容量の自由を取るかを、クラス名で選べるように分けています。

## まとめ

- `posToIdx` は、通し番号を容量で割った余りで添字に変えます。
- 容量が任意の値でも使えますが、割り算がかかります。
- 2 のべき乗に限れるなら `RingBufferPow2` の `&` の方が速くなります。
