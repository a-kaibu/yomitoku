---
title: "文字を順に探し、連続して一致するほど点を多くする"
description: "Apache Commons Text の FuzzyScore.fuzzyScore。検索語の文字を、対象の文字列の前から順に探す。一致するたびに 1 点、直前の一致の直後なら 2 点を加える。"
language: java
project: Apache Commons Text
repo: https://github.com/apache/commons-text
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "960159844c5f684e4567e93ef398bef58c8a3df5"
file: src/main/java/org/apache/commons/text/similarity/FuzzyScore.java
lines: [77, 115]
function: "FuzzyScore.fuzzyScore"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 探索]
---

## ひとことで

ファジー検索は、入力された短い文字列（クエリ）が、対象の文字列（ターム）に「ぼんやり」含まれているかを測ります。たとえば `hw` は `Hello World` に含まれていると考えます。

`fuzzyScore` は、その近さを点数で返すメソッドです。クエリの文字を、タームの前から順に探し、見つかるたびに点を加えます。

## コード

::: code-group

```java:line-numbers=77 [日本語訳]
    public Integer fuzzyScore(final CharSequence term, final CharSequence query) {
        if (term == null || query == null) {
            throw new IllegalArgumentException("CharSequences must not be null");
        }
        //         // ファジーの判定は大文字と小文字を区別しない。最初に両方を小文字にそろえる。
        //         // 小文字化は、文字ごとではなく、文字列全体に対して最初に行う。
        //         // Character.toLowerCase(char) を使う方法では、十分ではない。
        //         // ロケールを受け取れないからである。
        final String termLowerCase = term.toString().toLowerCase(locale);
        final String queryLowerCase = query.toString().toLowerCase(locale);
        //         // 結果のスコア
        int score = 0;
        //         // 次に一致を探し始める、対象の中の位置
        //         // （クエリの文字と照合する位置）
        int termIndex = 0;
        //         // 対象の中で、直前に一致した文字の位置
        int previousMatchingCharacterIndex = Integer.MIN_VALUE;
        for (int queryIndex = 0; queryIndex < queryLowerCase.length(); queryIndex++) {
            final char queryChar = queryLowerCase.charAt(queryIndex);
            boolean termCharacterMatchFound = false;
            for (; termIndex < termLowerCase.length() && !termCharacterMatchFound; termIndex++) {
                final char termChar = termLowerCase.charAt(termIndex);
                if (queryChar == termChar) {
                    //                     // 1 文字一致するごとに 1 点
                    score++;
                    //                     // 連続した一致は、さらにスコアを上げる
                    //                     // （スコアを上げる）
                    if (previousMatchingCharacterIndex + 1 == termIndex) {
                        score += 2;
                    }
                    previousMatchingCharacterIndex = termIndex;
                    //                     // 内側のループを抜けてよい。クエリの各文字は、対象の 1 文字にしか対応しないため
                    //                     // （各文字は多くとも 1 回だけ一致する）
                    termCharacterMatchFound = true;
                }
            }
        }
        return score;
    }
```

```java:line-numbers=77 [原文]
    public Integer fuzzyScore(final CharSequence term, final CharSequence query) {
        if (term == null || query == null) {
            throw new IllegalArgumentException("CharSequences must not be null");
        }
        // fuzzy logic is case insensitive. We normalize the Strings to lower
        // case right from the start. Turning characters to lower case
        // via Character.toLowerCase(char) is unfortunately insufficient
        // as it does not accept a locale.
        final String termLowerCase = term.toString().toLowerCase(locale);
        final String queryLowerCase = query.toString().toLowerCase(locale);
        // the resulting score
        int score = 0;
        // the position in the term which will be scanned next for potential
        // query character matches
        int termIndex = 0;
        // index of the previously matched character in the term
        int previousMatchingCharacterIndex = Integer.MIN_VALUE;
        for (int queryIndex = 0; queryIndex < queryLowerCase.length(); queryIndex++) {
            final char queryChar = queryLowerCase.charAt(queryIndex);
            boolean termCharacterMatchFound = false;
            for (; termIndex < termLowerCase.length() && !termCharacterMatchFound; termIndex++) {
                final char termChar = termLowerCase.charAt(termIndex);
                if (queryChar == termChar) {
                    // simple character matches result in one point
                    score++;
                    // subsequent character matches further improve
                    // the score.
                    if (previousMatchingCharacterIndex + 1 == termIndex) {
                        score += 2;
                    }
                    previousMatchingCharacterIndex = termIndex;
                    // we can leave the nested loop. Every character in the
                    // query can match at most one character in the term.
                    termCharacterMatchFound = true;
                }
            }
        }
        return score;
    }
```

:::

## 前提知識

- **部分列（subsequence）**: 元の文字列から、順番を守って一部の文字を取り出した並びです。`hw` は `Hello World` の部分列です（`H` と `W` の間に文字があってもよい）。
- **貪欲法（greedy）**: 見つかった最初の位置を、そのまま採用する方法です。後で戻らずに、前から順に決めていきます。
- **小文字化**: 大文字と小文字を同じものとして比べるために、両方を小文字にそろえます。
- **`MIN_VALUE` の初期値**: 最初の一致には「直前の一致」がないので、その位置を `Integer.MIN_VALUE` にしておきます。直後の判定が必ず偽になります。

## 何をしているか

### 1. クエリの文字を、前から順に探す

```java:line-numbers=94
        for (int queryIndex = 0; queryIndex < queryLowerCase.length(); queryIndex++) {
            final char queryChar = queryLowerCase.charAt(queryIndex);
            boolean termCharacterMatchFound = false;
            for (; termIndex < termLowerCase.length() && !termCharacterMatchFound; termIndex++) {
                final char termChar = termLowerCase.charAt(termIndex);
                if (queryChar == termChar) {
```

クエリの 1 文字ずつに対して、タームの `termIndex` から先を見ていきます。一致した文字が見つかったら、内側のループを抜けて、次のクエリの文字に移ります。

### 2. 一致ごとに点を足し、連続なら追加点

```java:line-numbers=100
                    //                     // 1 文字一致するごとに 1 点
                    score++;
                    //                     // 連続した一致は、さらにスコアを上げる
                    //                     // （スコアを上げる）
                    if (previousMatchingCharacterIndex + 1 == termIndex) {
                        score += 2;
                    }
                    previousMatchingCharacterIndex = termIndex;
```

一致したら、まず 1 点を足します。直前に一致した位置の次の文字なら、さらに 2 点を足します。つまり、連続して一致するほど、高い点数になります。

### 3. 最後に、得点だけを返す

```java:line-numbers=114
        return score;
```

すべてのクエリの文字が一致したかは確かめず、得られた点数を返します。見つからなかった文字は、点数が増えないだけです。

例として、`he` を `hello` に当てはめます。`h` は位置 0 で 1 点、`e` は位置 1 で、直前の一致の次なので 1 点と 2 点で、合計 4 点です。`he` を `h_e`（間に文字がある場合）と比べると、連続しない分だけ点が低くなります。

## ここがすごい

- **1 回の走査で済む**: 対象の文字列を前から 1 回だけ読むので、速く計算できます。
- **連続性を点数にする**: 単に文字が含まれるかではなく、近くに並んでいるかを点に反映します。検索結果の並べ替えに役立ちます。
- **大文字と小文字の違いを無視**: 最初に両方を小文字にそろえてから比べるので、大文字や小文字の違いで点が落ちません。
- **位置を戻さない**: 一致が見つかったら、その位置より前には戻りません。すべての組み合わせを試さないので、計算量が少なくなります。

## まとめ

- `fuzzyScore` は、クエリの文字をターム中で前から順に探し、一致ごとに 1 点を足す。
- 直前の一致の直後に一致したときは、さらに 2 点を足す。
- 全部一致したかは確かめず、得点だけを返す。貪欲法で、1 回の走査で計算する。
