---
title: "文字のずれを許して似ている度合いを測る jaroSimilarity"
description: "2 つの文字列の一致する文字の数と、順序の入れ替わりから 0 から 1 の似ている度合いを求める jaroSimilarity。近い位置の同じ文字だけを一致とみなす。"
language: kotlin
project: "Clikt"
repo: https://github.com/ajalt/clikt
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "fa2e48c54995a88d492f05568a64889d99994877"
file: clikt/src/commonMain/kotlin/com/github/ajalt/clikt/core/JaroWinkerSimilarity.kt
lines: [7, 38]
function: "jaroSimilarity"
difficulty: 3
tags: [文字列処理, アルゴリズム, 数値計算]
format: 2
---

## ひとことで

`jaroSimilarity()` は、2 つの文字列が **どれくらい似ているか** を、0（まったく違う）から 1（同じ）の数で表す関数です。文字が少しずれていても、近い位置に同じ文字があれば一致とみなします。

Clikt（コマンドラインツールを作るライブラリ）が、入力されたオプションの値の綴りを間違えたとき、近い候補を探すために使っています。

## コード

```kotlin:line-numbers=7
private fun jaroSimilarity(s1: String, s2: String): Double {
    if (s1.isEmpty() && s2.isEmpty()) return 1.0
    else if (s1.isEmpty() || s2.isEmpty()) return 0.0
    else if (s1.length == 1 && s2.length == 1) return if (s1[0] == s2[0]) 1.0 else 0.0

    val searchRange: Int = max(s1.length, s2.length) / 2 - 1
    val s2Consumed = BooleanArray(s2.length)
    var matches = 0.0
    var transpositions = 0
    var s2MatchIndex = 0

    for ((i, c1) in s1.withIndex()) {
        val start = max(0, i - searchRange)
        val end = min(s2.lastIndex, i + searchRange)
        for (j in start..end) {
            val c2 = s2[j]
            if (c1 != c2 || s2Consumed[j]) continue
            s2Consumed[j] = true
            matches += 1
            if (j < s2MatchIndex) transpositions += 1
            s2MatchIndex = j
            break
        }
    }

    return when (matches) {
        0.0 -> 0.0
        else -> (matches / s1.length +
                matches / s2.length +
                (matches - transpositions) / matches) / 3.0
    }
}
```

## 前提知識

- **類似度**: 2 つの文字列の似ている度合いを、0 から 1 の数で表したものです。1 なら同じ、0 なら一致する部分がありません。
- **一致の窓（ウィンドウ）**: 同じ文字を探す範囲です。位置が大きくずれた文字は、一致とみなしません。
- **`BooleanArray`**: 真偽値を並べた配列です。ここでは、相手の文字列の各文字が、すでに一致に使われたかを記録します。
- **`break` と `continue`**: `continue` は次の回へ、`break` はループを抜けます。ここでは、一致が見つかったら内側のループを抜けます。
- **`max` と `min`**: 2 つの値のうち大きいほう、小さいほうを返す関数です。

## 何をしているか

### 1. 空や 1 文字の特別扱い

```kotlin:line-numbers=8
    if (s1.isEmpty() && s2.isEmpty()) return 1.0
```

両方が空なら、同じとみなして 1 を返します。

```kotlin:line-numbers=10
    else if (s1.length == 1 && s2.length == 1) return if (s1[0] == s2[0]) 1.0 else 0.0
```

1 文字どうしなら、同じかどうかだけで決めます。窓の計算が要らないので、先に返します。

### 2. 一致を探す範囲を決める

```kotlin:line-numbers=12
    val searchRange: Int = max(s1.length, s2.length) / 2 - 1
```

一致を探す窓の幅を、長いほうの文字列の長さの半分から求めます。この範囲より遠い位置の同じ文字は、一致とみなしません。

### 3. 窓の中で同じ文字を一致させる

```kotlin:line-numbers=19
        val start = max(0, i - searchRange)
        val end = min(s2.lastIndex, i + searchRange)
```

`s1` の位置 `i` に対して、`s2` の中で探す範囲を決めます。範囲は文字列の端からはみ出さないようにしてあります。

```kotlin:line-numbers=23
            if (c1 != c2 || s2Consumed[j]) continue
```

違う文字や、すでに一致に使われた文字は飛ばします。同じ文字を二重に数えないための仕組みです。

```kotlin:line-numbers=26
            if (j < s2MatchIndex) transpositions += 1
```

見つかった一致の位置が、前の一致より手前にあれば、順序が入れ替わったとして数えます。

### 4. 3 つの割合を平均する

```kotlin:line-numbers=34
        else -> (matches / s1.length +
```

一致の数を、`s1` の長さで割った割合と、`s2` の長さで割った割合を足します。

```kotlin:line-numbers=36
                (matches - transpositions) / matches) / 3.0
```

順序が入れ替わっていない一致の割合を足して、3 で割ります。3 つの割合の平均が、類似度になります。

## ここがすごい

- **位置のずれを許す**: 完全に同じ位置でなくても、窓の中に同じ文字があれば一致とみなします。打ち間違いや一文字の抜けに強くなります。
- **一致を 1 回だけ使う**: `s2Consumed` で、同じ文字を二重に使わないようにしています。数え間違いがそのまま結果のずれになるので、この管理が大切です。
- **窓の幅が長さに比例**: 長い文字列ほど広い範囲を探します。短い語句と長い語句で、同じ基準の比較ができます。
- **注意点**: 一般に紹介される Jaro の定義では、順序の入れ替わりを半分にして数えることが多いですが、この実装はそうしていません。細部の数え方が違うことを知っておくと、結果の読み方を誤りません。

## まとめ

- `jaroSimilarity` は、近い位置の同じ文字の数と順序の入れ替わりから、0 から 1 の類似度を求める。
- 窓の幅を文字列の長さから決め、一致に使った文字は二重に数えない。
- 結果は 3 つの割合の平均で、綴りの間違いを候補として探すのに使える。
