---
title: 3 バイトの UTF-8 を復号し、サロゲートの範囲を弾く
description: Zig 標準ライブラリの unicode.utf8Decode3。3 バイトの復号を utf8Decode3AllowSurrogateHalf に任せ、その結果が UTF-16 のサロゲートの範囲なら、エラーとして返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/unicode.zig
lines: [131, 137]
function: utf8Decode3
difficulty: 2
format: 2
tags: [Unicode, 防御的プログラミング, パース]
---

## ひとことで

`utf8Decode3` は、3 バイトの UTF-8 の文字を、コードポイントの値に戻す関数です。日本語の多くの文字は、この 3 バイトで書かれています。サロゲートの範囲を指す値は、文字として正しくないので、ここで弾きます。

## コード

```zig:line-numbers=131
pub fn utf8Decode3(bytes: [3]u8) Utf8Decode3Error!u21 {
    const value = try utf8Decode3AllowSurrogateHalf(bytes);

    if (0xd800 <= value and value <= 0xdfff) return error.Utf8EncodesSurrogateHalf;

    return value;
}
```

## 前提知識

- **3 バイトの UTF-8**: 先頭が `1110xxxx`、続きの 2 バイトが `10xxxxxx` です。16 ビットの値を表せます。
- **サロゲートの範囲**: UTF-16 で使われる 0xD800 から 0xDFFF の値です。これ自体は文字ではないので、UTF-8 では符号化できません。
- **`try`**: エラーが返ったら、その場で関数から抜けてエラーを渡す書き方です。
- **`utf8Decode3AllowSurrogateHalf`**: 同じファイルにある関数で、サロゲートの範囲も含めて 3 バイトを復号します。この関数はその結果を検査します。
- **エラーの集合の合成**: `||` で、2 つのエラーの集合をまとめて、1 つの型にしています。

## 何をしているか

### 1. サロゲートを許して復号する

```zig:line-numbers=132
    const value = try utf8Decode3AllowSurrogateHalf(bytes);
```

まず、サロゲートを含めて 3 バイトを復号します。エラーがあれば、`try` で、そのエラーを返します。

### 2. サロゲートの範囲を弾く

```zig:line-numbers=134
    if (0xd800 <= value and value <= 0xdfff) return error.Utf8EncodesSurrogateHalf;
```

結果が 0xD800 から 0xDFFF の範囲なら、`error.Utf8EncodesSurrogateHalf` を返します。サロゲートは、UTF-8 の文字として正しくないからです。

### 3. 値を返す

```zig:line-numbers=136
    return value;
```

範囲に問題がなければ、値をそのまま返します。

## ここがすごい

- **復号と検査を分ける**: 復号の仕組みと、サロゲートの検査を別々の関数にしています。読み手は、どちらがどの仕事かをすぐ分かります。
- **エラーが明確**: 「続きがない」「過長」「サロゲート」と、原因ごとに別のエラーになります。
- **エラーの集合を合成**: `Utf8Decode3AllowSurrogateHalfError` と、サロゲート用のエラーを合わせて、1 つの型にまとめています。
- **`try` で流れが短い**: エラーの伝播を 1 行で書けるので、関数が読みやすくなります。

## まとめ

- `utf8Decode3` は、3 バイトの UTF-8 を復号します。
- サロゲートの範囲を指す結果は、エラーとして弾きます。
- 復号の本体は、別の関数に任せています。
