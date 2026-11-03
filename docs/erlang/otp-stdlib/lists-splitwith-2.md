---
title: "先頭から条件を満たす部分と、残りを一度に分ける"
description: "lists:splitwith/2 は、先頭から述語が真の間の要素を前半に、残りを後半にした組を返す。takewhile と dropwhile の結果を、そのまま組にした形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2813, 2814]
function: "lists:splitwith/2"
difficulty: 1
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:splitwith/2` は、リストを、先頭から条件を満たす部分と、その後ろの残りの二つに分けて、組にして返します。
前半は `lists:takewhile/2` の結果、後半は `lists:dropwhile/2` の結果です。二つの関数を、一度の呼び出しでまとめて使えます。

## コード

```erlang:line-numbers=2813
splitwith(Pred, List) ->
    {takewhile(Pred, List), dropwhile(Pred, List)}.
```

## 前提知識

- **`takewhile/2`**: 先頭から、述語が真の間の要素を集めます。最初に偽になった要素で止まります。
- **`dropwhile/2`**: 先頭から、述語が真の間の要素を捨て、偽になった要素からの残りを返します。
- **組 `{A, B}`**: 二つの値を一つにまとめたタプルです。ここでは、前半と後半を表します。
- **分割点**: 述語が最初に偽になる位置です。前半と後半は、この位置で境目になります。

## 何をしているか

関数の本体は、一行だけです。

```erlang:line-numbers=2813
splitwith(Pred, List) ->
    {takewhile(Pred, List), dropwhile(Pred, List)}.
```

### 1. 前半を takewhile で取る

`takewhile(Pred, List)` は、条件を満たす先頭の部分を取り出します。
この部分が、組の前半になります。

### 2. 後半を dropwhile で取る

`dropwhile(Pred, List)` は、同じ条件で、先頭の部分を捨てます。残りが、組の後半になります。

### 3. 二つを、一つの組にする

`{takewhile(...), dropwhile(...)}` で、前半と後半を組にして返します。
二つを続けて書くことで、分割の境目は、同じ述語で一度だけ決まります。

## ここがすごい

### 二つの関数の結果を、一つにまとめる

`takewhile` と `dropwhile` は、同じ述語で境目を見つけます。
この関数は、二つの結果を並べて組にしているだけです。分割の規則を一箇所にまとめ、読み手は、組の二つの要素を見るだけで、何が起きるかを理解できます。

### 二回の走査になる点に注意

関数の中で、述語は二回、先頭から当てられます。一度で二つの結果を作る関数ではありません。
読みやすさを優先した形で、分割点までの作業が二度行われることを、知っておくと良いでしょう。

### 境目が、どちらの部分にも含まれない

前半は、条件を満たす要素だけです。後半は、最初に条件を満たさなくなった要素から始まります。
境目の要素は、必ず後半に入ります。この約束を知っていると、分割の結果を正しく使えます。

## まとめ

`lists:splitwith(fun(X) -> X < 3 end, [1, 2, 3, 1])` は、`{[1, 2], [3, 1]}` を返します。
最初の `3` が、後半の先頭になります。
