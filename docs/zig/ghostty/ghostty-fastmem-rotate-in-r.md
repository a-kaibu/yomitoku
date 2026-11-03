---
title: 先頭に新しい値を入れて、末尾の値を押し出す
description: Ghostty の fastmem.rotateInR。スライスの先頭に新しい要素を入れ、残りを 1 つ後ろにずらして、押し出された末尾の要素を返す。固定長のキューに使える。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [70, 75]
function: rotateInR
difficulty: 2
format: 2
tags: [データ構造, 最適化, メモリ管理]
---

## ひとことで

`rotateInR` は、固定の大きさのスライスの先頭に新しい値を入れ、その代わりに末尾の古い値を押し出して返す関数です。最近の値だけを、一定の数だけ残したいときに使えます。

## コード

```zig:line-numbers=70
pub inline fn rotateInR(comptime T: type, items: []T, item: T) T {
    const removed = items[items.len - 1];
    move(T, items[1..items.len], items[0 .. items.len - 1]);
    items[0] = item;
    return removed;
}
```

## 前提知識

- **固定長のスライス**: 大きさが決まっている配列の部分です。要素を追加するたびに、どれかを押し出します。
- **押し出し（evict）**: 新しい値を入れるために、古い値をスライスの外へ出すことです。
- **`rotateIn`**: 同じファイルにある関数で、末尾に新しい値を入れて、先頭の古い値を返します。
- **`move`**: 重なりに対応したコピーで、要素をずらす本体です。
- **先頭と末尾**: この関数では、先頭が新しい値の入口で、末尾が古い値の出口です。

## 何をしているか

### 1. 末尾の値を取っておく

```zig:line-numbers=71
    const removed = items[items.len - 1];
```

末尾の値を `removed` に退避します。この値は、押し出されて後で返されます。

### 2. 残りを 1 つ後ろへずらす

```zig:line-numbers=72
    move(T, items[1..items.len], items[0 .. items.len - 1]);
```

`move` で、先頭から末尾の 1 つ前までを、1 つ後ろへずらします。これで末尾の位置が空きます。

### 3. 先頭に新しい値を入れて返す

```zig:line-numbers=73
    items[0] = item;
    return removed;
```

先頭に `item` を入れ、退避しておいた `removed` を返します。呼び出し側は、押し出された古い値を使えます。

## ここがすごい

- **押し出しを同時に行う**: 追加と取り出しを 1 回の関数呼び出しで済ませられます。
- **固定長で増えない**: 要素の数が変わらないので、確保のための処理が要りません。
- **`rotateIn` と対になる**: 向きの違う `rotateIn` と合わせると、先頭と末尾のどちらからでも押し出せます。
- **注釈の例で動きが分かる**: `0 1 2 3` に `4` を入れると `4 0 1 2` になり、`3` が返る、と説明されています。

## まとめ

- `rotateInR` は、先頭に新しい値を入れて、末尾の古い値を押し出して返します。
- 要素の数は変わらず、確保も不要です。
- `rotateIn` と対で使うと、両方向の押し出しができます。
