---
title: 文字列の先頭が、指定した並びと同じかを長さの確認つきで調べる
description: Zig 標準ライブラリの mem.startsWith。先頭の部分を切り出して eql と比べる。ただし比べる並びが長すぎれば、切り出す前に false を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3149, 3151]
function: startsWith
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`startsWith` は、ある列（文字列やスライス）の先頭が、指定した並びと一致するかを判定する関数です。たとえば、`"Bob"` が `"Bo"` で始まるかどうかを調べられます。

## コード

```zig:line-numbers=3149
pub fn startsWith(comptime T: type, haystack: []const T, needle: []const T) bool {
    return if (needle.len > haystack.len) false else eql(T, haystack[0..needle.len], needle);
}
```

## 前提知識

- **スライス**: 配列の一部分を指す値です。先頭の位置と長さを持っています。
- **`eql`**: 2 つのスライスが同じ要素の並びかを比べる関数です。同じファイルにあります。
- **`haystack` と `needle`**: 「干し草の山から針を探す」という意味の名前で、ここでは、探される側と探す側の列を指します。
- **三項演算の `if`**: `if (...) 値 else 値` の形で、条件に応じた値を 1 つ返す書き方です。
- **範囲外のアクセス**: 配列の外を読むと、Zig では安全チェックで止まります。ここでは、先に長さを確かめて、その事態を防いでいます。

## 何をしているか

### 1. 長さを先に確かめる

```zig:line-numbers=3150
    return if (needle.len > haystack.len) false else eql(T, haystack[0..needle.len], needle);
```

`needle.len > haystack.len` なら、先頭の部分を切り出せないので、`false` を返します。切り出しの前に確かめるのがポイントです。

### 2. 先頭を切り出して比べる

```zig:line-numbers=3150
    return if (needle.len > haystack.len) false else eql(T, haystack[0..needle.len], needle);
```

長さが足りていれば、`haystack[0..needle.len]` で先頭の部分だけを取り出し、`eql` で `needle` と比べます。

## ここがすごい

- **範囲外を読まない**: 長さの比較を先にするので、切り出しが範囲を超える心配がありません。
- **一行で意味が通る**: 条件と比較を 1 つの式にまとめてあり、「長さが足りないなら偽、そうでなければ比べる」という流れがそのまま読めます。
- **型で使い回せる**: `comptime T` で要素の型を受けるので、`u8` の文字列でも、他の型の配列でも使えます。
- **テストが例を示す**: ファイルの `test` は、`"Bob"` と `"Bo"` の例を使って、使い方を示しています。

## まとめ

- `startsWith` は、列の先頭が指定の並びと一致するかを判定します。
- 先に長さを比べ、足りないときは切り出さずに `false` を返します。
- 型を `comptime` で受け取るので、文字列以外の配列にも使えます。
