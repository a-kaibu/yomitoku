---
title: "同じ値を、指定の回数だけ並べたリストを作る"
description: "lists:duplicate/2 は、値 X を N 個並べたリストを返す。補助関数で、残りの回数を一つずつ減らしながら、先頭に X を積んでいく。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [591, 594]
function: "lists:duplicate/2"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`lists:duplicate/2` は、同じ値 `X` を `N` 個並べたリストを作ります。
`N` が 0 なら、空のリストを返します。`string:pad/4` が、埋める文字を並べるときにも、この関数を使っています。

## コード

```erlang:line-numbers=591
duplicate(N, X) when is_integer(N), N >= 0 -> duplicate(N, X, []).

duplicate(0, _, L) -> L;
duplicate(N, X, L) -> duplicate(N-1, X, [X|L]).
```

## 前提知識

- **累積リスト `L`**: 作りかけのリストを、引数で持ち回ります。
- **先頭への積み方 `[X|L]`**: 値を先頭に付けると、一回の操作で済みます。
- **残りの回数 `N`**: 何個まで積んだかを、引数で数えます。`0` になったら終わりです。
- **ガード `N >= 0`**: 負の回数は受け付けません。

## 何をしているか

### 1. 入口で、回数を確かめる

```erlang:line-numbers=591
duplicate(N, X) when is_integer(N), N >= 0 -> duplicate(N, X, []).
```

`duplicate/2` は、`N` が 0 以上の整数であることを確かめて、空のリストから作り始める `duplicate/3` を呼びます。

### 2. 回数が 0 になったら、作ったリストを返す

```erlang:line-numbers=593
duplicate(0, _, L) -> L;
```

残りの回数が 0 なら、その時点で作っていた `L` を返します。ここで、積む作業は終わりです。

### 3. 回数が残っていれば、値を積んで回数を減らす

```erlang:line-numbers=594
duplicate(N, X, L) -> duplicate(N-1, X, [X|L]).
```

残りの回数が 1 以上なら、`X` を `L` の先頭に付けて、残りの回数を一つ減らします。
この呼び出しは関数の最後にあるので、末尾再帰です。

## ここがすごい

### 末尾に足さず、先頭に積む

リストの末尾に値を足すのは、リストを最後まで辿る必要があり、回数が増えるほど遅くなります。
この関数は、先頭に積むので、一回の操作は回数に関係なく一定です。作ったリストの順番は、同じ値を並べるだけなので、崩れても問題になりません。

### 回数を、引数で数える

回数を数える部分を、外の変数ではなく、関数の引数として持ち回ります。
`duplicate/3` の第一引数は、残りの回数です。0 になったときに、一つ目の節が当たり、再帰が止まります。

### 入口と作業を分ける

`duplicate/2` は、作業の準備と、入力の確かめだけを担当します。作業は、`duplicate/3` が担当します。
呼び出す人は、回数と値だけを渡せば、中身の積み方を気にしなくて済みます。

### 回数が負の場合は、受け付けない

ガードの `N >= 0` で、負の回数は弾かれます。
「0 個並べる」は空のリストで自然に表せますが、「負の個数」は意味を持ちません。この関数は、そのような入力を、呼び出しの失敗として知らせます。

## まとめ

`lists:duplicate(3, a)` は、`[a, a, a]` を返します。
`lists:duplicate(0, a)` は、空のリスト `[]` を返します。
