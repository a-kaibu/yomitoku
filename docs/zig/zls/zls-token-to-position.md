---
title: トークンの開始位置を、エディタの行と文字の位置に直す
description: ZLS の tokenToPosition。トークンの開始のバイト位置を求め、指定のエンコーディングで LSP の Position（行と文字）に変換する。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [462, 465]
function: tokenToPosition
difficulty: 1
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`tokenToPosition` は、トークンの開始位置を、エディタが使う行と文字の組（`Position`）で返す関数です。ZLS が、診断の位置や、定義へのジャンプの位置を伝えるときに使われます。

## コード

```zig:line-numbers=462
pub fn tokenToPosition(tree: *const Ast, token_index: Ast.TokenIndex, encoding: Encoding) Position {
    const start = tree.tokenStart(token_index);
    return indexToPosition(tree.source, start, encoding);
}
```

## 前提知識

- **`Position`**: LSP の位置で、行の番号と、行の中の文字の番号の組です。
- **バイト位置**: ソースの文字列の中の、バイト単位の位置です。
- **エンコーディング**: 文字の数え方です。UTF-8 のバイト数や、UTF-16 の単位数があります。
- **`tree.tokenStart`**: トークンの開始のバイト位置を返す関数です。
- **`indexToPosition`**: バイト位置を、指定のエンコーディングの `Position` に変換する関数です。

## 何をしているか

### 1. トークンの開始位置を求める

```zig:line-numbers=463
    const start = tree.tokenStart(token_index);
```

`tree.tokenStart(token_index)` で、トークンが始まるバイト位置を求めます。

### 2. 行と文字の位置に変換する

```zig:line-numbers=464
    return indexToPosition(tree.source, start, encoding);
```

`indexToPosition` で、そのバイト位置を、エンコーディングに従った `Position` に変えます。

## ここがすごい

- **変換が 2 段で明快**: トークンの位置を求めることと、表示の形に直すことが、別の関数に分かれています。
- **エンコーディングを引数に**: クライアントが使う文字の数え方に、そのまま合わせられます。
- **範囲版と対**: 同じファイルの `tokenToRange` は、開始と終了の両方を求めます。
- **構文木の情報だけで済む**: 位置はトークンの開始から決まるので、テキストの読み直しが要りません。

## まとめ

- `tokenToPosition` は、トークンの開始を、行と文字の `Position` に直します。
- トークンの開始位置を求めてから、エンコーディングに従って変換します。
- 範囲を返す `tokenToRange` と対で使えます。
