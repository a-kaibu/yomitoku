---
title: "順序付き辞書の既存のキーの値を、関数で書き換える"
description: "orddict:update/3 は、昇順の辞書から既にあるキーを探し、その値に関数を適用して置き換える。キーが無ければ一致する節が無いため、関数呼び出しが失敗する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [418, 421]
function: "orddict:update/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`orddict:update/3` は、キーと値の組が昇順に並んだ辞書で、既にあるキーの値を、関数 `Fun` の結果に書き換えます。
キーが無ければ、更新できないので、失敗します。新しいキーを追加する関数ではありません。

## コード

```erlang:line-numbers=418
update(Key, Fun, [{K,_}=E|Dict]) when Key > K ->
    [E|update(Key, Fun, Dict)];
update(Key, Fun, [{K,Val}|Dict]) when Key == K ->
    [{Key,Fun(Val)}|Dict].
```

## 前提知識

- **順序付き辞書（orddict）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **比較 `>` と `==`**: 探すキー `Key` と、先頭の組のキー `K` の大小、または等しさで、進むかを決めます。
- **`Fun(Val)`**: 既存の値 `Val` を受け取り、新しい値を返す関数です。
- **`[E|...]`**: 比べて進む組を、そのまま結果に残す書き方です。

## 何をしているか

### 1. 探すキーが、先頭より大きければ、先頭を残して進む

```erlang:line-numbers=418
update(Key, Fun, [{K,_}=E|Dict]) when Key > K ->
    [E|update(Key, Fun, Dict)];
```

`Key` が先頭のキー `K` より大きければ、先頭の組 `E` は、そのまま結果に残します。残りのリストで、更新を続けます。

### 2. キーが一致すれば、値を書き換える

```erlang:line-numbers=420
update(Key, Fun, [{K,Val}|Dict]) when Key == K ->
    [{Key,Fun(Val)}|Dict].
```

先頭のキーが `Key` と等しければ、その値 `Val` に `Fun` を当てはめて、新しい組を作ります。その組を、残りのリストの前に付けて返します。

### 3. 無ければ、一致する節が無い

この関数には、リストが空になったときの節がありません。
`Key` が、全てのキーより小さい、あるいは途中で飛んでいる場合、どの節にも当たらず、呼び出しは失敗します。

## ここがすごい

### 並びを使って、途中で位置を決める

探すキーが先頭より大きいときだけ進みます。
キーが等しくなった時点で、そこだけを書き換えます。並びが昇順なので、探す場所は、一本道で決まります。

### 存在しないキーを追加しない

この関数は、キーが無いときに新しく加えることをしません。
値を更新する、という意図がはっきり表れています。追加も含めて扱いたい場合は、`orddict:store/3` を使う必要があります。

### 失敗を、節の不足で表す

空のリストの節を書いていないので、見つからない場合は、関数呼び出しの失敗になります。
わざわざエラーを投げる文は無く、Erlang の節の仕組みがそのまま、失敗の知らせになっています。

## まとめ

`orddict:update(a, fun(V) -> V + 1 end, [{a, 1}, {b, 2}])` は、`[{a, 2}, {b, 2}]` を返します。
キーが無い `orddict:update(c, fun(V) -> V end, [{a, 1}])` は、失敗します。
