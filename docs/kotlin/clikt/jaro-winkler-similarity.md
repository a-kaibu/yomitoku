---
title: "先頭が合う文字列を高く評価する jaroWinklerSimilarity"
description: "Jaro の類似度に、共通の先頭の長さに応じた加点を足す jaroWinklerSimilarity。先頭が合うほど似ていると判定され、1 を超えないように上限で止める。"
language: kotlin
project: "Clikt"
repo: https://github.com/ajalt/clikt
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "fa2e48c54995a88d492f05568a64889d99994877"
file: clikt/src/commonMain/kotlin/com/github/ajalt/clikt/core/JaroWinkerSimilarity.kt
lines: [40, 46]
function: "jaroWinklerSimilarity"
difficulty: 2
tags: [文字列処理, アルゴリズム, 数値計算]
format: 2
---

## ひとことで

`jaroWinklerSimilarity()` は、先ほどの `jaroSimilarity()` の結果に、**共通の先頭の長さ** に応じた加点をする関数です。先頭が合っている文字列は、綴りの間違いを見つけるときに、より似ていると判断されやすくなります。

Clikt が、入力された値に近い候補を探すときに使われています。Context.kt では、類似度が 0.8 を超える候補だけを提案に使っています。

## コード


::: code-group

```kotlin:line-numbers=40 [日本語訳]
internal fun jaroWinklerSimilarity(s1: String, s2: String): Double {
    // 古典的な Jaro-Winkler と違い、接頭辞の長さに上限を設けない
    val prefixLength = s1.commonPrefixWith(s2).length
    val jaro = jaroSimilarity(s1, s2)
    val winkler = jaro + (0.1 * prefixLength * (1 - jaro))
    return min(winkler, 1.0)
}
```

```kotlin:line-numbers=40 [原文]
internal fun jaroWinklerSimilarity(s1: String, s2: String): Double {
    // Unlike classic Jaro-Winkler, we don't set a limit on the prefix length
    val prefixLength = s1.commonPrefixWith(s2).length
    val jaro = jaroSimilarity(s1, s2)
    val winkler = jaro + (0.1 * prefixLength * (1 - jaro))
    return min(winkler, 1.0)
}
```

:::

## 前提知識

- **接頭辞（prefix）**: 2 つの文字列の先頭から、同じ文字が続いている部分です。`apple` と `apply` なら `appl` の 4 文字です。
- **`commonPrefixWith`**: 2 つの文字列で、先頭から共通の部分を返す標準の関数です。
- **`jaroSimilarity`**: 前の記事で扱った、0 から 1 の類似度を返す関数です。
- **`min`**: 2 つの値のうち小さいほうを返す関数です。ここでは上限を超えないように使っています。

## 何をしているか

### 1. 共通の先頭の長さを求める

```kotlin:line-numbers=42
    val prefixLength = s1.commonPrefixWith(s2).length
```

2 つの文字列が、先頭から何文字同じかを数えます。

### 2. 加点する

```kotlin:line-numbers=44
    val winkler = jaro + (0.1 * prefixLength * (1 - jaro))
```

先頭が 1 文字合うごとに、`0.1` の割合で、まだ残っている差（`1 - jaro`）の分を加えます。`jaro` がすでに 1 に近ければ、加点はわずかです。逆に、`jaro` が低い組み合わせでは、先頭が合っていることが効いてきます。

### 3. 上限で止める

```kotlin:line-numbers=45
    return min(winkler, 1.0)
```

加点の結果が 1 を超えないように、1 で止めて返します。

## ここがすごい

- **差分に比例させる**: 加点を `1 - jaro` に比例させているので、すでに似ている組み合わせが 1 を超えることはありません。上限の処理が、計算の形からも支えられています。
- **先頭だけを特別に見る**: 綴りの間違いは後ろよりも前の方で起きにくい、という経験則に基づく設計です。先頭が合うものを優先できます。
- **元の定義との違いをコメントで明記**: 古典的な方式では、先頭の長さを 4 文字までに制限します。この実装は上限を設けないと、コメントに書かれています。仕様の違いを隠さず残しているので、読み手が理解しやすくなります。
- **候補の絞り込みに使われる**: 0.8 を超える候補だけを提案に使うので、似ていない候補を大量に出さずに済みます。

## まとめ

- `jaroWinklerSimilarity` は、Jaro の類似度に、共通の先頭の長さに応じた加点を足す。
- 加点は `1 - jaro` に比例し、結果は 1 を超えないように止める。
- 古典的な定義と違い、先頭の長さに上限を設けないことがコメントで明記されている。
