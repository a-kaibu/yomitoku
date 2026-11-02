---
title: "順に並んだ配列で、次に大きい値を倍々の幅で探す"
description: "RoaringBitmap の Util.advanceUntil。ソート済みの char 配列で、指定した値以上の最初の位置を探す。幅を 1, 2, 4 と倍にして範囲を絞り、最後に二分探索する（ギャロッピング）。"
language: java
project: RoaringBitmap
repo: https://github.com/RoaringBitmap/RoaringBitmap
license: Apache-2.0
copyright: "Copyright 2013-2016 the RoaringBitmap authors"
commit: "1add1bd95854f18346375bff46b3c57b3dfb467a"
file: roaringbitmap/src/main/java/org/roaringbitmap/Util.java
lines: [154, 200]
function: "Util.advanceUntil"
difficulty: 3
format: 2
tags: [アルゴリズム, 探索, 最適化]
---

## ひとことで

`advanceUntil(array, pos, length, min)` は、ソート済みの配列の中で、`pos` より後ろにあり、`min` 以上になる最初の位置を返します。Roaring Bitmap は、整数を上位 16 ビットのキーごとに分けて持ちます。2 つの集合の積（共通部分）を求める `RoaringBitmap.and` では、このキーの配列を飛ばしながら読み進めるときに、この探索を使います。

このメソッドは、値が近くにある場合は速く、遠くにある場合も二分探索の範囲を効率よく狭める、という 2 つの性質を持っています。

## コード

::: code-group

```java:line-numbers=154 [日本語訳]
  public static int advanceUntil(char[] array, int pos, int length, char min) {
    int lower = pos + 1;

    // 順番に並んでいる場合の特別扱い。次の要素ですぐ答えが分かれば、それを返す
    if (lower >= length || (array[lower]) >= (int) (min)) {
      return lower;
    }

    int spansize = 1; // int spansize = 1; // もっと大きい値から始めてもよい
    // 上限を求める。幅を 1 から倍々に広げていく

    while (lower + spansize < length && (array[lower + spansize]) < (int) (min)) {
      spansize *= 2; // spansize *= 2; // コンパイラが、この演算を効率のよい形にしてくれることを期待している
    }
    // 上限の位置を求める（配列の外に出ないように制限する）
    int upper = (lower + spansize < length) ? lower + spansize : length - 1;

    // 運がよければ、すぐに見つかる（次の位置が近く、順番どおりに進むことが多い場合によくある）
    // （次の位置までの距離が小さいと予想される場合）
    // そうでなければ、順番に読むだけの処理が遅く見えてしまうので、この扱いを入れている
    if (array[upper] == min) {
      return upper;
    }

    if ((array[upper]) < (int) (min)) {
      // min 以上の値が配列にない、という意味なので、配列の長さを返す
      return length;
    }

    // 1 つ前の幅では小さすぎたと分かっているので、その半分から範囲を絞る
    lower += (spansize >>> 1);

    // そうでなければ、二分探索で範囲を狭める
    // 不変条件：array[lower] < min かつ array[upper] > min
    while (lower + 1 != upper) {
      int mid = (lower + upper) >>> 1;
      char arraymid = array[mid];
      if (arraymid == min) {
        return mid;
      } else if ((arraymid) < (int) (min)) {
        lower = mid;
      } else {
        upper = mid;
      }
    }
    return upper;
  }
```

```java:line-numbers=154 [原文]
  public static int advanceUntil(char[] array, int pos, int length, char min) {
    int lower = pos + 1;

    // special handling for a possibly common sequential case
    if (lower >= length || (array[lower]) >= (int) (min)) {
      return lower;
    }

    int spansize = 1; // could set larger
    // bootstrap an upper limit

    while (lower + spansize < length && (array[lower + spansize]) < (int) (min)) {
      spansize *= 2; // hoping for compiler will reduce to
    }
    // shift
    int upper = (lower + spansize < length) ? lower + spansize : length - 1;

    // maybe we are lucky (could be common case when the seek ahead
    // expected
    // to be small and sequential will otherwise make us look bad)
    if (array[upper] == min) {
      return upper;
    }

    if ((array[upper]) < (int) (min)) {
      // means array has no item >= min pos = array.length;
      return length;
    }

    // we know that the next-smallest span was too small
    lower += (spansize >>> 1);

    // else begin binary search
    // invariant: array[lower]<min && array[upper]>min
    while (lower + 1 != upper) {
      int mid = (lower + upper) >>> 1;
      char arraymid = array[mid];
      if (arraymid == min) {
        return mid;
      } else if ((arraymid) < (int) (min)) {
        lower = mid;
      } else {
        upper = mid;
      }
    }
    return upper;
  }
```

:::

## 前提知識

- **ソート済みの配列**: 値が小さい順に並んでいる配列です。この条件があるから、二分探索のような方法が使えます。
- **ギャロッピング（galloping）**: 位置を 1, 2, 4, 8 のように倍々に進めて、目的の値を含む範囲を見つける探索です。その後、その範囲の中で二分探索をします。
- **二分探索**: 範囲の中央を調べて、範囲を半分に絞る方法です。
- **`spansize`**: 今の探索の幅です。`spansize *= 2` で、倍々に広がります。
- **不変条件**: 処理のどの時点でも成り立つ条件です。ここでは「`array[lower]` は `min` より小さく、`array[upper]` は `min` より大きい」が、常に成り立っています。

## 何をしているか

### 1. 次の要素で即座に答えが出る場合

```java:line-numbers=157
    // 順番に並んでいる場合の特別扱い。次の要素ですぐ答えが分かれば、それを返す
    if (lower >= length || (array[lower]) >= (int) (min)) {
      return lower;
    }
```

`pos` の次の位置が配列の外、または、その値が `min` 以上なら、そこが答えです。連続して読んでいくような、よくある場合を最初に処理します。

### 2. 幅を倍々に広げて、上限を探す

```java:line-numbers=162
    int spansize = 1; // int spansize = 1; // もっと大きい値から始めてもよい
    // 上限を求める。幅を 1 から倍々に広げていく

    while (lower + spansize < length && (array[lower + spansize]) < (int) (min)) {
      spansize *= 2; // spansize *= 2; // コンパイラが、この演算を効率のよい形にしてくれることを期待している
    }
```

`spansize` を 1 から始めて、`array[lower + spansize]` が `min` より小さい間は、幅を 2 倍にします。これで、答えを含む範囲の上限が、対数的な回数で見つかります。

```java:line-numbers=168
    // 上限の位置を求める（配列の外に出ないように制限する）
    int upper = (lower + spansize < length) ? lower + spansize : length - 1;
```

上限は、配列の範囲を超えないように `length - 1` で止めます。

### 3. 上限と一致したら、そのまま返す

```java:line-numbers=171
    // 運がよければ、すぐに見つかる（次の位置が近く、順番どおりに進むことが多い場合によくある）
    // （次の位置までの距離が小さいと予想される場合）
    // そうでなければ、順番に読むだけの処理が遅く見えてしまうので、この扱いを入れている
    if (array[upper] == min) {
      return upper;
    }

```

上限の値がちょうど `min` なら、そこが答えです。上限の値が `min` より小さい場合は、配列の中に `min` 以上の値がないので、配列の長さを返します。

### 4. 二分探索で、答えの位置を求める

```java:line-numbers=183
    // 1 つ前の幅では小さすぎたと分かっているので、その半分から範囲を絞る
    lower += (spansize >>> 1);

    // そうでなければ、二分探索で範囲を狭める
    // 不変条件：array[lower] < min かつ array[upper] > min
    while (lower + 1 != upper) {
      int mid = (lower + upper) >>> 1;
      char arraymid = array[mid];
      if (arraymid == min) {
        return mid;
      } else if ((arraymid) < (int) (min)) {
        lower = mid;
      } else {
        upper = mid;
      }
    }
    return upper;
```

`lower` は、幅の半分だけ進めた位置から始めます。その後は、`lower + 1 == upper` になるまで、中央の値と `min` を比べて、範囲を半分に絞ります。最後に、`upper` が答えです。

## ここがすごい

- **近くの答えは速い**: 次の要素ですぐ答えが分かる場合は、比較 1 回で終わります。集合どうしを順に読んでいく処理と相性がよいです。
- **遠い答えも対数で探せる**: 幅を倍々にするので、答えが遠くても、上限を見つけるまでの比較回数は、距離の対数に比例します。
- **範囲を絞ってから二分探索**: 倍々の段階で、答えのおおよその範囲が分かるので、二分探索は狭い範囲だけで済みます。
- **不変条件で正しさを保つ**: `array[lower] < min` と `array[upper] > min` が常に成り立つので、ループが終わったとき、`upper` が求める位置だと分かります。

## まとめ

- `advanceUntil` は、ソート済み配列で `min` 以上の最初の位置を探す。
- まず幅を 1, 2, 4 と倍々に広げて上限を見つけ、その後、二分探索で答えを絞る。
- 近い答えは速く、遠い答えも対数的な回数で見つかる。
