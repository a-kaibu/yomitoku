---
title: UTF-16 の代理ペアから、Unicode の文字番号を組み立てる
description: Zig の utf16DecodeSurrogatePair。UTF-16 で 2 個の 16 ビットの値に分かれた文字を、上位と下位の 10 ビットずつを組み合わせて元の文字番号に戻す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [468, 475]
function: utf16DecodeSurrogatePair
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, ビット演算]
---

## ひとことで

`utf16DecodeSurrogatePair` は、UTF-16 で 2 個の 16 ビットの値に分けて表された文字を、もとの Unicode の文字番号（コードポイント）に戻す関数です。
UTF-16 では、64K（65536）を超える文字（絵文字など）を、**代理ペア（surrogate pair）** と呼ばれる 2 個の値で表します。前半を上位の代理、後半を下位の代理と呼びます。

## コード

```zig:line-numbers=468
pub fn utf16DecodeSurrogatePair(surrogate_pair: []const u16) !u21 {
    assert(surrogate_pair.len >= 2);
    assert(utf16IsHighSurrogate(surrogate_pair[0]));
    const high_half: u21 = surrogate_pair[0];
    const low_half = surrogate_pair[1];
    if (!utf16IsLowSurrogate(low_half)) return error.ExpectedSecondSurrogateHalf;
    return 0x10000 + ((high_half & 0x03ff) << 10) | (low_half & 0x03ff);
}
```
## 前提知識

- **UTF-16**: 文字を 16 ビット（2 バイト）の値で表す文字コードです。多くの文字は 1 個の値で表せますが、ごく一部は 2 個で表します。
- **代理（surrogate）**: UTF-16 で、2 個の値を組み合わせるために予約された範囲の値です。上位の代理は `0xD800` から `0xDBFF`、下位の代理は `0xDC00` から `0xDFFF` です。
- **コードポイント**: Unicode の文字 1 つに割り当てられた番号です。ここでは `u21`（0 から 0x10FFFF）で表します。
- **`assert`**: 条件が成り立つかを確かめる文です。前提が崩れると、プログラムを止めます。
- **`utf16IsHighSurrogate` と `utf16IsLowSurrogate`**: その値が上位の代理か、下位の代理かを判定する関数です。
- **`error.ExpectedSecondSurrogateHalf`**: 後半が下位の代理でないときに返すエラーです。

## 何をしているか

### 1. 2 個の値を取り出し、前提を確かめる

```zig:line-numbers=469
    assert(surrogate_pair.len >= 2);
    assert(utf16IsHighSurrogate(surrogate_pair[0]));
    const high_half: u21 = surrogate_pair[0];
    const low_half = surrogate_pair[1];
```

最初の 2 個の値を取り出します。先頭は上位の代理であることを、`assert` で確かめます。`high_half` は、計算のために `u21` の型に広げます。

### 2. 後半が下位の代理か確かめる

```zig:line-numbers=473
    if (!utf16IsLowSurrogate(low_half)) return error.ExpectedSecondSurrogateHalf;
```

後半が下位の代理でなければ、正しいペアではありません。エラーを返して、誤った文字を作らないようにします。

### 3. 10 ビットずつを組み合わせる

```zig:line-numbers=474
    return 0x10000 + ((high_half & 0x03ff) << 10) | (low_half & 0x03ff);
```

上位の代理と下位の代理は、それぞれ下位 10 ビットに情報を持っています。上位の 10 ビットを 10 ビット左にずらして、下位の 10 ビットと合わせます。その結果に `0x10000` を足すと、もとの文字番号になります。

たとえば、上位が `0xD83D`、下位が `0xDE00` の絵文字の組では、下位 10 ビットはそれぞれ `0x03D` と `0x200` です。`0x03D << 10 | 0x200` は `0xF600` になり、`0x10000` を足すと `0x1F600` です。絵文字の顔の文字番号に一致します。

## ここがすごい

- **ビットの役割が明確**: 代理の 16 ビットのうち、下位 10 ビットだけが情報を運びます。上位の固定の部分を捨てて、必要な 10 ビットだけを組み合わせる、きれいな設計です。
- **オフセットで範囲を揃える**: `0x10000` を足すことで、64K より大きい文字番号の範囲に、きちんと入ります。
- **前提を検査する**: 上位と下位の判定を入れて、誤ったペアを早く見つけます。黙って誤った文字番号を返すことがありません。
- **型を広げて計算**: 途中の計算は `u21` で行うので、10 ビットを左にずらしても、型の範囲を超えません。

## まとめ

- UTF-16 では、64K を超える文字を 2 個の代理の値で表します。
- 上位と下位のそれぞれ下位 10 ビットを組み合わせ、`0x10000` を足すと文字番号になります。
- 後半が正しい代理でなければ、エラーにして誤りを明示します。
- 計算は十分に大きな型で行い、溢れを避けています。
