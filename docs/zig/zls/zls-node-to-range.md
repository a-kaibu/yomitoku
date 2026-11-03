---
title: 構文木のノードを、エディタが使う行と文字の範囲に直す
description: ZLS の nodeToRange。ノードのソース上の範囲（Loc）を求めてから、指定のエンコーディングで LSP の Range に変換する。エディタとの橋渡しをする関数。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [545, 547]
function: nodeToRange
difficulty: 2
format: 2
tags: [パース, データ構造, イディオム]
---

## ひとことで

`nodeToRange` は、構文木のノードが占める範囲を、エディタが理解できる形で返す関数です。ノードの開始と終了を、行と文字の組（LSP の `Range`）に変換します。

## コード

```zig:line-numbers=545
pub fn nodeToRange(tree: *const Ast, node: Ast.Node.Index, encoding: Encoding) Range {
    return locToRange(tree.source, nodeToLoc(tree, node), encoding);
}
```

## 前提知識

- **`Range`**: LSP の範囲で、開始と終了の `Position`（行と文字）の組です。
- **`Loc`**: ソースのバイト位置の範囲です。`nodeToLoc` が求めます。
- **エンコーディング**: 文字の数え方です。LSP のクライアントが、どの単位を使うかを決めます。
- **`locToRange`**: バイト範囲を、指定のエンコーディングの `Range` に変換する関数です。同じファイルにあります。
- **`tree.source`**: 構文木が持つ、元のソースの文字列です。

## 何をしているか

### 1. ノードのバイト範囲を求める

```zig:line-numbers=546
    return locToRange(tree.source, nodeToLoc(tree, node), encoding);
```

`nodeToLoc` で、ノードが占めるバイトの範囲を求めます。

### 2. エディタの範囲に直す

```zig:line-numbers=546
    return locToRange(tree.source, nodeToLoc(tree, node), encoding);
```

`locToRange` に、ソースとバイト範囲、エンコーディングを渡します。結果は、行と文字の `Range` になります。

## ここがすごい

- **変換を 1 か所に集める**: バイトの範囲から、エディタの範囲への変換は、`locToRange` が一手に引き受けています。
- **エンコーディングを引数で選ぶ**: 同じ関数で、UTF-8 でも UTF-16 でも、クライアントに合わせた範囲を返せます。
- **構文の情報と表示の情報をつなぐ**: ノードという内部の概念を、エディタが使う範囲へ橋渡しします。
- **`nodeToLoc` の上に積まれる**: 範囲の求め方と、表示の形の変換が分かれています。

## まとめ

- `nodeToRange` は、ノードの範囲を、行と文字の `Range` に直します。
- 変換は `nodeToLoc` と `locToRange` の組合せです。
- エンコーディングを引数で選べるので、クライアントに合わせられます。
