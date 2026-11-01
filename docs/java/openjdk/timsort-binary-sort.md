---
title: "二分探索で入れる場所を探す挿入ソート"
description: "TimSort が短い区間を並べるのに使う二分挿入ソート。入れる位置を二分探索で探して比較回数を減らし、要素の移動はまとめてコピーする。2 個以下の移動は switch で特別扱いする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2009, 2013, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/TimSort.java
lines: [276, 320]
function: "TimSort.binarySort"
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

TimSort は、短い区間（32 個程度まで）を **挿入ソート** で並べます。挿入ソートは、トランプの手札を並べるように「並んだ部分に 1 枚ずつ正しい位置へ差し込む」方法です。

`binarySort` はその改良版で、差し込む位置を **二分探索** で探します。比較の回数が大きく減るので、比較が重いオブジェクトのソートで効果を発揮します。

## コード

::: code-group

```java:line-numbers=276 [日本語訳]
    @SuppressWarnings("fallthrough")
    private static <T> void binarySort(T[] a, int lo, int hi, int start,
                                       Comparator<? super T> c) {
        assert lo <= start && start <= hi;
        if (start == lo)
            start++;
        for ( ; start < hi; start++) {
            T pivot = a[start];

            // left（と right）を、a[start]（pivot）が入るべき位置にする
            int left = lo;
            int right = start;
            assert left <= right;
            /*
             * 不変条件:
             * pivot は [lo, left) のすべて以上。
             * pivot は [right, start) のすべてより小さい。
             */
            while (left < right) {
                int mid = (left + right) >>> 1;
                if (c.compare(pivot, a[mid]) < 0)
                    right = mid;
                else
                    left = mid + 1;
            }
            assert left == right;

            /*
             * 不変条件はまだ成り立っている: pivot は [lo, left) のすべて以上で、
             * [left, start) のすべてより小さい。だから pivot は left に入る。
             * pivot と等しい要素があれば、left はそれらの直後を指す
             * ことに注意。これがこのソートが安定である理由だ。
             * 要素をずらして pivot の場所を空ける。
             */
            int n = start - left;  // 動かす要素の数
            // switch は、default の場合の arraycopy を補う最適化にすぎない
            switch (n) {
                case 2:  a[left + 2] = a[left + 1];
                case 1:  a[left + 1] = a[left];
                         break;
                default: System.arraycopy(a, left, a, left + 1, n);
            }
            a[left] = pivot;
        }
    }
```

```java:line-numbers=276 [原文]
    @SuppressWarnings("fallthrough")
    private static <T> void binarySort(T[] a, int lo, int hi, int start,
                                       Comparator<? super T> c) {
        assert lo <= start && start <= hi;
        if (start == lo)
            start++;
        for ( ; start < hi; start++) {
            T pivot = a[start];

            // Set left (and right) to the index where a[start] (pivot) belongs
            int left = lo;
            int right = start;
            assert left <= right;
            /*
             * Invariants:
             *   pivot >= all in [lo, left).
             *   pivot <  all in [right, start).
             */
            while (left < right) {
                int mid = (left + right) >>> 1;
                if (c.compare(pivot, a[mid]) < 0)
                    right = mid;
                else
                    left = mid + 1;
            }
            assert left == right;

            /*
             * The invariants still hold: pivot >= all in [lo, left) and
             * pivot < all in [left, start), so pivot belongs at left.  Note
             * that if there are elements equal to pivot, left points to the
             * first slot after them -- that's why this sort is stable.
             * Slide elements over to make room for pivot.
             */
            int n = start - left;  // The number of elements to move
            // Switch is just an optimization for arraycopy in default case
            switch (n) {
                case 2:  a[left + 2] = a[left + 1];
                case 1:  a[left + 1] = a[left];
                         break;
                default: System.arraycopy(a, left, a, left + 1, n);
            }
            a[left] = pivot;
        }
    }
```

:::

## 前提知識

- **`T[] a`、`Comparator<? super T> c`**: 任意の型の配列と、要素を比べる道具です。`c.compare(x, y)` は `x < y` なら負を返します。
- **`lo`、`hi`、`start`**: 並べる範囲は `[lo, hi)` で、`[lo, start)` はすでに並んでいます。
- **`assert`**: 必ず成り立つはずの条件の確認です。
- **`switch` の fallthrough**: `case 2:` の後に `break` がないので、続けて `case 1:` の処理も実行されます。`@SuppressWarnings("fallthrough")` は、それが意図的だとコンパイラに伝えています。
- **`System.arraycopy(a, left, a, left + 1, n)`**: 配列の `left` から `n` 個を、1 つ後ろへまとめてずらします。重なっていても正しくコピーされます。

## 何をしているか

`[2, 5, 8, 3]`、`start = 3` で、`3` を差し込む場面を追います。

### 1. 二分探索で位置を探す

```java:line-numbers=286
            int left = lo;
            int right = start;
            assert left <= right;
            /*
             * 不変条件:
             * pivot は [lo, left) のすべて以上。
             * pivot は [right, start) のすべてより小さい。
             */
            while (left < right) {
                int mid = (left + right) >>> 1;
                if (c.compare(pivot, a[mid]) < 0)
                    right = mid;
                else
                    left = mid + 1;
            }
```
`left = 0`、`right = 3` から始めます。

- `mid = 1`、`3 < 5` なので `right = 1`
- `mid = 0`、`3 < 2` ではないので `left = 1`
- `left == right == 1` で終了

`3` は位置 1 に入ればよいとわかりました。比較は 2 回です。ふつうの挿入ソートなら、後ろから 1 つずつ比べるので 3 回かかります。区間が長くなるほど差は大きくなります。

### 2. 安定性の確保

```java:line-numbers=303
            /*
             * 不変条件はまだ成り立っている: pivot は [lo, left) のすべて以上で、
             * [left, start) のすべてより小さい。だから pivot は left に入る。
             * pivot と等しい要素があれば、left はそれらの直後を指す
             * ことに注意。これがこのソートが安定である理由だ。
```
比較が `< 0` のときだけ `right` を動かすので、`pivot` と等しい要素があれば、その **後ろ** に入ります。等しい要素の元の順番が保たれる（安定ソート）のはこのためです。

### 3. まとめてずらす

```java:line-numbers=310
            int n = start - left;  // 動かす要素の数
            // switch は、default の場合の arraycopy を補う最適化にすぎない
            switch (n) {
                case 2:  a[left + 2] = a[left + 1];
                case 1:  a[left + 1] = a[left];
                         break;
                default: System.arraycopy(a, left, a, left + 1, n);
            }
            a[left] = pivot;
```
`n = start - left = 2` 個（`5, 8`）を 1 つ後ろへずらし、空いた位置 1 に `3` を置いて `[2, 3, 5, 8]` になります。

移動する数が 1 か 2 のときは、`switch` で直接代入しています。`n = 2` なら `case 2` の代入をしてから、`break` がないので `case 1` の代入も続けて行います。3 個以上なら `System.arraycopy` に任せます。

## ここがすごい

- **比較を減らす**: 挿入ソートの比較回数は、区間の長さに比例しますが、二分探索なら対数で済みます。オブジェクトの比較は `compare` メソッドの呼び出しで、数値の比較よりずっと重いので、これが効きます。
- **移動はまとめて**: 要素の移動は、1 個ずつ代入するより `arraycopy` でまとめる方が速く動きます。比較は二分探索で減らし、移動は一括コピーで速くする、という役割分担です。
- **小さい移動の特別扱い**: `arraycopy` は呼び出し自体にコストがあるので、1〜2 個の移動では直接代入の方が速くなります。コメント "Switch is just an optimization for arraycopy in default case" のとおり、意図的な最適化です。fallthrough をわざと使った、珍しくて上手な `switch` の例でもあります。
- **不変条件をコメントで明示**: ループの中で何が成り立っているか（`pivot >= [lo, left) のすべて` など）をコメントに書いているので、二分探索の正しさを読む人が確かめられます。

## まとめ

- 挿入ソートの「位置を探す」部分は、二分探索に置き換えられる。
- 比較が重いときは比較回数を、移動が多いときは一括コピーを意識する。
- `switch` の fallthrough は、意図的に使うなら `@SuppressWarnings` やコメントで明示する。
