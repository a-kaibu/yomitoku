---
title: トークンの番号から、そのトークンのソースの文字列を取り出す
description: ZLS の tokenToSlice。トークンの範囲（Loc）を求めて、ソース全体からその部分を切り出す。コードを文字列として読むための基本の関数。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [453, 455]
function: tokenToSlice
difficulty: 1
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`tokenToSlice` は、トークンの番号を受け取って、そのトークンのソースの文字列を返す関数です。たとえば、識別子 `main` の文字列 `"main"` を取り出せます。ZLS が、名前を調べるときに使う基本の部品です。

## コード

```zig:line-numbers=453
pub fn tokenToSlice(tree: *const Ast, token_index: Ast.TokenIndex) []const u8 {
    return locToSlice(tree.source, tokenToLoc(tree, token_index));
}
```

## 前提知識

- **トークンの番号（`Ast.TokenIndex`）**: 構文木の中で、トークンに付けられた通し番号です。
- **`Loc`**: ソースのバイトの範囲です。開始と終了のバイト位置を持ちます。
- **`tokenToLoc`**: トークンの番号から、その範囲を求める関数です。
- **`locToSlice`**: ソースの文字列と範囲から、その部分の文字列（スライス）を切り出す関数です。
- **`tree.source`**: 構文木が持っている、元のソースの文字列です。

## 何をしているか

### 1. トークンの範囲を求める

```zig:line-numbers=454
    return locToSlice(tree.source, tokenToLoc(tree, token_index));
```

`tokenToLoc` で、トークンの開始と終了のバイト位置を求めます。

### 2. 元のソースから切り出す

```zig:line-numbers=454
    return locToSlice(tree.source, tokenToLoc(tree, token_index));
```

求めた範囲を `locToSlice` に渡し、`tree.source` から該当の部分を切り出します。切り出した結果は、元のソースを指すスライスです。新しい文字列は作りません。

## ここがすごい

- **コピーを作らない**: 返されるのは、ソースの一部を指すスライスです。メモリを確保せずに、名前や記号を読めます。
- **範囲の計算を隠す**: 呼び出し側は、トークンの番号だけを渡せます。バイト位置の扱いは、この関数の中に閉じています。
- **兄弟の関数がある**: `tokensToSlice` は、複数のトークンにまたがる文字列を、同じ形で切り出します。
- **土台として再利用される**: `identifierIndexToSlice` など、他の関数もこの仕組みを組み合わせています。

## まとめ

- `tokenToSlice` は、トークンの範囲を求めて、元のソースから文字列を切り出します。
- 結果は元のソースを指すスライスで、コピーは作りません。
- 複数トークン版の `tokensToSlice` と対になっています。
