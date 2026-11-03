---
title: 「番号=色」の文字列を、パレットの番号と色に分けて読む
description: Ghostty の parsePaletteEntry。等号で番号と色を分け、番号は 0x や 0b などの接頭辞も読める整数として、色は RGB.parse に任せて解析する。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/terminal/color.zig
lines: [64, 77]
function: parsePaletteEntry
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, 文字列処理]
---

## ひとことで

`parsePaletteEntry` は、設定ファイルに書かれた `0=#AABBCC` のような 1 行を読んで、パレットの番号と色の組にする関数です。Ghostty の設定で、端末の 256 色のパレットを一部だけ書き換えるときに使われます。

## コード

```zig:line-numbers=64
pub fn parsePaletteEntry(value: []const u8) error{ InvalidFormat, Overflow }!PaletteEntry {
    const eql_idx = std.mem.indexOfScalar(u8, value, '=') orelse
        return error.InvalidFormat;
    const index = std.fmt.parseInt(
        u8,
        std.mem.trim(u8, value[0..eql_idx], " \t"),
        0,
    ) catch |err| switch (err) {
        error.Overflow => return error.Overflow,
        error.InvalidCharacter => return error.InvalidFormat,
    };
    const rgb = try RGB.parse(value[eql_idx + 1 ..]);
    return .{ .index = index, .color = rgb };
}
```

## 前提知識

- **パレット**: 端末で使える色の一覧です。番号 0 から 255 で色を指定します。
- **`error` の集合（`error{ InvalidFormat, Overflow }`）**: 関数が返しうるエラーを、型で列挙したものです。呼び出す側は、どのエラーが起きうるかを型から知れます。
- **`std.mem.indexOfScalar`**: 文字列の中で、1 文字が最初に現れる位置を返す関数です。見つからなければ `null` を返します。
- **`orelse`**: 値が `null` のときに、別の式を使うための演算子です。ここでは、等号がなければエラーを返します。
- **基数 0 の `parseInt`**: 基数を 0 にすると、`0x` は 16 進数、`0o` は 8 進数、`0b` は 2 進数、それ以外は 10 進数として読みます。

## 何をしているか

### 1. 等号で番号と色を分ける

```zig:line-numbers=65
    const eql_idx = std.mem.indexOfScalar(u8, value, '=') orelse
        return error.InvalidFormat;
```

`=` の位置を探します。見つからなければ、形式の誤りとして `InvalidFormat` を返します。

### 2. 番号を整数として読む

```zig:line-numbers=67
    const index = std.fmt.parseInt(
        u8,
        std.mem.trim(u8, value[0..eql_idx], " \t"),
        0,
    ) catch |err| switch (err) {
        error.Overflow => return error.Overflow,
        error.InvalidCharacter => return error.InvalidFormat,
    };
```

`=` より前の部分を、前後の空白を取り除いてから `u8` の整数として読みます。大きすぎれば `Overflow`、文字が不正なら `InvalidFormat` に変えて返します。`switch` でエラーの名前を揃えているのがポイントです。

### 3. 色は RGB.parse に任せる

```zig:line-numbers=75
    const rgb = try RGB.parse(value[eql_idx + 1 ..]);
    return .{ .index = index, .color = rgb };
```

`=` より後ろは、`RGB.parse` に渡します。色の書き方（`#AABBCC` など）は、その関数が担当します。結果を番号と組にして返します。

## ここがすごい

- **番号の書き方が自由**: `parseInt` の基数 0 を使うので、10 進数、16 進数、8 進数、2 進数のどれで書いても読めます。
- **エラーを呼び出し側の言葉にする**: 内部の `InvalidCharacter` を、`InvalidFormat` に変えています。外に出すエラーの種類を、必要な分だけに絞っています。
- **役割を分けている**: 番号の読み取りと色の読み取りを、別の関数に任せています。この関数は、2 つを橋渡しするだけです。
- **テストが例を示している**: ファイルの後ろの `test` は、`0b1`、`0o7`、`0xF` の例を並べています。読み方の仕様が、テストの形で確かめられています。

## まとめ

- `parsePaletteEntry` は、等号で番号と色に分けて、それぞれを読みます。
- 番号は基数 0 の `parseInt` で、接頭辞付きの書き方も読めます。
- 色の解析は `RGB.parse` に任せ、この関数は橋渡しに徹しています。
