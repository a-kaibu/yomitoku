---
title: "キーと値の組のリストから、順序付き辞書を作る"
description: "orddict:from_list/1 は、キーと値の組のリストを、キーの昇順に並べた辞書にする。同じキーは後に来たものが残る。並べ替えを一度だけ行う、辞書の作り方。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [128, 131]
function: "orddict:from_list/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "ソート"]
---
## ひとことで

`orddict:from_list/1` は、`{Key, Value}` の組のリストを、キーの昇順に並べた順序付き辞書に変えます。
同じキーが複数あるときは、リストの後ろにあるものが残ります。

## コード

```erlang:line-numbers=128
from_list([]) -> [];
from_list([{_,_}]=Pair) -> Pair;
from_list(Pairs) ->
    lists:ukeysort(1, reverse_pairs(Pairs, [])).
```

## 前提知識

- **orddict（順序付き辞書）**: キーの昇順に並んだ `{Key, Value}` のリストです。キーで探すとき、途中で打ち切れる利点があります。
- **`reverse_pairs/2`**: 組の並びを逆順にして、同じキーのうち後ろのものを優先させる補助関数です。この記事では中身には踏み込みません。
- **`ukeysort/2`**: タプルの指定した位置の値で並べ替え、同じ値の要素を一つにする関数です。
- **空のリストと一つの組**: 並べ替えをしなくても、そのまま辞書の形になります。

## 何をしているか

### 1. 空のリストは、空の辞書になる

```erlang:line-numbers=128
from_list([]) -> [];
```

空のリストは、そのまま空の辞書です。
辞書の形は、`{Key, Value}` の組のリストなので、空でも形は変わりません。

### 2. 一つだけの組は、そのまま返す

```erlang:line-numbers=129
from_list([{_,_}]=Pair) -> Pair;
```

組が一つだけなら、並べ替えるものがありません。その組を、そのまま辞書として返します。

### 3. 複数の組は、逆順にしてから並べ替える

```erlang:line-numbers=130
from_list(Pairs) ->
    lists:ukeysort(1, reverse_pairs(Pairs, [])).
```

複数の組があれば、まず `reverse_pairs/2` で並びを逆にします。
その後、`lists:ukeysort/2` で、キーの位置 `1` を使って並べ替えます。逆にしておくと、同じキーの中で、後ろにあったものが先に残ります。

## ここがすごい

### 並べ替えを、一度だけ行う

キーを一つずつ正しい位置に入れていく方法もありますが、この関数は、リスト全体を一度に並べ替えます。
要素が多いときは、この一度の並べ替えの方が、ずっと効率的です。

### 同じキーの扱いを、逆順の並びで決める

同じキーの組が複数あるとき、どれを残すかを、この関数は決めています。
後ろにあるものを残すので、リストの後の方に書いた値で上書きするような振る舞いになります。

### 結果は、そのまま辞書として使える

作られた値は、ただのリストです。`orddict:find/2` などの関数に、そのまま渡せます。
特別な型を用意せず、並んだリストとして扱う設計なので、変換の手間が要りません。

## まとめ

`orddict:from_list([{b, 2}, {a, 1}, {b, 3}])` は、`[{a, 1}, {b, 3}]` を返します。
キー `b` は二つありますが、後ろの `3` が残ります。
