---
title: 色の名前の列挙値を、もとの整数のまま C の値として返す
description: Ghostty の Name.cval。標準の色の名前（black、red など）の列挙型を、そのもとの整数の値のまま返す。C の API に渡すための番号。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [490, 492]
function: Name.cval
difficulty: 1
format: 2
tags: [型システム, イディオム, 標準ライブラリ]
---

## ひとことで

`cval` は、標準の色の名前を表す列挙型を、C の言語から扱える整数の番号に変える関数です。`black` は 0、`red` は 1 のように、名前に決まった番号がついています。

## コード

```zig:line-numbers=490
    pub fn cval(self: Name) C {
        return @backingInt(self);
    }
```

## 前提知識

- **列挙型（enum）**: 決まった名前の値だけを持つ型です。`Name` は、`black` から `white` などの色の名前を持ちます。
- **`enum(u8)`**: 列挙型の背後の整数の型を指定した書き方です。ここでは 8 ビットの番号になります。
- **`C` 型**: `RGB` の C の側の型と同じく、この `Name` の番号の型を `u8` として定義しています。
- **`@backingInt`**: 列挙値の、もとの整数の値を取り出す組み込み関数です。
- **`default`**: 同じ `Name` の型の、既定の色を返す関数です。

## 何をしているか

### 1. 列挙値をもとの整数に変える

```zig:line-numbers=491
        return @backingInt(self);
```

`@backingInt(self)` で、列挙値の裏にある整数を取り出して返します。`black` なら 0、`red` なら 1 です。

## ここがすごい

- **名前と番号の対応が自動**: 列挙型に書かれた番号が、そのまま C の値になります。番号を別に管理する必要がありません。
- **型は C の値に一致**: 戻り値は `C`（`u8`）で、C の API の型と揃っています。
- **変換が 1 行**: 特別な分岐や表がありません。コンパイル時に決まる、単純な取り出しです。
- **`default` と対**: 同じ名前の値から、番号と既定の色の両方を得られます。

## まとめ

- `cval` は、列挙型の色の名前を、もとの整数の番号として返します。
- 番号は列挙型の定義がそのまま使われ、別の表は要りません。
- C の API に色の番号を渡すときの変換です。
