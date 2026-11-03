---
title: トークンの長さを、クライアントの単位で数える
description: ZLS の tokenLength。トークンの範囲を求め、locLength でエンコーディングに従った長さを返す。UTF-8 のバイト数や UTF-16 の単位数で、トークンの長さを得る。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [477, 480]
function: tokenLength
difficulty: 1
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`tokenLength` は、トークンの長さを、指定のエンコーディングの単位で返す関数です。トークンが占める文字数を、エディタの数え方に合わせて知ることができます。

## コード

```zig:line-numbers=477
pub fn tokenLength(tree: *const Ast, token_index: Ast.TokenIndex, encoding: Encoding) usize {
    const loc = tokenToLoc(tree, token_index);
    return locLength(tree.source, loc, encoding);
}
```

## 前提知識

- **トークンの範囲**: `tokenToLoc` が求める、ソースの中のバイト範囲です。
- **`locLength`**: 範囲の長さを、指定の単位で数える関数です。同じファイルにあります。
- **エンコーディング**: 長さの単位です。UTF-8 のバイト数か、UTF-16 の単位数などがあります。
- **`tree.source`**: 構文木が持つ、元のソースの文字列です。
- **`usize`**: 長さを表す、符号なしの整数の型です。

## 何をしているか

### 1. トークンの範囲を求める

```zig:line-numbers=478
    const loc = tokenToLoc(tree, token_index);
```

`tokenToLoc` で、トークンが占めるバイト範囲を求めます。

### 2. 指定の単位で長さを数える

```zig:line-numbers=479
    return locLength(tree.source, loc, encoding);
```

`locLength` に、ソースと範囲、エンコーディングを渡します。結果は、クライアントの数え方に合った長さです。

## ここがすごい

- **単位を呼び出し側が選ぶ**: 同じ関数で、UTF-8 でも UTF-16 でも、クライアントに合わせた長さを返せます。
- **範囲と長さの分離**: トークンの範囲を求める関数と、単位で数える関数を組み合わせています。
- **短い関数**: 2 行で、トークンの長さという概念が読み取れます。
- **位置の変換と整合**: `tokenToRange` と同じ単位を使うので、長さと範囲が矛盾しません。

## まとめ

- `tokenLength` は、トークンの長さを、指定の単位で返します。
- トークンの範囲を求め、`locLength` で数えます。
- 範囲を返す `tokenToRange` と、同じ単位で揃っています。
