---
title: 円形バッファの一番新しい値を、逆方向の反復子で取り出す
description: Ghostty の CircBuf.last。逆方向の反復子を作って、最後に書かれた値を返す。中身が空なら null を返す。古い値を取る first と対になる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [133, 138]
function: CircBuf.last
difficulty: 1
format: 2
tags: [データ構造, イディオム, 防御的プログラミング]
---

## ひとことで

`last` は、円形バッファの中で一番新しい値を返す関数です。値が一つもなければ `null` を返します。直近に書いたデータを読みたいときに使われます。

## コード

::: code-group

```zig:line-numbers=133 [日本語訳]
        pub fn last(self: Self) ?*T {
            // 反復子を使わなければ、これより速くできる。
            // 反復子は、実装が簡単だったから使っている。
            var it = self.iterator(.reverse);
            return it.next();
        }
```

```zig:line-numbers=133 [原文]
        pub fn last(self: Self) ?*T {
            // Note: this can be more efficient by not using the
            // iterator, but this was an easy way to implement it.
            var it = self.iterator(.reverse);
            return it.next();
        }
```

:::

## 前提知識

- **一番新しい値**: バッファに最後に書かれた値です。円形バッファでは、書き込みの位置（`head`）の直前にあたります。
- **`?*T`**: 値へのポインタか `null` を表す型です。空の場合は `null` を返します。
- **逆方向（`.reverse`）**: 新しい順に読む向きです。最後の要素から、先頭に戻るように進みます。
- **反復子**: 要素を一つずつ取り出すための値です。`next` で次の要素を返します。
- **`first`**: 同じファイルにある、古い方の値を返す関数です。

## 何をしているか

### 1. 逆方向の反復子を作る

```zig:line-numbers=136
            var it = self.iterator(.reverse);
```

`self.iterator(.reverse)` で、新しい順に読む反復子を作ります。`first` と違う向きを指定するだけで、同じ仕組みを使えます。

### 2. 最初に読めた値を返す

```zig:line-numbers=137
            return it.next();
```

逆方向で最初に読める値は、最後に書かれた値です。`next` で取り出して返します。空なら `null` です。

## ここがすごい

- **向きを変えるだけ**: `first` と `last` は、反復子の向きだけが違います。同じ仕組みを 2 つの用途に使っています。
- **空を値で表す**: `null` が返るので、空かどうかを、別の関数で確かめる必要がありません。
- **短い実装**: 4 行で、直近の値を取り出せます。
- **注釈の正直さ**: 反復子を使わない方が速いが、これが簡単な実装だと、注釈に書かれています。

## まとめ

- `last` は、逆方向の反復子を使って、一番新しい値を返します。
- 空なら `null` を返します。
- `first` と組にして、両端の値を取り出せます。
