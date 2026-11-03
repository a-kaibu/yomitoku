---
title: 識別子のトークンから、その名前の文字列を取り出す
description: ZLS の identifierTokenToNameSlice。識別子のトークンの名前の範囲（Loc）を求め、ソースの文字列として切り出す。宣言名を表示するときに使う。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [300, 302]
function: identifierTokenToNameSlice
difficulty: 1
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`identifierTokenToNameSlice` は、識別子のトークンを受け取り、その名前の文字列をソースから取り出す関数です。ZLS が、宣言されている変数名や関数名を表示するときに使われます。

## コード

```zig:line-numbers=300
pub fn identifierTokenToNameSlice(tree: *const Ast, identifier_token: Ast.TokenIndex) []const u8 {
    return locToSlice(tree.source, identifierTokenToNameLoc(tree, identifier_token));
}
```

## 前提知識

- **識別子のトークン**: 変数名や関数名などの、名前を表すトークンです。`Ast.TokenIndex` で指定します。
- **名前の範囲**: 識別子のトークンの中で、名前だけが占める範囲です。`@` で始まる名前のように、トークンの書き方が違う場合でも、名前の部分だけを取り出せます。
- **`identifierTokenToNameLoc`**: トークンから名前の範囲（`Loc`）を求める関数です。同じファイルにあります。
- **`locToSlice`**: 範囲からソースの文字列を切り出す関数です。
- **`tree.source`**: 構文木が持つ、元のソースの文字列です。

## 何をしているか

### 1. トークンから名前の範囲を求める

```zig:line-numbers=301
    return locToSlice(tree.source, identifierTokenToNameLoc(tree, identifier_token));
```

`identifierTokenToNameLoc` で、識別子トークンの中の名前の範囲を求めます。

### 2. ソースから名前を切り出す

```zig:line-numbers=301
    return locToSlice(tree.source, identifierTokenToNameLoc(tree, identifier_token));
```

求めた範囲を使い、`tree.source` から名前の文字列を切り出して返します。

## ここがすごい

- **名前の範囲を正しく切る**: トークンの全体ではなく、名前の部分だけを取り出します。余計な記号が混ざりません。
- **コピーなし**: 返される名前は、元のソースを指すスライスです。
- **`identifierTokenToNameLoc` と対**: 範囲の求め方は、その関数に任せています。この関数は、切り出しだけを担当します。
- **位置から名前を得る関数と対応**: `identifierIndexToSlice` は、バイト位置から同じ種類の名前を取り出します。入口が違っても、結果の形は揃っています。

## まとめ

- `identifierTokenToNameSlice` は、識別子トークンの名前を、ソースの文字列として返します。
- 名前の範囲は、専用の関数で求めます。
- 返る名前は、元のソースの一部です。
