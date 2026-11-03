---
title: バイト位置から、その位置にあるトークンの文字列を取り出す
description: ZLS の tokenIndexToSlice。tokenIndexToLoc で範囲を求めてから、ソースの文字列の一部を切り出す。構文木を使わずにトークンの文字列を得られる。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [509, 511]
function: tokenIndexToSlice
difficulty: 1
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`tokenIndexToSlice` は、ソースのバイト位置を受け取り、そこから始まるトークンの文字列を返す関数です。位置からトークンを特定し、その文字列まで一度に得られます。

## コード

```zig:line-numbers=509
pub fn tokenIndexToSlice(text: [:0]const u8, index: usize) []const u8 {
    return locToSlice(text, tokenIndexToLoc(text, index));
}
```

## 前提知識

- **バイト位置**: ソースの文字列の中の、バイト単位の位置です。
- **`tokenIndexToLoc`**: バイト位置から、そこにあるトークンの範囲（`Loc`）を求める関数です。同じファイルにあります。
- **`locToSlice`**: 範囲を使って、ソースの文字列から一部を切り出す関数です。
- **スライス**: 配列や文字列の一部を指す値です。元のデータをコピーせずに参照します。
- **`[:0]const u8`**: 終端がゼロの文字列の型です。ソース全体は、この型で渡されます。

## 何をしているか

### 1. 位置からトークンの範囲を求める

```zig:line-numbers=510
    return locToSlice(text, tokenIndexToLoc(text, index));
```

`tokenIndexToLoc` で、バイト位置から始まるトークンの範囲を求めます。

### 2. 範囲から文字列を切り出す

```zig:line-numbers=510
    return locToSlice(text, tokenIndexToLoc(text, index));
```

`locToSlice` で、求めた範囲に当たる部分を、元のソースの文字列から切り出します。

## ここがすごい

- **2 段の変換を 1 行で**: 位置から範囲へ、範囲から文字列へ、という 2 つの変換を連ねています。
- **コピーなし**: 返される文字列は、元のソースを指すスライスです。
- **兄弟の関数と対**: 構文木のノードを扱う `nodeToSlice` と、同じ形の考え方で書かれています。
- **小さく読める**: 2 行なので、どの部品を組み合わせているかが、すぐ分かります。

## まとめ

- `tokenIndexToSlice` は、バイト位置のトークンの文字列を取り出します。
- `tokenIndexToLoc` と `locToSlice` を連ねて、1 つの関数にしています。
- 返される文字列は、元のソースの一部です。
