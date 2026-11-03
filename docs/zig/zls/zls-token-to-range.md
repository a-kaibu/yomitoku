---
title: トークンのソース上の範囲を、エディタの行と文字の範囲に直す
description: ZLS の tokenToRange。トークンの開始の位置を求め、そこから終了までを advancePosition で進めて、LSP の Range（開始と終了の位置）を作る。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [467, 475]
function: tokenToRange
difficulty: 2
format: 2
tags: [パース, 文字列処理, データ構造]
---

## ひとことで

`tokenToRange` は、トークンのソース上の範囲を、エディタが使う行と文字の範囲（`Range`）に直す関数です。エラーの下線や、選択範囲の表示などに使われます。

## コード

```zig:line-numbers=467
pub fn tokenToRange(tree: *const Ast, token_index: Ast.TokenIndex, encoding: Encoding) Range {
    const start = tokenToPosition(tree, token_index, encoding);
    const loc = tokenToLoc(tree, token_index);

    return .{
        .start = start,
        .end = advancePosition(tree.source, start, loc.start, loc.end, encoding),
    };
}
```

## 前提知識

- **`Range`**: LSP の範囲で、開始と終了の `Position` の組です。
- **`Loc`**: ソースのバイト位置の範囲です。`tokenToLoc` で求めます。
- **`tokenToPosition`**: トークンの開始を、`Position` に直す関数です。同じファイルにあります。
- **`advancePosition`**: ある位置から、文字の列の分だけ進めた位置を求める関数です。改行を数えて、行と文字を更新します。
- **エンコーディング**: 文字の数え方です。両端の位置の計算で同じものを使います。

## 何をしているか

### 1. 開始の位置を求める

```zig:line-numbers=468
    const start = tokenToPosition(tree, token_index, encoding);
    const loc = tokenToLoc(tree, token_index);
```

開始のバイト範囲と、開始の `Position` を求めます。`loc` はトークンの範囲です。

### 2. 終了の位置を進めて求める

```zig:line-numbers=471
    return .{
        .start = start,
        .end = advancePosition(tree.source, start, loc.start, loc.end, encoding),
    };
```

`advancePosition` で、開始の位置から、トークンの長さの分だけ進めた位置を求めます。その値を終了の位置にして、`Range` を返します。

## ここがすごい

- **終了の位置を計算で得る**: 終わりのバイト位置を、開始の位置から進めて求めます。ソースを 2 回読み直す必要がありません。
- **改行を正しく扱う**: トークンが複数行にまたがっても、`advancePosition` が行と文字を正しく更新します。
- **エンコーディングを一貫させる**: 開始と終了の両方に同じ数え方を使うので、範囲がずれません。
- **`tokenToPosition` の上に積む**: 開始の変換を再利用しています。

## まとめ

- `tokenToRange` は、トークンの範囲を、行と文字の `Range` に直します。
- 開始の位置を求め、そこから `advancePosition` で終了の位置を進めます。
- 同じエンコーディングを使うので、範囲が正しく揃います。
