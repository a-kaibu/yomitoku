---
title: "2 行だけ持って編集距離を求める"
description: "Apache Commons Text の編集距離（レーベンシュタイン距離）の計算。表全体を持たず、1 行分の配列だけを上書きしながら最小の編集回数を求める動的計画法の実装。"
language: java
project: Apache Commons Text
repo: https://github.com/apache/commons-text
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "960159844c5f684e4567e93ef398bef58c8a3df5"
file: src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java
lines: [229, 278]
function: "LevenshteinDistance.unlimitedCompare"
difficulty: 3
format: 2
tags: [アルゴリズム, 文字列処理, 最適化]
---

## ひとことで

`unlimitedCompare(left, right)` は、2 つの文字列の「編集距離」を求めます。編集距離とは、一方の文字列を、挿入・削除・置換を繰り返してもう一方に変えるときの、最少の操作回数です。たとえば `kitten` を `sitting` に変えるには 3 回必要です。

スペルチェックや、検索の「もしかしてこれ？」の候補出しによく使われます。この関数は、その基本になる計算を、少ないメモリで行います。

## コード

::: code-group

```java:line-numbers=229 [日本語訳]
    private static <E> int unlimitedCompare(SimilarityInput<E> left, SimilarityInput<E> right) {
        if (left == null || right == null) {
            throw new IllegalArgumentException("CharSequences must not be null");
        }
        /*
         * この実装は、前のコストを記録する変数を 2 つだけ使うので、以前の実装よりメモリが少ない
         */
        int n = left.length(); // 左の文字列の長さ
        int m = right.length(); // 右の文字列の長さ

        if (n == 0) {
            return m;
        }
        if (m == 0) {
            return n;
        }
        if (n > m) {
            // メモリを節約するため、入力の文字列を入れ替える
            final SimilarityInput<E> tmp = left;
            left = right;
            right = tmp;
            n = m;
            m = right.length();
        }
        final int[] p = new int[n + 1];
        // 左と右の文字列の添字
        int i; // 左の文字列を順に見る
        int j; // 右の文字列を順に見る
        int upperLeft;
        int upper;
        E rightJ; // 右の文字列の j 番目の文字
        int cost; // コスト
        for (i = 0; i <= n; i++) {
            p[i] = i;
        }
        for (j = 1; j <= m; j++) {
            upperLeft = p[0];
            rightJ = right.at(j - 1);
            p[0] = j;

            for (i = 1; i <= n; i++) {
                upper = p[i];
                cost = left.at(i - 1).equals(rightJ) ? 0 : 1;
                // 左のセル + 1、上のセル + 1、左上のセル + コスト のうちの最小値
                p[i] = Math.min(Math.min(p[i - 1] + 1, p[i] + 1), upperLeft + cost);
                upperLeft = upper;
            }
        }
        return p[n];
    }
```

```java:line-numbers=229 [原文]
    private static <E> int unlimitedCompare(SimilarityInput<E> left, SimilarityInput<E> right) {
        if (left == null || right == null) {
            throw new IllegalArgumentException("CharSequences must not be null");
        }
        /*
         * This implementation use two variable to record the previous cost counts, So this implementation use less memory than previous impl.
         */
        int n = left.length(); // length of left
        int m = right.length(); // length of right

        if (n == 0) {
            return m;
        }
        if (m == 0) {
            return n;
        }
        if (n > m) {
            // swap the input strings to consume less memory
            final SimilarityInput<E> tmp = left;
            left = right;
            right = tmp;
            n = m;
            m = right.length();
        }
        final int[] p = new int[n + 1];
        // indexes into strings left and right
        int i; // iterates through left
        int j; // iterates through right
        int upperLeft;
        int upper;
        E rightJ; // jth character of right
        int cost; // cost
        for (i = 0; i <= n; i++) {
            p[i] = i;
        }
        for (j = 1; j <= m; j++) {
            upperLeft = p[0];
            rightJ = right.at(j - 1);
            p[0] = j;

            for (i = 1; i <= n; i++) {
                upper = p[i];
                cost = left.at(i - 1).equals(rightJ) ? 0 : 1;
                // minimum of cell to the left+1, to the top+1, diagonally left and up +cost
                p[i] = Math.min(Math.min(p[i - 1] + 1, p[i] + 1), upperLeft + cost);
                upperLeft = upper;
            }
        }
        return p[n];
    }
```

:::

## 前提知識

- **動的計画法（DP）**: 大きな問題を小さな問題の答えの組み合わせで解く方法です。一つ前の結果を覚えておき、それを使って次を計算します。
- **編集距離**: 文字列の違いを、操作回数の数で表したものです。小さいほど似ている文字列です。
- **`CharSequence` と `SimilarityInput`**: 文字の並びを表す型です。`at(i)` で i 番目の文字を取り出せます。
- **`Math.min`**: 2 つの値のうち小さい方を返します。ここでは 3 つの候補の最小値を取るために、二重に使われています。
- **`equals`**: 文字が同じかどうかを比べるために使います。同じなら置換のコストは 0 です。

## 何をしているか

### 1. 長さが短い方を左に置く

```java:line-numbers=245
        if (n > m) {
            // メモリを節約するため、入力の文字列を入れ替える
            final SimilarityInput<E> tmp = left;
            left = right;
            right = tmp;
            n = m;
            m = right.length();
        }
```

左の方が長いときは、2 つを入れ替えます。配列の長さを、短い方の文字列の長さに合わせるためです。編集距離は入れ替えても同じ値になるので、結果は変わりません。

### 2. 1 行分の配列を用意する

```java:line-numbers=253
        final int[] p = new int[n + 1];
        // 左と右の文字列の添字
        int i; // 左の文字列を順に見る
        int j; // 右の文字列を順に見る
        int upperLeft;
        int upper;
        E rightJ; // 右の文字列の j 番目の文字
        int cost; // コスト
        for (i = 0; i <= n; i++) {
            p[i] = i;
        }
```

`p` は、一つ前の行の結果を入れた配列です。表全体（文字列の長さの掛け算の大きさ）を持つ代わりに、1 行分だけを持ちます。`p[i]` は、左の文字列の先頭 i 文字を、空の文字列へ変えるコストに初期化されます。

### 3. 右の文字を 1 つずつ進める

```java:line-numbers=264
        for (j = 1; j <= m; j++) {
            upperLeft = p[0];
            rightJ = right.at(j - 1);
            p[0] = j;

```

右の文字列を 1 文字ずつ進めます。`upperLeft` は、左上にあたる値を覚えておく変数です。`p[0]` は、右側の先頭 j 文字を、空の文字列へ変えるコストで更新されます。

### 4. 3 つの候補の最小値を取る

```java:line-numbers=269
            for (i = 1; i <= n; i++) {
                upper = p[i];
                cost = left.at(i - 1).equals(rightJ) ? 0 : 1;
                // 左のセル + 1、上のセル + 1、左上のセル + コスト のうちの最小値
                p[i] = Math.min(Math.min(p[i - 1] + 1, p[i] + 1), upperLeft + cost);
                upperLeft = upper;
            }
```

各セルでは、次の 3 つの候補から最小値を取ります。左から来る「挿入」（`p[i - 1] + 1`）、上から来る「削除」（`p[i] + 1`）、左上から来る「置換または同じ文字」（`upperLeft + cost`）です。`upper` に退避してから `upperLeft` を更新するため、次のセルで左上の値が正しく使われます。

## ここがすごい

- **メモリが 1 行分で済む**: 表全体を持つと、文字列が長いときにメモリが大きく増えます。この実装は、必要な 1 行分の配列と、3 つの変数だけを使います。
- **左上の値を退避する**: 同じ配列を上書きしていくので、計算に必要な左上の値を失わないように、`upper` に一時的に保存しています。小さな工夫ですが、これがないと正しい答えになりません。
- **短い方を内側に置く**: 配列の長さを短い方に合わせる入れ替えで、メモリの使用量をさらに減らしています。
- **条件の数が少ない**: 3 つの候補の最小値を、`Math.min` を二重に使って表しています。特別な場合分けを書かずに、削除・挿入・置換を同じ式で扱えます。

## まとめ

- 編集距離は、挿入・削除・置換の最少回数で、文字列の違いを測る。
- 表全体ではなく 1 行分の配列を、左上の値を退避しながら上書きして求める。
- 短い方を内側に置くことで、メモリの使用量を抑える。
