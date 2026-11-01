---
title: "ラベル付きの continue で「部分配列」の位置を探す"
description: "Guava の Ints.indexOf。int 配列の中に別の配列が含まれる最初の位置を返す。内側のループを抜けるときにラベル付き continue で外側へ直接進む、Java ならではの書き方を見る。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2008 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/primitives/Ints.java
lines: [185, 202]
function: "Ints.indexOf(int[], int[])"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`Ints.indexOf(array, target)` は、`array` の中に `target` の並びが **最初に現れる位置** を返します。たとえば `array = {1, 2, 3, 2, 3}` に対して `target = {2, 3}` なら、答えは `1` です。見つからなければ `-1` です。

単純な「総当たり」の方法で、外側のループで開始位置を、内側のループで一致を確かめます。この実装の見どころは、**一致しないと分かった瞬間に、外側のループの次の位置へ直接進む** 書き方です。

## コード

```java:line-numbers=185
  public static int indexOf(int[] array, int[] target) {
    checkNotNull(array, "array");
    checkNotNull(target, "target");
    if (target.length == 0) {
      return 0;
    }

    outer:
    for (int i = 0; i < array.length - target.length + 1; i++) {
      for (int j = 0; j < target.length; j++) {
        if (array[i + j] != target[j]) {
          continue outer;
        }
      }
      return i;
    }
    return -1;
  }
```

## 前提知識

- **`int[]`**: 整数の配列です。`array.length` で要素数がわかります。
- **空の配列**: `target.length == 0` のときは、どこにでも空の並びがあるとみなして `0` を返します。
- **ラベル（`outer:`）**: `for` などの前に名前をつけると、`continue outer;` のように外側のループを指定できます。ふつうの `continue` は内側のループだけに効きます。
- **`continue`**: 残りの処理を飛ばして、次の繰り返しに進みます。
- **`array.length - target.length + 1`**: 開始位置の上限です。これを超えると、`target` が配列の終わりからはみ出してしまいます。

## 何をしているか

### 1. 開始位置を順に試す

```java:line-numbers=192
    outer:
    for (int i = 0; i < array.length - target.length + 1; i++) {
```

`i` は、`target` を置く開始位置です。上限を `array.length - target.length + 1` にしておくと、`target` が配列の外にはみ出さないことが保証されます。

### 2. 一文字ずつ比べる

```java:line-numbers=194
      for (int j = 0; j < target.length; j++) {
        if (array[i + j] != target[j]) {
          continue outer;
        }
      }
```

内側のループで、`array[i + j]` と `target[j]` を先頭から比べます。違いが見つかったら、`continue outer;` で **外側のループの次の `i`** に進みます。

ここが重要です。`continue` だけだと、内側のループの次の `j` に進んでしまい、無駄な比較が続きます。ラベル付きの `continue` なら、残りの比較を一度に捨てられます。

### 3. 全部一致したら位置を返す

```java:line-numbers=199
      return i;
```

内側のループを最後まで回ったということは、`target` の全要素が一致したことになります。そのときの `i` が答えです。

### 具体的な値で追う

`array = {1, 2, 3, 2, 3}`、`target = {2, 3}` で進めます。

- `i = 0`: `array[0] = 1` と `target[0] = 2` が違う。`continue outer` で次へ。
- `i = 1`: `array[1] = 2` と `2` が一致、`array[2] = 3` と `3` が一致。内側のループが終わるので `return 1`。

`{2, 3}` は位置 `1` から始まる、という答えになります。

## ここがすごい

- **無駄な比較を捨てる**: 一致しないと分かった開始位置では、残りの比較をやめて、すぐ次の位置へ行きます。ラベル付きの `continue` は、この「途中で諦めて外へ」という動きを 1 語で書けるようにしています。
- **上限の式で範囲外を防ぐ**: `array.length - target.length + 1` という式で、外側のループの範囲を正確に決めています。範囲外を読むことがないので、特別な判定が要りません。
- **空の並びの約束**: `target` が空なら `0` を返します。「空の並びは先頭で必ず見つかる」という一般的な約束に従っています。
- **総当たりの限界**: この方法は、最悪の場合に `array` の長さと `target` の長さの積に比例する時間がかかります。長い文字列を繰り返し探すなら、KMP 法などの別の方法が向いています。この関数は、短い配列を探す用途にふさわしい素直な実装です。
- **`null` の確認**: 最初に `checkNotNull` で `null` を弾いています。エラーを早い段階で、わかりやすい場所で出す設計です。

## まとめ

- 部分配列の探索は、開始位置ごとに一致を確かめる総当たりで書ける。
- ラベル付きの `continue` を使うと、一致しないことが分かった時点で外側の次へ直接進める。
- 範囲の上限を正しく決めれば、範囲外を読まずに済む。
