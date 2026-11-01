---
title: "すでに並んでいる部分を見つけて、逆順ならひっくり返す"
description: "TimSort がデータの中の「すでに並んでいる部分」を見つける関数。昇順ならそのまま、厳密な降順なら反転して昇順に直す。現実のデータに多い「ほぼ並んでいる」状態を活かす鍵。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2009, 2013, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/TimSort.java
lines: [347, 365]
function: "TimSort.countRunAndMakeAscending"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 標準ライブラリ]
---

## ひとことで

現実のデータは、まったくのでたらめより「ところどころ並んでいる」ことがよくあります。TimSort はそこに目をつけたソートで、`countRunAndMakeAscending` は **配列の先頭から、すでに並んでいる部分（ラン）がどこまで続くか** を数えます。

昇順に並んでいればそのまま、**降順に並んでいたら反転して昇順にします**。たとえば `[5, 4, 3, 8, 1]` の先頭は `5, 4, 3` が降順なので、反転して `[3, 4, 5, 8, 1]` にし、長さ 3 を返します。

## コード

::: code-group

```java:line-numbers=347 [日本語訳]
    private static <T> int countRunAndMakeAscending(T[] a, int lo, int hi,
                                                    Comparator<? super T> c) {
        assert lo < hi;
        int runHi = lo + 1;
        if (runHi == hi)
            return 1;

        // ランの終わりを見つけ、降順なら範囲を反転する
        if (c.compare(a[runHi++], a[lo]) < 0) { // 降順
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) < 0)
                runHi++;
            reverseRange(a, lo, runHi);
        } else {                              // 昇順
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) >= 0)
                runHi++;
        }

        return runHi - lo;
    }
```

```java:line-numbers=347 [原文]
    private static <T> int countRunAndMakeAscending(T[] a, int lo, int hi,
                                                    Comparator<? super T> c) {
        assert lo < hi;
        int runHi = lo + 1;
        if (runHi == hi)
            return 1;

        // Find end of run, and reverse range if descending
        if (c.compare(a[runHi++], a[lo]) < 0) { // Descending
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) < 0)
                runHi++;
            reverseRange(a, lo, runHi);
        } else {                              // Ascending
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) >= 0)
                runHi++;
        }

        return runHi - lo;
    }
```

:::

## 前提知識

- **`<T>` と `T[] a`**: ジェネリクスで、どんな型の配列でも扱えることを表します。
- **`Comparator<? super T> c`**: 2 つの要素を比べる道具です。`c.compare(x, y)` は、`x < y` なら負、等しければ 0、`x > y` なら正を返します。
- **`lo` と `hi`**: 調べる範囲で、`lo` 以上 `hi` 未満です。
- **`a[runHi++]`**: `runHi` 番目の要素を使い、その後 `runHi` を 1 増やします。
- **`reverseRange(a, lo, runHi)`**: 範囲内の要素を反転する、同じクラスの関数です。
- **安定なソート**: 等しい要素の元の順番を保つソートです。TimSort は安定です。

## 何をしているか

### 1. 長さ 1 なら終わり

```java:line-numbers=350
        int runHi = lo + 1;
        if (runHi == hi)
            return 1;
```
範囲に要素が 1 つしかなければ、それだけで長さ 1 のランです。

### 2. 最初の 2 つで向きを決める

```java:line-numbers=355
        if (c.compare(a[runHi++], a[lo]) < 0) { // 降順
```
`a[lo + 1]` が `a[lo]` より小さければ「降順のラン」、そうでなければ「昇順のラン」として、その向きが続く限り伸ばします。

### 3. 降順のとき

```java:line-numbers=356
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) < 0)
                runHi++;
            reverseRange(a, lo, runHi);
```
`[5, 4, 3, 8, 1]` では、`4 < 5`、`3 < 4` と降順が続き、`8 < 3` ではないので止まります。範囲 `[0, 3)` を反転して `[3, 4, 5, 8, 1]` にします。

ここで条件が `< 0`（**厳密に** 小さい）になっているのが大事です。`[3, 2, 2, 1]` のように等しい要素があると、そこで降順のランは止まります。

### 4. 昇順のとき

```java:line-numbers=360
            while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) >= 0)
                runHi++;
```
`>= 0`（等しいか大きい）が続く限り伸ばします。等しい要素は昇順のランに含めてよいのです。

### 5. 長さを返す

```java:line-numbers=364
        return runHi - lo;
```
`runHi - lo` がランの長さです。

## ここがすごい

- **安定性を守る「厳密な降順」**: 降順のランを反転すると、ランの中の要素の順番が逆になります。もし等しい要素 `2, 2` が含まれていると、その 2 つの順番まで入れ替わり、安定なソートでなくなってしまいます。降順のランを「厳密に小さくなる部分」に限ることで、反転しても等しい要素の順番が変わらないようにしています。
- **反転は安い**: 降順のデータを一般のソートで並べ直すのは大変ですが、反転なら要素数の半分の入れ替えで終わります。完全に逆順の配列なら、この関数 1 回でソートが終わってしまいます。
- **現実のデータに強い**: すでに並んでいる部分をそのまま使えるので、「ほぼソート済み」のデータでは比較回数が大きく減ります。ログのように時刻順に追加されるデータなど、実用ではよくある状況です。
- **比較を 1 回も無駄にしない**: 向きを決める比較の `a[runHi++]` で、向きの判定に使った比較が、そのままランを 1 つ伸ばす比較にもなっています。

## まとめ

- 現実のデータには「すでに並んでいる部分」が多い。それを見つけて活かすのが TimSort の発想。
- 降順の部分は反転するだけで昇順になる。ただし安定性のため、等しい要素を含めない。
- 判定のための比較を、そのまま処理にも使うと無駄がない。
