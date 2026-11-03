---
title: "大文字と小文字をそろえるとき、変わらなければ元の値をそのまま返す"
description: "string:casefold/1 は、文字列を大文字・小文字を区別しない形にそろえる。変わる文字がなければ、途中で unchanged を投げて、元の値を無駄なくそのまま返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [726, 738]
function: "string:casefold/1"
difficulty: 3
format: 2
tags: ["文字列処理", "Unicode", "最適化"]
---
## ひとことで

`string:casefold/1` は、文字列を比較しやすい形（大文字と小文字をそろえた形）に変換します。たとえば `"Straße"` は、比べるときに `"strasse"` に近い形になります。
ただし、もとの文字列に変えるべき文字がなければ、新しい文字列を作らず、元の値をそのまま返します。

## コード

```erlang:line-numbers=726
casefold(CD) when is_list(CD) ->
    try casefold_list(CD, false)
    catch unchanged -> CD
    end;
casefold(<<CP1/utf8, Rest/binary>>=Orig) ->
    try casefold_bin(CP1, Rest, false) of
        List -> unicode:characters_to_binary(List)
    catch unchanged -> Orig
    end;
casefold(<<>>) ->
    <<>>;
casefold(Bin) ->
    error({badarg, Bin}).
```

## 前提知識

- **casefold**: 大文字と小文字の違いを消すための変換です。比較のために使います。
- **リストとバイナリ**: 文字列は、コードポイントのリストか、UTF-8 のバイナリで渡せます。
- **`<<CP1/utf8, Rest/binary>>`**: UTF-8 のバイナリから、先頭の 1 文字（コードポイント）を取り出すパターンです。
- **`try ... of ... catch ... end`**: 正常時と、例外時の結果を分けて書きます。ここでは `throw` で途中の処理を止めます。
- **`throw(unchanged)`**: 変換の途中で「変わる文字がない」と分かったら、この値を投げて、外の `catch` で受け取ります。
- **`unicode:characters_to_binary/1`**: コードポイントのリストを UTF-8 のバイナリに変えます。

## 何をしているか

### 1. リストで渡されたとき

```erlang:line-numbers=726
casefold(CD) when is_list(CD) ->
    try casefold_list(CD, false)
    catch unchanged -> CD
    end;
```

リストなら、`casefold_list/2` で変換します。途中で変える文字がないと分かれば、`unchanged` が投げられ、`catch` で受け取って、元の `CD` を返します。

### 2. バイナリで渡されたとき

```erlang:line-numbers=730
casefold(<<CP1/utf8, Rest/binary>>=Orig) ->
    try casefold_bin(CP1, Rest, false) of
        List -> unicode:characters_to_binary(List)
    catch unchanged -> Orig
    end;
```

バイナリでは、先頭の 1 文字を取り出して `casefold_bin/3` に渡します。結果のリストを、`unicode:characters_to_binary/1` でバイナリに戻します。変わる文字がなければ、同じく元の `Orig` を返します。

### 3. 空のバイナリ

```erlang:line-numbers=735
casefold(<<>>) ->
    <<>>;
```

空のバイナリは、そのまま空を返します。

### 4. それ以外

```erlang:line-numbers=737
casefold(Bin) ->
    error({badarg, Bin}).
```

リストでもバイナリでもない値は、`badarg` の代わりに `error` を起こします。

## ここがすごい

### 変わらないなら、作り直さない

変換しても結果が同じ文字列になることは、よくあります。その場合にも、新しい文字列を作ると、メモリや時間を無駄にします。
この関数は、変える文字が出てきたときだけ新しい結果を作り、変わらなければ `throw` で元の値を返します。「何も変えない」を、特別な早道として扱っています。

### 例外を、普通の制御の流れに使う

`throw` は、本来はエラーを伝えるための仕組みです。しかしこの関数では、「途中で変換をやめて、元の値を返す」という通常の流れに使っています。
`catch` の範囲を、変換の本体だけに絞っているので、ほかの例外と混ざる心配がありません。

## まとめ

- 変換の結果が元と同じになる場合は、新しい値を作らずに元を返すと、無駄を省けます。
- `throw` と `catch` を、早期の打ち切りに使うと、途中での抜け出しを簡単に書けます。
- 文字列は、リストとバイナリの両方で、同じ変換の規則に従うように揃えています。
