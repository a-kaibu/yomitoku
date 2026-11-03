---
title: UTF-8 の先頭バイトを見て、その文字が何バイトかを switch で判定する
description: Zig 標準ライブラリの unicode.utf8ByteSequenceLength。先頭の 1 バイトのビットの形から、続くバイト数を 1 から 4 で返し、先頭になれないバイトはエラーにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [28, 37]
function: utf8ByteSequenceLength
difficulty: 2
format: 2
tags: [Unicode, 最適化, 防御的プログラミング]
---

## ひとことで

`utf8ByteSequenceLength` は、UTF-8 の文字列を読むときに、先頭のバイトを見て、その文字が全部で何バイトかを返す関数です。バイトの先頭の数ビットの形で、長さが決まっています。

## コード

::: code-group

```zig:line-numbers=28 [日本語訳]
pub fn utf8ByteSequenceLength(first_byte: u8) !u3 {
    // @clz を使う「賢い」方法より、switch の方がずっとよく最適化される。
    return switch (first_byte) {
        0b0000_0000...0b0111_1111 => 1,
        0b1100_0000...0b1101_1111 => 2,
        0b1110_0000...0b1110_1111 => 3,
        0b1111_0000...0b1111_0111 => 4,
        else => error.Utf8InvalidStartByte,
    };
}
```

```zig:line-numbers=28 [原文]
pub fn utf8ByteSequenceLength(first_byte: u8) !u3 {
    // The switch is optimized much better than a "smart" approach using @clz
    return switch (first_byte) {
        0b0000_0000...0b0111_1111 => 1,
        0b1100_0000...0b1101_1111 => 2,
        0b1110_0000...0b1110_1111 => 3,
        0b1111_0000...0b1111_0111 => 4,
        else => error.Utf8InvalidStartByte,
    };
}
```

:::

## 前提知識

- **UTF-8 の先頭バイト**: 1 バイトの文字（ASCII）は `0xxxxxxx`、2 バイトの文字は `110xxxxx`、3 バイトは `1110xxxx`、4 バイトは `11110xxx` の形です。
- **継続バイト**: 文字の 2 バイト目以降は `10xxxxxx` の形で、先頭になれません。
- **範囲の `switch`**: `0b0000_0000...0b0111_1111` のように、ビットの値の範囲を並べて書く書き方です。
- **`u3`**: 1 から 4 のバイト数を表す型です。
- **`error.Utf8InvalidStartByte`**: 先頭になれないバイトに対して返されるエラーです。

## 何をしているか

### 1. 先頭ビットの形で 1 バイトと 2 バイトを分ける

```zig:line-numbers=30
    return switch (first_byte) {
        0b0000_0000...0b0111_1111 => 1,
        0b1100_0000...0b1101_1111 => 2,
```

`0xxxxxxx` なら 1 バイト、`110xxxxx` なら 2 バイトです。ビットパターンの範囲を、そのまま `switch` の範囲に書いています。

### 2. 3 バイトと 4 バイトを分ける

```zig:line-numbers=33
        0b1110_0000...0b1110_1111 => 3,
        0b1111_0000...0b1111_0111 => 4,
```

`1110xxxx` なら 3 バイト、`11110xxx` なら 4 バイトです。4 バイトの範囲は、Unicode の上限に合わせて `0b1111_0111` までです。

### 3. 先頭になれないバイトをエラーにする

```zig:line-numbers=35
        else => error.Utf8InvalidStartByte,
```

`10xxxxxx` の継続バイトや、上限を超える `0xF8` 以上のバイトは、先頭になれません。`else` でエラーを返します。

## ここがすごい

- **ビットの形を直接書く**: 数値の範囲ではなく、ビットの並びで書くので、UTF-8 の規則と一対一に対応します。
- **速い判定**: 注釈にあるとおり、`@clz` を使う方法より、`switch` の方がよく最適化されます。
- **不正なバイトを明示**: 継続バイトを先頭に使うような、壊れた入力を `error` で知らせます。
- **値の範囲の表と同じ形**: 同じファイルの符号化や復号の関数と、同じ形の表を共有しています。

## まとめ

- `utf8ByteSequenceLength` は、先頭バイトのビットの形で、文字のバイト数を決めます。
- 継続バイトや範囲外のバイトは、エラーとして返します。
- 注釈が示すとおり、`switch` の範囲の表が、最も速い書き方として選ばれています。
