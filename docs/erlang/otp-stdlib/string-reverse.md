---
title: "文字列を逆順にするとき、見た目の 1 文字ごとに入れ替える"
description: "string:reverse/1 は、文字列の順番を逆にする。コードポイント単位ではなく書記素単位で入れ替えるので、結合文字が元の文字から離れない。ASCII だけの部分は、速い経路で処理する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [364, 367]
function: "string:reverse/1"
difficulty: 3
format: 2
tags: ["文字列処理", "Unicode", "最適化"]
---
## ひとことで

`string:reverse/1` は、文字列の並びを逆にします。ただし、1 文字ずつ逆にするのではなく、見た目の 1 文字（書記素）ごとに逆にします。
たとえば `"ế"` のように、基本の文字と結合記号からなる文字は、まとまりとして扱われます。そのため、逆にしても記号が前の文字に付いたままになります。

## コード

```erlang:line-numbers=364
reverse(<<CP1/utf8, Rest/binary>>) ->
    reverse_b(Rest, CP1, []);
reverse(CD) ->
    reverse_1(CD, []).
```

## 前提知識

- **書記素（grapheme）**: 見た目で 1 文字に見えるまとまりです。結合記号を含むことがあります。
- **コードポイント**: Unicode の 1 つの番号です。書記素は、1 個以上のコードポイントからできています。
- **`unicode_util:gc/1`**: 先頭の書記素を 1 つ取り出す関数です。
- **ASCII の範囲**: 0 から 127 の文字です。英数字や記号の多くが含まれます。このコードでは、0 から 255 の範囲（Latin-1 の文字まで）を速い経路の対象にしています。
- **`?ASCII_LIST(CP1, CP2)` のマクロ**: 2 つのコードポイントが、どちらも速い経路の範囲に入るかを確かめます。

## 何をしているか

### 1. バイナリの入り口

```erlang:line-numbers=364
reverse(<<CP1/utf8, Rest/binary>>) ->
    reverse_b(Rest, CP1, []);
```

UTF-8 のバイナリなら、先頭の 1 文字を取り出して `reverse_b/3` に渡します。バイナリのまま処理して、途中でリストに変えずに済ませます。

### 2. その他（リストなど）

```erlang:line-numbers=366
reverse(CD) ->
    reverse_1(CD, []).
```

それ以外は、`reverse_1/2` に渡して、空の結果から積み上げます。

### 3. 速い経路（`reverse_1` の 1 つ目の節）

```erlang:line-numbers=1238
reverse_1([CP1|[CP2|_]=Cont], Acc) when ?ASCII_LIST(CP1,CP2) ->
    reverse_1(Cont, [CP1|Acc]);
```

次の文字も ASCII の範囲なら、書記素の確認を省いて、先頭の文字をそのまま結果に積みます。ASCII の文字どうしは、結合記号で結ばれることがないので、この近道が正しい結果になります。

### 4. 一般の経路

```erlang:line-numbers=1240
reverse_1(CD, Acc) ->
    case unicode_util:gc(CD) of
        [GC|Rest] -> reverse_1(Rest, [GC|Acc]);
        [] -> Acc;
        {error, Err} -> error({badarg, Err})
    end.
```

それ以外では、`unicode_util:gc/1` で先頭の書記素 `GC` を取り出し、そのまま積みます。空になったら、積み上げた結果を返します。エラーのときは `badarg` 相当で報告します。

## ここがすごい

### 書記素を単位にすると、見た目が崩れない

文字を 1 コードポイントずつ逆にすると、結合記号が前の文字から離れて、別の位置に付いてしまいます。この関数は、書記素のまとまりを 1 つの単位として積みます。
逆順にしても、見た目の 1 文字が壊れません。

### ASCII の近道で、普通の文字列を速くする

大部分の文字列は ASCII の文字だけです。それらは結合記号を含まないので、書記素の確認が要りません。近道を先に置いて、一般の経路は例外的な場合だけに使います。
正しさを保ったまま、よくある入力を速くする工夫です。

## まとめ

- 文字列の反転は、コードポイントではなく書記素の単位で行うと、見た目が崩れません。
- ASCII の範囲だけなら、結合記号の心配がないので、速い経路を使えます。
- 正しさを変えずに速くする経路は、先頭の節に置くと、読み手にも意図が伝わります。
