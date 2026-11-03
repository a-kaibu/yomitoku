---
title: "区切り文字を見つけるたびに、語を切り出して積む"
description: "string:lexemes/2 の内部 lexemes_m/3 は、文字列を区切り文字で分けて、空でない語だけを集める。文字列、バイナリ、コードポイントの 3 つの形を、それぞれの経路で処理する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [1936, 1984]
function: "string:lexemes_m/3"
difficulty: 3
format: 2
tags: ["文字列処理", "パース", "Unicode"]
---
## ひとことで

`string:lexemes/2` は、文字列を区切り文字で分けて、空でない語（レキシム）の一覧を返します。内部で動く `lexemes_m/3` は、文字列を先頭から読みながら、区切り文字に出会うたびに語を切り出します。
入力は、コードポイントのリスト、UTF-8 のバイナリ、それらが混ざったリストのどれでも扱えます。

## コード

```erlang:line-numbers=1936
lexemes_m([CP|_]=Cs0, {GCs,CPs,_}=Seps0, Ts) when is_integer(CP) ->
    case lists:member(CP, CPs) of
        true ->
            [GC|Cs2] = unicode_util:gc(Cs0),
            case lists:member(GC, GCs) of
                true ->
                    lexemes_m(Cs2, Seps0, Ts);
                false ->
                    Seps = search_compile(Seps0),
                    {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
                    lexemes_m(Rest, Seps, [Lexeme|Ts])
            end;
        false ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
            lexemes_m(Rest, Seps, [Lexeme|Ts])
    end;
lexemes_m([Bin|Cont0], {GCs,_,_}=Seps0, Ts) when is_binary(Bin) ->
    case bin_search_inv(Bin, Cont0, GCs) of
        {nomatch,Cont} ->
            lexemes_m(Cont, Seps0, Ts);
        Cs ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs, Seps, []),
            lexemes_m(Rest, Seps, [Lexeme|Ts])
    end;
lexemes_m(Cs0, {GCs, _, _}=Seps0, Ts) when is_list(Cs0) ->
    case unicode_util:gc(Cs0) of
        [C|Cs] ->
            case lists:member(C, GCs) of
                true  ->
                    lexemes_m(Cs, Seps0, Ts);
                false ->
                    Seps = search_compile(Seps0),
                    {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
                    lexemes_m(Rest, Seps, [Lexeme|Ts])
            end;
        [] ->
            lists:reverse(Ts)
    end;
lexemes_m(Bin, {GCs,_,_}=Seps0, Ts) when is_binary(Bin) ->
    case bin_search_inv(Bin, [], GCs) of
        {nomatch,_} ->
            lists:reverse(Ts);
        [Cs] ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs, Seps, []),
            lexemes_m(Rest, Seps, add_non_empty(Lexeme,Ts))
    end.
```

## 前提知識

- **レキシム（lexeme）**: 区切り文字で分けられた、空でない語のことです。たとえば `"a  b"` を空白で分けると、`"a"` と `"b"` になります。
- **書記素（grapheme）**: 見た目の 1 文字です。`unicode_util:gc/1` は、先頭の書記素を取り出します。
- **`lists:member/2`**: リストに値が含まれるかを調べます。
- **区切り文字の集合 `Seps`**: 書記素の一覧 `GCs`、コードポイントの一覧 `CPs` などをまとめた値です。区切りを素早く調べるために、前もって整えておきます。
- **`lexeme_pick/3`**: 区切り文字の手前までを切り出して、残りと一緒に返す補助関数です。
- **`bin_search_inv/3`**: バイナリの中で、区切り文字ではない位置を探す補助関数です。

## 何をしているか

### 1. 先頭がコードポイントのとき

```erlang:line-numbers=1936
lexemes_m([CP|_]=Cs0, {GCs,CPs,_}=Seps0, Ts) when is_integer(CP) ->
    case lists:member(CP, CPs) of
        true ->
            [GC|Cs2] = unicode_util:gc(Cs0),
            case lists:member(GC, GCs) of
                true ->
                    lexemes_m(Cs2, Seps0, Ts);
                false ->
                    Seps = search_compile(Seps0),
                    {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
                    lexemes_m(Rest, Seps, [Lexeme|Ts])
            end;
        false ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
            lexemes_m(Rest, Seps, [Lexeme|Ts])
    end;
```

先頭が整数（コードポイント）なら、まずその文字が区切り文字の一覧 `CPs` にあるかを調べます。あれば、書記素を 1 つ読んで、区切りの書記素（`GCs`）かを確かめます。区切りなら読み飛ばします。そうでなければ、語を切り出して `Ts` に積みます。

### 2. 先頭がバイナリのとき

```erlang:line-numbers=1953
lexemes_m([Bin|Cont0], {GCs,_,_}=Seps0, Ts) when is_binary(Bin) ->
    case bin_search_inv(Bin, Cont0, GCs) of
        {nomatch,Cont} ->
            lexemes_m(Cont, Seps0, Ts);
        Cs ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs, Seps, []),
            lexemes_m(Rest, Seps, [Lexeme|Ts])
    end;
```

バイナリの中を探して、区切りでない位置から語を切り出します。見つからなければ、残りを次の段階へ回します。

### 3. 文字列の残りを読むとき

```erlang:line-numbers=1962
lexemes_m(Cs0, {GCs, _, _}=Seps0, Ts) when is_list(Cs0) ->
    case unicode_util:gc(Cs0) of
        [C|Cs] ->
            case lists:member(C, GCs) of
                true  ->
                    lexemes_m(Cs, Seps0, Ts);
                false ->
                    Seps = search_compile(Seps0),
                    {Lexeme,Rest} = lexeme_pick(Cs0, Seps, []),
                    lexemes_m(Rest, Seps, [Lexeme|Ts])
            end;
        [] ->
            lists:reverse(Ts)
    end;
```

リストの先頭の書記素 `C` が区切りなら、読み飛ばします。そうでなければ語を切り出します。残りが空になったら、`Ts` を反転して結果にします。
反転するのは、語を先頭から積んだので、最後に順番を戻すためです。

### 4. 末尾のバイナリ

```erlang:line-numbers=1976
lexemes_m(Bin, {GCs,_,_}=Seps0, Ts) when is_binary(Bin) ->
    case bin_search_inv(Bin, [], GCs) of
        {nomatch,_} ->
            lists:reverse(Ts);
        [Cs] ->
            Seps = search_compile(Seps0),
            {Lexeme,Rest} = lexeme_pick(Cs, Seps, []),
            lexemes_m(Rest, Seps, add_non_empty(Lexeme,Ts))
```

最後にバイナリが残ったときは、区切りでない部分を探します。見つかった語を、空でなければ `add_non_empty/2` で積みます。見つからなければ、ここまでの語を返して終わります。

## ここがすごい

### 区切りの判定を、書記素とコードポイントで使い分ける

区切りが 1 つのコードポイントなら、比べるのは数値の一覧で十分です。書記素の区切りは、結合文字を含むので、書記素単位で比べる必要があります。
この関数は、区切りの種類に応じて、比べる単位を変えています。文字の単位を取り違えないための工夫です。

### 文字列とバイナリを、同じ規則で行き来する

入力は、途中でリストからバイナリへ変わることがあります。この関数は、どの形からでも続きを処理できるように、節をそろえています。
利用者から見れば、入力の形を気にせず、同じ結果が得られます。

## まとめ

- 区切りで分ける処理は、語を見つけるたびに切り出して積むと、一度の走査で終わります。
- 区切りの判定は、文字の単位（書記素かコードポイントか）をそろえることが大切です。
- 語を積んだ後で反転すると、元の順番を保てます。
