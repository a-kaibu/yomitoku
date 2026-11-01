---
title: "元の地図を変えずに新しい地図を作る put"
description: "変更できない（永続的な）ハッシュマップの put。元のマップはそのままにして、新しいマップを返す。内容が変わらないときは、同じマップを返して無駄な生成を省く。"
language: kotlin
project: "kotlinx.collections.immutable"
repo: https://github.com/Kotlin/kotlinx.collections.immutable
license: Apache-2.0
copyright: "Copyright 2016-2026 JetBrains s.r.o."
commit: "9f961e4dd419dff58ffea164dd41ebba68acc8d6"
file: core/commonMain/src/implementations/immutableMap/PersistentHashMap.kt
lines: [57, 60]
function: "PersistentHashMap.put"
difficulty: 3
tags: [データ構造, 関数型, 最適化]
format: 2
---

## ひとことで

`kotlinx.collections.immutable` の `PersistentHashMap` は、**一度作ったら中身を変えない** マップ（辞書）です。`put` で値を入れても、元のマップは変わりません。代わりに、**新しい値を入れたマップを新しく返します**。

この方式は「永続的（persistent）」と呼ばれます。古いマップを持っている人は、変更の影響を受けずに済みます。

## コード

```kotlin:line-numbers=57
    override fun put(key: K, value: @UnsafeVariance V): PersistentHashMap<K, V> {
        val newNodeResult = node.put(key.hashCode(), key, value, 0) ?: return this
        return PersistentHashMap(newNodeResult.node, size + newNodeResult.sizeDelta)
    }
```

## 前提知識

- **ハッシュマップ**: キーの `hashCode()` から位置を求めて、値を素早く探せる辞書です。
- **不変（immutable）**: 作った後で中身を変えないデータです。値を変えたいときは、新しい値を持つものを作ります。
- **`node`**: マップの中身を入れた木のノードです。キーのハッシュ値の一部ずつを使って、枝をたどります。
- **`sizeDelta`**: 追加や置き換えで、要素の数がどれだけ増えたかを表す値です。新しく追加されたときは 1、置き換えのときは 0 になります。
- **`?: return this`**: 左の値が `null` なら、この関数を今のマップのまま終わります。

## 何をしているか

### 1. 木に入れてみて、変化がなければ今のマップを返す

```kotlin:line-numbers=58
        val newNodeResult = node.put(key.hashCode(), key, value, 0) ?: return this
```

`node.put` は、新しい木と要素数の変化を返します。変化がない場合（同じ値をもう一度入れたなど）は `null` を返すので、今のマップをそのまま返します。新しいマップを作る必要がありません。

### 2. 新しいマップを、新しい木と要素数で作る

```kotlin:line-numbers=59
        return PersistentHashMap(newNodeResult.node, size + newNodeResult.sizeDelta)
```

新しい木と、古い要素数に変化分を足した数で、新しいマップを作ります。元のマップの木は、そのまま残ります。

## ここがすごい

- **変化がなければ同じ物を返す**: 同じ値を入れ直す場合、新しいマップを作らずに今のマップを返します。無駄な割り当てを避け、同じかどうかの比較も速くなります。
- **古い版を壊さない**: 元のマップは変わらないので、別のスレッドや別の処理が古い版を読んでいても、安全です。同時に読み書きするときの、ロックの必要が少なくなります。
- **変化を数だけで伝える**: 要素数の変化を `sizeDelta` で返すので、マップ全体を数え直す必要がありません。
- **`put` は非推奨になっている**: コード上の `@Deprecated` が示すように、同じ働きの `putting` を使うよう案内されています。

## まとめ

- 永続的なマップは、`put` で元を変えずに、新しいマップを返す。
- 変化がなければ同じマップを返すと、無駄な割り当てを省ける。
- 要素数の変化を別の値で返すと、数え直しが要らない。
