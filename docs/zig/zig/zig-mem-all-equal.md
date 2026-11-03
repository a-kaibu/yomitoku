---
title: スライスの全要素が、同じ 1 つの値かを一度に確かめる
description: Zig 標準ライブラリの mem.allEqual。スライスの要素を先頭から順に、指定した値と比べて、1 つでも違えば false を返す。空のスライスは true になる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1206, 1211]
function: allEqual
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`allEqual` は、スライスのすべての要素が、指定した一つの値と等しいかを判定する関数です。たとえば、バッファが全部 0 で埋まっているかを確かめるときなどに使えます。

## コード

```zig:line-numbers=1206
pub fn allEqual(comptime T: type, slice: []const T, scalar: T) bool {
    for (slice) |item| {
        if (item != scalar) return false;
    }
    return true;
}
```

## 前提知識

- **スライス**: 配列の一部を指す値です。要素の数を持っています。
- **全称の判定**: 「すべての要素が条件を満たす」を確かめる判定です。1 つでも満たさなければ偽になります。
- **`for` ループの要素取り出し**: `for (slice) |item|` で、要素を一つずつ `item` に入れて回せます。
- **`!=`**: 等しくないことを調べる演算子です。
- **空の列**: 要素が 1 つもないとき、「すべての要素が条件を満たす」は真になります。この関数もそうなっています。

## 何をしているか

### 1. 要素を一つずつ比べる

```zig:line-numbers=1207
    for (slice) |item| {
        if (item != scalar) return false;
    }
```

要素を先頭から順に取り出して、`scalar` と比べます。違う要素が一つでも見つかれば、その時点で `false` を返します。

### 2. 最後まで同じなら真を返す

```zig:line-numbers=1210
    return true;
```

ループが最後まで終わったら、すべての要素が同じ値だったので、`true` を返します。空のスライスも、ここで `true` になります。

## ここがすごい

- **途中で打ち切る**: 違う要素が見つかった時点で止まるので、無駄な比較がありません。
- **空の場合も自然に扱う**: ループが一度も回らないので、空の列は真になります。特別な分岐は要りません。
- **型が汎用**: `comptime T` で要素の型を受けるので、バイト列にも数値の列にも使えます。
- **1 行の意図**: `item != scalar` が、関数の意味そのものです。読み手がすぐ理解できます。

## まとめ

- `allEqual` は、スライスの全要素が指定の値と同じかを判定します。
- 違う要素が見つかれば、そこで `false` を返します。
- 空のスライスは `true` になります。
