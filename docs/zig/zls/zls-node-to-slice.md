---
title: 構文木のノードに対応する、ソースの文字列を取り出す
description: ZLS の nodeToSlice。ノードの範囲を nodeToLoc で求めて、ソースの文字列の一部として返す。式や宣言の元の書き方を、そのまま取り出せる。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [541, 543]
function: nodeToSlice
difficulty: 1
format: 2
tags: [パース, 文字列処理, データ構造]
---

## ひとことで

`nodeToSlice` は、構文木のノードに対応するソースの文字列を返す関数です。たとえば、関数の宣言や式の、元の書き方をそのまま取り出せます。ZLS が、シンボルの名前や型の表示を作るときに使われます。

## コード

```zig:line-numbers=541
pub fn nodeToSlice(tree: *const Ast, node: Ast.Node.Index) []const u8 {
    return locToSlice(tree.source, nodeToLoc(tree, node));
}
```

## 前提知識

- **ノード（`Ast.Node.Index`）**: 構文木の中の 1 つの要素を指す番号です。式、宣言、関数などがあります。
- **`nodeToLoc`**: ノードの範囲（`Loc`）を求める関数です。同じファイルにあります。
- **`locToSlice`**: 範囲を使って、ソースの文字列から一部を切り出す関数です。
- **`tree.source`**: 構文木が持っている、元のソースの文字列です。
- **スライス**: 文字列の一部を指す値です。コピーを作りません。

## 何をしているか

### 1. ノードの範囲を求める

```zig:line-numbers=542
    return locToSlice(tree.source, nodeToLoc(tree, node));
```

`nodeToLoc` で、ノードが占めるソースの範囲を求めます。

### 2. 元のソースから切り出す

```zig:line-numbers=542
    return locToSlice(tree.source, nodeToLoc(tree, node));
```

求めた範囲を使い、`tree.source` から該当の文字列を切り出します。

## ここがすごい

- **元の書き方をそのまま得る**: 整形された文字列ではなく、ソースに書かれた通りの文字列が返ります。コメントの扱いなども元のままです。
- **範囲の計算を任せる**: 両端の求め方は `nodeToLoc` に任せ、この関数は切り出しだけを行います。
- **コピーなし**: 返されるのは元のソースの一部です。大きな構文木でも、メモリを増やしません。
- **兄弟の関数がある**: `tokenToSlice`、`tokensToSlice` と同じ形で、ノード版として揃えられています。

## まとめ

- `nodeToSlice` は、ノードの範囲を求めて、元のソースの文字列を返します。
- 返る文字列は、書かれた通りの元の書き方です。
- トークン版の関数と同じ形で、構文の塊に対応しています。
