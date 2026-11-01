---
title: "位置の前に何件あるかをビットの数で求める entryKeyIndex"
description: "永続ハッシュマップのノードで、ビットマップの中の位置から、バッファの中のキーの場所を求める entryKeyIndex。位置より下のビットを数えて、その個数に 1 件の大きさを掛ける。"
language: kotlin
project: "kotlinx.collections.immutable"
repo: https://github.com/Kotlin/kotlinx.collections.immutable
license: Apache-2.0
copyright: "Copyright 2016-2019 JetBrains s.r.o."
commit: "9f961e4dd419dff58ffea164dd41ebba68acc8d6"
file: core/commonMain/src/implementations/immutableMap/TrieNode.kt
lines: [121, 123]
function: "TrieNode.entryKeyIndex"
difficulty: 3
tags: [データ構造, ビット演算, 最適化]
format: 2
---

## ひとことで

`entryKeyIndex()` は、ノードの中で **ある位置に対応するキーが、バッファ（配列）のどこにあるか** を求める関数です。ノードの中身は、ビットマップという「どの位置に何があるか」の印と、詰めて並べた配列で管理されています。

位置より前に何件のエントリがあるかを、ビットの数を数えるだけで求めている点が、この関数のおもしろいところです。

## コード

```kotlin:line-numbers=121
    internal fun entryKeyIndex(positionMask: Int): Int {
        return ENTRY_SIZE * (dataMap and (positionMask - 1)).countOneBits()
    }
```

## 前提知識

- **ビットマップ**: 32 ビットの整数の各ビットを、「その位置にエントリがあるか」の印として使う方法です。1 が立っていればある、0 ならない、という意味です。
- **`positionMask`**: 1 つのビットだけが立った値です。その位置を指す印として使われます。
- **`positionMask - 1`**: その位置より下のビットが全部 1 になる値です。たとえば位置が 8（`1000`）なら、`7`（`0111`）になります。
- **`countOneBits()`**: 値の中で 1 になっているビットの数を返す関数です。
- **`ENTRY_SIZE`**: 1 件のエントリが、バッファの中で占める要素の数です。キーと値の 2 つ分です。

## 何をしているか

### 位置より前の件数を数える

```kotlin:line-numbers=121
    internal fun entryKeyIndex(positionMask: Int): Int {
```

関数は、位置を表す `positionMask` を受け取ります。

```kotlin:line-numbers=122
        return ENTRY_SIZE * (dataMap and (positionMask - 1)).countOneBits()
```

手順は次のとおりです。まず `positionMask - 1` で、その位置より下のビットを 1 にします。次に `dataMap` と `and` でかけると、その位置より前にあるエントリの印だけが残ります。その 1 の数を数えると、前に何件あるかが分かります。最後に `ENTRY_SIZE` を掛けると、バッファの中の位置になります。

## ここがすごい

- **配列をずらさずに位置が分かる**: 並べ替えや探索をしなくても、ビットの数を数えるだけで位置が求まります。エントリの追加や削除の後も、印さえ正しければ位置は計算で決まります。
- **詰めて並べた配列**: エントリは隙間なく並んでいるので、前に何件あるかが、そのまま配列の位置になります。ビットマップが「どこに何があるか」の地図の役割を果たしています。
- **1 命令級の軽さ**: 引き算、`and`、ビットの数、掛け算だけで済みます。ハッシュマップの検索の中で、何度も呼ばれても負担になりません。
- **ほかの印との分離**: 同じ仕組みで、サブノードの位置も別のビットマップで管理されています。エントリとノードの位置が、互いに混ざりません。

## まとめ

- `entryKeyIndex` は、位置より下のビットを数えて、その件数に `ENTRY_SIZE` を掛けて、キーの位置を求める。
- ビットマップと詰めて並べた配列を組み合わせると、探索なしで位置が決まる。
- 位置の印の引き算と `and`、ビットの数だけで計算するので、軽い処理になる。
