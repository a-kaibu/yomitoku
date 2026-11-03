---
title: "文字列の中の検索パターンを、別の文字列に置き換える"
description: "string:replace/3 は、文字列を検索パターンで分割し、その間に置き換え文字列を挟んで組み直す。分割と結合を組み合わせて、置き換えを一行で書いている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [908, 909]
function: "string:replace/3"
difficulty: 2
format: 2
tags: ["文字列処理", "標準ライブラリ", "イディオム"]
---
## ひとことで

`string:replace/3` は、文字列の中にある検索パターンを、別の文字列に置き換えます。
すべての出現箇所を置き換えるのが、この関数の動きです。置き換えそのものを書くのではなく、「分割して、間に挟んで、つなぐ」という形で作っています。

## コード

```erlang:line-numbers=908
replace(String, SearchPattern, Replacement) ->
    lists:join(Replacement, split(String, SearchPattern)).
```

## 前提知識

- **`string:split/2`**: 文字列を、検索パターンの出現箇所で区切り、リストにします。区切られた部分は、検索パターンそのものは含みません。
- **`lists:join(Sep, List)`**: リストの要素と要素の間に `Sep` を一つずつ挟みます。最初と最後には挟みません。
- **`unicode:chardata()`**: 文字列を表す型です。`"abc"` のような文字列、`<<"abc">>` のようなバイナリ、文字のリストなど、いずれも渡せます。
- **分割と結合**: 置き換えは、「区切る」と「挟んでつなぐ」の二段階で表せます。

## 何をしているか

関数の本体は、一行だけです。

### 1. 検索パターンの位置で区切る

```erlang:line-numbers=908
replace(String, SearchPattern, Replacement) ->
    lists:join(Replacement, split(String, SearchPattern)).
```

`split(String, SearchPattern)` で、文字列を検索パターンの位置で区切ります。たとえば、`"a-b-c"` を `-` で区切ると、`["a", "b", "c"]` になります。

### 2. 区切りの間に、置き換え文字列を挟む

`lists:join(Replacement, ...)` で、部分と部分の間に `Replacement` を挟みます。`"a-b-c"` を `-` から `+` に置き換えるなら、`["a", "b", "c"]` の間に `"+"` を挟み、`["a", "+", "b", "+", "c"]` を作ります。これを結合すると `"a+b+c"` になります。
検索パターンが見つからないときは、区切る場所がないので、元の文字列だけを要素に持つリストになります。挟むものがないので、置き換えは起きません。

## ここがすごい

### 置き換えを「区切り」と「挟む」に分ける

よくある置き換えは、先頭から一つずつ探して書き換える、という手続きで書かれます。
この関数は、そのような手続きを書きません。区切った位置を覚えておくだけで、残りは `lists:join` が挟んでくれます。
検索と書き換えを分けたので、各部分は、ただ並べるだけで済みます。

### 挟む処理を一つの関数に任せる

`lists:join` は、要素の間に区切りを入れる、という一つの仕事だけをします。
この関数は、その仕事を借りることで、置き換えのための新しいループを書いていません。
「分ける」「挟む」という二つの部品を組み合わせるだけで、置き換えが表せることを、この一行が示しています。

## まとめ

`string:replace("a-b-c", "-", "+")` は、`"a+b+c"` 相当の値を返します。
戻り値は、文字列を表すリストです。出力したいときは、そのまま結合して使えます。
