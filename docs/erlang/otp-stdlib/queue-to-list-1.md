---
title: "キューの中身を、先頭から順番に並んだリストにする"
description: "queue:to_list/1 は、キューの要素を先頭から順に並べたリストを返す。先頭側のリストをそのまま前に置き、後ろ側のリストを逆順にして続けるだけの一行。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/queue.erl
lines: [218, 221]
function: "queue:to_list/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`queue:to_list/1` は、キューに入っている要素を、取り出される順番どおりに並べたリストにして返します。
キューを壊さずに、中身を普通のリストとして見たいときに使います。

## コード

```erlang:line-numbers=218
to_list({In,Out}) when is_list(In), is_list(Out) ->
    Out++lists:reverse(In, []);
to_list(Q) ->
    erlang:error(badarg, [Q]).
```

## 前提知識

- **キューの表現**: `{In, Out}` の二つのリストです。`Out` は先頭側で、すぐ取り出される要素を持ちます。`In` は後ろから入った要素を、新しい順に逆に持ちます。
- **`lists:reverse/2`**: 第一引数のリストを逆にして、第二引数の先頭につなげます。ここでは、`[]` につなげているので、逆順のリストになります。
- **`++`**: 二つのリストをつなげる演算子です。左側は、先頭から全部コピーされます。
- **`badarg`**: キューの形でない値が渡されたときの、標準的なエラーです。

## 何をしているか

### 1. 形が正しいキューなら、二つを順につなげる

```erlang:line-numbers=218
to_list({In,Out}) when is_list(In), is_list(Out) ->
    Out++lists:reverse(In, []);
```

`In` と `Out` が、どちらもリストであれば、`Out` をそのまま先頭に置きます。その後ろに、`In` を逆順にしたものをつなげます。
`lists:reverse(In, [])` は、`In` の順番を反転させたリストを作ります。

### 2. 形が正しくなければ、badarg

```erlang:line-numbers=220
to_list(Q) ->
    erlang:error(badarg, [Q]).
```

キューの形でない値が来たら、`badarg` を投げます。投げるときは、引数を一緒に残します。

## ここがすごい

### 先頭側は、そのまま使う

`Out` は、すでに取り出される順番に並んでいます。
そのため、何も変えずに、結果の先頭に置けます。コピーの作業は、`++` の左側に一度起きるだけです。

### 後ろ側は、一度だけ反転する

`In` は、新しい要素が先頭に来るように積まれています。
取り出される順番に並べ直すには、反転が一度必要です。`lists:reverse/2` の第二引数に `[]` を使えば、反転と結合が一度の作業で済みます。

### 元のキューは、変わらない

この関数は、キューを書き換えません。
中身の並びだけを、新しいリストとして作ります。キューは、呼び出しの前と後で、同じ内容のままです。

### 空のキューは、空のリスト

両方のリストが空なら、結果は空のリストです。要素が無いキューを、そのまま見たときの答えとして自然です。
途中で特別な場合分けを書かなくても、`++` と `reverse` の性質から、正しい答えが出ます。

## まとめ

`queue:to_list(queue:from_list([a, b, c]))` は、`[a, b, c]` を返します。
先頭から取り出される順番どおりに、要素が並びます。
