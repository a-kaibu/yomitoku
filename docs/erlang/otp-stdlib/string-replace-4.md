---
title: "文字列の検索パターンを、指定した位置だけ置き換える"
description: "string:replace/4 は、検索パターンの出現箇所のうち、leading、trailing、all のどれを置き換えるかを Where で選ぶ。分割して置き換え文字列を挟み、つなぐ形は replace/3 と同じ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [938, 939]
function: "string:replace/4"
difficulty: 2
format: 2
tags: ["文字列処理", "標準ライブラリ", "イディオム"]
---
## ひとことで

`string:replace/4` は、文字列の中の検索パターンを、別の文字列に置き換えます。
`replace/3` と違い、四つ目の引数 `Where` で、置き換える場所を選べます。`leading` は最初の一つだけ、`trailing` は最後の一つだけ、`all` はすべてです。

## コード

```erlang:line-numbers=938
replace(String, SearchPattern, Replacement, Where) ->
    lists:join(Replacement, split(String, SearchPattern, Where)).
```

## 前提知識

- **`string:split/3`**: 文字列を検索パターンで区切ります。`Where` の値で、どの出現箇所で区切るかが決まります。
- **`lists:join/2`**: リストの要素と要素の間に、指定の値を挟みます。
- **`Where`**: `leading`、`trailing`、`all` のいずれかです。区切る場所を指定します。
- **置き換え文字列 `Replacement`**: 区切りの位置に挟まれる文字列です。

## 何をしているか

関数の本体は、一行だけです。処理は、次の二段階です。

### 1. 指定の場所で区切る

```erlang:line-numbers=938
replace(String, SearchPattern, Replacement, Where) ->
```

`split(String, SearchPattern, Where)` で、文字列を、`Where` が指定する出現箇所で区切ります。区切られた部分のリストを作ります。

### 2. 区切りの間に、置き換え文字列を挟む

```erlang:line-numbers=939
    lists:join(Replacement, split(String, SearchPattern, Where)).
```

`lists:join(Replacement, ...)` で、区切られた部分と部分の間に、`Replacement` を挟みます。結果を結合すると、置き換えられた文字列になります。

## ここがすごい

### 置き換える場所を、引数の値で選ぶ

「最初だけ置き換える」「最後だけ置き換える」「すべて置き換える」という違いを、関数を三つに分けず、`Where` という一つの値で表しています。
実際の区切りは `split/3` が担当するので、この関数は、挟んでつなぐ作業に集中できます。

### replace/3 の考えを、そのまま広げる

`replace/3` は、すべての出現箇所を置き換えます。`replace/4` は、同じ二段階の流れで、区切り方だけを増やしています。
読み手は、`replace/3` を理解していれば、この関数の残りの部分は、すぐに読み取れます。

### 区切りの方向は、split に任せる

どこで区切るかは、`split/3` の仕事です。
この関数が行うのは、区切られたものを、置き換え文字列で組み直すことだけです。役割が二つに分かれているので、それぞれの関数が、短く保たれています。

## まとめ

`string:replace("a-b-c", "-", "+", leading)` は、`"a+b-c"` 相当の値を返します。
最初の `-` だけが `+` に替わり、後ろの `-` は残ります。
