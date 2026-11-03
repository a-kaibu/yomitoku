---
title: "タプルのリストから、指定の位置が一致する最初の要素を消す"
description: "lists:keydelete/3 は、タプルのリストを先頭から見て、N 番目の要素が Key と一致する最初のタプルを取り除く。見つけた一つだけを消し、後ろは変えない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1393, 1399]
function: "lists:keydelete/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`lists:keydelete/3` は、タプルのリストから、指定の位置の値が一致する要素を一つ消します。
たとえば、`{名前, 年齢}` の組の並びから、名前が一致する最初の組だけを取り除く、という使い方ができます。

## コード

```erlang:line-numbers=1393
keydelete(K, N, L) when is_integer(N), N > 0 ->
    keydelete3(K, N, L).

keydelete3(Key, N, [H|T]) when element(N, H) == Key -> T;
keydelete3(Key, N, [H|T]) ->
    [H|keydelete3(Key, N, T)];
keydelete3(_, _, []) -> [].
```

## 前提知識

- **キー位置 `N`**: タプルの何番目の要素を、キーとして比べるかを表す数です。Erlang のタプルは `1` から数えます。
- **`element/2`**: タプルの指定位置の要素を取り出します。
- **ガード `element(N, H) == Key`**: 指定位置の値が `Key` と等しいときだけ、その節を選びます。
- **`==` と `=:=`**: `==` は数の値として比べるので、`1 == 1.0` は真になります。`=:=` は型まで含めて比べます。

## 何をしているか

### 1. 入口で、位置が正しいかを確かめる

```erlang:line-numbers=1393
keydelete(K, N, L) when is_integer(N), N > 0 ->
    keydelete3(K, N, L).
```

`keydelete/3` は、`N` が 1 以上の整数であることを確かめてから、`keydelete3/3` に仕事を渡します。

### 2. 一致した最初のタプルを、飛ばす

```erlang:line-numbers=1396
keydelete3(Key, N, [H|T]) when element(N, H) == Key -> T;
```

先頭のタプル `H` の `N` 番目が `Key` と等しければ、そのタプルを捨てて、残りの `T` をそのまま返します。
この節で、消すのは一度きりに決まります。

### 3. 一致しなければ、残す

```erlang:line-numbers=1397
keydelete3(Key, N, [H|T]) ->
    [H|keydelete3(Key, N, T)];
```

一致しなければ、`H` を結果の先頭に残し、残りの `T` に対して同じ関数を呼びます。

### 4. 空になったら終わる

```erlang:line-numbers=1399
keydelete3(_, _, []) -> [].
```

リストが空になったら、空のリストを返します。

## ここがすごい

### 一致した一つだけを消す

二つ目以降に同じキーがあっても、消すのは最初の一つだけです。
一つ見つけたら、残りのリストをそのまま返すので、後ろの要素は一切変わりません。

### 一致しなければ、同じ形で残す

一致しない要素は、`[H|...]` の形で結果に残ります。
消す節と残す節を分けて書いているので、読み手は、どの条件で消えるのかを、ガードの一行で読み取れます。

### `==` の比べ方に注意する

`element(N, H) == Key` は、値として等しいかを比べます。`1` と `1.0` は、この比べ方では一致します。
同じ値として扱いたいときは、この比べ方が便利です。逆に、型まで区別したいときは、`=:=` を使う別の関数を選ぶ必要があります。

## まとめ

`lists:keydelete(b, 1, [{a, 1}, {b, 2}, {b, 3}])` は、`[{a, 1}, {b, 3}]` を返します。
一致する最初の `{b, 2}` だけが消えて、後ろの `{b, 3}` は残ります。
