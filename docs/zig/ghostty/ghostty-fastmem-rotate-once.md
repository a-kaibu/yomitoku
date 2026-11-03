---
title: 先頭の 1 つを末尾へ送って、スライス全体を 1 つずらす
description: Ghostty の fastmem.rotateOnce。先頭の要素を一時変数に取り、残りを move で 1 つ前へずらして、取った要素を末尾に置く。3 回の reverse より速い。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [31, 35]
function: rotateOnce
difficulty: 2
format: 2
tags: [最適化, アルゴリズム, メモリ管理]
---

## ひとことで

`rotateOnce` は、スライスの先頭の要素を末尾へ移し、残りの要素を 1 つずつ前にずらす関数です。Ghostty では、直近のデータを列の末尾に追加しながら、古いものを先頭から捨てる、といった操作で使われます。

## コード

```zig:line-numbers=31
pub inline fn rotateOnce(comptime T: type, items: []T) void {
    const tmp = items[0];
    move(T, items[0 .. items.len - 1], items[1..items.len]);
    items[items.len - 1] = tmp;
}
```

## 前提知識

- **スライス**: 配列の一部分を指す値です。要素の数（`len`）を持っています。
- **回転（rotate）**: 要素を循環させる操作です。先頭から押し出された要素が、末尾に戻ってきます。
- **`move`**: 同じファイルにある、重なりに強いコピー関数です。
- **一時変数（`tmp`）**: 途中で値を一時的に保管しておく変数です。
- **`std.mem.rotate` との違い**: 標準の `rotate` は 3 回の `reverse` で作りますが、この関数は、1 要素だけを一時変数に退避して、移動を 1 回で済ませます。

## 何をしているか

### 1. 先頭の要素を退避する

```zig:line-numbers=32
    const tmp = items[0];
```

先頭の要素を `tmp` に取っておきます。後で末尾に置くための値です。

### 2. 残りを 1 つ前へずらす

```zig:line-numbers=33
    move(T, items[0 .. items.len - 1], items[1..items.len]);
```

`move` で、先頭の次から末尾までを、1 つ前の位置へずらします。残りの要素が前へ詰まる形になります。重なる領域のコピーなので、`move` を使います。

### 3. 末尾に退避した値を置く

```zig:line-numbers=34
    items[items.len - 1] = tmp;
```

ずらして空いた末尾の位置に、退避しておいた `tmp` を入れます。これで、先頭の要素が末尾に移りました。

## ここがすごい

- **移動が 1 回で済む**: 3 回の `reverse` と比べて、データを読んで書く回数が減ります。コードの注釈でも、この違いが述べられています。
- **一時変数は 1 つだけ**: 必要なのは 1 要素分の退避だけです。追加の配列を用意しません。
- **`move` を再利用**: 重なるコピーの処理を、`move` に任せています。移動の仕組みが 1 か所にまとまっています。
- **逆の操作がある**: 同じファイルの `rotateOnceR` は、末尾を先頭へ送ります。対で使うと、位置を戻せます。

## まとめ

- `rotateOnce` は、先頭を末尾へ移して、残りを 1 つずつ前へずらします。
- 退避した 1 要素と、`move` による 1 回の移動で済みます。
- 逆向きの `rotateOnceR` と対になっています。
