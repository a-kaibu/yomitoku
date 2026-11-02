---
title: "時間を、刻みの倍数に切り上げる"
description: "Apache Pekko の LightArrayRevolverScheduler.roundUp。指定された時間を、タイマーの刻み幅 tickNanos の倍数に切り上げる。ナノ秒の整数の割り算で、切り上げを 1 行で行う。すでにちょうど倍数なら、そのまま返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/actor/LightArrayRevolverScheduler.scala"
lines: [93, 97]
format: 2
function: "LightArrayRevolverScheduler.roundUp"
difficulty: 3
tags: [数値計算, 並行処理, アルゴリズム]
---

## ひとことで

Apache Pekko のスケジューラは、一定の刻み（ティック）ごとに、予約された処理を実行します。`roundUp` は、予約された時間を次の刻みの位置へ切り上げます。たとえば刻み幅が 10 ミリ秒のとき、12 ミリ秒の予約は 20 ミリ秒の位置に直されます。

## コード

```scala:line-numbers=93
  private def roundUp(d: FiniteDuration): FiniteDuration = {
    val dn = d.toNanos
    val r = ((dn - 1) / tickNanos + 1) * tickNanos
    if (r != dn && r > 0 && dn > 0) r.nanos else d
  }
```

## 前提知識

- `FiniteDuration` は、有限の長さの時間を表す型です。`toNanos` で、ナノ秒の整数として取り出せます。
- 刻み幅（`tickNanos`）は、タイマーが動く間隔を、ナノ秒の数で表した値です。
- 切り上げは、割り算の余りがあれば 1 つ先の倍数にする計算です。整数の割り算は小数を切り捨てるので、そのままでは切り上げになりません。
- `(dn - 1) / tickNanos + 1` は、整数の割り算で切り上げを行う定番の書き方です。
- `r.nanos` は、ナノ秒の数から `FiniteDuration` を作る書き方です。

## 何をしているか

### 1. 切り上げた刻みの数を求める

`dn` は予約された時間をナノ秒にした値です。`(dn - 1) / tickNanos + 1` は、`dn` を刻み幅で割って切り上げた刻みの数を返します。`dn - 1` としているのは、ちょうど割り切れる場合に 1 つ先へ進まないようにするためです。

```scala:line-numbers=95
    val r = ((dn - 1) / tickNanos + 1) * tickNanos
```

### 2. 刻みの数に、刻み幅を掛けて時間へ戻す

切り上げた刻みの数に `tickNanos` を掛けると、刻みの位置の時間になります。これが `r` です。

```scala:line-numbers=95
    val r = ((dn - 1) / tickNanos + 1) * tickNanos
```

### 3. ちょうどの倍数でなければ、切り上げた値を返す

`r` が元の値 `dn` と違い、かつ正の値なら、`r` を `FiniteDuration` にして返します。そうでなければ、元の `d` をそのまま返します。

```scala:line-numbers=96
    if (r != dn && r > 0 && dn > 0) r.nanos else d
```

## ここがすごい

- 割り算の切り上げを、`dn - 1` と 1 を足す形で整数だけで行うので、小数や浮動小数点の誤差がありません。
- ちょうど刻みに一致する時間は、切り上げずにそのまま返します。余計な遅れが生まれません。
- 負の値や 0 の場合は、切り上げを行わず元の値を返します。境界の値を安全に扱っています。
- 時間の単位をナノ秒の整数に揃えてから計算するので、単位の変換で迷うことがありません。

## まとめ

- 整数で切り上げるには、`(n - 1) / k + 1` の形を使うと、誤差なく求められます。
- 時間の予約は、刻みに合わせて切り上げると、タイマーの仕組みと整合が取れます。
- ちょうど割り切れる場合の扱いを決めておくと、余計な遅れを防げます。
