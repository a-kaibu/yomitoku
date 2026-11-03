---
title: "文字列の左・右・両側を、指定の文字で長さまで埋める"
description: "string:pad/4 は、文字列を指定の長さまで、指定の文字で埋める関数。左、右、両側の三通りがあり、両側のときは余りを右側に回す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [460, 474]
function: "string:pad/4"
difficulty: 2
format: 2
tags: ["文字列処理", "標準ライブラリ"]
---
## ひとことで

`string:pad/4` は、文字列の長さが指定より短いとき、足りない分だけ指定の文字を付け足します。
付け足す場所は、左、右、両側から選べます。長さが足りていれば、何も足さずに元の文字列を返します。

## コード

```erlang:line-numbers=460
pad(CD, Length, leading, Char) when is_integer(Length) ->
    Len = length(CD),
    [lists:duplicate(max(0, Length-Len), Char), CD];
pad(CD, Length, trailing, Char) when is_integer(Length) ->
    Len = length(CD),
    [CD|lists:duplicate(max(0, Length-Len), Char)];
pad(CD, Length, both, Char) when is_integer(Length) ->
    Len = length(CD),
    Size = max(0, Length-Len),
    Pre = lists:duplicate(Size div 2, Char),
    Post = case Size rem 2 of
               1 -> [Char];
               _ -> []
           end,
    [Pre, CD, Pre|Post].
```

## 前提知識

- **`lists:duplicate(N, Char)`**: 文字 `Char` を `N` 個並べたリストを作ります。`N` が 0 なら空のリストになります。
- **`max(0, Length-Len)`**: 足りない文字数を計算します。すでに長いときは差がマイナスになるので、`max` で 0 に丸めます。
- **ガード `when is_integer(Length)`**: 長さが整数のときだけ、この節を選びます。
- **リストのまま返す**: 戻り値は文字列を表す入れ子のリストです。結合は呼び出し側に任せています。
- **`Dir` の値**: `leading`（左）、`trailing`（右）、`both`（両側）の三つです。

## 何をしているか

### 1. 左に埋める

```erlang:line-numbers=460
pad(CD, Length, leading, Char) when is_integer(Length) ->
    Len = length(CD),
```

元の文字列の長さ `Len` を求め、足りない分の `Char` を左に並べます。
戻り値は `[埋める部分, CD]` という二要素のリストです。

### 2. 右に埋める

```erlang:line-numbers=463
pad(CD, Length, trailing, Char) when is_integer(Length) ->
    Len = length(CD),
```

左と同じ計算ですが、並びが逆です。`[CD|埋める部分]` は、元の文字列の後ろに埋める部分をつなげます。

### 3. 両側に埋める

```erlang:line-numbers=466
pad(CD, Length, both, Char) when is_integer(Length) ->
    Len = length(CD),
    Size = max(0, Length-Len),
    Pre = lists:duplicate(Size div 2, Char),
    Post = case Size rem 2 of
               1 -> [Char];
               _ -> []
           end,
    [Pre, CD, Pre|Post].
```

両側のときは、足りない文字数 `Size` を二つに分けます。
- 左側には `Size div 2` 個（切り捨て）を置きます。
- 右側には同じ数を置き、`Size rem 2` が 1 のときだけ、もう一文字を右側の最後に足します。

たとえば、足りない数が 5 なら、左に 2 個、右に 3 個です。余りの 1 文字は、右に回ります。

## ここがすごい

### 余りを右側に寄せる、というルールを一箇所で決める

両側に埋めるとき、奇数の余りをどちらに回すかは、どこかで決めなければなりません。
この関数は、`Post` という変数で「余りは右」と一度だけ決めています。読み手は、`case` の一箇所を見れば、ルールがわかります。

### 負の差を `max` で打ち消す

元の文字列が指定の長さより長いとき、`Length-Len` はマイナスになります。
`max(0, ...)` を挟むことで、`lists:duplicate` にはマイナスの数が渡らず、結果として何も足されません。
「短ければ埋める、長ければそのまま」という意図が、一行で表されています。

### 戻り値をリストのままにする

この関数は文字列をつなげて返さず、入れ子のリストを返します。
文字列を作るコストを減らせますし、続けて別の文字列と合わせるときにも、その場でつなげられます。

## まとめ

`string:pad("abc", 6, both, $*)` は、`"*abc**"` 相当のリストになります。
足りない数が 3 なので、左に 1 個、右に 2 個です。
