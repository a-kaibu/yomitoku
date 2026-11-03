---
title: 連続する複数のトークンを、ソースの 1 つの文字列として取り出す
description: ZLS の tokensToSlice。最初と最後のトークンの番号を受け取り、その間をすべて含むソースの文字列を返す。範囲の順序を assert で確かめる。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [457, 460]
function: tokensToSlice
difficulty: 2
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`tokensToSlice` は、最初のトークンから最後のトークンまでの、連続したソースの文字列を取り出す関数です。たとえば `std.debug.print` のように、いくつものトークンからなる式の文字列を得られます。

## コード

```zig:line-numbers=457
pub fn tokensToSlice(tree: *const Ast, first_token: Ast.TokenIndex, last_token: Ast.TokenIndex) []const u8 {
    std.debug.assert(first_token <= last_token);
    return locToSlice(tree.source, tokensToLoc(tree, first_token, last_token));
}
```

## 前提知識

- **トークン**: ソースを分けた最小単位です。
- **`tokensToLoc`**: 最初と最後のトークンから、その間の範囲（`Loc`）を求める関数です。同じファイルにあります。
- **`locToSlice`**: 範囲からソースの文字列を切り出す関数です。
- **`std.debug.assert`**: 前提の条件を確かめる関数です。ここでは、最初のトークンの番号が最後以下であることを確かめます。
- **`Ast.TokenIndex`**: トークンの番号の型です。番号は、ソースの前から順に増えていきます。

## 何をしているか

### 1. 順序を確かめる

```zig:line-numbers=458
    std.debug.assert(first_token <= last_token);
```

最初のトークンの番号が、最後のトークンの番号以下であることを確かめます。逆になっていれば、範囲が作れないので止まります。

### 2. 範囲から文字列を切り出す

```zig:line-numbers=459
    return locToSlice(tree.source, tokensToLoc(tree, first_token, last_token));
```

`tokensToLoc` で両端の範囲を求め、`locToSlice` で `tree.source` から切り出します。結果は、元のソースの一部を指すスライスです。

## ここがすごい

- **順序の誤りを早く見つける**: 逆順のトークンを渡すと、`assert` で止まります。誤った範囲の文字列が静かに返ることはありません。
- **コピーを作らない**: 返されるのは元のソースの一部です。複数のトークンでも、新しい文字列の確保は要りません。
- **範囲の計算を再利用**: 両端の範囲の計算は `tokensToLoc` に任せ、この関数は切り出しだけを担当します。
- **単一版と対**: `tokenToSlice` は 1 つのトークン、この関数は連続した複数のトークンを扱います。

## まとめ

- `tokensToSlice` は、連続するトークンの範囲を、ソースの文字列として返します。
- 順序は `assert` で確かめ、逆の順序は止めます。
- 切り出した結果は元のソースを指し、コピーは作りません。
