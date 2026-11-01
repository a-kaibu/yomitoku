---
title: "小さい方の子と比べて沈めるヒープの「ふるい落とし」"
description: "優先度付きキューから最小値を取り出したあと、穴を埋めた要素を正しい位置まで下へ沈める関数。葉の手前で止まるループ条件と、小さい方の子を選ぶ工夫が見どころ。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2003, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/PriorityQueue.java
lines: [709, 726]
function: "PriorityQueue.siftDownComparable"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`PriorityQueue` から最小値（根）を取り出すと、根が空きます。そこで、配列の最後の要素を根に持ってきて、**正しい位置まで下へ沈めます**。これをするのが `siftDownComparable` です。

各段で「2 人の子のうち小さい方」と比べ、子の方が小さければ子を上げて自分は下がります。ループ条件 `k < half` で、葉（子を持たないノード）に着いたら自然に止まるようになっています。

## コード

::: code-group

```java:line-numbers=709 [日本語訳]
    private static <T> void siftDownComparable(int k, T x, Object[] es, int n) {
        // assert n > 0;（n は 0 より大きいはず）
        Comparable<? super T> key = (Comparable<? super T>)x;
        int half = n >>> 1;           // 葉でない間ループする
        while (k < half) {
            int child = (k << 1) + 1; // 左の子がいちばん小さいと仮定する
            Object c = es[child];
            int right = child + 1;
            if (right < n &&
                ((Comparable<? super T>) c).compareTo((T) es[right]) > 0)
                c = es[child = right];
            if (key.compareTo((T) c) <= 0)
                break;
            es[k] = c;
            k = child;
        }
        es[k] = key;
    }
```

```java:line-numbers=709 [原文]
    private static <T> void siftDownComparable(int k, T x, Object[] es, int n) {
        // assert n > 0;
        Comparable<? super T> key = (Comparable<? super T>)x;
        int half = n >>> 1;           // loop while a non-leaf
        while (k < half) {
            int child = (k << 1) + 1; // assume left child is least
            Object c = es[child];
            int right = child + 1;
            if (right < n &&
                ((Comparable<? super T>) c).compareTo((T) es[right]) > 0)
                c = es[child = right];
            if (key.compareTo((T) c) <= 0)
                break;
            es[k] = c;
            k = child;
        }
        es[k] = key;
    }
```

:::

## 前提知識

- **二分ヒープ**: 親が子以下という規則を持つ木を配列で表したものです。位置 `k` の子は `2k + 1`（左）と `2k + 2`（右）です。
- **`n`**: ヒープの要素数です。
- **`n >>> 1`**: `n / 2` です。配列の後ろ半分のノードはすべて葉（子を持たない）になります。
- **`Comparable` と `compareTo`**: `a.compareTo(b)` は `a < b` なら負、等しければ 0、`a > b` なら正を返します。
- **`c = es[child = right]`**: 代入式の値を使う書き方です。`child` を `right` に更新しつつ、その位置の要素を `c` に入れています。
- **`(k << 1) + 1`**: `2k + 1` です。

## 何をしているか

最小値の `1` を取り出したヒープを考えます。最後の要素 `9` を根に置いて沈めます。残りは `[_, 3, 2, 7, 4, 5]`（`n = 6`）です。

```
       9
     /   \
    3     2
   / \   /
  7   4 5
```

### 1. ループの範囲

```java:line-numbers=712
        int half = n >>> 1;           // 葉でない間ループする
        while (k < half) {
```
`half = 3` です。位置 0〜2 は子を持ち、3〜5 は葉です。`k < half` の間だけ進みます。

### 2. 小さい方の子を選ぶ

```java:line-numbers=714
            int child = (k << 1) + 1; // 左の子がいちばん小さいと仮定する
            Object c = es[child];
            int right = child + 1;
            if (right < n &&
                ((Comparable<? super T>) c).compareTo((T) es[right]) > 0)
                c = es[child = right];
```
- `k = 0`: 左の子 `3`（位置 1）、右の子 `2`（位置 2）。`3 > 2` なので右を選び、`c = 2`、`child = 2`。
- `9 <= 2` ではないので、`2` を位置 0 に上げ、`k = 2`。
- `k = 2`: 左の子は位置 5 の `5`。右の子（位置 6）は `n` の外なので比べません。`9 <= 5` ではないので、`5` を位置 2 に上げ、`k = 5`。
- `k = 5` は `half` 以上なので終了。

### 3. 最後に書く

```java:line-numbers=725
        es[k] = key;
```
位置 5 に `9` を書き込んで完成です。

```
       2
     /   \
    3     5
   / \   /
  7   4 9
```

## ここがすごい

- **小さい方の子と比べる理由**: 親になる要素は、両方の子以下でなければいけません。小さい方の子を上げれば、もう一方の子より必ず小さいので、規則が保たれます。
- **`k < half` という終了条件**: 「子がいるか」を毎回 `2k + 1 < n` で調べる代わりに、あらかじめ `n / 2` を計算しておき、それと比べるだけにしています。左の子があることが保証されるので、右の子だけを `right < n` で確認すればよくなります。
- **入れ替えずに穴を動かす**: 子を上に上げて、最後に 1 回だけ沈める要素を書きます。入れ替えを繰り返すより書き込みが少なくなります。
- **コメントが意図を語る**: `// loop while a non-leaf`、`// assume left child is least` という短いコメントが、各行の狙いを説明しています。

## まとめ

- ヒープから最小値を取り出したら、最後の要素を根に置いて「小さい方の子」と比べながら沈める。
- 配列の前半 `n / 2` 個だけが子を持つ。ループ条件をそれに合わせると判定が減る。
- 要素の移動は「穴を動かして最後に書く」と書き込みが少なくて済む。
