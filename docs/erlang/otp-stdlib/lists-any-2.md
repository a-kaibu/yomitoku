---
title: "リストの中に、一つでも条件に合う要素があるかを調べる"
description: "lists:any/2 は、先頭から述語を当てはめ、最初に真になった時点で true を返す。すべてが偽なら false になる。途中で結論が出たら残りを見ない形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2346, 2354]
function: "lists:any/2"
difficulty: 1
format: 2
tags: ["関数型", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`lists:any/2` は、リストの中に、述語が `true` になる要素が一つでもあるかを調べます。
あれば `true` を返し、なければ `false` を返します。最初に条件を満たした時点で結論が出るので、残りの要素は調べません。

## コード

```erlang:line-numbers=2346
any(Pred, List) when is_function(Pred, 1) ->
    case List of
        [Hd | Tail] ->
            case Pred(Hd) of
                true -> true;
                false -> any_1(Pred, Tail)
            end;
        [] -> false
    end.
```

## 前提知識

- **述語（`Pred`）**: 要素を一つ受け取り、`true` か `false` を返す関数です。
- **`any_1/2`**: 先頭の要素の次から、残りを順に調べる補助関数です。
- **空のリスト**: 調べる要素が無いので、`any` の結果は `false` です。
- **論理和の考え方**: 「一つでも真なら真」という考え方です。途中で `true` が出れば、残りは結果に影響しません。

## 何をしているか

### 1. 先頭の要素を調べる

```erlang:line-numbers=2347
    case List of
        [Hd | Tail] ->
            case Pred(Hd) of
                true -> true;
                false -> any_1(Pred, Tail)
            end;
```

リストに要素があれば、先頭の `Hd` に述語を当てはめます。
`true` なら、その時点で `true` を返します。残りのリストは見ません。
`false` なら、残りの `Tail` を補助関数 `any_1` に渡して、続きを調べます。

### 2. 空のリストなら、見つからなかった

```erlang:line-numbers=2353
        [] -> false
    end.
```

リストが空なら、調べるものがないので `false` を返します。

## ここがすごい

### 途中で結論が出る

`lists:all/2` と並べると違いがわかります。`all` は、一つでも偽があれば結果が決まります。`any` は、一つでも真があれば結果が決まります。
どちらも、結論が出た時点で残りを見ないので、大きなリストでも無駄な判定が少なくて済みます。

### 空の場合を、わかりやすく決める

空のリストに対して `any` は `false` です。「条件を満たす要素が一つもない」と読めば、直感と一致します。
この関数は、空の場合の節を最後に書いて、結果を明示しています。

### 検査の順番を、そのまま使う

先頭から順に調べるので、どの要素で `true` になったかが、結果の仕組みから自然にわかります。
読み手は、二つの節だけを見て、動きを追えます。

### 結果を真偽値だけに絞る

`any` が返すのは、`true` か `false` だけです。どの要素で条件を満たしたかは返しません。
どの要素かが必要なときは、`lists:search/2` を使うと、`{value, Value}` で見つかった値を受け取れます。用途に応じて、返す情報の量を選べます。

## まとめ

`lists:any(fun(X) -> X > 2 end, [1, 2, 3])` は、`true` を返します。
`lists:any(fun(X) -> X > 2 end, [1, 2])` は、`false` を返します。
