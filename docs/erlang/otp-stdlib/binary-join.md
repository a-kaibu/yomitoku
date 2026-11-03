---
title: "バイナリを区切り文字でつなぐとき、途中で作り直さない"
description: "binary:join/2 は、区切り文字を挟んでバイナリをつなぐ。追記先を同じプロセス内で作ったバイナリにすると、BEAM の private-append 最適化が効き、毎回コピーしなくて済む。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2010-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/binary.erl
lines: [1123, 1138]
function: "binary:join/2"
difficulty: 3
format: 2
tags: ["文字列処理", "最適化", "標準ライブラリ"]
---
## ひとことで

`binary:join/2` は、バイナリのリストを、区切り文字（`Separator`）を挟んで 1 つのバイナリにします。たとえば `[<<"a">>, <<"b">>]` を `<<", ">>` で区切ると、`<<"a, b">>` になります。
ドキュメントにあるとおり、`iolist_to_binary(lists:join(...))` と同じ結果を、より速く作るための関数です。

## コード

::: code-group

```erlang:line-numbers=1123 [日本語訳]
join([], Separator) when is_binary(Separator) -> <<>>;
join([H], Separator) when is_binary(H), is_binary(Separator) -> H;
join([H | T]=List, Separator) when is_binary(Separator) ->
    try
        Acc = <<>>,                             %private-append 最適化を有効にする
        join(T, Separator, <<Acc/binary, H/binary>>)
    catch
        error:_ ->
            badarg_with_info([List, Separator])
    end;
join(Arg, Separator) ->
    badarg_with_info([Arg, Separator]).

join([], _Separator, Acc) -> Acc;
join([H | T], Separator, Acc) ->
    join(T, Separator, <<Acc/binary, Separator/binary, H/binary>>).
```

```erlang:line-numbers=1123 [原文]
join([], Separator) when is_binary(Separator) -> <<>>;
join([H], Separator) when is_binary(H), is_binary(Separator) -> H;
join([H | T]=List, Separator) when is_binary(Separator) ->
    try
        Acc = <<>>,                             %Enable private-append optimization
        join(T, Separator, <<Acc/binary, H/binary>>)
    catch
        error:_ ->
            badarg_with_info([List, Separator])
    end;
join(Arg, Separator) ->
    badarg_with_info([Arg, Separator]).

join([], _Separator, Acc) -> Acc;
join([H | T], Separator, Acc) ->
    join(T, Separator, <<Acc/binary, Separator/binary, H/binary>>).
```

:::

## 前提知識

- **バイナリ**: 変更できない、バイト列の値です。`<<"abc">>` のように書きます。
- **`<<Acc/binary, H/binary>>`**: `Acc` の後ろに `H` をつないだ新しいバイナリを作る書き方です。
- **private-append 最適化**: BEAM（Erlang の実行環境）が、プロセスが作ったばかりのバイナリに追記するとき、コピーを避けて末尾に足す仕組みです。追記を繰り返すときに、毎回全体をコピーせずに済みます。
- **`try ... catch error:_`**: 途中で起きたエラーを捕まえて、`badarg` として報告します。
- **`badarg_with_info/1`**: 引数が不正なことを、詳しい情報付きで報告する関数です。

## 何をしているか

### 1. 要素が 0 個か 1 個のとき

```erlang:line-numbers=1123
join([], Separator) when is_binary(Separator) -> <<>>;
join([H], Separator) when is_binary(H), is_binary(Separator) -> H;
```

空のリストは空のバイナリを返します。要素が 1 つなら、その要素をそのまま返します。区切り文字は、間に入る必要がないので使いません。

### 2. 要素が 2 個以上のとき

```erlang:line-numbers=1125
join([H | T]=List, Separator) when is_binary(Separator) ->
    try
        Acc = <<>>,                             %Enable private-append optimization
        join(T, Separator, <<Acc/binary, H/binary>>)
    catch
        error:_ ->
            badarg_with_info([List, Separator])
    end;
```

先頭の要素 `H` で、`Acc` を `<<>>` から作り、そこに `H` をつないだバイナリを初期値にします。そして、残りの要素を `join/3` で追記していきます。
コード中のコメントにあるとおり、`Acc = <<>>` と書いて `<<Acc/binary, H/binary>>` と連結するのが、private-append 最適化を有効にするための書き方です。エラーが起きたら、`badarg` として報告します。

### 3. 残りの要素を追記する

```erlang:line-numbers=1136
join([], _Separator, Acc) -> Acc;
join([H | T], Separator, Acc) ->
    join(T, Separator, <<Acc/binary, Separator/binary, H/binary>>).
```

`join/3` は、残りの要素 `H` を 1 つずつ、区切り文字と一緒に `Acc` の後ろにつなぎます。`Acc` は、追記のたびに新しいバイナリになりますが、最適化によって末尾に足すだけで済みます。
最後に、リストが空になったら、`Acc` をそのまま返します。

## ここがすごい

### 作り直さない、ように作る

素朴に `<<A/binary, Sep/binary, B/binary>>` と書き続けると、そのたびに全体をコピーする、と考えることもあります。しかし、同じプロセスで作ったバイナリに追記していれば、BEAM は末尾に足すだけで済ませられます。
この関数は、その最適化が効く形（`<<>>` から始めて、同じバイナリに追記する形）を、わざと選んでいます。

### 最適化を、コメントで読み手に伝える

`Acc = <<>>` という一見無駄な行には、「private-append 最適化を有効にする」というコメントが付いています。
この 1 行がないと、後から読む人が「初期値として不要」と判断して消してしまうかもしれません。コメントは、性能の理由を残すための、大切な記録です。

## まとめ

- バイナリを何度も連結するときは、同じプロセス内で追記する形にすると、コピーを減らせます。
- 最適化の前提を満たすための書き方には、理由をコメントで残すと、後の保守で壊れにくくなります。
- 要素が 0 個や 1 個の場合を先に処理すると、区切りの扱いを単純にできます。
