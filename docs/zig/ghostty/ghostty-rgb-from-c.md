---
title: C 言語の構造体の色を、Zig の RGB 型に詰め替える
description: Ghostty の RGB.fromC。C の API が使う色の構造体の赤、緑、青の値を、Zig の RGB 型へ詰め替える。両者の型が違っても、値はそのまま渡る。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [608, 610]
function: RGB.fromC
difficulty: 1
format: 2
tags: [イディオム, 型システム, 標準ライブラリ]
---

## ひとことで

`fromC` は、C の言語で書かれたライブラリとやりとりするための変換関数です。C の側の色の構造体を受け取り、Zig の `RGB` 型の値に詰め替えます。Ghostty は、外部の API と色をやりとりするときに、この形の変換を使います。

## コード

```zig:line-numbers=608
    pub fn fromC(c: C) RGB {
        return .{ .r = c.r, .g = c.g, .b = c.b };
    }
```

## 前提知識

- **C の構造体**: C 言語の `struct` です。Zig から C の API を呼ぶとき、この形の値が使われます。
- **型の違い**: C の側と Zig の側で、同じ意味の構造体でも、別の型として扱われます。そのため、変換が必要になります。
- **構造体のリテラル（`.{ .r = ..., .g = ..., .b = ... }`）**: 名前付きの値を並べて、構造体を作る書き方です。
- **`C`**: `RGB` 型の中で、C の側の構造体を指す名前です。
- **`cval`**: 同じ型の反対方向の変換を行う関数です。

## 何をしているか

### 1. 3 つの成分を取り出して詰める

```zig:line-numbers=609
        return .{ .r = c.r, .g = c.g, .b = c.b };
```

`c.r`、`c.g`、`c.b` の 3 つの値を、同じ名前の `RGB` のフィールドに入れます。成分の値は、そのままの数値として渡ります。

## ここがすごい

- **変換が 1 行**: 成分の名前が同じなので、そのまま詰め替えられます。
- **型の境界を明示**: C の側と Zig の側を、この関数で明確に分けています。内部の処理は Zig の型だけで行えます。
- **反対方向の `cval` と対**: 同じ型の `cval` は、Zig から C の側の構造体を作ります。往復の変換が揃っています。
- **値の意味が変わらない**: 8 ビットの成分の値は、変換の前後で同じ数です。

## まとめ

- `fromC` は、C の色の構造体を、Zig の `RGB` 型に詰め替えます。
- 成分の名前が同じなので、1 行で済みます。
- 反対方向の `cval` と対で、往復の変換ができます。
