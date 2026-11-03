---
title: "色の 3 成分を、2 桁ずつの 16 進数で rgb:xx/xx/xx の形に書く"
description: "Ghostty の RGB.encodeRgb8。赤、緑、青の各 8 ビットの値を、0 埋めの 2 桁の 16 進数にして、rgb:ff/80/00 の形で書き出す。端末の色の応答に使う。"
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [624, 629]
function: RGB.encodeRgb8
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, イディオム]
---

## ひとことで

`encodeRgb8` は、色の 3 成分を、端末が読める `rgb:` の形式で書き出す関数です。端末に色を問い合わせられたときの返事を作るために使われます。8 ビットの精度で書きます。

## コード

```zig:line-numbers=624
    pub fn encodeRgb8(self: RGB, writer: *std.Io.Writer) !void {
        try writer.print(
            "rgb:{x:0>2}/{x:0>2}/{x:0>2}",
            .{ self.r, self.g, self.b },
        );
    }
```

## 前提知識

- **8 ビットの色**: 各成分が 0 から 255 の値です。`RGB` 型では `u8` で持っています。
- **`rgb:` の形式**: 端末の色の表し方の 1 つです。`rgb:RR/GG/BB` のように、16 進数の成分を `/` で区切って書きます。
- **`writer.print`**: 書式付きの文字列を、書き込み先に出す関数です。
- **書式 `{x:0>2}`**: 値を 16 進数で書き、足りない桁を `0` で埋めて、2 桁にする指定です。
- **`!void`**: 書き込みの失敗をエラーとして返す型です。

## 何をしているか

### 1. 書式を作る

```zig:line-numbers=625
        try writer.print(
            "rgb:{x:0>2}/{x:0>2}/{x:0>2}",
```

`rgb:` の後に、2 桁の 16 進数を 3 つ、`/` で区切って並べる書式です。

### 2. 3 成分を渡す

```zig:line-numbers=627
            .{ self.r, self.g, self.b },
        );
```

`.{ self.r, self.g, self.b }` の 3 つの値を、書式の順番に渡して書き出します。失敗すれば、`try` でエラーを返します。

## ここがすごい

- **書式が仕様そのもの**: `rgb:xx/xx/xx` の形が、書式の文字列に直接書かれています。
- **0 埋めで桁がそろう**: 値が小さくても、必ず 2 桁で書かれるので、端末の読み取りが安定します。
- **16 ビット版と対**: 同じ `RGB` 型の `encodeRgb16` は、4 桁で書きます。精度に応じて使い分けます。
- **書き込み先を選ばない**: `*std.Io.Writer` を受け取るので、どこへ書くかを呼び出し側が決められます。

## まとめ

- `encodeRgb8` は、3 成分を 2 桁の 16 進数にして、`rgb:` の形式で書きます。
- 書式の文字列が、端末の仕様を直接表しています。
- 精度の高い版は、`encodeRgb16` が担当します。
