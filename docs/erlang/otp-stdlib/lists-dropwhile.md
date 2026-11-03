---
title: "リストの先頭から、条件を満たす間の要素を捨てる"
description: "lists:dropwhile/2 は、先頭から述語が真の間の要素を捨て、最初に偽になった要素からのリストを返す。takewhile の反対側を取り出す関数。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2765, 2774]
function: "lists:dropwhile/2"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`lists:dropwhile/2` は、リストの先頭から、述語が `true` を返す要素を捨てます。
最初に `false` になった要素から後ろを、そのまま返します。`lists:takewhile/2` が残す部分を、反対に捨てる関数です。

## コード

```erlang:line-numbers=2765
dropwhile(Pred, List) when is_function(Pred, 1) ->
    dropwhile_1(Pred, List).

dropwhile_1(Pred, [Hd | Tail]=Rest) ->
    case Pred(Hd) of
        true -> dropwhile_1(Pred, Tail);
        false -> Rest
    end;
dropwhile_1(_Pred, []) ->
    [].
```

## 前提知識

- **述語（`Pred`）**: 要素を受け取り、`true` か `false` を返す関数です。
- **`Rest`**: 関数の引数に付けた名前で、先頭から見ている残りのリスト全体を指します。`[Hd | Tail]=Rest` と書くと、先頭の分解と、リスト全体の両方に名前を付けられます。
- **`takewhile` との対比**: `takewhile` は条件を満たす間の要素を集め、`dropwhile` はそれを捨てます。二つを合わせると、元のリストになります。
- **空のリスト**: 捨てるものが無いので、空のリストを返します。

## 何をしているか

### 1. 入口で述語を確かめる

```erlang:line-numbers=2765
dropwhile(Pred, List) when is_function(Pred, 1) ->
    dropwhile_1(Pred, List).
```

`dropwhile/2` は、`Pred` が引数を一つ取る関数であることを確かめて、補助関数に仕事を渡します。

### 2. 条件が真なら、先頭を捨てて続ける

```erlang:line-numbers=2768
dropwhile_1(Pred, [Hd | Tail]=Rest) ->
    case Pred(Hd) of
        true -> dropwhile_1(Pred, Tail);
        false -> Rest
    end;
```

先頭の要素 `Hd` に述語を当てはめます。
`true` なら、`Hd` を捨てて、残りの `Tail` に対して同じ関数を呼びます。
`false` なら、そこで `Rest` を返します。`Rest` は、`Hd` を含む、今見ている残りのリスト全体です。

### 3. リストが空になったら終わる

```erlang:line-numbers=2773
dropwhile_1(_Pred, []) ->
    [].
```

空のリストに当たったら、空のリストを返します。

## ここがすごい

### 「Rest」という名前で、残りをそのまま返す

`false` の節では、要素を一つずつ組み直していません。`Rest` という名前を付けたリストを、そのまま返しています。
組み直す手間がないので、結果は元のリストの一部をそのまま指す形になります。

### takewhile と並べて理解する

`takewhile(Pred, L)` と `dropwhile(Pred, L)` を並べると、`L` は二つの部分に分かれます。
前の部分が `takewhile` で、後ろの部分が `dropwhile` です。`lists:splitwith/2` は、この二つを一度に返す関数として作られています。

### 条件が偽になったら、その後は調べない

一度 `false` が出ると、残りの要素は、述語を当てずにそのまま返されます。
後ろの要素を全部調べ直す必要がないので、長いリストでも、前の方の判定だけで結果が決まります。

## まとめ

`lists:dropwhile(fun(X) -> X < 3 end, [1, 2, 3, 1])` は、`[3, 1]` を返します。
最初に `3` が現れた時点で、そこから後ろをそのまま返すからです。
