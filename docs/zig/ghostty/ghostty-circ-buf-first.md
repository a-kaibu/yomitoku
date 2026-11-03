---
title: 円形バッファの一番古い値を、順方向の反復子で取り出す
description: Ghostty の CircBuf.first。順方向の反復子を作って、最初に読める値を返す。中身が空なら null を返す。最新の値を取る last と対になる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [125, 130]
function: CircBuf.first
difficulty: 1
format: 2
tags: [データ構造, イディオム, 防御的プログラミング]
---

## ひとことで

`first` は、円形バッファの中で一番古い値を返す関数です。値が一つもなければ `null` を返します。古いデータから順に処理したいときに使われます。

## コード

::: code-group

```zig:line-numbers=125 [日本語訳]
        pub fn first(self: Self) ?*T {
            // 反復子を使わなければ、これより速くできる。
            // 反復子は、実装が簡単だったから使っている。
            var it = self.iterator(.forward);
            return it.next();
        }
```

```zig:line-numbers=125 [原文]
        pub fn first(self: Self) ?*T {
            // Note: this can be more efficient by not using the
            // iterator, but this was an easy way to implement it.
            var it = self.iterator(.forward);
            return it.next();
        }
```

:::

## 前提知識

- **一番古い値**: バッファに入っている値のうち、最も前に書かれたものです。円形バッファでは、読み出しの位置（`tail`）の先頭にあたります。
- **`?*T`**: 値へのポインタか `null` を表す型です。空かもしれないので、`null` を返せます。
- **反復子**: 同じファイルの `iterator` が作る、要素を順に読むための値です。
- **順方向（`.forward`）**: 古い順に読む向きです。
- **`last`**: 同じファイルの関数で、一番新しい値を返します。

## 何をしているか

### 1. 順方向の反復子を作る

```zig:line-numbers=128
            var it = self.iterator(.forward);
```

`self.iterator(.forward)` で、古い順に読む反復子を作ります。

### 2. 最初の要素を返す

```zig:line-numbers=129
            return it.next();
```

`it.next()` を呼ぶと、最初の要素（一番古い値）が返ります。空なら `null` になります。

## ここがすごい

- **反復子を再利用**: 専用の探索の処理を書かずに、既に作った反復子に任せています。
- **空を型で表す**: `?*T` の `null` で、空の状態を値の中で表せます。呼び出し側が、確かめずに使うことはできません。
- **書き方が短い**: 2 行で、一番古い値を取り出せます。
- **注釈が実装の理由を語る**: コメントには、もっと速くできるが、反復子を使うのが簡単だったと書かれています。

## まとめ

- `first` は、順方向の反復子を使って、一番古い値を返します。
- 空なら `null` を返すので、呼び出し側は空の場合を扱えます。
- 反対向きの `last` と対になっています。
