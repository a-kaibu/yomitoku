---
title: "混み合った枠を、xorshift の乱数で別の枠へ移す"
description: "Java 標準の Exchanger.xchg。値を交換する枠（スロット）が合わないとき、スレッドごとの乱数の種を xorshift で進め、使える枠番号の範囲で剰余を取って、次に試す枠を決める。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/Exchanger.java
lines: [341, 343]
function: "Exchanger.xchg"
difficulty: 3
format: 2
tags: [並行処理, ビット演算, 数値計算]
---

## ひとことで

`Exchanger` は、2 つのスレッドが、お互いの値を交換するための待ち合わせの仕組みです。複数の枠（スロット）の配列（arena）を持ち、スレッドは、その枠のどれかで相手を待ちます。

同じ枠に多くのスレッドが集まると、衝突が増えて遅くなります。そこで、スレッドは次に試す枠を、乱数で別の場所へ移します。`xchg` の中のこの 3 行が、その移動先の乱数を作ります。

## コード

::: code-group

```java:line-numbers=341 [日本語訳]
                long r = p.seed;                 // 乱数で移動する
                r ^= r << 13; r ^= r >>> 7; r ^= r << 17; // xorshift（シフトと XOR を繰り返して、乱数の並びを作る方式）
                i = p.index = (int)((p.seed = r) % (m + 1));
```

```java:line-numbers=341 [原文]
                long r = p.seed;                 // randomly move
                r ^= r << 13; r ^= r >>> 7; r ^= r << 17; // xorShift
                i = p.index = (int)((p.seed = r) % (m + 1));
```

:::

## 前提知識

- **xorshift**: 整数を、左シフトや右シフトと XOR で混ぜ、次の乱数を作る方式です。計算が短く、乱数の状態は 1 つの `long` だけで済みます。
- **`p.seed`**: スレッドごとの、乱数の状態です。次の乱数を作るたびに、この値を新しくします。
- **`m`**: 使える一番大きな枠の番号です。`bound` の下位ビットから取り出しています。
- **剰余 `%`**: `r % (m + 1)` は、0 から `m` までの値になります（`r` が負でない場合）。

## 何をしているか

### 1. 乱数の種を、xorshift で進める

```java:line-numbers=341
                long r = p.seed;                 // 乱数で移動する
                r ^= r << 13; r ^= r >>> 7; r ^= r << 17; // xorshift（シフトと XOR を繰り返して、乱数の並びを作る方式）
```

`r` は、スレッドの種のコピーです。`r ^= r << 13; r ^= r >>> 7; r ^= r << 17` の 3 段の計算で、次の乱数を作ります。この並びのシフト量（13、7、17）は、64 ビットの xorshift で使われる組み合わせです。

### 2. 枠の番号を、範囲の中に収める

```java:line-numbers=343
                i = p.index = (int)((p.seed = r) % (m + 1));
```

`p.seed = r` で、次の乱数のための種を覚えます。`r % (m + 1)` で、使える枠の範囲に収めて、`p.index` と `i` に入れます。枠の番号は、同じスレッドが次に枠を選ぶときの出発点にもなります。

## ここがすごい

- **種はスレッドごとに持つ**: 乱数の状態を、スレッドごとの `Node` の中に置いています（`Node` は、`Participant`（スレッドローカル）から取り出します）。そのため、スレッド同士で乱数の状態を共有して、競合する必要がありません。
- **計算は短い**: シフトと XOR の 3 段だけで、次の乱数が出ます。乱数の状態を変えるのに、ロックや別のオブジェクトは要りません。
- **剰余で範囲を決める**: 乱数の値を、使える枠の数で割った余りにします。範囲の外に出る心配がありません（符号が正のときに限ります）。
- **負の値に注意**: `long` は符号つきなので、剰余が負になることがあります。その値の扱いは、この 3 行の外の判定で行われます（この記事では引用していません）。

## まとめ

- 枠が合わないとき、スレッドは xorshift で乱数の種を進め、次に試す枠を決める。
- 種は、スレッドごとの `Node` に保存され、次の移動で続きから使う。
- 剰余で、使える枠の範囲に番号を収める。
