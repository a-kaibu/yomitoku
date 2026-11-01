---
title: "64 ビットずつ飛ばして次の 1 を探す BitSet"
description: "BitSet で指定位置以降の最初の 1 を探す関数。マスクで手前のビットを消し、0 の word は丸ごと飛ばし、見つけた word の中は末尾の 0 を数える命令で一発で位置を出す。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/BitSet.java
lines: [715, 734]
function: "BitSet.nextSetBit"
difficulty: 2
tags: [ビット演算, データ構造, 探索]
---

## ひとことで

`BitSet` は、たくさんの真偽値（ビット）を詰めて持つデータ構造です。`nextSetBit(from)` は、**位置 `from` 以降で最初に 1 になっているビットの位置** を返します。なければ `-1` です。

1 ビットずつ調べるのではなく、**64 ビットのかたまり（word）単位** で進み、かたまりの中の位置は `numberOfTrailingZeros` で一発で求めます。

## コード

```java:line-numbers=715
    public int nextSetBit(int fromIndex) {
        if (fromIndex < 0)
            throw new IndexOutOfBoundsException("fromIndex < 0: " + fromIndex);

        checkInvariants();

        int u = wordIndex(fromIndex);
        if (u >= wordsInUse)
            return -1;

        long word = words[u] & (WORD_MASK << fromIndex);

        while (true) {
            if (word != 0)
                return (u * BITS_PER_WORD) + Long.numberOfTrailingZeros(word);
            if (++u == wordsInUse)
                return -1;
            word = words[u];
        }
    }
```

関連する定数とヘルパーは、同じファイルで次のように定義されています。

```java
private static final int ADDRESS_BITS_PER_WORD = 6;
private static final int BITS_PER_WORD = 1 << ADDRESS_BITS_PER_WORD;
private static final long WORD_MASK = 0xffffffffffffffffL;

private static int wordIndex(int bitIndex) {
    return bitIndex >> ADDRESS_BITS_PER_WORD;
}
```

## 前提知識

- **`long[] words`**: BitSet はビットを `long`（64 ビット）の配列に詰めて持っています。ビット `i` は `words[i / 64]` の、下から `i % 64` 番目です。
- **`wordsInUse`**: 実際に使っている word の数です。それより後ろはすべて 0 とみなせます。
- **`>> 6`**: 右に 6 ビットずらす、つまり 64 で割る計算です（`wordIndex`）。
- **`WORD_MASK << fromIndex`**: 全部 1 の `long` を左にずらします。Java の `long` のシフトは、**シフト量の下位 6 ビット（0〜63）だけを使う** ので、`fromIndex` が 130 でも `130 % 64 = 2` ビットずらしたことになります。
- **`Long.numberOfTrailingZeros(word)`**: 下位から 0 がいくつ続くか、つまり「いちばん下の 1 の位置」を返します。多くの CPU では 1 命令です。
- **`checkInvariants()`**: 内部の約束が守られているかを確かめる、デバッグ用の確認です。

## 何をしているか

`from = 70` で、ビット 75 と 200 が 1 の BitSet を考えます。

### 1. 開始位置の word を求める（721〜723 行目）

`wordIndex(70) = 70 >> 6 = 1` です。使っている word の範囲外なら、もう 1 はないので `-1` を返します。

### 2. 手前のビットを消す（725 行目）

`words[1]` はビット 64〜127 を表しています。そのうち 64〜69 は探す範囲の外なので、消さなければいけません。

`WORD_MASK << 70` は、シフト量が `70 % 64 = 6` になるので、下位 6 ビットが 0、残りが 1 のマスクです。これと AND を取ると、ビット 64〜69 に当たる部分が消えます。

### 3. 0 でない word を探す（727〜733 行目）

- `word` が 0 でなければ、その中にいちばん下の 1 があります。`words[1]` にはビット 75（下から 11 番目）が立っているので、`1 * 64 + 11 = 75` を返します。
- もし 0 なら、次の word へ進みます。0 の word は **64 ビットまとめて一度の比較で飛ばせます**。

## ここがすごい

- **シフト量の丸めを利用**: `fromIndex % 64` を自分で計算せずに、Java の `long` のシフトが量を自動で 0〜63 に丸める性質を使っています。マスクの計算が `WORD_MASK << fromIndex` の 1 式で済みます。
- **0 の word を一気に飛ばす**: まばらな BitSet（1 が少ない）では、ほとんどの word が 0 です。1 ビットずつなら 64 回の比較が、1 回で済みます。
- **word の中は 1 命令**: 見つけた word の中で 1 の位置を探すのも、ループではなく `numberOfTrailingZeros` の 1 回です。結果として、探索の手間は「調べた word の数」だけになります。
- **使い方の定番**: Javadoc にも、`for (int i = bs.nextSetBit(0); i >= 0; i = bs.nextSetBit(i + 1))` で 1 のビットをすべて回るイディオムが載っています。この関数が速いので、このループも速く動きます。

## まとめ

- ビットの集合は `long` の配列に詰めると、64 個を一度に調べられる。
- 「指定位置より手前を消す」は、全部 1 のマスクを左シフトして AND を取ればよい。
- Java のシフトは量を自動で丸める。それを前提にした書き方もできるが、意図をコメントなどで示すとよい。
