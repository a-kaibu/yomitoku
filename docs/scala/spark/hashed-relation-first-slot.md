---
title: "黄金比の定数で、キーの格納位置を散らす"
description: "Spark の HashedRelation の firstSlot。Long のキーに黄金比由来の定数を掛け、上位ビットを下位へ混ぜてから、表の大きさの範囲に収めて最初の格納位置を決める。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "sql/core/src/main/scala/org/apache/spark/sql/execution/joins/HashedRelation.scala"
lines: [618, 621]
format: 2
function: "LongToUnsafeRowMap.firstSlot"
difficulty: 3
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

Apache Spark の結合処理で使われるハッシュ表で、Long のキーに対する最初の格納位置を決める `firstSlot` です。キーに大きな奇数の定数を掛けて、ビットを散らしてから、表の範囲に収めます。連続した数字のキーでも、表の中に偏らず置かれるようにしています。

## コード

```scala:line-numbers=618
  private def firstSlot(key: Long): Int = {
    val h = key * 0x9E3779B9L
    (h ^ (h >> 32)).toInt & mask
  }
```

## 前提知識

- ハッシュ表は、キーからハッシュ値を作り、その値を添字として配列の中の場所を決めるデータ構造です。
- 同じ場所に複数のキーが入ると「衝突」が起き、表の性能が落ちます。
- `0x9E3779B9` は、2 の 32 乗を黄金比で割った値の近似です。この種の定数を掛ける方法を「フィボナッチハッシング」と呼びます。
- `>>` は符号付きの右シフト、`^` は XOR です。
- `mask` は、表の大きさから 1 を引いた値で、添字の範囲を制限するために使われます（定義は同じクラスの別の場所にあります）。

## 何をしているか

### 1. キーに定数を掛けて散らす

まず、キーに `0x9E3779B9L` を掛けます。連続したキーは、掛けた後は大きく離れた値になります。

```scala:line-numbers=619
    val h = key * 0x9E3779B9L
```

### 2. 上位ビットを下位へ混ぜる

掛け算の結果は、下位のビットに変化が集まりやすいので、上位 32 ビットを右にずらして XOR します。これで、上位のビットの変化も下位に届きます。

```scala:line-numbers=620
    (h ^ (h >> 32)).toInt & mask
```

`toInt` で `Int` に変換し、`& mask` で表の範囲に収めます。`mask` が 2 のべき乗から 1 を引いた値なら、この `&` で 0 から大きさ未満の値を得られます。

## ここがすごい

- キーが 1, 2, 3 のように連続していても、黄金比の定数を掛けると、結果はばらばらに散ります。表の中で場所が偏りにくくなります。
- 掛け算は 1 命令で済み、割り算の剰余より軽いのに、分布は十分によくなります。
- 上位ビットを XOR で混ぜるのは、掛け算だけでは下位ビットの変化が上位に届きにくいという弱点を補うためです。
- 添字を `&` で決めるので、表の大きさを 2 のべき乗にしておけば、割り算をまったく使いません。前の関数 `nextPowerOf2` と組み合わせて使われる設計です。

## まとめ

- 連続した整数のキーは、黄金比の定数を掛けると散らしやすくなります。
- 掛け算のあとに、上位ビットを XOR で下位へ混ぜると分布が安定します。
- 表の大きさを 2 のべき乗にすると、添字をビット演算だけで決められます。
