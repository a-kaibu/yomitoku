---
title: 2 バイトの UTF-8 を、ビットを組み立てて 1 つのコードポイントに戻す
description: Zig 標準ライブラリの unicode.utf8Decode2。先頭バイトの下位 5 ビットと、続きのバイトの下位 6 ビットをつないで、21 ビットの値に戻す。過長な符号化を拒否する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [115, 126]
function: utf8Decode2
difficulty: 3
format: 2
tags: [Unicode, ビット演算, パース]
---

## ひとことで

`utf8Decode2` は、2 バイトで書かれた UTF-8 の文字を、Unicode のコードポイントの値に戻す関数です。UTF-8 では、値の一部を各バイトに分けて入れているので、それを取り出してつなぎ直します。

## コード

```zig:line-numbers=115
pub fn utf8Decode2(bytes: [2]u8) Utf8Decode2Error!u21 {
    assert(bytes[0] & 0b11100000 == 0b11000000);
    var value: u21 = bytes[0] & 0b00011111;

    if (bytes[1] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[1] & 0b00111111;

    if (value < 0x80) return error.Utf8OverlongEncoding;

    return value;
}
```

## 前提知識

- **2 バイトの UTF-8**: 先頭が `110xxxxx`、続きが `10xxxxxx` です。`xxxxx` と `xxxxxx` を合わせた 11 ビットが、値になります。
- **継続バイト**: 2 バイト目の先頭 2 ビットは、必ず `10` です。これで、途中から読み始めたことを確かめられます。
- **過長な符号化（overlong）**: 本来は 1 バイトで書ける値を、無駄に長く書いたものです。安全上の問題になるので、拒否します。
- **`u21`**: コードポイントの値を入れる型です。
- **`<<=` と `|=`**: 左にずらして、下位のビットを OR で足す操作です。

## 何をしているか

### 1. 先頭バイトの値を取る

```zig:line-numbers=116
    assert(bytes[0] & 0b11100000 == 0b11000000);
    var value: u21 = bytes[0] & 0b00011111;
```

`assert` で先頭バイトの形（`110xxxxx`）を確かめます。その後、下位 5 ビットを `value` に入れます。

### 2. 続きのバイトをつなぐ

```zig:line-numbers=119
    if (bytes[1] & 0b11000000 != 0b10000000) return error.Utf8ExpectedContinuation;
    value <<= 6;
    value |= bytes[1] & 0b00111111;
```

2 バイト目が継続バイト（`10xxxxxx`）の形かを確かめます。合っていれば、`value` を 6 ビット左にずらして、続きの下位 6 ビットを OR で入れます。

### 3. 過長な符号化を拒否する

```zig:line-numbers=123
    if (value < 0x80) return error.Utf8OverlongEncoding;

    return value;
```

値が 0x80 より小さければ、1 バイトで書けたはずなので、`error.Utf8OverlongEncoding` を返します。それ以外は、値をそのまま返します。

## ここがすごい

- **ビットの組み立てが明快**: 先頭の 5 ビットと続きの 6 ビットを、ずらして OR するだけで、正しい値になります。
- **不正な形を段階的に弾く**: 形の確認、継続バイトの確認、過長の確認の 3 段階で、壊れた入力を正しく弾きます。
- **型を広げて計算**: 途中の値を `u21` で持つので、11 ビットの値が溢れません。
- **セキュリティ上の配慮**: 過長な符号化は、フィルタを回避する攻撃に使われることがあるので、明示的に拒否しています。

## まとめ

- `utf8Decode2` は、先頭の 5 ビットと続きの 6 ビットをつないで、値に戻します。
- 継続バイトの形と、過長な符号化を確かめます。
- 不正な入力は、種類ごとのエラーで返します。
