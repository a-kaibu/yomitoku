---
title: 配列を動かさずに「先頭を捨てて末尾に足す」を 1 回の移動で行う
description: Ghostty の fastmem.rotateIn。固定長の配列に新しい値を入れ、先頭の値を押し出す。一時的な配列を作らず、memmove 1 回で済ませる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [57, 62]
function: rotateIn
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 最適化]
---

## ひとことで

`rotateIn` は、配列の末尾に新しい値を 1 つ入れ、先頭の値を取り出して返す関数です。たとえば `0 1 2 3` の配列に `4` を入れると、配列は `1 2 3 4` になり、`0` が返ります。
配列の長さは変わらず、古い値が押し出される、という動きです。

Ghostty では、キャッシュやバッファなど、大きさが決まった列を先入れ先出しで使う場面で使われています。

## コード

```zig:line-numbers=57
pub inline fn rotateIn(comptime T: type, items: []T, item: T) T {
    const removed = items[0];
    move(T, items[0 .. items.len - 1], items[1..items.len]);
    items[items.len - 1] = item;
    return removed;
}
```
```zig:line-numbers=6
pub inline fn move(comptime T: type, dest: []T, source: []const T) void {
    if (builtin.link_libc) {
        _ = memmove(dest.ptr, source.ptr, source.len * @sizeOf(T));
    } else {
        @memmove(dest, source);
    }
}
```
## 前提知識

- **`items: []T`**: 値を書き換えられる配列（スライス）です。`items.len` で長さを取り出せます。
- **`items[items.len - 1]`**: 配列の最後の要素です。長さから 1 を引いて添字にします。
- **`items[1..items.len]`**: 先頭の 1 つを除いた残りの部分のスライスです。
- **`inline fn`（`pub inline fn`）**: 呼び出しの場所に、関数の中身をそのまま展開する指定です。
- **`@memmove`**: 重なっているメモリの範囲を、安全に移動する組み込み関数です。コピー元とコピー先が重なっても、正しく動きます。
- **`builtin.link_libc`**: C 言語のライブラリを使ってビルドしているかどうかを表す定数です。
- **先入れ先出し（FIFO）**: 最初に入れたものから順番に取り出す使い方です。キューと同じ考え方です。

## 何をしているか

### 1. 先頭の値を、先に覚えておく

```zig:line-numbers=58
    const removed = items[0];
```

先頭の値を一時的に `removed` に保存します。このあと配列を詰めるので、この値は配列の中から消えてしまいます。戻り値として返すために、先に取っておきます。

### 2. 残りを 1 つ前にずらす

```zig:line-numbers=59
    move(T, items[0 .. items.len - 1], items[1..items.len]);
```

`items[1..]` の範囲を、`items[0..len-1]` の位置へ動かします。たとえば `0 1 2 3` は、この操作で `1 2 3 3` になります。最後の要素は、まだ古い値のままです。

ここで使う `move` は、ずれた範囲が重なっていても、`@memmove` で正しく動かします。

### 3. 末尾に新しい値を入れる

```zig:line-numbers=60
    items[items.len - 1] = item;
    return removed;
```

ずらしたあとの末尾に新しい値 `item` を書き込みます。最後に、先ほど保存しておいた `removed` を返します。`0 1 2 3` に `4` を入れると、配列は `1 2 3 4` になり、返す値は `0` です。

### 4. move の中身を確かめる

```zig:line-numbers=6
pub inline fn move(comptime T: type, dest: []T, source: []const T) void {
    if (builtin.link_libc) {
        _ = memmove(dest.ptr, source.ptr, source.len * @sizeOf(T));
    } else {
        @memmove(dest, source);
    }
}
```

`move` は、libc が使えるなら C の `memmove` を、使えないなら Zig の `@memmove` を呼びます。どちらも、1 回の呼び出しで範囲をまとめて移動します。

## ここがすごい

- **1 回の移動で済む**: 1 つずつ代入して詰める方法より、`memmove` で範囲をまとめて動かすほうが速いです。コメントにも、一般の移動より効率がよいと書かれています。
- **一時的な配列が要らない**: 押し出す値は `removed` という 1 つの変数に入れるだけです。配列を作り直さないので、メモリの確保もありません。
- **`std.mem.rotate` より速い**: 同じファイルの説明によると、標準の回転関数を 3 回の反転で行うより、この方法はずっと効率的です。
- **対になる関数**: 同じファイルに `rotateInR`（末尾から取り出して先頭に入れる）もあり、双方向に使えます。

## まとめ

- `rotateIn` は、固定長の配列で、先頭を押し出して末尾に新しい値を入れます。
- 押し出す値を先に保存してから、残りを 1 つ前へ動かします。
- 移動には `memmove` を使い、範囲をまとめて動かすので速いです。
- 配列の長さは変わらず、メモリの確保も要りません。
