---
title: "区間の列から、値が入る区間を再帰で探す"
description: "ソートされた区間の列から、位置の値を含む区間の番号を再帰で探す binarySearch。見つからなければ -1 を返し、真ん中の区間と比べて左右どちらを調べるか決める。"
language: kotlin
project: "ktlint"
repo: https://github.com/pinterest/ktlint
license: MIT
copyright: "Copyright 2026 Ktlint, Copyright 2019-2026 Pinterest, Inc., Copyright 2016-2019 Stanley Shyiko"
commit: "5775b58d0f996e84c9c67205342f1c5620de6a4a"
file: ktlint-rule-engine/src/main/kotlin/io/github/ktlint/core/rule/engine/internal/PositionInTextLocator.kt
lines: [55, 74]
function: "SegmentTree.binarySearch"
difficulty: 2
tags: [アルゴリズム, 再帰, 可読性]
format: 2
---

## ひとことで

`binarySearch()` は、左から順に並んだ **区間の列** の中から、指定された値が **どの区間に入るか** を探す関数です。ktlint（Kotlin のコードの書式を検査するツール）が、文字の位置から行と列を求めるために使っています。

区間は、「左の端」と「右の端」の 2 つの数で表されています。区間どうしは重ならず、左から順に並んでいます。

## コード

```kotlin:line-numbers=55
    private fun binarySearch(
        v: Int,
        l: Int,
        r: Int,
    ): Int =
        when {
            l > r -> {
                -1
            }

            else -> {
                val i = l + (r - l) / 2
                val s = segments[i]
                if (v < s.left) {
                    binarySearch(v, l, i - 1)
                } else {
                    if (s.right < v) binarySearch(v, i + 1, r) else i
                }
            }
        }
```

## 前提知識

- **区間（Segment）**: 左の端 `left` と右の端 `right` で表された、数の範囲です。ここでは `Segment` という `data class` で表します。
- **`data class`**: 値を保持するためのクラスです。`left` と `right` を持つ箱だと考えると分かりやすいです。
- **二分探索**: 列の真ん中を調べて、探す値が左か右かで範囲を半分に絞る探し方です。
- **再帰**: 関数の中で、同じ関数を別の引数で呼ぶ書き方です。ここでは探索範囲を変えながら、自分自身を呼びます。
- **`when` 式**: 条件で分岐して、結果の値を返す書き方です。

## 何をしているか

### 1. 範囲が空なら見つからない

```kotlin:line-numbers=61
            l > r -> {
                -1
            }
```

探索の範囲がなくなったら、見つからなかったとして `-1` を返します。

### 2. 真ん中の区間と比べる

```kotlin:line-numbers=66
                val i = l + (r - l) / 2
```

探索範囲の真ん中の番号を求めます。`l + (r - l) / 2` と書くと、`(l + r) / 2` よりも溢れにくくなります。

```kotlin:line-numbers=68
                if (v < s.left) {
```

探す値が、真ん中の区間の左端より小さければ、値は左側にあります。

### 3. 左右どちらを調べるか決める

```kotlin:line-numbers=69
                    binarySearch(v, l, i - 1)
```

左側なら、真ん中より前の範囲だけを再帰で調べます。

```kotlin:line-numbers=71
                    if (s.right < v) binarySearch(v, i + 1, r) else i
```

右端より大きければ、値は右側にあるので、真ん中より後ろを調べます。どちらでもなければ、真ん中の区間が値を含んでいるので、その番号 `i` を返します。

## ここがすごい

- **条件が 3 つにきれいに分かれる**: 範囲がない、左にある、右にある、含んでいる、の 4 通りがはっきり分かれています。読んでも、どの場合に何が返るかが分かります。
- **区間を 1 つの型にまとめる**: `Segment` を使うので、左端と右端を別々の変数で持ち回る必要がありません。
- **溢れを避けた中点**: `l + (r - l) / 2` は、大きな番号でも安全な中点の求め方です。
- **再帰で書いた素直な二分探索**: ループの代わりに関数を呼ぶ形なので、読み手が探索の流れを追いやすくなっています。探索の深さは、列の長さの対数になるので、再帰が深くなりすぎることはありません。

## まとめ

- `binarySearch` は、区間の列から、値を含む区間の番号を二分探索で求める。
- 真ん中の区間の左端と右端で、左右どちらを調べるかを決める。
- 範囲がなくなれば `-1` を返し、見つからなかったことを伝える。
