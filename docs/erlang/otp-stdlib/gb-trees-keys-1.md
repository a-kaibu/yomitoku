---
title: "平衡木のキーを、小さい順に一つのリストにまとめる"
description: "gb_trees:keys/1 は、木のキーを昇順に並べたリストを返す。value の代わりに Key を積む点を除けば、gb_trees:values/1 と同じ中順の走査。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [901, 906]
function: "gb_trees:keys/1"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "再帰"]
---
## ひとことで

`gb_trees:keys/1` は、木の中のキーだけを、小さい順に並べたリストにして返します。
値は含みません。二分探索木の中順で訪れることで、結果は、キーの昇順になります。

## コード

```erlang:line-numbers=901
keys({_, T}) ->
    keys(T, []).

keys({Key, _Value, Small, Big}, L) ->
    keys(Small, [Key | keys(Big, L)]);
keys(nil, L) -> L.
```

## 前提知識

- **中順の走査**: 左の枝、自分の節、右の枝の順で訪れる走査です。
- **累積引数 `L`**: 結果のリストを、引数で持ち回ります。
- **`keys/1` と `keys/2`**: 入口は木全体を受け取り、作業用の `keys/2` が、積み上げ中のリストを引数に持ちます。
- **`nil`**: 枝が空であることを表します。

## 何をしているか

### 1. 入口で、根の節から始める

```erlang:line-numbers=901
keys({_, T}) ->
    keys(T, []).
```

`keys/1` は、木全体から根の部分を取り出し、空のリストを積み上げの出発点として、`keys/2` に渡します。

### 2. 節のキーを、右の結果の前に付けてから、左を進める

```erlang:line-numbers=904
keys({Key, _Value, Small, Big}, L) ->
    keys(Small, [Key | keys(Big, L)]);
```

`keys/2` は、節に来たら、右の枝 `Big` を、積み上げ中のリスト `L` に対して処理します。
その結果の先頭に、この節のキー `Key` を付けます。さらに、左の枝 `Small` を、その結果の前に付けて処理します。
この順番で、右のキー、自分のキー、左のキーの順に並びます。

### 3. 空の枝に当たったら、積んだリストを返す

```erlang:line-numbers=906
keys(nil, L) -> L.
```

`nil` の枝に当たったら、何も足さず、積んだ `L` を返します。

## ここがすごい

### values と同じ形を、キーに使う

`gb_trees:values/1` と、この関数は、同じ形の再帰です。違うのは、積むものが値かキーかだけです。
一つの形を理解すれば、二つの関数の読み方は、同時に身につきます。

### 値を捨てて、キーだけを運ぶ

節の中には、キーと値が両方あります。この関数は、値を見ずに、キーだけを積みます。
必要なものだけを運ぶので、結果のリストは、キーの一覧として使えます。

### 並べ替えが要らない

二分探索木の中順で訪れるだけで、キーは最初から昇順になります。
結果を並べ替える手間は、ありません。木の構造が、並びの情報を持っています。

### 木の大きさに比例した時間で、一度だけ訪れる

全部の節を、一度ずつ訪れます。節の数に比例した作業量です。
結果のリストは、節の数だけの要素を持ちます。キーの一覧を作るには、この訪れ方が最も素直な方法です。

## まとめ

`gb_trees:keys(gb_trees:from_orddict([{1, a}, {2, b}, {3, c}]))` は、`[1, 2, 3]` を返します。
値は含まれず、キーだけが小さい順に並びます。
