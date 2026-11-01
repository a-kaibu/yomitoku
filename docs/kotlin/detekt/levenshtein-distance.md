---
title: "表を埋めて文字列の違いを数える levenshteinDistance"
description: "2 つの文字列を 1 文字ずつ直すのに必要な最少の操作回数（編集距離）を、表を埋める動的計画法で求める。detekt の設定ファイルの、打ち間違えたプロパティ名の検査で使われている。"
language: kotlin
project: "detekt"
repo: https://github.com/detekt/detekt
license: Apache-2.0
copyright: "Copyright 2016-2024 Artur Bosch and detekt contributors"
commit: "0887fcccf93842244ba851e970aa99c7da31ffbc"
file: detekt-core/src/main/kotlin/dev/detekt/core/config/validation/InvalidPropertiesConfigValidator.kt
lines: [120, 131]
function: "levenshteinDistance"
difficulty: 3
tags: [アルゴリズム, 文字列処理, 最適化]
format: 2
---

## ひとことで

**編集距離（レーベンシュタイン距離）** は、2 つの文字列を同じにするために必要な、1 文字の **挿入・削除・置き換え** の最少回数です。`cat` と `cut` は、`a` を `u` に置き換える 1 回で同じになるので、距離は 1 です。

`levenshteinDistance` は、この距離を **表（2 次元の配列）を順に埋める** 方法で求めます。小さい問題の答えを使って、少しずつ大きな問題を解く、動的計画法と呼ばれる方法です。

## コード

```kotlin:line-numbers=120
private fun levenshteinDistance(a: String, b: String): Int {
    val dp = Array(a.length + 1) { IntArray(b.length + 1) }
    for (i in 0..a.length) dp[i][0] = i
    for (j in 0..b.length) dp[0][j] = j
    for (i in 1..a.length) {
        for (j in 1..b.length) {
            val cost = if (a[i - 1] == b[j - 1]) 0 else 1
            dp[i][j] = minOf(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
    }
    return dp[a.length][b.length]
}
```

## 前提知識

- **表（`dp`）の意味**: `dp[i][j]` は、`a` の最初の `i` 文字を `b` の最初の `j` 文字に変えるのに必要な最少回数です。
- **動的計画法**: 大きな問題を小さな部分問題に分け、その答えを表に記録して再利用する方法です。同じ計算を繰り返さないので速くなります。
- **`minOf(a, b, c)`**: 3 つの値のうち最小のものを返す関数です。
- **`Array(n) { IntArray(m) }`**: 行と列をもつ 2 次元の配列を作ります。
- **`0..a.length`**: 0 から `a.length` までを含む範囲です。

## 何をしているか

### 1. 表の端を埋める

```kotlin:line-numbers=122
    for (i in 0..a.length) dp[i][0] = i
    for (j in 0..b.length) dp[0][j] = j
```

片方が空の文字列のとき、距離は残りの文字数です。たとえば、`a` の最初の 3 文字を空にするには、3 回の削除が必要です。表の最初の行と列がその値になります。

### 2. 1 マスずつ、3 つの操作から最小を選ぶ

```kotlin:line-numbers=126
            val cost = if (a[i - 1] == b[j - 1]) 0 else 1
            dp[i][j] = minOf(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
```

- `dp[i - 1][j] + 1`: `a` の文字を 1 つ削除する
- `dp[i][j - 1] + 1`: `b` の文字を 1 つ挿入する
- `dp[i - 1][j - 1] + cost`: 最後の文字を比べて、同じなら 0、違えば 1 の置き換え

この 3 つのうち最小を、そのマスの答えにします。

### 3. 右下が答え

```kotlin:line-numbers=130
    return dp[a.length][b.length]
```

表の右下は、2 つの文字列すべてを比べた結果です。そこを返します。

## ここがすごい

- **同じ計算を繰り返さない**: 各マスは、左・上・左上のマスの答えだけで決まります。すべてのマスを 1 回ずつ計算するので、全体の計算量は文字数の積に比例します。
- **3 つの操作を 1 つの式に**: 削除、挿入、置き換えのどれが最も安いかを、`minOf` の 1 行で選びます。読むとそのまま操作の定義になっています。
- **端の処理が自然**: 空の文字列を、表の最初の行と列で表すので、特別な場合分けが少なくて済みます。
- **打ち間違いの検出に使える**: 設定名が正しい名前と近いかを、距離で判定できます。距離が小さい候補を提案すれば、利用者は直せます。

## まとめ

- 文字列の違いは、挿入・削除・置き換えの最少回数（編集距離）で測れる。
- 表を埋める動的計画法では、各マスを近くの答えから 1 回だけ計算する。
- 端の値を正しく決めれば、残りのマスは同じ規則で埋められる。
