---
title: 辞書順の比較を、先頭から 1 要素ずつ見る
description: 2 つのスライスを辞書順（五十音順のように、先頭から比べる順番）で比べる mem.order。同じ場所を指していれば、中身を見ずに答えを出す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [649, 661]
function: order
difficulty: 2
format: 2
tags: [アルゴリズム, 標準ライブラリ, ジェネリクス]
---

## ひとことで

`order` は、2 つのスライスを **辞書順**（先頭の要素から順に比べて、最初に違ったほうで大小を決める並べ方）で比べ、`.lt`、`.eq`、`.gt` のどれかを返す関数です。
たとえば `"abc"` と `"abd"` は、3 文字目で違うので `"abc"` のほうが小さいと判定されます。

ジェネリック（`comptime T`）なので、`u8` の文字列でも、`i32` の配列でも同じ関数で比べられます。

## コード

```zig:line-numbers=649
pub fn order(comptime T: type, lhs: []const T, rhs: []const T) math.Order {
    if (lhs.ptr != rhs.ptr) {
        const n = @min(lhs.len, rhs.len);
        for (lhs[0..n], rhs[0..n]) |lhs_elem, rhs_elem| {
            switch (math.order(lhs_elem, rhs_elem)) {
                .eq => continue,
                .lt => return .lt,
                .gt => return .gt,
            }
        }
    }
    return math.order(lhs.len, rhs.len);
}
```
## 前提知識

- **スライス（`[]const T`）**: 配列の一部を指す「先頭の位置と長さ」の組みです。`lhs.len` で長さを取り出せます。
- **`comptime T: type`**: 型を引数として受け取る書き方です。`order(u8, ...)` のように型を指定して使います。
- **`math.Order`**: 大小関係を表す列挙型です。`.lt`（小さい）、`.eq`（等しい）、`.gt`（大きい）の 3 つがあります。
- **`switch`**: 値ごとに処理を分ける文です。ここでは 3 つの場合を網羅しています。
- **`continue` と `return`**: `continue` は繰り返しの次へ進む文、`return` は関数の結果を返して終わる文です。
- **`@min`**: 2 つの値の小さいほうを返す組み込み関数です。

## 何をしているか

### 1. 同じメモリなら、比較の必要がない

```zig:line-numbers=650
    if (lhs.ptr != rhs.ptr) {
```

2 つのスライスが同じメモリを指しているなら、要素をいちいち比べなくても、中身は同じです。その場合は、このブロックを飛ばして、長さの比較だけに進みます。

### 2. 短いほうの長さまで、1 つずつ比べる

```zig:line-numbers=651
        const n = @min(lhs.len, rhs.len);
        for (lhs[0..n], rhs[0..n]) |lhs_elem, rhs_elem| {
            switch (math.order(lhs_elem, rhs_elem)) {
                .eq => continue,
                .lt => return .lt,
                .gt => return .gt,
            }
        }
```

`n` は 2 つの長さのうち短いほうです。その範囲で、先頭から要素を 1 組ずつ取り出して比べます。

`math.order` は、2 つの要素の大小を `Order` で返します。`.eq`（等しい）なら次の要素へ進みます。`.lt` または `.gt` が出た時点で、その結果をすぐに返します。ここが辞書順の肝で、最初に違う要素が出た時点で勝負が決まります。

### 3. 全部同じなら、長さで決める

```zig:line-numbers=660
    return math.order(lhs.len, rhs.len);
```

短いほうの範囲がすべて等しかった場合は、長さの比較で決めます。たとえば `"abc"` と `"abc0"` は、先頭 3 文字が同じなので、長いほうの `"abc0"` が大きいと判定されます。

`lessThan` も、この `order` の結果が `.lt` かどうかを返すだけの関数です。

## ここがすごい

- **早い段階で打ち切る**: 最初に違う要素が見つかった時点で `return` します。残りの要素は見ません。並べ替えで何度も比べる場面では、この打ち切りが効きます。
- **同じ場所なら一瞬**: `lhs.ptr != rhs.ptr` の確認は、同じ配列どうしを比べる場合の近道です。
- **1 つの関数を型で使い回す**: `comptime T` によって、`u8` の文字列も、数値の配列も、同じ書き方で比べられます。
- **長さの違いを最後に扱う**: 接頭辞だけが同じ場合（`"abc"` と `"abcd"`）でも、長さで必ず順番が決まります。結果が一意に決まるので、ソートの基準としてそのまま使えます。

## まとめ

- 辞書順は、先頭から最初に違う要素で大小を決める比べ方です。
- 最初に違う要素が出たら、残りを見ずに結果を返すのが効率的です。
- 先頭が同じなら長さで決めます。
- `comptime T` で型を受け取ると、同じ関数を文字列にも数値の配列にも使えます。
