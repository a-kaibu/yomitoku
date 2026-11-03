---
title: 4 バイトの UTF-8 を復号して、Unicode の上限と過長の両方を確かめる
description: Zig 標準ライブラリの unicode.utf8Decode4。4 バイトの続きの確認と、ビットのつなぎ合わせを行い、0x10000 未満の過長と 0x10FFFF を超える値を、それぞれエラーで弾く。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [165, 185]
function: utf8Decode4
difficulty: 3
format: 2
tags: [Unicode, ビット演算, 防御的プログラミング]
---

## ひとことで

`utf8Decode4` は、4 バイトで書かれた UTF-8 の文字を、コードポイントの値に戻す関数です。絵文字や、基本多言語面の外の文字などが、この 4 バイトになります。

## コード

```zig:line-numbers=165
pub fn utf8Decode4(bytes: [4]u8) Utf8Decode4Error!u21 {
    assert(bytes[0] & 0b11111000 == 0b11110000);
    var value: u21 = bytes[0] & 0b00000111;

    if (bytes[1] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[1] & 0b00111111;

    if (bytes[2] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[2] & 0b00111111;

    if (bytes[3] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[3] & 0b00111111;

    if (value < 0x10000) return error.Utf8OverlongEncoding;
    if (value > 0x10FFFF) return error.Utf8CodepointTooLarge;

    return value;
}
```

## 前提知識

- **4 バイトの UTF-8**: 先頭が `11110xxx`、続きの 3 バイトが `10xxxxxx` です。合わせて 21 ビットの値を表せます。
- **Unicode の上限**: コードポイントは 0x10FFFF までです。4 バイトでは、それより大きな値も表せてしまうので、確かめる必要があります。
- **過長な符号化**: 0x10000 より小さい値を 4 バイトで書いたものは、無駄な符号化です。拒否します。
- **`assert`**: 先頭バイトの形を確かめます。
- **`|=`、`<<=`**: 値を 6 ビットずつ左にずらして、続きのビットを OR で足していく操作です。

## 何をしているか

### 1. 先頭バイトの値と、最初の続きを取る

```zig:line-numbers=166
    assert(bytes[0] & 0b11111000 == 0b11110000);
    var value: u21 = bytes[0] & 0b00000111;

    if (bytes[1] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[1] & 0b00111111;
```

先頭バイトの下位 3 ビットを `value` に入れます。2 バイト目の継続バイトを確かめて、6 ビット分を足します。

### 2. 残りの 2 つの続きを足す

```zig:line-numbers=173
    if (bytes[2] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[2] & 0b00111111;

    if (bytes[3] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[3] & 0b00111111;
```

3 バイト目と 4 バイト目も、同じ手順で確かめて足します。3 バイトの継続バイトを足すと、合計 21 ビットの値になります。

### 3. 範囲を確かめて返す

```zig:line-numbers=181
    if (value < 0x10000) return error.Utf8OverlongEncoding;
    if (value > 0x10FFFF) return error.Utf8CodepointTooLarge;

    return value;
```

0x10000 より小さければ過長、0x10FFFF より大きければ上限超えとして、それぞれエラーを返します。範囲内なら値を返します。

## ここがすごい

- **同じ手順の繰り返し**: 継続バイトの確認と足し込みを、3 回同じ形で書いています。規則が一目で分かります。
- **2 種類の範囲の確認**: 過長（小さすぎる）と上限超え（大きすぎる）を、別々のエラーで扱います。原因が分かりやすくなります。
- **型が 21 ビットに合う**: 結果は `u21` に収まるので、溢れがありません。
- **安全な入力の受け口**: 壊れた入力を、必ずエラーとして返すので、後続の処理が安全に動きます。

## まとめ

- `utf8Decode4` は、4 バイトの UTF-8 を、継続バイトを確かめながら 21 ビットの値に戻します。
- 過長と、上限超えの 2 つの範囲を、それぞれエラーで弾きます。
- 復号の基本の形は、2 バイト、3 バイトの版と同じです。
