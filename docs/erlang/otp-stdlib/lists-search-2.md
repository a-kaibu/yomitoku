---
title: "リストから、条件に合う最初の要素を一つだけ探す"
description: "lists:search/2 は、述語が真になる最初の要素を {value, Value} で返し、無ければ false を返す。見つけた時点で再帰を止める、短絡評価の形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2796, 2805]
function: "lists:search/2"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:search/2` は、リストの先頭から順に述語を当てはめ、最初に真になった要素を返します。
見つからなければ `false` を返します。見つけたら、残りの要素は調べません。

## コード

```erlang:line-numbers=2796
search(Pred, List) when is_function(Pred, 1) ->
    search_1(Pred, List).

search_1(Pred, [Hd | Tail]) ->
    case Pred(Hd) of
        true -> {value, Hd};
        false -> search_1(Pred, Tail)
    end;
search_1(_Pred, []) ->
    false.
```

## 前提知識

- **述語（`Pred`）**: 要素を一つ受け取り、`true` か `false` を返す関数です。
- **`{value, Value}`**: 見つかったことと、その値を一緒に表すタプルです。`false` と区別できるので、要素そのものが `false` でも曖昧になりません。
- **再帰呼び出し**: 関数が自分自身を呼ぶことです。Erlang では、末尾で呼べば、ループと同じように使えます。
- **`case` 式**: 値の形によって分岐します。ここでは `true` と `false` の二つに分けています。
- **`is_function(Pred, 1)`**: ガードで、引数が一つの関数かどうかを調べています。

## 何をしているか

### 1. 入口で関数の形を確かめる

```erlang:line-numbers=2796
search(Pred, List) when is_function(Pred, 1) ->
    search_1(Pred, List).
```

`search/2` は、`Pred` が引数を一つ取る関数であることをガードで確かめてから、`search_1/2` に仕事を渡します。
引数の形が違えば、この節は選ばれず、関数呼び出しは失敗します。入口で条件を絞ることで、中の関数は、ただ順に調べるだけで済みます。

### 2. 先頭の要素を判定する

```erlang:line-numbers=2799
search_1(Pred, [Hd | Tail]) ->
    case Pred(Hd) of
        true -> {value, Hd};
        false -> search_1(Pred, Tail)
    end;
```

リストの先頭 `Hd` に対して `Pred(Hd)` を呼び、結果で分岐します。
- `true` なら、`{value, Hd}` を返します。ここで再帰は止まり、残りのリストは見ません。
- `false` なら、残りの `Tail` に対して、同じ `search_1` を呼びます。

### 3. 最後まで見つからなかったとき

（リストが空になったら、この節が選ばれます。）

```erlang:line-numbers=2804
search_1(_Pred, []) ->
    false.
```

リストが空になるまで見つからなければ、`false` を返します。空のリストに対する節が、再帰の終わりを表しています。

## ここがすごい

### 見つけた時点で止まる

`lists:filter/2` のような関数は、すべての要素を調べてから結果を返します。
`search/2` は、真になった時点で、残りのリストに触れません。大きなリストから一つだけ欲しいとき、無駄な判定を省けます。

### `false` を直接返さず、タプルで包む

見つかった値が、もし `false` だったらどうでしょう。`false` だけを返すと、見つからなかったのか、見つかった値が `false` だったのか、区別できません。
`{value, Value}` で包むと、この二つの区別がつきます。`{value, _}` と `false` の二択にすれば、呼び出し側は必ず、どちらの場合かを `case` で分けて扱えます。

### 末尾再帰で、スタックを増やさない

`search_1` の再帰呼び出しは、`case` の中で、結果をそのまま返す位置にあります。
この形は末尾呼び出しなので、要素数が多くても、呼び出しの積み重ねが増えません。

## まとめ

`lists:search(fun(X) -> X > 2 end, [1, 2, 3, 4])` は、`{value, 3}` を返します。
条件を満たす要素がなければ、`false` になります。
