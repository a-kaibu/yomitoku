---
title: 最初と最後のトークンから、その間をすべて含む範囲を求める
description: ZLS の tokensToLoc。開始トークンの先頭位置と、終了トークンの末尾位置を取り、その間の複数のトークンを含む範囲（Loc）を返す。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [391, 393]
function: tokensToLoc
difficulty: 1
format: 2
tags: [パース, データ構造, 防御的プログラミング]
---

## ひとことで

`tokensToLoc` は、最初のトークンから最後のトークンまでの、複数のトークンにまたがる範囲を求める関数です。たとえば、関数の引数の列全体のような、いくつものトークンからなる範囲を一度に表せます。

## コード

```zig:line-numbers=391
pub fn tokensToLoc(tree: *const Ast, first_token: Ast.TokenIndex, last_token: Ast.TokenIndex) Loc {
    return .{ .start = tree.tokenStart(first_token), .end = tokenToLoc(tree, last_token).end };
}
```

## 前提知識

- **トークン**: Zig のソースを分けた最小単位です。キーワード、識別子、記号などがあります。
- **`Ast`**: Zig の構文木です。トークンの列を、文法に従って組み立てたものです。`Ast.TokenIndex` は、トークンの通し番号の型です。
- **`tree.tokenStart`**: トークンの開始位置（バイトの番号）を返す関数です。
- **`tokenToLoc`**: 1 つのトークンの範囲（`Loc`）を返す関数です。同じファイルにあります。
- **`Loc`**: `start` と `end` を持つ、ソースのバイトの範囲です。

## 何をしているか

### 1. 開始位置は最初のトークンの先頭

```zig:line-numbers=392
    return .{ .start = tree.tokenStart(first_token), .end = tokenToLoc(tree, last_token).end };
```

`tree.tokenStart(first_token)` で、最初のトークンの開始位置を `start` にします。

### 2. 終了位置は最後のトークンの末尾

```zig:line-numbers=392
    return .{ .start = tree.tokenStart(first_token), .end = tokenToLoc(tree, last_token).end };
```

`tokenToLoc(tree, last_token).end` で、最後のトークンの終了位置を `end` にします。開始と終了を別々に取り、両方を 1 つの `Loc` にまとめています。

## ここがすごい

- **端だけを見る**: 間にあるトークンを 1 つずつ読まずに、両端の位置だけで範囲を作れます。
- **既存の関数を組み合わせる**: 開始は `tokenStart`、終了は `tokenToLoc` と、役割の違う関数を使い分けています。
- **空白や注釈を含む**: 2 つのトークンの間にある空白や注釈も、範囲に含まれます。ソースをそのまま切り出せる範囲になります。
- **小さな部品**: `tokenToSlice` や `tokensToSlice` などの高い層の関数が、この関数の上に組み立てられています。

## まとめ

- `tokensToLoc` は、最初と最後のトークンの両端から、その間の範囲を作ります。
- 開始は最初のトークンの先頭、終了は最後のトークンの末尾です。
- 複数トークンの範囲を扱う、土台の関数です。
