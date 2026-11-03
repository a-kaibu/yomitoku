---
title: "平衡木に、新しいキーを釣り合いを保って追加する"
description: "gb_trees:insert/3 は、新しいキーを木の正しい位置に入れる。要素数を使って、左右の深さが極端に偏らないように、部分木の大きさを毎回決める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [320, 322]
function: "gb_trees:insert/3"
difficulty: 3
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`gb_trees:insert/3` は、平衡木に新しいキーと値を追加します。
追加した木は、二分探索木の並び順を守ったまま、左右の深さが極端に偏らないように保たれます。

## コード

```erlang:line-numbers=320
insert(Key, Val, {S, T}) when is_integer(S) ->
    S1 = S+1,
    {S1, insert_1(Key, Val, T, ?pow(S1, ?p))}.
```

## 前提知識

- **gb tree（平衡木）**: 二分探索木の一種です。キーが昇順に並び、各ノードの左右の部分木の大きさが、大きく違わないように保たれます。
- **要素数 `S`**: 木に入っているキーの数です。外側の組 `{S, T}` に入っています。
- **`?pow` と `?div2`**: ソースの中で定義されたマクロです。二つの値の比率を使い、部分木の大きさを決めるために使われます。
- **`is_integer` ガード**: 要素数が整数であることを、節の入口で確かめています。

## 何をしているか

### 1. 要素数を一つ増やす

```erlang:line-numbers=320
insert(Key, Val, {S, T}) when is_integer(S) ->
    S1 = S+1,
```

まず、外側の `S` を読み、新しい要素数 `S1` を `S + 1` で求めます。
木に一つ入るので、数は一つ増えます。

### 2. 挿入の位置を、要素数から決めて探す

```erlang:line-numbers=322
    {S1, insert_1(Key, Val, T, ?pow(S1, ?p))}.
```

`insert_1/4` に、木の根 `T` と、大きさの目安 `?pow(S1, ?p)` を渡します。
この大きさは、木のどの深さまで比較の幅を持つかを決めるための値です。挿入の途中で、この値を半分にしながら、部分木を探します。

### 3. 挿入後の木を組み立てる

```erlang:line-numbers=324
insert_1(Key, Value, {Key1, V, Smaller, Bigger}, S) when Key < Key1 -> 
    case insert_1(Key, Value, Smaller, ?div2(S)) of
        {T1, H1, S1} when is_integer(H1), is_integer(S1) ->
```

キーが根より小さいときは、`Smaller` の方へ挿入を続けます。戻ってきた結果は、ノードの高さや大きさを確かめてから組み直します。
ここでは、部分木の要素数 `H1` と `S1` が整数であることを、パターンの中で確かめています。

## ここがすごい

### 数を追加と同時に数える

挿入のたびに、要素数を一つ増やして返します。
木全体の数を数え直す必要がないので、`gb_trees:size/1` の呼び出しが、速く済みます。

### 偏りを、部分木の大きさで防ぐ

単純な二分探索木は、キーが昇順に入ると、一本の鎖のように伸びてしまいます。
この実装は、各部分木の要素数の比率を見ながら、偏りが大きくなったときに組み直します。その判断に、`?pow` と `?div2` が使われています。

### 節の数を絞る

`insert/3` 本体は、要素数を更新して、根への挿入を呼ぶだけです。
実際の探索は `insert_1/4` にまとめられています。外側と内側が役割で分かれているので、読むときの順番も分かりやすくなっています。

## まとめ

`gb_trees:insert(b, 2, gb_trees:insert(a, 1, gb_trees:empty()))` は、キーが `a` と `b` の二つの木を返します。
同じキーをもう一度入れると、この関数はエラーになります。キーを上書きしたいときは、`update/3` か `enter/3` を使います。
