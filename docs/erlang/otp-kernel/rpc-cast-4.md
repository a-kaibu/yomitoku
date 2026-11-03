---
title: "別のノードで関数を非同期に呼び、古い形の例外に読み替える"
description: "rpc:cast/4 は、別のノードで関数を非同期に実行し、結果を待たずに true を返す。新しい erpc:cast の失敗を、古い rpc の badarg の形に読み替えて投げ直す。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/rpc.erl
lines: [661, 668]
function: "rpc:cast/4"
difficulty: 3
format: 2
tags: ["並行処理", "ネットワーク", "エラー処理"]
---
## ひとことで

`rpc:cast/4` は、指定したノードで、モジュールの関数を呼び出します。結果は待ちません。呼び出しを送ったら、すぐに `true` を返します。
中身は、新しい `erpc:cast/4` に任せています。そこで起きた `badarg` の例外だけを、古い `rpc` の形に読み替えて、外へ投げ直します。

## コード

```erlang:line-numbers=661
cast(Node, Mod, Fun, Args) ->
    try
        ok = erpc:cast(Node, Mod, Fun, Args)
    catch
        error:{erpc, badarg} ->
            error(badarg)
    end,
    true.
```

## 前提知識

- **非同期呼び出し**: 相手の処理の終わりを待たずに、呼び出しを送って戻る方式です。結果は受け取りません。
- **`erpc:cast/4`**: 新しい形の非同期呼び出しです。送れたときは `ok` を返します。
- **`try ... catch`**: 例外を捕まえて、別の例外に変える構文です。
- **`error:{erpc, badarg}`**: 新しい関数が投げる、引数の誤りの例外の形です。
- **`rpc:cast/4` の戻り値 `true`**: 古い `rpc` の API に合わせた、決まった値です。

## 何をしているか

### 1. erpc:cast で、呼び出しを送る

```erlang:line-numbers=662
    try
        ok = erpc:cast(Node, Mod, Fun, Args)
```

`try` の中で、`erpc:cast/4` を呼びます。送れたら、戻り値の `ok` と一致します。一致しなければ、マッチの失敗が起きます。

### 2. badarg の例外を、古い形に読み替える

```erlang:line-numbers=664
    catch
        error:{erpc, badarg} ->
            error(badarg)
```

`erpc:cast/4` が `badarg` の例外を投げたら、その例外を捕まえて、`error(badarg)` を投げ直します。
外から見れば、古い `rpc` の関数が投げる例外と同じ形になります。

### 3. 成功したら、true を返す

```erlang:line-numbers=667
    end,
    true.
```

例外が起きなかったときは、`true` を返します。古い `rpc:cast/4` の、決まった戻り値です。

## ここがすごい

### 新しい関数の上に、古い形の関数を重ねる

`rpc` は、古い API です。その中身を、新しい `erpc` の上に組み直しています。
仕組みを一箇所に寄せ、古い呼び出し方を保ったまま、新しい実装を使えます。

### 例外の形を、読み替える

内側の例外は `{erpc, badarg}` という形です。外側へは、`badarg` だけで投げ直されます。
読み替えによって、古い呼び出し側は、新しい例外の形を知らなくても、同じ対応ができます。

### 結果を待たない、と決めている

関数は、送れたかどうかだけを確かめて戻ります。相手の処理結果は、受け取りません。
「とにかく送る」という非同期の考え方が、戻り値の形からそのまま読み取れます。

## まとめ

`rpc:cast('b@host', lists, reverse, [[1, 2, 3]])` は、送れたら `true` を返します。
結果は受け取らないので、相手の計算の答えは、この関数からは分かりません。
