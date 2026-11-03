---
title: ソースのバイト位置から、そこにあるトークンの範囲を読む
description: ZLS の tokenIndexToLoc。指定したバイト位置から Zig のトークナイザを動かし、最初に読めたトークンの開始と終了を Loc として返す。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [487, 495]
function: tokenIndexToLoc
difficulty: 2
format: 2
tags: [パース, 文字列処理, 標準ライブラリ]
---

## ひとことで

`tokenIndexToLoc` は、ソース上のバイト位置を受け取って、そこから始まるトークンの範囲を返す関数です。構文木がなくても、位置からトークンを特定できます。エディタのカーソル位置の単語を調べるときなどに使われます。

## コード

```zig:line-numbers=487
pub fn tokenIndexToLoc(text: [:0]const u8, index: usize) Loc {
    var tokenizer: std.zig.Tokenizer = .{
        .buffer = text,
        .index = index,
    };

    const token = tokenizer.next();
    return .{ .start = token.loc.start, .end = token.loc.end };
}
```

## 前提知識

- **トークナイザ（字句解析器）**: ソースの文字列を、トークンの列に分ける部品です。`std.zig.Tokenizer` は、Zig の標準ライブラリにあります。
- **バイト位置（`index`）**: ソースの文字列の中の、バイト単位の位置です。
- **`Loc`**: `start` と `end` の 2 つのバイト位置を持つ、範囲の型です。
- **構造体の初期化（`.{ .buffer = ..., .index = ... }`）**: 名前付きの値を並べて、トークナイザを作る書き方です。
- **`next`**: トークナイザから、次のトークンを 1 つ読む関数です。

## 何をしているか

### 1. 指定の位置からトークナイザを作る

```zig:line-numbers=488
    var tokenizer: std.zig.Tokenizer = .{
        .buffer = text,
        .index = index,
    };
```

`std.zig.Tokenizer` に、ソースの文字列（`buffer`）と、読み始める位置（`index`）を渡します。構文木を作る必要はありません。

### 2. 1 つのトークンを読んで範囲を返す

```zig:line-numbers=493
    const token = tokenizer.next();
    return .{ .start = token.loc.start, .end = token.loc.end };
```

`tokenizer.next()` で、位置から始まる最初のトークンを読みます。そのトークンの `loc.start` と `loc.end` を、`Loc` にして返します。

## ここがすごい

- **構文木なしで使える**: 構文解析が途中でも、位置さえあれば、その場のトークンを特定できます。
- **標準ライブラリの字句解析を使う**: Zig と同じ規則でトークンを分けるので、言語の仕様に合った結果になります。
- **テストが例を示す**: ファイルの `test` は、空の文字列、`foo`、`0, 0` の 3 の位置、` bar ` の空白の後などを確かめています。
- **名前が意図を語る**: `IndexToLoc` と付いているので、バイト位置から範囲を求めることが分かります。

## まとめ

- `tokenIndexToLoc` は、バイト位置から 1 つのトークンを読み、その範囲を返します。
- 構文木は要らず、Zig の字句解析の規則に従います。
- 同じ形の `tokenIndexToSlice` で、文字列も取り出せます。
