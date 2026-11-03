---
title: 識別子のトークンから、名前だけの範囲を求める
description: ZLS の identifierTokenToNameLoc。トークンが識別子か組み込み関数の名前かを assert で確かめてから、識別子の名前の範囲（Loc）を求める。宣言の名前の位置を得る部品。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [291, 297]
function: identifierTokenToNameLoc
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, データ構造]
---

## ひとことで

`identifierTokenToNameLoc` は、宣言の名前を表すトークンから、その名前が占めるソース上の範囲を求める関数です。ZLS が、名前の位置を使って定義へ移動するなどの機能で使われます。

## コード

::: code-group

```zig:line-numbers=291 [日本語訳]
pub fn identifierTokenToNameLoc(tree: *const Ast, identifier_token: Ast.TokenIndex) Loc {
    std.debug.assert(switch (tree.tokenTag(identifier_token)) {
        .builtin => true, // Zig のパーサは、識別子が来るはずの場所に .builtin を出すことがある。
        .identifier => true,
        else => false,
    });
    return identifierIndexToLoc(tree.source, tree.tokenStart(identifier_token), .name);
```

```zig:line-numbers=291 [原文]
pub fn identifierTokenToNameLoc(tree: *const Ast, identifier_token: Ast.TokenIndex) Loc {
    std.debug.assert(switch (tree.tokenTag(identifier_token)) {
        .builtin => true, // The Zig parser likes to emit .builtin where a identifier would be expected
        .identifier => true,
        else => false,
    });
    return identifierIndexToLoc(tree.source, tree.tokenStart(identifier_token), .name);
```

:::

## 前提知識

- **識別子のトークン**: 名前を表すトークンです。`Ast.TokenIndex` で指定します。
- **`.builtin` トークン**: `@import` などの組み込み関数の名前を表すトークンです。名前の位置にも現れることがあります。
- **`tree.tokenTag`**: トークンの種類を返す関数です。
- **`identifierIndexToLoc`**: 位置と範囲の種類から、識別子の範囲を求める関数です。`.name` は、名前の部分だけを表す指定です。
- **`std.debug.assert`**: 前提の条件を確かめる関数です。

## 何をしているか

### 1. トークンの種類を確かめる

::: code-group

```zig:line-numbers=292 [日本語訳]
    std.debug.assert(switch (tree.tokenTag(identifier_token)) {
        .builtin => true, // Zig のパーサは、識別子が来るはずの場所に .builtin を出すことがある。
        .identifier => true,
        else => false,
    });
```

```zig:line-numbers=292 [原文]
    std.debug.assert(switch (tree.tokenTag(identifier_token)) {
        .builtin => true, // The Zig parser likes to emit .builtin where a identifier would be expected
        .identifier => true,
        else => false,
    });
```

:::

`tokenTag` で種類を調べ、識別子か組み込み関数の名前なら通します。それ以外のトークンは、`assert` で止まります。

### 2. 名前の範囲を求める

```zig:line-numbers=297
    return identifierIndexToLoc(tree.source, tree.tokenStart(identifier_token), .name);
```

トークンの開始位置を `identifierIndexToLoc` に渡し、名前だけが占める範囲を求めます。`.name` を指定すると、`@` や記号を除いた名前の部分になります。

## ここがすごい

- **前提を型の種類で確かめる**: 間違ったトークンを渡すと、すぐに止まります。位置がずれた結果が、静かに返ることを防ぎます。
- **構文の癖を注釈で示す**: `.builtin` を許す理由が、コメントに書かれています。パーサの実際の振る舞いに合わせています。
- **範囲の計算を再利用**: 位置の変換は `identifierIndexToLoc` に任せ、この関数は前提の確認と呼び出しに集中しています。
- **名前の文字列版と対**: `identifierTokenToNameSlice` は、同じ範囲から文字列を取り出します。

## まとめ

- `identifierTokenToNameLoc` は、識別子トークンの名前の範囲を求めます。
- トークンの種類を確かめ、識別子か組み込みの名前以外は止めます。
- 範囲の計算は `identifierIndexToLoc` に任せます。
