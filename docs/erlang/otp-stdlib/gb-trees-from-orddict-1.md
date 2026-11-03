---
title: "キーで並んだ組のリストから、平衡木を一度に作る"
description: "gb_trees:from_orddict/1 は、キー順に並んだ組のリストを受け取り、要素数を数えたあと、釣り合った木を一気に組み立てる。一つずつ挿入するより、速く作れる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [510, 512]
function: "gb_trees:from_orddict/1"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`gb_trees:from_orddict/1` は、キーの昇順に並んだ `{Key, Value}` のリストから、平衡木を作ります。
リストを一つずつ `insert` するのではなく、一度に釣り合った形を組み立てます。

## コード

```erlang:line-numbers=510
from_orddict(L) ->
    S = length(L),
    {S, balance_list_checked(L, S)}.
```

## 前提知識

- **orddict（順序付き辞書）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **`length/1`**: リストの要素数を数えます。ここでは、木の外側に入れる要素数 `S` を求めるために使われます。
- **`balance_list_checked/2`**: 並んだリストを、釣り合った木の形に組み直す補助関数です。引数に、要素数を渡します。
- **`from_orddict_unchecked/1`**: 同じ目的ですが、リストが並んでいるかを確かめない版です。

## 何をしているか

### 1. 要素数を数える

```erlang:line-numbers=511
    S = length(L),
```

リストの長さを `length/1` で数えます。この数が、木の要素数 `S` になります。

### 2. 並んだリストから、釣り合った木を組む

```erlang:line-numbers=512
    {S, balance_list_checked(L, S)}.
```

`balance_list_checked/2` に、リストと要素数を渡します。その結果を、`{S, 木}` の組として返します。
この一行で、木の形は、リストの真ん中の要素を根にする形に決まります。

## ここがすごい

### 一つずつ入れないので速い

`insert` を要素の数だけ呼ぶと、そのたびに木の釣り合いを確かめることになります。
並んだリストが手元にあるなら、真ん中から分けていけば、木は一度の走査で組めます。

### 並んでいる前提を、呼び出し側に任せる

この関数は、リストが並んでいるかを、自分では確かめていません。
並んでいないリストを渡すと、木の探索が正しく動かなくなります。ソースに `from_orddict_unchecked/1` という別の版があるのも、そのためです。

### 外側の組で、要素数を先に持つ

作られた木は、`{S, Tree}` の組です。`S` は、`length/1` で数えた値です。
後から `size/1` を呼ぶときに、木を探らず、この数をそのまま返せます。

### 並びが崩れると、木は壊れる

この関数は、並びを確かめないので、速さの代わりに責任を呼び出し側に渡しています。
キーの順が、リストの中で一度でも逆になれば、作られた木は二分探索木の性質を満たしません。そうなると、`get/2` や `is_defined/2` は、存在するキーを見つけられなくなります。
リストを作る元が、`orddict` の形を守っているかどうかは、読み手が確かめるべき点です。たとえば `lists:ukeysort/2` で整えてから渡すと、安全に使えます。

### 元のリストは、そのまま残る

`from_orddict/1` は、渡されたリストを変えません。木は別の値として作られるので、元のリストは、そのまま他の処理にも使えます。
Erlang の値は、変更されないという性質を持つので、この関数の結果だけが新しく作られます。

## まとめ

`gb_trees:from_orddict([{a, 1}, {b, 2}, {c, 3}])` は、三つの要素を持つ木を返します。
要素数は `3` で、`gb_trees:get(b, Tree)` は `2` を返します。
