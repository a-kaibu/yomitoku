---
title: スライスが指定の並びで終わるかを調べる
description: Zig 標準ライブラリの mem.endsWith。検索する並びが長すぎれば false、そうでなければ末尾の同じ長さの部分と比べる。startsWith の対。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3160, 3162]
function: endsWith
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`endsWith` は、スライスが指定した並びで終わるかを調べる関数です。文字列の末尾が `.zig` かどうかを調べる、といった使い方ができます。

文字列を扱うとき、ファイル名の拡張子や、行の末尾の記号を調べる場面が多くあります。そのとき、末尾だけを見て判断できると、元の文字列を切り分けずに済みます。`endsWith` は、そのための基本の道具です。

Zig の標準ライブラリでは、スライスは要素の並びを指す値で、文字列も `u8` のスライスとして扱われます。そのため、文字列の末尾の判定も、他の要素の並びと同じ関数で書けます。

## コード

```zig:line-numbers=3160
pub fn endsWith(comptime T: type, haystack: []const T, needle: []const T) bool {
    return if (needle.len > haystack.len) false else eql(T, haystack[haystack.len - needle.len ..], needle);
}
```

## 前提知識

- **スライス**: 配列の一部を指す、長さつきの参照です。
- **`eql`**: 2 つのスライスが同じ要素を持つかを調べる関数です。
- **`startsWith`**: 先頭が指定の並びかを調べる、対になる関数です。
- **比較の対象の長さ**: `eql` は、長さが違えば比べる前に `false` を返します。そのため、切り出すスライスの長さを揃えることが大切です。

## 何をしているか

### 1. 末尾の同じ長さの部分と比べる

```zig:line-numbers=3161
    return if (needle.len > haystack.len) false else eql(T, haystack[haystack.len - needle.len ..], needle);
```

検索する並びが元より長ければ、必ず `false` です。そうでなければ、元のスライスの末尾から、検索する並びの長さの部分を切り出し、`eql` で比べます。

`endsWith` の処理は、短い並びを一度比べるだけです。元の文字列の末尾から切り出すので、新しいメモリも作りません。

## ここがすごい

- **長さの検査を先に行う**: 長すぎる並びは、比べる前に除外します。範囲外の添字を作りません。
- **`startsWith` と対になる**: 先頭と末尾で、同じ形の関数になっていて読みやすいです。

## まとめ

- `endsWith` は、スライスの末尾が指定の並びと一致するかを調べます。
- 並びが長すぎるときは、比べる前に `false` を返します。
