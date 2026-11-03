---
title: UTF-16 の先頭の単位を見て、続きが必要かを判定する
description: Zig 標準ライブラリの unicode.utf16CodeUnitSequenceLength。先頭の 16 ビットが上位サロゲートなら 2、下位サロゲートなら不正、それ以外は 1 を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [452, 456]
function: utf16CodeUnitSequenceLength
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 低レイヤ]
---

## ひとことで

`utf16CodeUnitSequenceLength` は、UTF-16 の列を読むときに、先頭の 1 単位を見て、その文字が 1 単位か 2 単位かを返す関数です。2 単位なら、次の単位も読む必要があります。

## コード

```zig:line-numbers=452
pub fn utf16CodeUnitSequenceLength(first_code_unit: u16) !u2 {
    if (utf16IsHighSurrogate(first_code_unit)) return 2;
    if (utf16IsLowSurrogate(first_code_unit)) return error.Utf16InvalidStartCodeUnit;
    return 1;
}
```

## 前提知識

- **コードユニット**: UTF-16 の 16 ビットの単位です。
- **上位サロゲート**: 2 単位の文字の、先頭の単位です。0xD800 から 0xDBFF の範囲です。
- **下位サロゲート**: 2 単位の文字の、後ろの単位です。0xDC00 から 0xDFFF の範囲です。
- **`utf16IsHighSurrogate` と `utf16IsLowSurrogate`**: 同じファイルにある、サロゲートの範囲を判定する関数です。
- **不正な先頭**: 下位サロゲートから読み始めると、文字の途中を読んだことになります。

## 何をしているか

### 1. 上位サロゲートなら 2 単位

```zig:line-numbers=453
    if (utf16IsHighSurrogate(first_code_unit)) return 2;
```

先頭が上位サロゲートなら、後ろの単位と合わせて 2 単位の文字です。`2` を返します。

### 2. 下位サロゲートはエラー

```zig:line-numbers=454
    if (utf16IsLowSurrogate(first_code_unit)) return error.Utf16InvalidStartCodeUnit;
```

先頭が下位サロゲートなら、文字の途中から読んでいます。`error.Utf16InvalidStartCodeUnit` を返します。

### 3. それ以外は 1 単位

```zig:line-numbers=455
    return 1;
```

どちらのサロゲートでもなければ、1 単位で完結する文字です。`1` を返します。

## ここがすごい

- **判定の順序が意味を持つ**: 上位サロゲートを先に調べると、下位サロゲートとの区別が明確になります。
- **途中から読む誤りを検出**: 下位サロゲートを先頭として扱うと、壊れた列を見つけられます。
- **判定を部品に分ける**: サロゲートの範囲の判定は、`utf16IsHighSurrogate` と `utf16IsLowSurrogate` に任せています。
- **読む量を決められる**: 返り値の 1 か 2 で、次に読むべき単位数が決まります。

## まとめ

- `utf16CodeUnitSequenceLength` は、先頭の単位が 1 単位か 2 単位かを返します。
- 下位サロゲートから始まる列は、不正としてエラーにします。
- サロゲートの判定は、専用の関数に任せています。
