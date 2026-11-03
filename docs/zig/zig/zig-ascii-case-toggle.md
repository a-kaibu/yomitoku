---
title: 英字の大文字と小文字を、ビット 1 つの切り替えで変える
description: ASCII の英字の大小を変える toUpper と toLower。大文字と小文字の差がちょうど 1 ビット（0x20）であることを利用して、比較なしで変換する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/ascii.zig
lines: [185, 194]
function: toUpper / toLower
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 標準ライブラリ]
---

## ひとことで

`toUpper` と `toLower` は、1 バイトの ASCII の英字を大文字または小文字に変える関数です。
たとえば `toUpper('a')` は `'A'`、`toLower('B')` は `'b'` です。英字以外の文字は、そのまま返します。

どちらの関数も、表を引いたり範囲を比べたりしません。大文字と小文字の違いが、ビットの **1 つだけ** であることを使って、ビットの操作で変換しています。

## コード

::: code-group

```zig:line-numbers=185 [日本語訳]
pub fn toUpper(c: u8) u8 {
    const mask = @as(u8, @intFromBool(isLower(c))) << 5;
    return c ^ mask;
}

/// 英大文字を小文字にして返す。すでに小文字か、英字でなければそのまま返す。
pub fn toLower(c: u8) u8 {
    const mask = @as(u8, @intFromBool(isUpper(c))) << 5;
    return c | mask;
}
```

```zig:line-numbers=185 [原文]
pub fn toUpper(c: u8) u8 {
    const mask = @as(u8, @intFromBool(isLower(c))) << 5;
    return c ^ mask;
}

/// Lowercases the character and returns it as-is if already lowercase or not a letter.
pub fn toLower(c: u8) u8 {
    const mask = @as(u8, @intFromBool(isUpper(c))) << 5;
    return c | mask;
}
```

:::
## 前提知識

- **ASCII の値**: 英大文字の `'A'` は 65（0x41）、英小文字の `'a'` は 97（0x61）です。2 進数で比べると、違うのは 5 番目のビットだけです。
- **0x20**: 2 進数で `0010_0000` の値で、10 進数の 32 です。この 1 ビットを立てたり消したりすると、大文字と小文字が入れ替わります。
- **`^`（XOR）**: 違うビットだけ 1 になる演算です。同じ値を 2 回 XOR すると元に戻ります。
- **`|`（OR）**: どちらかが 1 なら 1 になる演算です。ビットを立てるときに使います。
- **`@intFromBool`**: 真なら 1、偽なら 0 の整数に変換する組み込み関数です。
- **`<< 5`**: 5 ビット左にずらす演算です。`1 << 5` は `0x20` です。

## 何をしているか

### 1. 小文字なら、0x20 を作る（toUpper）

```zig:line-numbers=186
    const mask = @as(u8, @intFromBool(isLower(c))) << 5;
    return c ^ mask;
```

`isLower(c)` が真なら 1、偽なら 0 になります。それを 5 ビット左にずらすと、0x20 か 0 です。
小文字なら 0x20 を XOR します。`'a'`（0x61）と 0x20 を XOR すると `'A'`（0x41）になります。英字以外は、マスクが 0 なので変わりません。

### 2. 大文字なら、0x20 を立てる（toLower）

```zig:line-numbers=192
    const mask = @as(u8, @intFromBool(isUpper(c))) << 5;
    return c | mask;
```

`isUpper(c)` が真のときだけ、0x20 のマスクを作ります。それを OR で合わせると、5 番目のビットが立ち、`'A'`（0x41）が `'a'`（0x61）になります。
すでに小文字の文字は、マスクが 0 なので変わりません。

### 3. 具体例で確かめる

`'Z'` を `toLower` すると、0x5A に 0x20 を足した 0x7A、つまり `'z'` になります。`'3'`（0x33）は英字ではないのでマスクが 0 で、`toUpper` も `toLower` も `'3'` のままです。

## ここがすごい

- **表が要らない**: 26 個の英字それぞれの変換表を持つ必要がありません。1 ビットの操作だけで、すべての英字が変わります。
- **分岐が少ない**: 大文字か小文字かの判定の結果を、マスクという値にして計算に使うので、`if` を書かずに済みます。分岐の予測が外れにくく、速く動きます。
- **英字以外を壊さない**: 判定でマスクが 0 になるので、数字や記号は変換されずに返ります。
- **ASCII の配置を利用**: 大文字と小文字のコードが 0x20 だけ離れているのは、ASCII を設計したときの工夫です。その性質を、そのまま使っています。

## まとめ

- 英字の大小は、ASCII の 5 番目のビット（0x20）の違いだけです。
- XOR で反転すると大文字から小文字（または逆）に変わり、OR で立てると小文字にそろえられます。
- 判定の結果をマスクにして計算すると、`if` を使わずに変換できます。
- 英字以外の文字は、マスクが 0 なので変わりません。
