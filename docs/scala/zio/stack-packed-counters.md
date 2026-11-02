---
title: "1 つの整数に、使用数と段数の 2 つを詰め込む"
description: "ZIO の内部スタック Stack。1 つの Int の下位 4 ビットに使用数、上位ビットに入れ子の段数を入れ、メモリと読み書きを節約する。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2017-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/internal/Stack.scala"
lines: [28, 32]
format: 2
function: "Stack.getUsed / Stack.setUsed"
difficulty: 3
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

ZIO の内部にある `Stack` は、速さを重視した可変の数え上げ用スタックです。`packed` という 1 つの整数に、2 つの数を詰め込んでいます。下位 4 ビットは「いま使っている要素数」、残りの上位ビットは「入れ子の段数」です。

## コード

```scala:line-numbers=28
  private def getUsed: Int          = packed & 0xf
  private def setUsed(n: Int): Unit = packed = (packed & 0xfffffff0) + (n & 0xf)

  private def getNesting: Int          = (packed >>> 4)
  private def setNesting(n: Int): Unit = packed = (packed & 0xf) + (n << 4)
```

## 前提知識

- `Int` は 32 ビットの整数で、2 進数の 0 と 1 の並びとして扱えます。
- `0xf` は 16 進数で、2 進数の `1111`（下位 4 ビット）を表します。`0xfffffff0` は、その反対で下位 4 ビットが 0 のマスクです。
- `&` はビットの and、`+` は足し算です。`packed & 0xfffffff0` は、下位 4 ビットを 0 にしてから、新しい値を足すための準備です。
- `>>>` は右シフトです。ビットを右へ動かして、下位のビットを捨てます。`n << 4` は 4 ビット左へ動かすことです。
- `private[this] var` は、このインスタンスだけから見える変数です。外からは直接触れません。

## 何をしているか

### 1. 下位 4 ビットから、使用数を取り出す

`packed & 0xf` は、下位 4 ビットだけを残します。その値が「いま使っている要素数」です。

```scala:line-numbers=28
  private def getUsed: Int          = packed & 0xf
```

### 2. 下位 4 ビットだけを書き換える

`setUsed` は、上位のビットを `packed & 0xfffffff0` で残し、新しい値 `n & 0xf` を下位 4 ビットに足します。上位の段数は変えません。

```scala:line-numbers=29
  private def setUsed(n: Int): Unit = packed = (packed & 0xfffffff0) + (n & 0xf)
```

### 3. 上位ビットから、段数を取り出して書き換える

`getNesting` は `packed >>> 4` で、下位 4 ビットを捨てて段数を得ます。`setNesting` は、下位 4 ビットを残し、新しい段数を `n << 4` で上位へ移します。

```scala:line-numbers=31
  private def getNesting: Int          = (packed >>> 4)
  private def setNesting(n: Int): Unit = packed = (packed & 0xf) + (n << 4)
```

## ここがすごい

- 2 つの数を、1 つの `Int` の変数に収めています。フィールドを 2 つ持つより、メモリを少なく使い、扱うものも減ります。
- 下位のビットと上位のビットを、マスクとシフトで分けるので、一方を書き換えても他方が壊れません。
- `size` は `getUsed + 12 * getNesting` で全体の大きさを求めます。1 段に 12 個の要素を持つ形を、整数の計算だけで表しています。
- 内部のスタックという、何度も呼ばれる場所で使うため、少ない命令で済む書き方を選んでいます。

## まとめ

- `packed` の下位 4 ビットに使用数、上位ビットに段数を入れています。
- 取り出しは `&` と `>>>`、書き換えはマスクと `<<` で行います。
- 2 つの値を 1 つの `Int` に詰めると、速さとメモリの両方で得をします。
