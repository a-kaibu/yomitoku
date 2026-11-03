---
title: "リストの各要素に、結果を捨てて副作用だけを起こす"
description: "lists:foreach/2 は、各要素に関数を順に適用するが、その戻り値は集めない。最後に ok を返す。表示や書き込みのように、値より副作用を目的とする処理に使う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2637, 2644]
function: "lists:foreach/2"
difficulty: 1
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:foreach/2` は、リストの要素を先頭から順に関数へ渡します。
関数の戻り値は、結果のリストに集めません。たとえば、要素を一つずつ表示するような、副作用を起こすために使います。最後の戻り値は、いつも `ok` です。

## コード

```erlang:line-numbers=2637
foreach(F, List) when is_function(F, 1) ->
    foreach_1(F, List).

foreach_1(F, [Hd | Tail]) ->
    F(Hd),
    foreach_1(F, Tail);
foreach_1(_F, []) ->
    ok.
```

## 前提知識

- **副作用**: 値を返す以外に、外の世界に影響を与える操作です。表示、ファイルへの書き込み、メッセージの送信などが例です。
- **`ok`**: 何も意味のある値を返さないときに使う、慣習的な戻り値です。
- **`map` との違い**: `map` は、戻り値を集めて新しいリストを作ります。`foreach` は、戻り値を捨てます。
- **`F(Hd)`**: 関数 `F` を、要素 `Hd` に一度だけ適用します。

## 何をしているか

### 1. 入口で、関数の形を確かめる

```erlang:line-numbers=2637
foreach(F, List) when is_function(F, 1) ->
    foreach_1(F, List).
```

`foreach/2` は、`F` が引数を一つ取る関数であることを確かめて、補助関数に仕事を渡します。

### 2. 先頭の要素で、関数を一度だけ呼ぶ

```erlang:line-numbers=2640
foreach_1(F, [Hd | Tail]) ->
    F(Hd),
    foreach_1(F, Tail);
```

先頭の要素 `Hd` を `F` に渡し、その結果は無視します。その後で、残りのリストに対して同じ補助関数を呼びます。
`F(Hd)` の戻り値は、どこにも保存されません。

### 3. 空になったら、ok を返す

```erlang:line-numbers=2643
foreach_1(_F, []) ->
    ok.
```

リストが空になったら、`ok` を返します。結果の値を気にする必要はない、という合図です。

## ここがすごい

### 戻り値を集めないから、メモリを使わない

`map` は、結果のリストを作るので、要素が多いとメモリを使います。
`foreach` は、戻り値を捨てるので、結果を作りません。大きなリストの一つずつに処理をかけるときに、余計な領域を使わずに済みます。

### 順番どおりに、一つずつ実行する

関数は、先頭の要素から順に、一つずつ呼ばれます。
前の要素の処理が終わってから、次の要素の処理が始まります。表示やファイルへの書き込みのように、順番が意味を持つ処理に向いています。

### 結果ではなく、起きたことで判断する

`foreach` の戻り値は、常に `ok` です。関数の中で何が起きたかを見るには、副作用の結果を、別の方法で確かめる必要があります。
値を返す設計と、副作用で結果を伝える設計を、呼び出し側で区別して選びます。

## まとめ

`lists:foreach(fun(X) -> io:format("~p~n", [X]) end, [1, 2])` は、`1` と `2` を順に表示し、最後に `ok` を返します。
表示の結果は、リストとしては返りません。
