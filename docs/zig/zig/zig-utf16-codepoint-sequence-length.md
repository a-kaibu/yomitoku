---
title: コードポイントが UTF-16 で 1 単位か 2 単位かを、範囲の比較で決める
description: Zig 標準ライブラリの unicode.utf16CodepointSequenceLength。0xFFFF 以下なら 1 単位、0x10FFFF 以下なら 2 単位（サロゲートペア）、それ以外はエラーを返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [435, 439]
function: utf16CodepointSequenceLength
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 文字列処理]
---

## ひとことで

`utf16CodepointSequenceLength` は、Unicode のコードポイントを UTF-16 で書いたとき、何単位（16 ビットの値）になるかを返す関数です。基本多言語面の文字は 1 単位、それより外の文字は 2 単位になります。

## コード

```zig:line-numbers=435
pub fn utf16CodepointSequenceLength(c: u21) !u2 {
    if (c <= 0xFFFF) return 1;
    if (c <= 0x10FFFF) return 2;
    return error.CodepointTooLarge;
}
```

## 前提知識

- **UTF-16**: 文字を 16 ビットの単位（コードユニット）で表す文字コードです。Windows の内部や JavaScript などで使われています。
- **基本多言語面（BMP）**: 0 から 0xFFFF までのコードポイントです。1 単位で表せます。
- **サロゲートペア**: BMP の外の文字を、2 単位で表す仕組みです。
- **`u2`**: 0 から 3 の値を表す型です。1 か 2 を表せます。
- **`error.CodepointTooLarge`**: 0x110000 以上の値に対するエラーです。

## 何をしているか

### 1. BMP の文字は 1 単位

```zig:line-numbers=436
    if (c <= 0xFFFF) return 1;
```

0xFFFF 以下の値は、1 単位で表せます。

### 2. BMP の外は 2 単位

```zig:line-numbers=437
    if (c <= 0x10FFFF) return 2;
```

0x10FFFF 以下で、BMP より大きい値は、サロゲートペアの 2 単位です。

### 3. 範囲外はエラー

```zig:line-numbers=438
    return error.CodepointTooLarge;
```

0x10FFFF を超える値は、Unicode の範囲外なのでエラーです。

## ここがすごい

- **単位数が範囲で決まる**: 境界の値が 2 つあるだけで、単位数が決まります。判定の表が短いです。
- **UTF-8 版と対応**: 同じファイルの `utf8CodepointSequenceLength` と、同じ考え方で書かれています。両方の符号化の長さを、同じ形で求められます。
- **書き込み先の確保に使える**: UTF-16 の配列を作る前に、必要な単位数を求められます。
- **誤った値を弾く**: 範囲外の値は、エラーで返します。

## まとめ

- `utf16CodepointSequenceLength` は、BMP の内か外かで、1 単位か 2 単位かを決めます。
- 0x10FFFF を超える値は、エラーとして返します。
- UTF-8 版の長さの関数と、対になっています。
