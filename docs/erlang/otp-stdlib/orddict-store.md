---
title: "順序付きの辞書に、キーの位置を探しながら値を入れる"
description: "orddict:store/3 は、キーで昇順に並んだ辞書に値を入れる。キーの大小で先へ進み、同じキーが見つかったらその値を置き換え、無ければ正しい位置に挿入する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [317, 323]
function: "orddict:store/3"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム"]
---
## ひとことで

`orddict:store/3` は、キーと値の組を、順序付きリスト（`orddict`）に入れます。`orddict` は、キーの昇順に並んだ `{Key, Value}` のリストです。
同じキーがあれば値を置き換えます。なければ、キーの順番を保つ位置に挿入します。

## コード

::: code-group

```erlang:line-numbers=317 [日本語訳]
store(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,New}|Dict];
store(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|store(Key, New, Dict)];
store(Key, New, [{_K,_Old}|Dict]) ->		%キーが K と等しいとき
    [{Key,New}|Dict];
store(Key, New, []) -> [{Key,New}].
```

```erlang:line-numbers=317 [原文]
store(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,New}|Dict];
store(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|store(Key, New, Dict)];
store(Key, New, [{_K,_Old}|Dict]) ->		%Key == K
    [{Key,New}|Dict];
store(Key, New, []) -> [{Key,New}].
```

:::

## 前提知識

- **`orddict`**: キーで並べた `{Key, Value}` のリストで、辞書を表すモジュールです。キーの重複はありません。
- **キーの比較 `Key < K`**: Erlang の項の順序で比べます。キーには数値やアトムなど、比べられる値を使えます。
- **`[{K,_}|_]=Dict`**: 先頭の組 `{K, _}` と、残りを表すパターンです。`_` は使わない値を表します。
- **`[E|store(...)]`**: 先頭の組 `E` をそのまま残し、残りの処理結果をつなぎます。
- **`[]`**: 空のリストです。キーが一つも見つからないときの最後の場所です。

## 何をしているか

### 1. 新しいキーが先頭より小さいとき

```erlang:line-numbers=317
store(Key, New, [{K,_}|_]=Dict) when Key < K ->
    [{Key,New}|Dict];
```

先頭のキー `K` より `Key` が小さければ、その位置に新しい組を挿入して終わりです。順序を保つための、先頭への挿入です。

### 2. 新しいキーが先頭より大きいとき

```erlang:line-numbers=319
store(Key, New, [{K,_}=E|Dict]) when Key > K ->
    [E|store(Key, New, Dict)];
```

`Key` が `K` より大きければ、先頭の組 `E` は残したまま、残りのリストに同じ処理を続けます。

### 3. 同じキーが見つかったとき

```erlang:line-numbers=321
store(Key, New, [{_K,_Old}|Dict]) ->		%Key == K
    [{Key,New}|Dict];
```

`Key` と `K` が等しければ、古い値 `_Old` を捨てて、新しい値 `New` の組に置き換えます。リストの長さは変わりません。

### 4. 末尾まで来たとき

```erlang:line-numbers=323
store(Key, New, []) -> [{Key,New}].
```

リストの最後まで来ても見つからなければ、末尾に新しい組を作ります。キーが一番大きいので、順序が保たれます。

## ここがすごい

### 探しながら、挿入位置をそのまま決める

キーを探す処理と、挿入の処理が 1 つの再帰にまとまっています。キーが小さくなったところで挿入し、同じキーなら置き換えるので、余分な探索がありません。
ソート済みという前提を使い、「大きい間は進む」「等しければ置き換える」「小さければ入れる」の 3 つの規則だけで書いています。

### 不変データでも、置き換えは 1 か所だけ

値の書き換えはできないので、新しいリストを作る必要があります。この関数は、置き換える組より前の部分だけを新しく作り、後ろは共有します。
途中の組を変えても、後ろのリストが再利用されるので、無駄なコピーを減らせます。

## まとめ

- 順序付きのリストに入れるときは、キーの大小で先に進むと、探索と挿入を 1 回でまとめられます。
- 同じキーは、古い組を捨てて新しい組に置き換えます。
- 不変データでは、変えた部分より後ろは共有できます。
