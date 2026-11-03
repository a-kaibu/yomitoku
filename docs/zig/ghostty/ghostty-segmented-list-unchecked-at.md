---
title: 増えても要素の場所を動かさない配列で、番号から棚と箱を求める
description: Ghostty の SegmentedList.uncheckedAt。要素を 2 の冪の大きさの「棚」に分けて持ち、番号から棚と棚の中の位置を計算して要素のポインタを返す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/segmented_list.zig
lines: [272, 279]
function: SegmentedList.uncheckedAt
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, アルゴリズム]
---

## ひとことで

`uncheckedAt` は、リストの `index` 番目の要素へのポインタを返す関数です。
この連想リストは、要素を 1 つの大きな配列に入れず、大きさが 2 倍ずつ増える **棚（shelf）** に分けて持ちます。そのため、要素が増えても、古い要素を別の場所へ移す必要がありません。

番号から「どの棚の、何番目の箱か」を計算するのが、この関数の仕事です。

## コード

```zig:line-numbers=272
        pub fn uncheckedAt(self: anytype, index: usize) AtType(@TypeOf(self)) {
            if (index < prealloc_item_count) {
                return &self.prealloc_segment[index];
            }
            const shelf_index = shelfIndex(index);
            const box_index = boxIndex(index, shelf_index);
            return &self.dynamic_segments[shelf_index][box_index];
        }
```
## 前提知識

- **ポインタ（参照）**: 要素の場所を指す値です。`&` で作ります。ポインタが指す先の要素は、リストが大きくなっても動かないので、ずっと同じ場所で使えます。
- **`ArrayList`（伸びる配列）**: 要素が増えると、より大きな配列を確保して、中身を全部コピーし直すのが普通です。そのため、古いポインタは無効になります。
- **棚（shelf）**: この実装で、要素を入れておく区画です。棚の大きさは、1、2、4、8 … と 2 の冪で増えます。
- **`prealloc_item_count`**: 最初から用意しておく要素の数です。0 か、2 の冪の値です。
- **`anytype`**: どの型の `self` でも受け付ける書き方です。`*Self` にも `*const Self` にも対応できます。
- **`uncheckedAt`**: 範囲を調べずに要素を返す関数です。範囲の確認は、呼び出し側の `at` が行います。

## 何をしているか

### 1. 先頭の数個は、専用の場所から返す

```zig:line-numbers=273
            if (index < prealloc_item_count) {
                return &self.prealloc_segment[index];
            }
```

最初から用意してある分（`prealloc_item_count` 個）は、専用の配列から直接返します。数が少ないリストなら、棚を作らずに済むので便利です。

### 2. 番号から棚の番号を求める

```zig:line-numbers=276
            const shelf_index = shelfIndex(index);
```

`shelfIndex` で、この番号がどの棚にあるかを求めます。番号が大きくなるほど、棚の番号も大きくなります。計算は対数（2 を何回掛けると、その数になるか）から求めます。

### 3. 棚の中の位置を求める

```zig:line-numbers=277
            const box_index = boxIndex(index, shelf_index);
```

`boxIndex` で、棚の中の何番目かを求めます。棚の先頭の番号を引いた残りが、棚の中の位置です。

### 4. 棚から要素のポインタを返す

```zig:line-numbers=278
            return &self.dynamic_segments[shelf_index][box_index];
```

`dynamic_segments` は、棚のリストです。その棚の中の箱を選んで、ポインタを返します。ポインタが指す先は、棚に固定された場所なので、後から動きません。

## ここがすごい

- **要素を動かさない**: 伸びる配列は、大きくなるたびに全要素をコピーします。この方法では、新しい棚を追加するだけで、古い要素はそのままの場所に残ります。古いポインタも一生有効です。
- **棚の大きさが倍々**: 棚は 2 の冪で大きくなるので、全体の要素数が増えても、棚の数は対数のぶんしか増えません。
- **計算は足し算とシフトだけ**: 棚の番号は対数、棚の中の位置は引き算で求まります。ループで探す必要がありません。
- **先頭だけの近道**: 小さなリストは、最初から用意した場所で済みます。棚を用意する手間もメモリも不要です。
- **ソースに設計の図がある**: この関数の周りのコメントには、棚と番号の対応表が描かれています。読む人は、その図を見ながら計算を追えます。

## まとめ

- 要素を棚に分けて持つと、伸ばしても要素の場所が動きません。
- 番号から、棚の番号と棚の中の位置を計算で求めます。
- 最初の数個は専用の場所から直接返すと、小さなリストが軽くなります。
- 古いポインタを保ったまま要素を増やしたいときに向いた設計です。
