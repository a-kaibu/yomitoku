---
title: "リストを、先頭から指定した数で二つに分ける"
description: "lists:split/2 は、リストを先頭から指定した数の要素と、残りの要素の二つに分ける。数がリストの長さを超えると、例外になる。引数の検査と、分割の結果を組で返す形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2864, 2871]
function: "lists:split/2"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "エラー処理"]
---
## ひとことで

`lists:split/2` は、リストを先頭から指定した数で二つに分け、その組 `{前, 後}` を返します。
数が正の整数でなかったり、リストの長さより大きかったりすると、例外になります。

## コード

```erlang:line-numbers=2864
split(N, List) when is_integer(N), N >= 0, is_list(List) ->
    case split(N, List, []) of
	{_, _} = Result -> Result;
	Fault when is_atom(Fault) ->
	    error(Fault, [N,List])
    end;
split(N, List) ->
    error(badarg, [N,List]).
```

## 前提知識

- **組 `{前, 後}`**: 二つの値を一つにまとめるタプルです。ここでは、前半と後半のリストを、一緒に返すために使います。
- **`error/2`**: 例外を投げる組み込み関数です。第一引数に理由、第二引数に引数のリストを渡します。
- **`badarg`**: 引数が正しくないことを表す、標準の理由の名前です。
- **`split/3`**: 実際の分割を行う補助関数です。戻り値は、成功なら組、失敗なら理由のアトムです。

## 何をしているか

### 1. 引数が正しければ、分割を試す

```erlang:line-numbers=2864
split(N, List) when is_integer(N), N >= 0, is_list(List) ->
    case split(N, List, []) of
```

`N` が `0` 以上の整数で、`List` がリストのときに、この節が選ばれます。
補助関数 `split/3` の結果を `case` で受けます。

### 2. 成功した組は、そのまま返す

```erlang:line-numbers=2866
	{_, _} = Result -> Result;
```

`split/3` が組を返したら、その組を結果とします。

### 3. 失敗の理由は、例外にする

```erlang:line-numbers=2867
	Fault when is_atom(Fault) ->
	    error(Fault, [N,List])
```

`split/3` がアトムを返したら、それを理由にして、`error/2` で例外を投げます。
理由と引数を一緒に渡すので、どの呼び出しで失敗したかが分かります。

### 4. 引数の型が違えば、すぐに例外にする

```erlang:line-numbers=2870
split(N, List) ->
    error(badarg, [N,List]).
```

先頭の節に当たらない引数は、`badarg` の例外になります。

## ここがすごい

### 失敗を、二つの場所で分ける

引数の検査は、この関数の入口で行います。長さが足りないといった、データに依存する失敗は、補助関数の中で見つかります。
入口で型を確かめ、中で長さを確かめるので、どこで失敗したかを追いやすくなっています。

### 組で、二つの結果を同時に返す

分割の結果は、前半と後半の組です。一度の関数呼び出しで、二つのリストを受け取れます。
呼び出し側は、`{Front, Back} = lists:split(2, L)` のように、そのまま分けて受け取れます。

### 失敗の形を、明示する

補助関数の結果がアトムなら、例外にしてそのアトムを理由に使います。
呼び出し側は、失敗したときの理由を、例外の中で見られます。値として「失敗」を返す方法と違い、後の処理を書き忘れても、静かに進むことはありません。

## まとめ

`lists:split(2, [a, b, c, d])` は、`{[a, b], [c, d]}` を返します。
`lists:split(5, [a, b])` のように長さを超えると、例外になります。
