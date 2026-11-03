---
title: "平衡木に、キーがあれば更新し、無ければ追加する"
description: "gb_trees:enter/3 は、キーの有無を確かめて、update と insert を振り分ける。呼び出し側は、キーが既にあるかを気にせず、値を入れるだけでよい。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [386, 392]
function: "gb_trees:enter/3"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "イディオム"]
---
## ひとことで

`gb_trees:enter/3` は、平衡木にキーと値を入れます。
キーがすでにあれば値を書き換え、無ければ新しいキーとして追加します。呼び出し側は、どちらの場合かを考えなくてよくなります。

## コード

```erlang:line-numbers=386
enter(Key, Val, T) ->
    case is_defined(Key, T) of
	true ->
	    update(Key, Val, T);
	false ->
	    insert(Key, Val, T)
    end.
```

## 前提知識

- **`enter`**: 「入れる」という意味で、追加と更新を一つにまとめた操作です。辞書の `store` に近い考え方です。
- **`update/3`**: キーがある前提で、値を書き換える関数です。キーが無いときは追加しません。
- **`insert/3`**: キーが無い前提で、新しく追加する関数です。キーがあると、エラーになります。
- **`is_defined/2`**: キーが木にあるかを、`true` か `false` で返す関数です。

## 何をしているか

### 1. キーが木にあるかを先に調べる

```erlang:line-numbers=387
    case is_defined(Key, T) of
```

`is_defined(Key, T)` で、キーの有無を確かめます。木の中の探索だけで、値は取り出しません。

### 2. あれば、値を書き換える

```erlang:line-numbers=388
	true ->
	    update(Key, Val, T);
```

キーが見つかった場合は、`update/3` を呼びます。要素数は変わらず、値だけが新しくなります。

### 3. 無ければ、追加する

```erlang:line-numbers=390
	false ->
	    insert(Key, Val, T)
```

キーが無ければ、`insert/3` を呼びます。新しいノードを作り、要素数を一つ増やします。

## ここがすごい

### 二回探すことを、呼び出し側から隠す

`enter` の中では、キーを探す処理が二度行われます。一度は `is_defined/2`、もう一度は `update` か `insert` の中です。
それでも、呼び出し側からは `enter(Key, Val, Tree)` の一回の呼び出しに見えます。この分け方は、読み手にとって分かりやすい形です。

### 追加か更新かの判断を、一箇所にまとめる

`case` の二つの枝は、それぞれ既存の関数に一行で任せています。
判断の基準は `is_defined/2` だけなので、判断がどこで行われているかが、すぐに分かります。

### 結果の形は、どちらでも同じ

更新でも追加でも、戻り値は同じ形の木です。呼び出し側は、結果を受け取るだけで済みます。
要素数の変化だけが違い、それも木の中に保存されています。

## まとめ

`gb_trees:enter(a, 1, gb_trees:empty())` は、キー `a` を一つだけ持つ木を返します。
同じキーに対して `enter` をもう一度呼ぶと、値だけが書き換わり、要素数は一つのままです。
