---
title: 円形バッファが空かどうかを、満杯の印と先頭・末尾の一致で判定する
description: Ghostty の CircBuf.empty。満杯でなく、先頭と末尾が同じ位置にあるときだけ空と判定する。満杯の状態と空の状態を、同じ位置の値で区別する仕組み。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [193, 195]
function: CircBuf.empty
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング]
---

## ひとことで

`empty` は、円形バッファに要素が 1 つもないかを判定する関数です。空の判定には、満杯の印（`full`）を一緒に見るのがポイントです。

## コード

```zig:line-numbers=193
        pub fn empty(self: Self) bool {
            return !self.full and self.head == self.tail;
        }
```

## 前提知識

- **円形バッファ**: 固定の大きさの配列を、端がつながっているとみなすデータ構造です。
- **head と tail**: 書き込みの位置と、読み出しの位置を表す添字です。
- **満杯と空の区別**: `head` と `tail` が同じ位置にあるとき、空か満杯かが曖昧です。どちらも、位置の差は 0 になるからです。
- **`full` フラグ**: 満杯のときに真になる印です。この曖昧さを解消します。
- **論理積と否定（`!`、`and`）**: 「満杯ではない」かつ「位置が同じ」という 2 つの条件を、両方満たすかで判定します。

## 何をしているか

関数は 1 行で、2 つの条件を調べます。両方が真なら、要素は 1 つもありません。

### 1. 満杯ではないかを確かめる

```zig:line-numbers=194
            return !self.full and self.head == self.tail;
```

`!self.full` は、満杯の印が立っていないことを表します。満杯なら、位置が同じでも要素があります。

### 2. 先頭と末尾が同じ位置かを確かめる

```zig:line-numbers=194
            return !self.full and self.head == self.tail;
```

`self.head == self.tail` は、読み出しと書き込みの位置が一致していることを表します。この 2 つを `and` で結ぶと、空の状態になります。

## ここがすごい

- **曖昧さを印で解く**: 位置が同じでも、満杯かどうかは `full` が教えてくれます。位置だけで判断しないのが、この設計の要です。
- **判定が 1 行**: 2 つの条件の `and` で、空の意味がそのまま書けます。
- **`len` と整合する**: 同じファイルの `len` は、満杯の印を先に見ます。両方の関数が、同じ判定の仕組みを使っています。
- **副作用がない**: `self` を読むだけの関数で、状態を変えません。安心して何度でも呼べます。

## まとめ

- `empty` は、満杯でなく、先頭と末尾が一致するときに空と判定します。
- 位置の一致だけでは空か満杯か分からないので、`full` の印を一緒に見ます。
- 状態を変えない、読むだけの関数です。
