---
title: "順序付き辞書から、キーと値の条件に合う組だけを残す"
description: "orddict:filter/2 は、辞書の各組について、キーと値を関数に渡し、真になった組だけを残す。残った組は、元の昇順の並びを保つ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [561, 566]
function: "orddict:filter/2"
difficulty: 2
format: 2
tags: ["データ構造", "関数型", "標準ライブラリ"]
---
## ひとことで

`orddict:filter/2` は、順序付き辞書の組を一つずつ確かめ、条件を満たすものだけを集めた辞書を返します。
条件の関数 `F` は、キーと値の両方を受け取ります。残った組は、元の昇順の並びを保ちます。

## コード

```erlang:line-numbers=561
filter(F, [{Key,Val}=E|D]) ->
    case F(Key, Val) of
	true -> [E|filter(F, D)]; 
	false -> filter(F, D)
    end;
filter(F, []) when is_function(F, 2) -> [].
```

## 前提知識

- **順序付き辞書（orddict）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **`F(Key, Val)`**: キーと値から、`true` か `false` を返す関数です。
- **`case` 式**: 関数の結果で、組を残すか捨てるかを分けます。
- **`E` の名前付け**: `{Key,Val}=E` と書くと、組全体を `E` として使えます。

## 何をしているか

### 1. 条件が真なら、組を残す

```erlang:line-numbers=561
filter(F, [{Key,Val}=E|D]) ->
    case F(Key, Val) of
	true -> [E|filter(F, D)]; 
	false -> filter(F, D)
```

先頭の組 `E` について、`F(Key, Val)` を計算します。結果が `true` なら、組 `E` をそのまま結果の先頭に付けます。
残りの組に対しても、同じ関数を続けます。

### 2. 条件が偽なら、組を捨てる

```erlang:line-numbers=564
	false -> filter(F, D)
    end;
```

結果が `false` なら、この組は捨てます。残りの組だけを、同じ関数で処理します。

### 3. 空になったら、空を返す

```erlang:line-numbers=566
filter(F, []) when is_function(F, 2) -> [].
```

組が無くなったら、空の辞書を返します。

## ここがすごい

### 組そのものを残す

真になった組は、キーと値をばらして組み直さず、`E` という名前で、そのまま結果に入れます。
元の組と、結果の組は、まったく同じものです。余計な作業が無い書き方です。

### 並びを壊さず、絞り込む

組の順番は変わりません。残った組は、元の昇順のままです。
そのため、絞り込んだ結果も、そのまま辞書として使えます。

### 条件にキーを使える

関数 `F` は、キーと値の両方を見ます。
たとえば、キーが一定の範囲にあるものだけを残す、といった条件が書けます。値だけを見る場合は、キーを無視して書けます。

### 絞り込んだ後の辞書は、また絞り込める

結果も、昇順の辞書です。そのため、別の条件で続けて絞り込んだり、他の辞書の操作に渡したりできます。
関数の結果の形が、入力と同じであることが、組み合わせやすさの理由です。

### 空の辞書は、条件を一度も満たさない

入力が空なら、確かめる組が無いので、結果も空です。
条件の関数を、空の辞書に対して一度も呼ばないことも、この節の形から分かります。関数が二引数であることの確かめも、空の辞書の節で行っています。

## まとめ

`orddict:filter(fun(K, V) -> V > 1 end, [{a, 1}, {b, 2}, {c, 3}])` は、`[{b, 2}, {c, 3}]` を返します。
値が一より大きい組だけが、元の順番で残ります。
