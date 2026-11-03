---
title: "文字列を大文字にし、変わらなければ元の値をそのまま返す"
description: "string:uppercase/1 は、文字列の小文字を大文字に変える。変換が起きなければ、例外 unchanged で途中を抜け、元の文字列を同じ値のまま返す。リストとバイナリの両方を扱う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [639, 651]
function: "string:uppercase/1"
difficulty: 3
format: 2
tags: ["文字列処理", "Unicode", "標準ライブラリ"]
---
## ひとことで

`string:uppercase/1` は、文字列の中の小文字を大文字に変えて返します。
文字列は、文字のリストでも、UTF-8 のバイナリでも渡せます。もともと全部大文字なら、新しい文字列は作らず、元の値をそのまま返します。

## コード

```erlang:line-numbers=639
uppercase(CD) when is_list(CD) ->
    try uppercase_list(CD, false)
    catch unchanged -> CD
    end;
uppercase(<<CP1/utf8, Rest/binary>>=Orig) ->
    try uppercase_bin(CP1, Rest, false) of
        List -> unicode:characters_to_binary(List)
    catch unchanged -> Orig
    end;
uppercase(<<>>) ->
    <<>>;
uppercase(Bin) ->
    error({badarg, Bin}).
```

## 前提知識

- **文字列の二つの形**: 文字のリスト（`"abc"`）と、UTF-8 のバイナリ（`<<"abc">>`）です。この関数は、どちらにも対応します。
- **`try ... catch`**: 途中で例外を投げ、外側で捕まえる構文です。ここでは、変化が無かったことを知らせる合図として使っています。
- **`unchanged`**: 変換で一文字も変わらなかったときに投げる例外の名前です。
- **`unicode:characters_to_binary/1`**: 文字のリストを、UTF-8 のバイナリに直します。

## 何をしているか

### 1. 文字のリストの場合

```erlang:line-numbers=639
uppercase(CD) when is_list(CD) ->
    try uppercase_list(CD, false)
    catch unchanged -> CD
    end;
```

リストなら、`uppercase_list/2` で変換を試みます。変換の途中で `unchanged` が投げられたら、`catch` で受け、元の `CD` を返します。

### 2. バイナリの場合

```erlang:line-numbers=643
uppercase(<<CP1/utf8, Rest/binary>>=Orig) ->
    try uppercase_bin(CP1, Rest, false) of
        List -> unicode:characters_to_binary(List)
    catch unchanged -> Orig
    end;
```

バイナリなら、先頭の文字 `CP1` と残り `Rest` に分けて、`uppercase_bin/3` で変換します。変換結果は、`unicode:characters_to_binary/1` でバイナリに戻します。
変わらなかった場合は、`unchanged` を受けて、元のバイナリ `Orig` を返します。

### 3. 空のバイナリ

```erlang:line-numbers=648
uppercase(<<>>) ->
    <<>>;
```

空のバイナリは、そのまま空のバイナリを返します。

### 4. それ以外は、badarg

```erlang:line-numbers=650
uppercase(Bin) ->
    error({badarg, Bin}).
```

文字列でない値が渡されたら、`badarg` のエラーを投げます。

## ここがすごい

### 変化が無ければ、新しい値を作らない

変換の途中で、一文字も変わらないと分かったら、`unchanged` を投げて、元の値をそのまま返します。
新しい文字列を作るコストが省かれるので、すでに大文字の文字列には、ほとんど手間がかかりません。

### 例外を、早い脱出に使う

ループを途中で抜けるための `throw` は、Erlang のよく使われる書き方です。
ここでは、「変化が無かった」という結果を、例外で一気に外側へ運んでいます。正常な戻り値とは別の経路で、特別な場合を扱えます。

### リストとバイナリを、同じ考えで扱う

二つの節は、型ごとに変換の道筋を分けています。ただし、変化が無いときに元の値を返す、という考えは同じです。
型の違いを節で吸収し、呼び出し側は、どちらの形でも同じ関数を使えます。

## まとめ

`string:uppercase("abc")` は、`"ABC"` を返します。
`string:uppercase("ABC")` は、もともと大文字なので、元の値を返します。
