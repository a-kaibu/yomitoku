---
title: バイト位置の識別子を、ソースの文字列として取り出す
description: ZLS の identifierIndexToSlice。識別子の位置と範囲（IdentifierIndexRange）から Loc を求め、ソースの文字列を切り出す。カーソル位置の名前を得る部品。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [287, 289]
function: identifierIndexToSlice
difficulty: 1
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`identifierIndexToSlice` は、ソースの中の位置を受け取り、そこにある識別子の名前を文字列で返す関数です。ZLS が、カーソルの下の名前を取り出すときに使われます。

## コード

```zig:line-numbers=287
pub fn identifierIndexToSlice(text: [:0]const u8, source_index: usize, range: IdentifierIndexRange) []const u8 {
    return locToSlice(text, identifierIndexToLoc(text, source_index, range));
}
```

## 前提知識

- **識別子（identifier）**: 変数名や関数名などの名前です。
- **`IdentifierIndexRange`**: 位置からどの識別子の範囲を探すかを指定する型です。
- **`identifierIndexToLoc`**: 位置と範囲から、識別子の範囲（`Loc`）を求める関数です。同じファイルにあります。
- **`locToSlice`**: 範囲を使い、ソースの文字列の一部を切り出す関数です。
- **`[:0]const u8`**: 終端がゼロのソースの文字列の型です。

## 何をしているか

### 1. 位置から識別子の範囲を求める

```zig:line-numbers=288
    return locToSlice(text, identifierIndexToLoc(text, source_index, range));
```

`identifierIndexToLoc` で、位置と範囲から、識別子が占めるバイトの範囲を求めます。

### 2. 範囲から名前を切り出す

```zig:line-numbers=288
    return locToSlice(text, identifierIndexToLoc(text, source_index, range));
```

`locToSlice` で、その範囲を元のソースの文字列から切り出し、名前として返します。

## ここがすごい

- **2 段の変換を 1 行で**: 位置から範囲へ、範囲から文字列へ、の流れを 1 つの式にしています。
- **コピーなし**: 返される名前は、元のソースを指すスライスです。
- **同じ形の関数と並ぶ**: `identifierTokenToNameSlice` は、トークンの番号から同じ結果を得ます。入口が違っても、結果の形は揃っています。
- **範囲の指定を分離**: どの識別子とみなすかの規則は、`IdentifierIndexRange` と `identifierIndexToLoc` にあります。この関数は、組み合わせるだけです。

## まとめ

- `identifierIndexToSlice` は、位置の識別子の名前を、元のソースから切り出します。
- 範囲の求め方は `identifierIndexToLoc` に任せています。
- 返る名前は、元のソースを指すスライスです。
