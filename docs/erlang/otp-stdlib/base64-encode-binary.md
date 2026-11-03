---
title: "3 バイトを 4 文字に変える、ビット列の切り出し"
description: "base64:encode_binary/4 は、バイナリを 6 ビットずつ切り出して文字に変える。Erlang のビット構文で 1 回のパターンマッチが 8 文字分を一度に扱い、末尾の端数は = で埋める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2007-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/base64.erl
lines: [218, 256]
function: "base64:encode_binary/4"
difficulty: 2
format: 2
tags: ["文字列処理", "ビット演算", "標準ライブラリ"]
---
## ひとことで

`base64:encode_binary/4` は、バイナリを Base64 の文字列に変換します。Base64 は、3 バイト（24 ビット）を 6 ビットずつ 4 つに区切り、それぞれを 1 文字に対応させる方式です。
この関数は、Erlang のビット構文でそのビット列を直接切り出します。入力が 8 組の 6 ビットに分けられるときは、一度に 8 文字ずつ処理します。

## コード

```erlang:line-numbers=218
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:6, B4:6, B5:6, B6:6, B7:6, B8:6, Ls/bits>>, A) ->
    encode_binary(ModeOffset,
                  Padding,
                  Ls,
                  <<A/bits,
                    (b64e(B1, ModeOffset)):8,
                    (b64e(B2, ModeOffset)):8,
                    (b64e(B3, ModeOffset)):8,
                    (b64e(B4, ModeOffset)):8,
                    (b64e(B5, ModeOffset)):8,
                    (b64e(B6, ModeOffset)):8,
                    (b64e(B7, ModeOffset)):8,
                    (b64e(B8, ModeOffset)):8>>);
encode_binary(_ModeOffset, _Padding, <<>>, A) ->
    A;
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:6, B4:6, Ls/bits>>, A) ->
    encode_binary(ModeOffset,
                  Padding,
                  Ls,
                  <<A/bits,
                    (b64e(B1, ModeOffset)):8,
                    (b64e(B2, ModeOffset)):8,
                    (b64e(B3, ModeOffset)):8,
                    (b64e(B4, ModeOffset)):8>>);
encode_binary(ModeOffset, Padding, <<B1:6, B2:2>>, A) ->
    E1 = b64e(B1, ModeOffset),
    E2 = b64e(B2 bsl 4, ModeOffset),
    case Padding of
        true -> <<A/bits,E1,E2,$=,$=>>;
        _ -> <<A/bits,E1,E2>>
    end;
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:4>>, A) ->
    E1 = b64e(B1, ModeOffset),
    E2 = b64e(B2, ModeOffset),
    E3 = b64e(B3 bsl 2, ModeOffset),
    case Padding of
        true -> <<A/bits,E1,E2,E3,$=>>;
        _ -> <<A/bits,E1,E2,E3>>
    end.
```

## 前提知識

- **Base64**: 任意のバイト列を、英数字と `+`、`/` だけの文字列に変換する方式です。メールや URL に含めやすい文字だけを使います。
- **ビット構文 `<<...>>`**: Erlang では、バイナリを `<<B1:6, B2:6>>` のように、ビット単位の幅で書けます。`B1:6` は 6 ビットの整数です。
- **`Ls/bits`**: 残りのビット列を `Ls` に束縛します。`/bits` は、バイト単位でなくてもよいという指定です。
- **`A/bits`**: 結果を積み上げるバイナリです。`<<A/bits, ...>>` は、`A` の後ろに新しい部分を連結します。
- **`b64e/2`**: 6 ビットの値を、Base64 の文字コードに変える関数です。`ModeOffset` は、アルファベットの種類を切り替えるための補正値です。
- **`$=`**: 文字 `=` の文字コードを書く Erlang の記法です。

## 何をしているか

### 1. 入力を 24 ビットずつ切り出す

```erlang:line-numbers=218
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:6, B4:6, B5:6, B6:6, B7:6, B8:6, Ls/bits>>, A) ->
    encode_binary(ModeOffset,
                  Padding,
```

先頭の節は、入力が 6 ビットの 8 組以上残っている場合です。ここでは 48 ビット（6 バイト）分を一度に取り出します。`Ls` には、切り出しの残りが入ります。

### 2. 8 文字を一度に作る

```erlang:line-numbers=222
                  <<A/bits,
                    (b64e(B1, ModeOffset)):8,
                    (b64e(B2, ModeOffset)):8,
                    (b64e(B3, ModeOffset)):8,
                    (b64e(B4, ModeOffset)):8,
                    (b64e(B5, ModeOffset)):8,
                    (b64e(B6, ModeOffset)):8,
                    (b64e(B7, ModeOffset)):8,
                    (b64e(B8, ModeOffset)):8>>);
```

取り出した 8 個の 6 ビットを、`b64e/2` で 1 文字ずつ変換します。`:8` は、各文字を 1 バイトとしてバイナリに書き込む指定です。結果は `A` の後ろに連結されます。
この節は再帰で自分自身を呼び、残りの入力を同じ方法で処理します。

### 3. 残りが 4 組以下のとき

```erlang:line-numbers=233
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:6, B4:6, Ls/bits>>, A) ->
    encode_binary(ModeOffset,
                  Padding,
                  Ls,
                  <<A/bits,
                    (b64e(B1, ModeOffset)):8,
                    (b64e(B2, ModeOffset)):8,
                    (b64e(B3, ModeOffset)):8,
                    (b64e(B4, ModeOffset)):8>>);
```

6 ビットが 4 組残っているときは、同じ考え方で 4 文字を作ります。

### 4. 入力を使い切ったとき

```erlang:line-numbers=231
encode_binary(_ModeOffset, _Padding, <<>>, A) ->
    A;
```

残りが空のビット列 `<<>>` なら、結果 `A` を返して終わります。

### 5. 端数が 1 バイトだけ残ったとき

```erlang:line-numbers=242
encode_binary(ModeOffset, Padding, <<B1:6, B2:2>>, A) ->
    E1 = b64e(B1, ModeOffset),
    E2 = b64e(B2 bsl 4, ModeOffset),
    case Padding of
        true -> <<A/bits,E1,E2,$=,$=>>;
        _ -> <<A/bits,E1,E2>>
    end;
```

残りが `<<B1:6, B2:2>>` のように 8 ビットしかないときは、6 ビットの 1 つと 2 ビットの 1 つで、2 文字を作ります。足りない 4 ビットは、2 ビット目の値を `bsl 4`（4 ビット左へずらす）で埋めます。`Padding` が `true` なら、末尾に `==` を付けて 4 文字に揃えます。

### 6. 端数が 2 バイトだけ残ったとき

```erlang:line-numbers=249
encode_binary(ModeOffset, Padding, <<B1:6, B2:6, B3:4>>, A) ->
    E1 = b64e(B1, ModeOffset),
    E2 = b64e(B2, ModeOffset),
    E3 = b64e(B3 bsl 2, ModeOffset),
    case Padding of
        true -> <<A/bits,E1,E2,E3,$=>>;
        _ -> <<A/bits,E1,E2,E3>>
    end.
```

残りが `<<B1:6, B2:6, B3:4>>` の形（16 ビット）のときは、3 文字を作ります。足りない 2 ビットを `bsl 2` で埋めて、最後に `=` を 1 つ付けます。

## ここがすごい

### 切り出しを、ビット構文の形に任せている

素直に書くと、ビットを 1 つずつ数えてシフトとマスクを繰り返すことになります。この関数は、パターンの形そのもので 6 ビットずつの切り出しを表しています。
端数の場合も、`<<B1:6, B2:2>>` と 16 ビットのパターンで書けるので、場合分けが読みやすくなります。

### 8 文字単位の一括処理

入力が長いと、3 バイトずつ処理すると再帰の回数が多くなります。最初の節は 6 バイトずつ処理し、再帰の回数を減らしています。
`A/bits` の連結も、1 回の再帰で 8 文字分にまとめるので、バイナリを作るための処理回数が減ります。

## まとめ

- Erlang のビット構文を使うと、6 ビット単位の切り出しをパターンだけで書けます。
- 端数は、足りないビットを `bsl` でそろえてから、`=` で埋めます。
- 入力の長さに応じて、一度に扱う量を変えると、再帰の回数を減らせます。
