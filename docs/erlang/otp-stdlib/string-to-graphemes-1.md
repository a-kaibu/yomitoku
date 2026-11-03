---
title: "文字列を、見た目の一文字ずつのリストに分ける"
description: "string:to_graphemes/1 は、文字列を書記素クラスタ（見た目の一文字）に分けたリストを返す。結合文字や絵文字の並びも、一つの要素にまとめる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [277, 282]
function: "string:to_graphemes/1"
difficulty: 2
format: 2
tags: ["文字列処理", "Unicode", "標準ライブラリ"]
---
## ひとことで

`string:to_graphemes/1` は、文字列を書記素クラスタ（grapheme cluster）の並びに分けます。
書記素クラスタは、人が見て一文字だと感じる単位です。たとえば、ア と濁点の組み合わせは、一つの単位として扱われます。

## コード

```erlang:line-numbers=277
to_graphemes(CD0) ->
    case unicode_util:gc(CD0) of
        [GC|CD] -> [GC|to_graphemes(CD)];
        [] -> [];
        {error, Err} -> error({badarg, Err})
    end.
```

## 前提知識

- **コードポイント**: Unicode の一つ一つの文字番号です。一つの見た目の文字が、複数のコードポイントでできていることがあります。
- **書記素クラスタ（grapheme cluster）**: 見た目で一文字と感じる単位です。結合文字や、絵文字の肌色の修飾などを含みます。
- **`unicode_util:gc/1`**: 文字列の先頭から、一つの書記素クラスタを取り出す関数です。戻り値は、`[GC | 残り]` の形です。
- **`{error, Err}`**: 文字列の中に、正しくない符号化があったときの戻り値です。

## 何をしているか

### 1. 先頭の書記素クラスタを取り出す

```erlang:line-numbers=278
    case unicode_util:gc(CD0) of
        [GC|CD] -> [GC|to_graphemes(CD)];
```

`unicode_util:gc/1` で、先頭の書記素クラスタ `GC` と残りの文字列 `CD` を分けます。
`GC` を先頭に置き、残りについて同じ関数を再帰で呼びます。

### 2. 文字列の終わりで止める

```erlang:line-numbers=280
        [] -> [];
```

残りが空になったら、空のリストを返します。ここで再帰が終わります。

### 3. 正しくない符号化は、エラーにする

```erlang:line-numbers=281
        {error, Err} -> error({badarg, Err})
```

`unicode_util:gc/1` が `{error, Err}` を返したときは、`error({badarg, Err})` で例外を投げます。
黙って誤った結果を返さず、どこで壊れていたかを呼び出し側に知らせます。

## ここがすごい

### 再帰の形を、そのまま書く

この関数は、先頭の一つを取り、残りに同じ関数を適用するだけです。
リストを作る処理も、一つずつ前に付けていく形なので、再帰の形がそのまま結果の形になります。

### 見た目の単位を、Unicode の規則に任せる

どこまでを一文字とみなすかは、Erlang の中で独自に決めていません。
`unicode_util:gc/1` が、Unicode の規則に従って区切りを決めます。だから、新しい絵文字や結合文字にも、同じ仕組みで対応できます。

### 失敗は値にせず、例外にする

区切れない文字列は、空のリストや途中までの結果ではなく、例外になります。
呼び出し側は、エラーがあったという事実を、見落とさずに扱えます。

## まとめ

`string:to_graphemes("abc")` は、`"abc"` の各文字を一つずつ並べた、`[97, 98, 99]` 相当のリストを返します。
結合文字を含む文字列でも、見た目の一文字は、一つの要素としてまとめられます。
