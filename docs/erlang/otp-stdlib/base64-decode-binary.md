---
title: "4 文字ずつ 6 ビットを読み、3 バイトに組み直す"
description: "base64:decode_binary/4 は、Base64 の文字列を 4 文字ずつ読んで、6 ビットの値を 24 ビットにまとめ直す。空白は読み飛ばし、末尾の = による端数は別の関数で扱う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2007-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/base64.erl
lines: [659, 673]
function: "base64:decode_binary/4"
difficulty: 2
format: 2
tags: ["文字列処理", "ビット演算", "標準ライブラリ"]
---
## ひとことで

`base64:decode_binary/4` は、Base64 の文字列を元のバイナリに戻します。文字を 4 つずつ読み、それぞれの 6 ビットを取り出して、3 バイト（24 ビット）に組み直します。
文字の中の空白（改行など）は無視します。末尾の `=` による端数は、別の関数で処理します。

## コード

```erlang:line-numbers=659
decode_binary(ModeOffset, Padding, <<C1:8, C2:8, C3:8, C4:8, Cs/bits>>, A) ->
    case {b64d(C1, ModeOffset), b64d(C2, ModeOffset), b64d(C3, ModeOffset), b64d(C4, ModeOffset)} of
        {B1, B2, B3, B4} when is_integer(B1), is_integer(B2),
                              is_integer(B3), is_integer(B4) ->
            decode_binary(ModeOffset, Padding, Cs, <<A/bits,B1:6,B2:6,B3:6,B4:6>>);
        {B1, B2, B3, B4} ->
            dec_bin(ModeOffset, Padding, Cs, B1, B2, B3, B4, A)
    end;
decode_binary(_ModeOffset, _Padding, <<>>, A) ->
    A;
decode_binary(ModeOffset, Padding, <<C1:8, Cs/bits>>, A) ->
    case b64d(C1, ModeOffset) of
        ws -> decode_binary(ModeOffset, Padding, Cs, A);
        B1 -> decode_binary(ModeOffset, Padding, Cs, A, B1)
    end.
```

## 前提知識

- **Base64 の復号**: 符号化の逆です。1 文字が表す 6 ビットを求め、それを 8 ビットずつに組み直します。
- **ビット構文 `<<C1:8, ...>>`**: 文字の 1 バイトを 8 ビットの整数として取り出します。
- **`b64d/2`**: 文字の値を 6 ビットの整数に変換します。Base64 にない文字は、`ws`（空白）か、別の結果になります。
- **`ws`**: 空白を表す値です。改行や空白は、無視して次の文字へ進みます。
- **`dec_bin/8`**: 末尾の端数（`=`）を処理する補助関数です。ここでは詳しく説明しません。

## 何をしているか

### 1. 4 文字がそろったとき

```erlang:line-numbers=659
decode_binary(ModeOffset, Padding, <<C1:8, C2:8, C3:8, C4:8, Cs/bits>>, A) ->
    case {b64d(C1, ModeOffset), b64d(C2, ModeOffset), b64d(C3, ModeOffset), b64d(C4, ModeOffset)} of
        {B1, B2, B3, B4} when is_integer(B1), is_integer(B2),
                              is_integer(B3), is_integer(B4) ->
            decode_binary(ModeOffset, Padding, Cs, <<A/bits,B1:6,B2:6,B3:6,B4:6>>);
```

先頭から 4 文字 `C1`〜`C4` を取り出し、それぞれ `b64d/2` で 6 ビットの値に変えます。4 つとも数値なら、`<<A/bits, B1:6, B2:6, B3:6, B4:6>>` のように、6 ビットずつ並べて結果に追加します。ビットの並びが、そのまま 3 バイトになります。

### 2. 端数や `=` が現れたとき

```erlang:line-numbers=664
        {B1, B2, B3, B4} ->
            dec_bin(ModeOffset, Padding, Cs, B1, B2, B3, B4, A)
```

4 つの中に、数値でない値（`=` など）があるときは、`dec_bin/8` に任せます。末尾の端数を、正しい長さのバイナリにする処理です。

### 3. 入力を使い切ったとき

```erlang:line-numbers=667
decode_binary(_ModeOffset, _Padding, <<>>, A) ->
    A;
```

残りが空のバイナリ `<<>>` なら、結果 `A` を返します。

### 4. 4 文字に満たない残り

```erlang:line-numbers=669
decode_binary(ModeOffset, Padding, <<C1:8, Cs/bits>>, A) ->
    case b64d(C1, ModeOffset) of
        ws -> decode_binary(ModeOffset, Padding, Cs, A);
        B1 -> decode_binary(ModeOffset, Padding, Cs, A, B1)
    end.
```

1 文字だけ残ったときは、`b64d/2` で値を求めます。空白なら読み飛ばします。それ以外なら、`decode_binary/5` で、残りの文字と組み合わせて処理を続けます。

## ここがすごい

### 「4 文字 = 3 バイト」という対応を、パターンそのものにしている

Base64 の本質は、4 文字が 3 バイトに対応することです。この関数は、`<<C1:8, C2:8, C3:8, C4:8, Cs/bits>>` という形で、その対応を直接書いています。
エンコードの `encode_binary` と、同じ単位で対になっているので、読み比べると理解が深まります。

### 空白を、規則の中で自然に読み飛ばす

Base64 の文字列は、改行で区切られていることがよくあります。この関数は、空白を値 `ws` として扱い、次の文字へ進むだけです。
特別な前処理をせずに、入力の形のゆらぎを吸収しています。

## まとめ

- Base64 の復号は、4 文字を 24 ビットに組み直す、逆向きの対応です。
- ビット構文で 8 ビットと 6 ビットを並べると、組み直しを式そのものとして書けます。
- 空白は値として扱い、読み飛ばすと、入力のゆらぎに強くなります。
