---
title: "キューの中に、値が含まれるかを二つのリストから探す"
description: "queue:member/2 は、二つのリストに分かれたキューの両方を、リストの member で調べる。キューの形が正しくないときは badarg を投げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/queue.erl
lines: [261, 264]
function: "queue:member/2"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "エラー処理"]
---
## ひとことで

`queue:member/2` は、キューの中に値が入っているかを `true` か `false` で返します。
キューは、二つのリストで表されています。この関数は、両方のリストを順に調べて、どちらかに値があれば `true` を返します。

## コード

```erlang:line-numbers=261
member(X, {R,F}) when is_list(R), is_list(F) ->
    lists:member(X, R) orelse lists:member(X, F);
member(X, Q) ->
    erlang:error(badarg, [X,Q]).
```

## 前提知識

- **キューの表現**: `{R, F}` の二つのリストで、一列の並びを表します。`F` は先頭側の要素を、`R` は後ろから入ってきた要素を逆順に持ちます。
- **`lists:member/2`**: リストの中に値があるかを、先頭から調べる関数です。
- **`orelse`**: 左が `true` なら右を調べずに `true` を返す、短絡の論理和です。
- **`erlang:error(badarg, ...)`**: 引数の形が正しくないときに、エラーを投げる関数です。

## 何をしているか

### 1. 正しいキューなら、二つのリストを調べる

```erlang:line-numbers=261
member(X, {R,F}) when is_list(R), is_list(F) ->
    lists:member(X, R) orelse lists:member(X, F);
```

`R` と `F` が、どちらもリストであれば、`lists:member/2` で両方を調べます。
`orelse` の左で `R` に見つかれば、右の `F` は調べません。見つからなければ、`F` を調べます。

### 2. 形が正しくないなら、エラーを投げる

```erlang:line-numbers=263
member(X, Q) ->
    erlang:error(badarg, [X,Q]).
```

キューの形でない値が渡されたときは、どの節にも当たらないので、`badarg` のエラーを投げます。投げるときは、引数を一緒に残します。

## ここがすごい

### 短絡の論理和で、無駄な調べを避ける

`orelse` は、左が `true` なら右を評価しません。
`R` に値が見つかれば、`F` は調べなくて済みます。キューの両方を調べる処理を、一行で、しかも効率よく書いています。

### 形の確かめを、節の並びで表す

最初の節は、キューの形が正しいときだけに当たります。
二つ目の節は、それ以外のすべての値に当たります。関数の中で `if` を使わず、節の順番で正しい場合と誤りの場合を分けています。

### エラーの内容を、引数に残す

`erlang:error(badarg, [X, Q])` の第二引数には、呼び出されたときの引数を入れます。
失敗したときに、どの値とどのキューで呼ばれたかが、エラーの情報に残ります。

### 比べる順番は、前のリストから

`R` の値は、先頭から比べられ、見つかればそこで止まります。
`F` は、その後で調べられます。どちらも、リストの並びに沿って順番に比べるので、順番を変えても結果は同じです。

## まとめ

`queue:member(2, queue:from_list([1, 2, 3]))` は、`true` を返します。
引数がキューでない値のときは、`badarg` のエラーになります。
