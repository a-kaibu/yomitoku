---
title: "キューの先頭を、取り出さずに覗く"
description: "queue:peek/1 は、キューの先頭の要素を取り出さずに {value, Item} で返し、空なら empty を返す。前のリストが空のときは、後ろのリストの末尾を調べる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/queue.erl
lines: [473, 482]
function: "queue:peek/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "エラー処理"]
---
## ひとことで

`queue:peek/1` は、キューの先頭にある要素を、キューから取り除かずに見ます。
要素があれば `{value, Item}`、キューが空なら `empty` を返します。キューの中身は、呼び出しの前と後で変わりません。

## コード

::: code-group

```erlang:line-numbers=473 [日本語訳]
peek({[],[]}) ->
    empty;
peek({R,[H|_]}) when is_list(R) ->
    {value,H};
peek({[H],[]}) ->
    {value,H};
peek({[_|R],[]}) -> % 形の崩れたキューとして、後ろのリストの末尾を調べる（長さに比例する）
    {value,lists:last(R)};
peek(Q) ->
    erlang:error(badarg, [Q]).
```

```erlang:line-numbers=473 [原文]
peek({[],[]}) ->
    empty;
peek({R,[H|_]}) when is_list(R) ->
    {value,H};
peek({[H],[]}) ->
    {value,H};
peek({[_|R],[]}) -> % malformed queue -> O(len(Q))
    {value,lists:last(R)};
peek(Q) ->
    erlang:error(badarg, [Q]).
```

:::

## 前提知識

- **キューの表現**: `{R, F}` の二つのリストです。`F` は先頭側、`R` は後ろから入った要素を逆順に持ちます。
- **先頭の要素**: `F` が空でないなら、その先頭が次に取り出される要素です。
- **`{value, Item}` と `empty`**: 要素があるかどうかを、戻り値の形で区別する約束です。
- **`lists:last/1`**: リストの最後の要素を返します。

## 何をしているか

### 1. 空のキューなら、empty

```erlang:line-numbers=473
peek({[],[]}) ->
    empty;
```

前のリストも先頭のリストも空なら、キューは空です。`empty` を返します。

### 2. 通常のキューなら、先頭を覗く

```erlang:line-numbers=475
peek({R,[H|_]}) when is_list(R) ->
    {value,H};
```

`F` の先頭 `H` が、いちばん先に取り出される要素です。`R` がリストであれば、`{value, H}` で返します。

### 3. 先頭側が空で、後ろに要素が一つだけある場合

```erlang:line-numbers=477
peek({[H],[]}) ->
    {value,H};
```

後ろのリスト `R` が一つだけの要素 `H` を持ち、先頭側 `F` が空のときは、その要素が唯一の要素であり、先頭です。`{value, H}` を返します。

### 4. 形の崩れたキュー

```erlang:line-numbers=479
peek({[_|R],[]}) -> % malformed queue -> O(len(Q))
    {value,lists:last(R)};
```

先頭側が空で、後ろのリストに要素があるときは、キューの形が崩れています。後ろのリストの最後の要素が、先頭になります。`lists:last/1` で探すので、長さに比例した時間がかかります。

### 5. キューでない値は、badarg

```erlang:line-numbers=481
peek(Q) ->
    erlang:error(badarg, [Q]).
```

キューの形でない値が渡されたときは、`badarg` を投げます。

## ここがすごい

### 覗くだけで、キューは変わらない

`peek/1` は、新しいキューを作りません。取り出す `out/1` と違って、要素の位置も、残りの並びも、そのまま保たれます。
「次に何が来るか」だけを知りたい場面で、安心して使えます。

### 崩れた形のための、特別な節

通常のキューでは、先頭側のリストに要素があるので、この節は使われません。
しかし、形が崩れたキューの場合に備えて、後ろの最後を探す節を用意しています。コメントの「O(len(Q))」は、その節の作業量が長さに比例することを、正直に示しています。

### 戻り値で、空かどうかを伝える

空のときは、`empty` というアトムを返します。`{value, Item}` と並べると、呼び出し側は、`case` で両方を分けられます。
例外を使わず、空の場合の処理を書けるので、読み手にも安心です。

## まとめ

`queue:peek(queue:from_list([a, b]))` は、`{value, a}` を返します。
空のキュー `queue:peek(queue:new())` は、`empty` を返します。
