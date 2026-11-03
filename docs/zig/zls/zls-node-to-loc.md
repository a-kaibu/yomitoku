---
title: 構文木のノードが占める、ソース上の範囲を求める
description: ZLS の nodeToLoc。ノードの最初のトークンと最後のトークンを取り、tokensToLoc で範囲に直す。構文の塊がソースのどこにあるかを表す。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [537, 539]
function: nodeToLoc
difficulty: 2
format: 2
tags: [パース, データ構造, 防御的プログラミング]
---

## ひとことで

`nodeToLoc` は、構文木のノード（式や宣言などの構文の塊）が、ソースのどの範囲を占めているかを求める関数です。ZLS が、カーソルの位置がどの構文の中にあるかを調べるときなどに使われます。

## コード

```zig:line-numbers=537
pub fn nodeToLoc(tree: *const Ast, node: Ast.Node.Index) Loc {
    return tokensToLoc(tree, tree.firstToken(node), ast.lastToken(tree, node));
}
```

## 前提知識

- **構文木（AST）**: ソースの構文を、木の形で表したものです。関数、式、宣言などが、それぞれノードになります。
- **ノード（`Ast.Node.Index`）**: 構文木の中の 1 つの要素を指す番号です。
- **最初と最後のトークン**: ノードがソースで占めるトークンの、先頭と末尾です。`tree.firstToken` と `ast.lastToken` で求められます。
- **`tokensToLoc`**: 最初と最後のトークンから、範囲（`Loc`）を作る関数です。
- **`Loc`**: ソースのバイトの範囲です。

## 何をしているか

### 1. 最初と最後のトークンを求める

```zig:line-numbers=538
    return tokensToLoc(tree, tree.firstToken(node), ast.lastToken(tree, node));
```

`tree.firstToken(node)` で最初のトークンを、`ast.lastToken(tree, node)` で最後のトークンを求めます。

### 2. 範囲に直す

```zig:line-numbers=538
    return tokensToLoc(tree, tree.firstToken(node), ast.lastToken(tree, node));
```

2 つのトークンを `tokensToLoc` に渡して、ソースの範囲にします。ノードの中身を読まずに、両端の情報だけで範囲が決まります。

## ここがすごい

- **構文の情報だけで範囲が決まる**: 空白や注釈の位置を気にせず、ノードの両端のトークンから範囲が決まります。
- **再利用の層が重なる**: `nodeToLoc` は `tokensToLoc` の上に作られています。`nodeToSlice` や `nodeToRange` も、同じ範囲を使います。
- **構文木の性質を使う**: 木の各ノードは、必ず連続したトークンの範囲を占めます。その性質があるから、両端だけで範囲が表せます。
- **名前で意図が分かる**: `nodeToLoc` と呼ぶだけで、ノードから範囲を求める関数だと分かります。

## まとめ

- `nodeToLoc` は、構文木のノードが占める範囲を求めます。
- ノードの最初と最後のトークンを、`tokensToLoc` で範囲にします。
- 構文木のノードは連続したトークンを占めるので、両端だけで範囲が決まります。
