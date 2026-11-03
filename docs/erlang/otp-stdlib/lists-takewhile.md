---
title: "先頭から、条件を満たす間だけ要素を取り出す"
description: "lists:takewhile/2 は、リストの先頭から述語が真の間だけ要素を集め、最初に偽になった時点で止める。残りの要素は捨てる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2735, 2744]
function: "lists:takewhile/2"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`lists:takewhile/2` は、リストの先頭から、述語が `true` を返す間だけ要素を集めます。
最初に `false` になった要素に出会うと、そこで集めるのをやめます。その後ろの要素は、どんな値でも結果に入りません。

## コード

```erlang:line-numbers=2735
takewhile(Pred, List) when is_function(Pred, 1) ->
    takewhile_1(Pred, List).

takewhile_1(Pred, [Hd | Tail]) ->
    case Pred(Hd) of
        true -> [Hd | takewhile_1(Pred, Tail)];
        false -> []
    end;
takewhile_1(_Pred, []) ->
    [].
```

## 前提知識

- **述語（`Pred`）**: 要素を受け取り、`true` か `false` を返す関数です。
- **`takewhile_1/2`**: 実際に先頭から走査する補助関数です。
- **`[Hd | takewhile_1(Pred, Tail)]`**: 先頭の要素を前に付け、残りの結果をつなげる形です。
- **`[]`**: 空のリストです。結果の終わりを表します。

## 何をしているか

### 1. 入口で述語を確かめる

```erlang:line-numbers=2735
takewhile(Pred, List) when is_function(Pred, 1) ->
    takewhile_1(Pred, List).
```

`takewhile/2` は、`Pred` が引数を一つ取る関数であることを確かめてから、補助関数に仕事を渡します。

### 2. 条件を満たせば、要素を残して続ける

```erlang:line-numbers=2738
takewhile_1(Pred, [Hd | Tail]) ->
    case Pred(Hd) of
        true -> [Hd | takewhile_1(Pred, Tail)];
        false -> []
    end;
```

先頭の要素 `Hd` に述語を当てはめます。`true` なら、`Hd` を結果の先頭に付け、残りの `Tail` に対して同じ関数を呼びます。
`false` なら、ここで `[]` を返します。残りのリストは見ないまま、結果が終わります。

### 3. リストが空になったら終わる

```erlang:line-numbers=2743
takewhile_1(_Pred, []) ->
    [].
```

空のリストに当たったら、空の結果を返します。

## ここがすごい

### 最初の失敗で、結果を打ち切る

`lists:filter/2` は、条件に合う要素をすべて集めます。
`takewhile` は、条件が崩れた時点で打ち切ります。先頭に並んだ同じ種類の要素だけが欲しいときに、この違いが効きます。

### 打ち切りは、`false` を返す節だけで表す

打ち切りのために、フラグや特別な変数を使っていません。`false` の節が `[]` を返すことで、再帰の続きが自然に止まります。
読み手は、`case` の二つの枝を見れば、いつ止まるかがわかります。

### 結果は、前に付けながら組み立てる

`[Hd | takewhile_1(Pred, Tail)]` は、再帰の結果の前に `Hd` を付けます。
このため、要素の順番は元のリストと同じままです。

### 一度止まったら、後ろは見ない

述語が偽になった後の要素は、どれも調べられません。
そのため、長いリストでも、先頭の一部だけを見て結果が決まります。途中で打ち切る処理の速さは、この性質から来ています。

## まとめ

`lists:takewhile(fun(X) -> X < 3 end, [1, 2, 3, 1])` は、`[1, 2]` を返します。
最初に `3` が現れた時点で止まるので、後ろの `1` は結果に入りません。
