---
title: 末尾の要素を先頭へ送って、スライス全体を 1 つ後ろへずらす
description: Ghostty の fastmem.rotateOnceR。末尾の要素を一時変数に取り、残りを move で 1 つ後ろへずらして、取った要素を先頭に置く。rotateOnce の逆の操作。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/fastmem.zig
lines: [45, 49]
function: rotateOnceR
difficulty: 2
format: 2
tags: [最適化, アルゴリズム, メモリ管理]
---

## ひとことで

`rotateOnceR` は、スライスの末尾の要素を先頭へ移し、残りの要素を 1 つずつ後ろにずらす関数です。`rotateOnce` の逆向きの操作にあたります。

## コード

```zig:line-numbers=45
pub inline fn rotateOnceR(comptime T: type, items: []T) void {
    const tmp = items[items.len - 1];
    move(T, items[1..items.len], items[0 .. items.len - 1]);
    items[0] = tmp;
}
```

## 前提知識

- **回転（rotate）**: 要素を循環させる操作です。末尾から押し出された要素が、先頭に戻ってきます。
- **`rotateOnce`**: 同じファイルにある、逆向きの関数です。先頭を末尾へ送ります。
- **`move`**: 重なりに対応したコピーです。ずらす操作の本体になっています。
- **一時変数**: 移す 1 つの要素を、いったん退避しておくための変数です。
- **添字の範囲**: `items[0 .. items.len - 1]` のように、末尾を除いた部分を切り出す書き方です。

## 何をしているか

### 1. 末尾の要素を退避する

```zig:line-numbers=46
    const tmp = items[items.len - 1];
```

末尾の要素を `tmp` に取っておきます。後で先頭に置くための値です。

### 2. 残りを 1 つ後ろへずらす

```zig:line-numbers=47
    move(T, items[1..items.len], items[0 .. items.len - 1]);
```

`move` で、先頭から末尾の 1 つ前までを、1 つ後ろの位置へずらします。重なる領域なので、`move` を使います。

### 3. 先頭に退避した値を置く

```zig:line-numbers=48
    items[0] = tmp;
```

ずらして空いた先頭に、`tmp` の値を入れます。これで、末尾の要素が先頭に移りました。

## ここがすごい

- **移動が 1 回で済む**: 3 回の `reverse` を使う方法より、データの読み書きが少なくて済みます。
- **対で使える**: `rotateOnce` と組にすると、回転の向きを行き来できます。
- **追加の領域が要らない**: 退避は 1 要素分だけです。
- **例が注釈にある**: 注釈の `0 1 2 3` → `3 0 1 2` の例を見ると、動きがすぐに分かります。

## まとめ

- `rotateOnceR` は、末尾を先頭へ送って、残りを 1 つ後ろにずらします。
- 退避した 1 要素と、`move` による 1 回の移動で済みます。
- `rotateOnce` の逆の操作です。
