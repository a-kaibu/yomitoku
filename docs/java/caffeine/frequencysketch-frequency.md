---
title: "4 つのカウンタを 1 つのキャッシュ行にまとめて、最小値で推定する"
description: "Caffeine の FrequencySketch.frequency。あるデータの出現回数を、4 段の小さなカウンタ表から推定する。4 つのカウンタを 64 バイトのブロックに収めて、メモリ読み込みを 1 回に抑える工夫。"
language: java
project: Caffeine
repo: https://github.com/ben-manes/caffeine
license: Apache-2.0
copyright: "Copyright 2015 Ben Manes. All Rights Reserved."
commit: "10646b00c14a7837fe16a16a2a7b1f82e5fa3155"
file: caffeine/src/main/java/com/github/benmanes/caffeine/cache/FrequencySketch.java
lines: [124, 143]
function: "FrequencySketch.frequency"
difficulty: 3
format: 2
tags: [キャッシュ, ハッシュ, データ構造]
---

## ひとことで

`FrequencySketch.frequency(e)` は、キャッシュに入るデータ `e` が **これまでどのくらい使われたか** を、小さな表から推定します。答えは実際より多めになることがあっても、少なめになることはありません。

Caffeine は、どのデータを残すかを決めるときに、この推定値を使います。正確な数を大量のメモリに記録するのではなく、4 ビットのカウンタを少しだけ使って、ほぼ正しい値を得るのが狙いです。

## コード

```java:line-numbers=124
  @SuppressWarnings("Varifier")
  public int frequency(Object e) {
    if (isNotInitialized()) {
      return 0;
    }

    @Var int frequency = Integer.MAX_VALUE;
    int blockHash = spread(e.hashCode());
    int counterHash = rehash(blockHash);
    int block = (blockHash >>> blockShift) << 3;
    for (int i = 0; i < 4; i++) {
      int h = counterHash >>> (i << 3);
      int index = (h >>> 1) & 15;
      int offset = h & 1;
      int slot = block + offset + (i << 1);
      int count = (int) ((table[slot] >>> (index << 2)) & 0xfL);
      frequency = Math.min(frequency, count);
    }
    return frequency;
  }
```

## 前提知識

- **カウント・ミン・スケッチ**: 数えたいものを複数の表に別々のハッシュで振り分け、その中の最小の値を答えとする方法です。ハッシュの衝突で増えた分を、最小値で打ち消します。
- **キャッシュ行（キャッシュライン）**: CPU がメモリを読むときにまとめて運ぶ単位です。一般的に 64 バイトです。
- **`long[] table`**: 64 ビットの整数の配列です。1 つの `long` に、4 ビットのカウンタが 16 個入ります。
- **`>>>`（符号なし右シフト）**: 左に 0 を入れて右にずらします。ハッシュ値の上位や下位の一部を取り出すのに使います。
- **`& 15`、`& 1`**: 下位 4 ビット、下位 1 ビットを取り出すマスクです。

## 何をしているか

### 1. ハッシュ値から「ブロック」を決める

```java:line-numbers=131
    int blockHash = spread(e.hashCode());
    int counterHash = rehash(blockHash);
    int block = (blockHash >>> blockShift) << 3;
```

`spread` で混ぜたハッシュ値の上位ビットで、どのブロックを使うかを決めます。`<< 3` は、1 ブロックが 8 個の `long`（64 バイト）ぶんであることを表します。`rehash` は、ブロック内の位置を決めるための、別の乱数のような値を作ります。

### 2. 4 つのカウンタを順に読む

```java:line-numbers=134
    for (int i = 0; i < 4; i++) {
      int h = counterHash >>> (i << 3);
      int index = (h >>> 1) & 15;
      int offset = h & 1;
      int slot = block + offset + (i << 1);
      int count = (int) ((table[slot] >>> (index << 2)) & 0xfL);
```

ループは 4 回回ります。毎回、`counterHash` の別の 8 ビットを取り出して、次のように使います。

- `index`: 16 個の中から 1 つのカウンタを選ぶ位置です。
- `offset`: 2 つの `long` のどちらかを選ぶ位置です。
- `slot`: 同じブロックの中で、どの `long` を読むかを決めます。`i << 1` によって、4 つの行がそれぞれ別の 16 バイトの区間に入ります。

### 3. 読んだ値の最小を返す

```java:line-numbers=139
      int count = (int) ((table[slot] >>> (index << 2)) & 0xfL);
      frequency = Math.min(frequency, count);
    }
    return frequency;
```

`(table[slot] >>> (index << 2)) & 0xf` で、4 ビットのカウンタの値を取り出します。4 つの値のうち、最も小さいものを答えにします。

### 具体的な値で追う

ハッシュで決まったブロックから、4 つのカウンタを読んだとします。それぞれの値が `7`、`3`、`5`、`3` だったとすると、最小は `3` です。どれかの行で衝突が起きていても、衝突していない行の値が残るので、答えは実際の回数に近くなります。

## ここがすごい

- **1 回のメモリ読み込みで済む**: 4 つのカウンタを 1 つのブロック（64 バイト）に入れるので、CPU はほとんどの場合、1 回のメモリ読み込みで必要なデータを揃えられます。あちこちの場所を読むより、はるかに速くなります。
- **最小値は上にずれない**: カウント・ミン・スケッチでは、衝突で値が増えることはあっても減ることはありません。だから最小値は、実際の回数より少なくならず、上に誤差が出るだけです。
- **ハッシュの使い回し**: 1 つのハッシュ値から、ブロックの位置と 4 つのカウンタの位置を全部取り出しています。ハッシュを何度も計算せず、ビットを切り出すだけで済みます。
- **古い情報を薄める仕組み**: 別の場所（`reset`）で、定期的にすべてのカウンタを半分にします。古い人気が薄れ、最近の人気が反映されるように設計されています。

## まとめ

- 出現回数の推定は、複数の小さなカウンタの最小値で行うと、誤差を上にだけ抑えられる。
- 関連するカウンタを 1 つの「キャッシュ行」に寄せると、メモリの読み込みが減る。
- 1 つのハッシュ値からビットを切り出せば、ハッシュの計算を増やさずに複数の位置を決められる。
