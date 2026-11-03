---
title: "リストの全部の要素が条件に合うかを、途中で偽が出たら打ち切って調べる"
description: "lists:all/2 は、先頭から述語を当てはめ、一つでも偽になった時点で false を返す。すべて真なら true になる。空のリストは true。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2309, 2317]
function: "lists:all/2"
difficulty: 1
format: 2
tags: ["関数型", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`lists:all/2` は、リストのすべての要素が、述語を満たすかを調べます。
一つでも満たさない要素があれば、その時点で `false` を返します。すべて満たせば `true` です。空のリストは、どの条件も破られていないので `true` になります。

## コード

```erlang:line-numbers=2309
all(Pred, List) when is_function(Pred, 1) ->
    case List of
        [Hd | Tail] ->
            case Pred(Hd) of
                true -> all_1(Pred, Tail);
                false -> false
            end;
        [] -> true
    end.
```

## 前提知識

- **述語（`Pred`）**: 要素を一つ受け取り、`true` か `false` を返す関数です。
- **`all_1/2`**: 先頭の要素の次から、残りを順に調べる補助関数です。
- **空のリストの真**: 「すべての要素が条件を満たす」は、要素が無ければ成り立つ、という約束です。数学の全称命題と同じ考え方です。
- **`lists:any/2` との対比**: `any` は一つでも真があれば真、`all` は一つでも偽があれば偽になります。

## 何をしているか

### 1. 先頭の要素を調べる

```erlang:line-numbers=2310
    case List of
        [Hd | Tail] ->
            case Pred(Hd) of
                true -> all_1(Pred, Tail);
                false -> false
            end;
```

リストに要素があれば、先頭の `Hd` に述語を当てはめます。
`true` なら、残りの `Tail` を `all_1/2` に渡して続けます。
`false` なら、その時点で `false` を返します。残りは見ません。

### 2. 空のリストなら、真を返す

```erlang:line-numbers=2316
        [] -> true
    end.
```

空のリストに対しては、`true` を返します。これは、偽になる要素が無かったという意味です。

### 3. 補助関数で、残りを順に調べる

```erlang:line-numbers=2319
all_1(Pred, [Hd | Tail]) ->
    case Pred(Hd) of
        true -> all_1(Pred, Tail);
        false -> false
    end;
all_1(_Pred, []) ->
    true.
```

`all_1/2` は、先頭から残りを順に調べます。偽に当たれば `false`、残りが空になれば `true` を返します。

## ここがすごい

### 偽を見つけた時点で、結論が出る

すべてが真かどうかは、一つの偽があれば決まります。
この関数は、その時点で `false` を返し、残りの要素を見ません。大きなリストでも、途中で結論が出れば、そこで止まります。

### 空のリストが真になる理由

空のリストに対して `true` を返すのは、「偽の要素が一つも無かった」からです。
この約束があると、`all` は「条件を満たさないものは一つも無い」という形で使えます。空のリストを特別扱いしなくて済みます。

### `any` と鏡のように対になる

`lists:any/2` は、真を一つ見つけたら `true` を返します。`all/2` は、偽を一つ見つけたら `false` を返します。
二つの関数は、判定の向きが反対なだけで、構造はよく似ています。片方を読めば、もう片方も同じ形で読めます。

## まとめ

`lists:all(fun(X) -> X > 0 end, [1, 2, 3])` は、`true` を返します。
`lists:all(fun(X) -> X > 0 end, [1, -2, 3])` は、`-2` で偽になるので、`false` を返します。
