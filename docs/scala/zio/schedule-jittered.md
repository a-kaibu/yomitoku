---
title: "再試行の間隔に揺らぎを入れて、集中を防ぐ"
description: "ZIO の Schedule.jittered。待ち時間を、最小と最大の間で乱数に応じて決める。多くのクライアントが同じ時刻に一斉に再試行するのを防ぐ。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Schedule.scala"
lines: [653, 663]
format: 2
function: "Schedule.jittered"
difficulty: 2
tags: [並行処理, 非同期, 乱数]
---

## ひとことで

ZIO の `Schedule` は、失敗した処理を再試行する間隔を決める仕組みです。その中の `jittered` は、待ち時間に乱数で揺らぎを入れます。待ち時間を最小と最大の間で一様に変えることで、多くの処理が同じ時刻に一斉に再試行するのを防ぎます。

## コード

```scala:line-numbers=653
  final def jittered(min: Double, max: Double)(implicit
    trace: Trace
  ): Schedule.WithState[self.State, Env, In, Out] =
    delayedZIO[Env] { duration =>
      Random.nextDouble.map { random =>
        val d        = duration.toNanos
        val jittered = d * min * (1 - random) + d * max * random

        Duration.fromNanos(jittered.toLong)
      }
    }
```

## 前提知識

- 再試行（リトライ）は、失敗した処理をしばらく待ってからもう一度行うことです。
- 「雷鳴の群れ（thundering herd）」は、多くのクライアントが同じ時刻に一斉にリクエストを送り、サーバーが急に混雑する現象です。
- ZIO の `Random.nextDouble` は、0 以上 1 未満の乱数を返す effect です。`map` の中で値を使えます。
- `Duration.toNanos` は時間をナノ秒の `Long` にします。`fromNanos` はその逆です。
- `d * min * (1 - random) + d * max * random` は、最小と最大の間を、乱数の割合で内分する計算です。

## 何をしているか

### 1. 乱数を 1 つ引く

`Random.nextDouble.map` で、0 以上 1 未満の乱数 `random` を 1 つ取ります。この乱数が、待ち時間をどこに置くかを決めます。

### 2. 最小と最大の間で待ち時間を決める

元の待ち時間を `d`（ナノ秒）として、次の式で揺らいだ時間を求めます。

```scala:line-numbers=659
        val jittered = d * min * (1 - random) + d * max * random
```

`random` が 0 なら `d * min`、1 に近づくと `d * max` に近づきます。最小と最大の間を一様に分けるので、待ち時間が平均して両端の中間くらいになります。

### 3. Duration に戻す

計算した `jittered` を `toLong` で整数のナノ秒にして、`Duration.fromNanos` で時間に戻します。戻り値の時間が、次の再試行までの待ち時間になります。

## ここがすごい

- 全員が同じ待ち時間を使うと、再試行のタイミングがそろって、サーバーに負荷が集中します。乱数で散らすと、再試行が時間的に広がります。
- 式は、最小と最大の間を 1 回の掛け算と足し算で決めます。乱数 1 つだけで、範囲を自由に表せます。
- 乱数を `Random` という effect で持つので、テストのときに乱数源を差し替えられます。ZIO の設計らしい工夫です。
- 元の待ち時間 `d` を基準にするので、待ち時間が指数的に伸びる `exponential` などと組み合わせても、揺らぎの割合は変わりません。

## まとめ

- 再試行の間隔に乱数で揺らぎを入れると、一斉の再試行を防げます。
- 最小と最大の間の内分は、乱数 1 つで書けます。
- 乱数を effect として扱うと、テストで制御しやすくなります。
