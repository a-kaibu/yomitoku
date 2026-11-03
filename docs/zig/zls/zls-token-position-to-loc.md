---
title: LSP の行と文字の位置から、そこにあるトークンの範囲を求める
description: ZLS の tokenPositionToLoc。エディタの位置（行と文字）をバイト位置に直してから、tokenIndexToLoc でその位置のトークンの範囲を読む。LSP の位置と Zig の範囲をつなぐ関数。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [504, 506]
function: tokenPositionToLoc
difficulty: 1
format: 2
tags: [パース, 防御的プログラミング, イディオム]
---

## ひとことで

`tokenPositionToLoc` は、エディタが伝えてくる行と文字の位置から、そこにあるトークンの範囲を求める関数です。LSP の位置は行と文字で表されるので、まずバイト位置に直す必要があります。

## コード

```zig:line-numbers=504
pub fn tokenPositionToLoc(text: [:0]const u8, position: Position, encoding: Encoding) Loc {
    const index = positionToIndex(text, position, encoding);
    return tokenIndexToLoc(text, index);
```

## 前提知識

- **LSP の位置（`Position`）**: 行の番号と、行の中の文字の番号の組です。文字の単位は、エンコーディングによって変わります。
- **バイト位置**: ソースの文字列の中の、バイト単位の位置です。`tokenIndexToLoc` はバイト位置を受け取ります。
- **エンコーディング**: 文字の数え方です。UTF-8 のバイト数や、UTF-16 の単位数などがあります。
- **`positionToIndex`**: 同じファイルの関数で、行と文字の位置をバイト位置に変えます。
- **`tokenIndexToLoc`**: バイト位置から、そこにあるトークンの範囲を読む関数です。

## 何をしているか

### 1. 位置をバイト位置に直す

```zig:line-numbers=505
    const index = positionToIndex(text, position, encoding);
```

`positionToIndex` で、行と文字の位置を、テキスト上のバイト位置に変換します。この変換で、エンコーディングの違いが吸収されます。

### 2. バイト位置からトークンを読む

```zig:line-numbers=506
    return tokenIndexToLoc(text, index);
```

求めたバイト位置を `tokenIndexToLoc` に渡し、その位置から始まるトークンの範囲を返します。

## ここがすごい

- **2 段の変換を連ねる**: エディタの位置から、バイトの位置へ、そしてトークンの範囲へ、という流れを 2 行で書いています。
- **エンコーディングを隠す**: 呼び出し側は、文字の数え方の違いを気にしません。
- **構文木が要らない**: トークンの範囲は、テキストとバイト位置だけで求まります。構文解析が途中でも使えます。
- **部品の組合せ**: `positionToIndex` と `tokenIndexToLoc` は、それぞれ 1 つの仕事だけをしています。

## まとめ

- `tokenPositionToLoc` は、行と文字の位置から、トークンの範囲を求めます。
- まず位置をバイト位置に直し、次にトークンの範囲を読みます。
- エンコーディングの違いは、変換の段階で吸収されます。
