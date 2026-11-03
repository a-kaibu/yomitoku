---
title: 文字の番号から、UTF-8 で何バイトになるかを 4 段階の比較で求める
description: Zig 標準ライブラリの unicode.utf8CodepointSequenceLength。コードポイントの値の範囲に応じて 1 から 4 バイトを返し、範囲外はエラーにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [17, 23]
function: utf8CodepointSequenceLength
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 文字列処理]
---

## ひとことで

`utf8CodepointSequenceLength` は、Unicode の文字の番号（コードポイント）を UTF-8 で書いたとき、何バイトになるかを返す関数です。ASCII の文字は 1 バイト、日本語の多くは 3 バイトになります。文字列の領域を確保するときに、先に長さを知るために使われます。

## コード

```zig:line-numbers=17
pub fn utf8CodepointSequenceLength(c: u21) !u3 {
    if (c < 0x80) return @as(u3, 1);
    if (c < 0x800) return @as(u3, 2);
    if (c < 0x10000) return @as(u3, 3);
    if (c < 0x110000) return @as(u3, 4);
    return error.CodepointTooLarge;
}
```

## 前提知識

- **UTF-8**: Unicode の文字を、1 バイトから 4 バイトの可変長で表す文字コードです。
- **コードポイント**: Unicode の文字に割り当てられた番号です。0 から 0x10FFFF までの値があります。
- **`u21`**: 21 ビットの符号なし整数です。コードポイントを表すのにちょうどの大きさです。
- **`u3`**: 0 から 7 の値を表す型です。バイト数の 1 から 4 を表せます。
- **`error.CodepointTooLarge`**: 範囲外の値に対して返されるエラーです。

## 何をしているか

### 1. 範囲ごとにバイト数を決める

```zig:line-numbers=18
    if (c < 0x80) return @as(u3, 1);
    if (c < 0x800) return @as(u3, 2);
    if (c < 0x10000) return @as(u3, 3);
    if (c < 0x110000) return @as(u3, 4);
```

値が 0x80 未満なら 1 バイト、0x800 未満なら 2 バイト、0x10000 未満なら 3 バイト、0x110000 未満なら 4 バイトです。範囲の上限から順に比べ、最初に当てはまったものを返します。

### 2. 範囲外はエラーにする

```zig:line-numbers=22
    return error.CodepointTooLarge;
```

0x110000 以上の値は、UTF-8 で表せる範囲を超えるので、`error.CodepointTooLarge` を返します。

## ここがすごい

- **範囲の表がそのまま仕様**: 4 つの境界の値が、UTF-8 の符号化の規則を直接表しています。
- **上から順に比べる**: 小さい範囲から順に判定するので、どの分岐も 1 行で読めます。
- **エラーで無効を弾く**: 範囲外の値を、特別な数で返さずにエラーとして返すので、呼び出し側が確実に扱えます。
- **先に長さが分かる**: 書き込み先の領域の大きさを、符号化の前に決められます。

## まとめ

- `utf8CodepointSequenceLength` は、コードポイントの範囲で 1 から 4 バイトを決めます。
- 0x110000 以上の値は、エラーとして返します。
- 符号化の前に、必要なバイト数を知るための関数です。
