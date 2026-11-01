---
title: "「(low + high) >>> 1」に込められた二分探索のバグ修正"
description: "ソート済み配列から値を探す二分探索。真ん中の位置を >>> 1 で求めるのは、長年見逃されたオーバーフローのバグを避けるため。見つからないときの戻り値にも工夫がある。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Arrays.java
lines: [1699, 1716]
function: "Arrays.binarySearch0(int[])"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, 防御的プログラミング]
---

## ひとことで

`Arrays.binarySearch` は、**小さい順に並んだ配列** から指定した値を探し、見つかればその位置を返します。真ん中の要素と比べて、探す範囲を半分ずつに絞る「二分探索」です。100 万個の配列でも 20 回ほどの比較で見つかります。

`binarySearch0` はその本体です。真ん中を `(low + high) / 2` ではなく **`(low + high) >>> 1`** で求めているのは、かつて多くの実装に潜んでいたバグを避けるためです。

## コード

::: code-group

```java:line-numbers=1699 [日本語訳]
    private static int binarySearch0(int[] a, int fromIndex, int toIndex,
                                     int key) {
        int low = fromIndex;
        int high = toIndex - 1;

        while (low <= high) {
            int mid = (low + high) >>> 1;
            int midVal = a[mid];

            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else
                return mid; // キーが見つかった
        }
        return -(low + 1);  // キーが見つからなかった。
    }
```

```java:line-numbers=1699 [原文]
    private static int binarySearch0(int[] a, int fromIndex, int toIndex,
                                     int key) {
        int low = fromIndex;
        int high = toIndex - 1;

        while (low <= high) {
            int mid = (low + high) >>> 1;
            int midVal = a[mid];

            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else
                return mid; // key found
        }
        return -(low + 1);  // key not found.
    }
```

:::

## 前提知識

- **`int[] a`**: `int` の配列です。`a[mid]` で `mid` 番目の要素を読みます。番号は 0 から始まります。
- **`int` の範囲**: 約 −21 億〜+21 億です。超えるとエラーにならず、**負の数に回り込みます**（オーバーフロー）。
- **`>>>`（符号なし右シフト）**: 左端に `0` を入れて右へずらします。`x >>> 1` は「`x` を符号なしの数とみなして 2 で割る」のと同じです。
- **`private static`**: クラスの中だけで使う、オブジェクト不要の関数です。公開版の `binarySearch` が引数の範囲を検査してからこれを呼びます。
- **`-(low + 1)`**: 単にマイナスをつけた値です。後で説明します。

## 何をしているか

`a = [1, 3, 5, 7, 9]` から `7` を探します。

### 1. 範囲を半分にする

```java:line-numbers=1701
        int low = fromIndex;
        int high = toIndex - 1;

        while (low <= high) {
            int mid = (low + high) >>> 1;
            int midVal = a[mid];

            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else
                return mid; // キーが見つかった
        }
        return -(low + 1);  // キーが見つからなかった。
```
- `low = 0`、`high = 4`。`mid = 2`、`a[2] = 5 < 7` なので右半分へ。`low = 3`。
- `mid = (3 + 4) >>> 1 = 3`、`a[3] = 7`。見つかったので `3` を返します。

### 2. 見つからないとき

```java:line-numbers=1716
    }
```
`6` を探すと、最終的に `low = 3`、`high = 2` でループを抜けます。このとき `low` は「`6` を入れるならここ」という挿入位置です。それを `-(low + 1) = -4` として返します。

戻り値が 0 以上なら「見つかった位置」、負なら「`-(戻り値) - 1` が挿入位置」と読めます。挿入位置が 0 のときも `-1` になるので、「見つかった位置 0」と区別できます。`+1` はそのための工夫です。

### 3. `>>> 1` の理由

```java:line-numbers=1706
            int midVal = a[mid];
```
配列が 15 億要素あり、`low = 10 億`、`high = 14 億` だとします。`low + high = 24 億` は `int` の上限（約 21 億）を超え、負の数に回り込みます。`/ 2` では負のまま割られるので、`mid` が負になり、配列の範囲外を読んでしまいます。

一方、回り込んだ値も、**ビットとしては正しい 24 億** を表しています。`>>> 1` は符号を気にせずビットを右にずらすので、正しく 12 億が得られます。`low` も `high` も 0 以上なので、和は 2^32 未満に収まり、この方法で必ず正しい結果になります。

## ここがすごい

- **歴史のあるバグ修正**: この `(low + high) / 2` のオーバーフローは、Java の標準ライブラリにも長く存在していました。2006 年に Joshua Bloch 氏が「ほとんどすべての二分探索とマージソートは壊れている」という記事で広く知らせ、JDK も修正されました。配列が巨大になって初めて起きるので、何年も気づかれなかったのです。
- **修正が 1 演算で済む**: `low + (high - low) / 2` と書く方法もありますが、`>>> 1` は演算が少なく、Java らしい解決です（C 言語などには `>>>` がないので、前者がよく使われます）。
- **戻り値の設計**: 見つからないときに単に `-1` を返すのではなく、挿入位置を符号に詰めて返します。呼ぶ側は「なければ正しい位置に入れる」処理を、もう一度探さずに書けます。

## まとめ

- 二分探索は範囲を半分にして探すので、比較回数は要素数の対数で済む。
- 2 つの大きな `int` の平均は、`(a + b) >>> 1` で安全に求められる。
- 「見つからなかった」ときにも役立つ情報（挿入位置）を返すと、API が使いやすくなる。
