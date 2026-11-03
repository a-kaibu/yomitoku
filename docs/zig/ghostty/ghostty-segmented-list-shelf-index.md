---
title: 番号の対数から、要素がどの棚にあるかを一瞬で求める
description: Ghostty の SegmentedList.shelfIndex。棚の大きさが 2 の冪で増えるので、番号に 1 を足したものの 2 を底とする対数が、そのまま棚の番号になる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/segmented_list.zig
lines: [295, 300]
function: SegmentedList.shelfIndex
difficulty: 3
format: 2
tags: [データ構造, 数値計算, アルゴリズム]
---

## ひとことで

`shelfIndex` は、リストの番号 `list_index` が、何番目の棚に入るかを求める関数です。
棚の大きさは 1、2、4、8 … と倍々に増えます。そのため、番号の対数（2 を底とする）から、棚の番号を直接計算できます。

棚を順番にたどって探す必要はありません。

## コード

```zig:line-numbers=295
        fn shelfIndex(list_index: usize) ShelfIndex {
            if (prealloc_item_count == 0) {
                return std.math.log2_int(usize, list_index + 1);
            }
            return std.math.log2_int(usize, list_index + prealloc_item_count) - prealloc_exp - 1;
        }
```
## 前提知識

- **対数（log2）**: 2 を何回掛けるとその数になるかを表します。整数の場合は、切り捨てた値を使います。`log2_int(8)` は `3` です。
- **棚（shelf）**: 大きさが 2 の冪で増える区画です。0 番目の棚は 1 個、1 番目は 2 個、2 番目は 4 個です。
- **`prealloc_item_count`**: 最初から用意してある要素の数です。0 のときと、2 の冪のときで計算の式が違います。
- **`prealloc_exp`**: `prealloc_item_count` の 2 を底とする対数です。前もって決まっている定数だと考えてください。
- **`std.math.log2_int`**: 符号なし整数の対数を、切り捨てて求める標準の関数です。
- **`ShelfIndex`**: 棚の番号を表す型です。

## 何をしているか

### 1. 準備がないとき: 番号 + 1 の対数

```zig:line-numbers=296
            if (prealloc_item_count == 0) {
                return std.math.log2_int(usize, list_index + 1);
            }
```

事前に用意した要素がないときは、`list_index + 1` の対数がそのまま棚の番号です。

たとえば番号 0 は、`0 + 1 = 1` の対数で `0` です。番号 1 と 2 は、`2` と `3` の対数で `1` です。番号 3 から 6 は、`4` から `7` の対数で `2` です。これは、棚が 1、2、4 個と並ぶ形に一致します。

### 2. 準備があるとき: 対数の位置をずらす

```zig:line-numbers=299
            return std.math.log2_int(usize, list_index + prealloc_item_count) - prealloc_exp - 1;
```

事前に用意した数がある場合も、考え方は同じです。`list_index + prealloc_item_count` の対数から、準備分の対数と 1 を引きます。こうすると、最初の動的な棚の番号が 0 から始まります。

### 3. 対数は、先頭の 1 の位置

`log2_int` は、数の中でいちばん上にある 1 のビットの位置を返します。番号に 1 を足したものを 2 進数で見ると、その位置が「どの棚か」を示しています。

## ここがすごい

- **比較の回数がゼロ**: 棚を 1 つずつ数えて、番号が収まる場所を探す方法は、棚が増えるほど遅くなります。対数の計算は、番号の大きさによらず一定の時間で終わります。
- **棚の番号が自然に決まる**: 棚の大きさが 2 の冪なので、番号に 1 を足すと、ちょうど棚の境目で値が変わります。計算式が、棚の作りそのものに対応しています。
- **分岐が少ない**: 準備の有無で式が 2 通りあるだけです。`comptime` の条件なので、使わない側の分岐は、実行時には残りません。
- **前の記事の関数を使う**: 2 を底とする対数は、標準の `log2_int` で求めています。同じビットの位置の考え方が、ここでも使われています。

## まとめ

- 棚の大きさが 2 の冪で増えるとき、番号の対数が棚の番号になります。
- 番号に 1 を足して対数を取ると、棚の境目がちょうど合います。
- 準備分がある場合は、その分の対数をずらして補正します。
- 棚を順番にたどらず、一瞬で棚の番号が求まります。
