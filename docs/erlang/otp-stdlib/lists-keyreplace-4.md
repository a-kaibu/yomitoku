---
title: "タプルのリストで、キーが一致する最初の要素を新しい値に置き換える"
description: "lists:keyreplace/4 は、タプルのリストから、指定の位置が Key と一致する最初の要素を New で置き換える。置き換えるのは一度きりで、後ろは変えない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1423, 1430]
function: "lists:keyreplace/4"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`lists:keyreplace/4` は、タプルのリストから、キーが一致する最初のタプルを、新しいタプル `New` で置き換えます。
消して別のものを入れる `keydelete` と、位置を保ったまま中身を入れ替える `keyreplace` は、使いどころが違います。

## コード

```erlang:line-numbers=1423
keyreplace(K, N, L, New) when is_integer(N), N > 0, is_tuple(New) ->
    keyreplace3(K, N, L, New).

keyreplace3(Key, Pos, [Tup|Tail], New) when element(Pos, Tup) == Key ->
    [New|Tail];
keyreplace3(Key, Pos, [H|T], New) ->
    [H|keyreplace3(Key, Pos, T, New)];
keyreplace3(_, _, [], _) -> [].
```

## 前提知識

- **キー位置 `Pos`**: タプルの何番目の要素を、キーとして比べるかです。`1` から数えます。
- **`New`**: 置き換えに使う新しいタプルです。ガードで、タプルであることを確かめています。
- **`element/2`**: タプルの指定位置の要素を取り出します。
- **`==` での比べ方**: 値として等しいかを比べます。`1` と `1.0` は一致します。

## 何をしているか

### 1. 入口で、引数の形を確かめる

```erlang:line-numbers=1423
keyreplace(K, N, L, New) when is_integer(N), N > 0, is_tuple(New) ->
    keyreplace3(K, N, L, New).
```

`keyreplace/4` は、`N` が正の整数で、`New` がタプルであることを確かめてから、`keyreplace3/4` に仕事を渡します。

### 2. 一致した最初のタプルを、新しいものに替える

```erlang:line-numbers=1426
keyreplace3(Key, Pos, [Tup|Tail], New) when element(Pos, Tup) == Key ->
    [New|Tail];
```

先頭のタプルの `Pos` 番目が `Key` と等しければ、そのタプルを `New` に替えます。残りのリスト `Tail` は、そのまま結果に続けます。
この節は一度だけ使われ、以降は替わりません。

### 3. 一致しなければ、残す

```erlang:line-numbers=1428
keyreplace3(Key, Pos, [H|T], New) ->
    [H|keyreplace3(Key, Pos, T, New)];
```

一致しない要素は、そのまま結果に残します。残りに対して、同じ関数を呼びます。

### 4. 空になったら終わる

```erlang:line-numbers=1430
keyreplace3(_, _, [], _) -> [].
```

リストが空になったら、空のリストを返します。

## ここがすごい

### 置き換えても、長さは変わらない

`keydelete` は要素を消しますが、`keyreplace` は要素を一つ差し替えるだけです。
リストの長さは変わらないので、要素の位置を保ったまま、中身だけを更新したいときに向いています。

### 最初の一つだけを替える

一致が複数あっても、替えるのは最初の一つです。後ろの同じキーは、元の値のままです。
この一度きりの動きが、節の形そのものに表れています。

### 節の順で、替える場所を決める

替える節と残す節は、ガードの条件だけで分かれています。
関数の中で位置を数えたり、フラグを持ったりしていません。読み手は、節の並びから、動きを追えます。

## まとめ

`lists:keyreplace(b, 1, [{a, 1}, {b, 2}, {b, 3}], {b, 9})` は、`[{a, 1}, {b, 9}, {b, 3}]` を返します。
最初の `{b, 2}` だけが替わり、後ろの `{b, 3}` は残ります。
