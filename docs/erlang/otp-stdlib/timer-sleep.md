---
title: "49 日を超える待ち時間を、少しずつ区切って待つ"
description: "timer:sleep/1 は、Erlang の receive の after に上限があるため、長い時間を上限ごとに区切って待つ。最後の端数だけを普通に待つ、単純な再帰で書かれている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/timer.erl
lines: [565, 575]
function: "timer:sleep/1"
difficulty: 1
format: 2
tags: ["並行処理", "標準ライブラリ"]
---
## ひとことで

`timer:sleep/1` は、指定したミリ秒だけ現在のプロセスを止めます。ただし、Erlang の `receive ... after` が待てる時間には上限があります。
上限より長い時間は、上限ごとに区切って何度も待ち、残りの端数だけを最後に待ちます。

## コード

```erlang:line-numbers=565
sleep(T)
  when is_integer(T),
       T > ?MAX_RECEIVE_AFTER ->
    receive
    after ?MAX_RECEIVE_AFTER ->
            sleep(T - ?MAX_RECEIVE_AFTER)
    end;
sleep(T) ->
    receive
    after T -> ok
    end.
```

上限の値は、ファイルの上のほうで定義されています。

```erlang:line-numbers=164
-define(MAX_RECEIVE_AFTER, 16#ffffffff).
```

## 前提知識

- **`receive ... after T -> ...`**: メッセージを待ちますが、`T` ミリ秒たっても届かなければ `after` の枝を実行します。メッセージを待たずに時間だけ止めたいときに、よく使われる書き方です。
- **`16#ffffffff`**: 16 進数の表記です。10 進数では 4294967295 です。
- **ガード `when`**: 関数の一致条件に、`T > ?MAX_RECEIVE_AFTER` のような条件を付けます。
- **`?MAX_RECEIVE_AFTER`**: `-define` で決めた定数を、マクロとして展開します。
- **再帰**: 関数が自分自身を呼び出すことです。ここでは、残りの時間を減らしながら何度も呼び出します。

## 何をしているか

### 1. 上限より長い時間のとき

```erlang:line-numbers=566
  when is_integer(T),
       T > ?MAX_RECEIVE_AFTER ->
    receive
    after ?MAX_RECEIVE_AFTER ->
            sleep(T - ?MAX_RECEIVE_AFTER)
    end;
```

`T` が上限より大きいときは、上限の分だけ `receive ... after` で待ちます。`after` の枝に来ると、残りの時間 `T - ?MAX_RECEIVE_AFTER` を使って、`sleep/1` を再び呼び出します。待ちの時間は、少しずつ減っていきます。

### 2. 上限以下の時間のとき

```erlang:line-numbers=572
sleep(T) ->
    receive
    after T -> ok
    end.
```

残りの時間が上限以下になると、この節に一致します。`receive ... after T -> ok` で、その時間だけ待って終わります。`after` の枝だけがあり、メッセージの待ち受けはありません。

## ここがすごい

### 「上限」を、Erlang の仕組みに合わせて決めている

`after` の値は、内部で 32 ビットの整数として扱われます。`16#ffffffff` ミリ秒は約 49.7 日です。それより長い値を直接渡すと、正しく待てません。
関数の中で上限を定数にしておけば、その制約をコードの中で一か所にまとめられます。

### 再帰が、残りの時間を持ち運ぶ

区切って待つ処理は、一見複雑に見えます。しかし、「残りの時間」を引数として渡すだけで、再帰が終わる条件（上限以下になること）がはっきりします。
ループ用の変数や状態を持たず、関数の引数だけで進められるのが Erlang らしい書き方です。

## まとめ

- 言語の仕組みに上限があるときは、その上限を定数にして、区切って処理するとよいです。
- 再帰の引数で残りの量を持ち運ぶと、終わる条件が分かりやすくなります。
- メッセージを待たずに時間だけ止める場合は、`receive ... after` で十分です。
