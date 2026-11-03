---
title: "プロセスの本体を呼ぶとき、例外をクラッシュ報告へ回す"
description: "proc_lib:init_p_do_apply/3 は、proc_lib で起動したプロセスの本体関数を、try で囲んで呼ぶ。例外が起きたら、exit_p/3 でクラッシュ報告を出し、プロセスを終わらせる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proc_lib.erl
lines: [339, 345]
function: "proc_lib:init_p_do_apply/3"
difficulty: 2
format: 2
tags: ["並行処理", "エラー処理"]
---
## ひとことで

`proc_lib:init_p_do_apply/3` は、新しく起動されたプロセスが、最初に実行する本体の関数（`M:F(A)`）を呼び出します。
本体の中で例外が起きると、この関数が捕まえて、`exit_p/3` に渡します。`exit_p/3` は、クラッシュ報告を出してからプロセスを終わらせます。

## コード

```erlang:line-numbers=339
init_p_do_apply(M, F, A) ->
    try
	apply(M, F, A) 
    catch
	Class:Reason:Stacktrace ->
	    exit_p(Class, Reason, Stacktrace)
    end.
```

## 前提知識

- **`proc_lib`**: 手続き的なプロセスを、OTP の規則に沿って起動する仕組みです。前に見た `exit_p/3` と `sync_start/3` もこのモジュールにあります。
- **`apply(M, F, A)`**: モジュール `M` の関数 `F` を、引数のリスト `A` で呼び出します。
- **`Class:Reason:Stacktrace`**: 例外の種類（`throw`、`exit`、`error`）、理由、呼び出しの履歴の 3 つを捕まえるパターンです。
- **`try ... catch ... end`**: 本体の処理と、例外のときの処理を分けて書きます。
- **クラッシュ報告**: 異常終了の内容を、ログに残すための仕組みです。

## 何をしているか

### 1. 本体を呼ぶ

```erlang:line-numbers=340
    try
	apply(M, F, A) 
```

`apply(M, F, A)` で、プロセスの本体を呼び出します。本体が正常に終われば、その戻り値は `try` の結果になります。この関数の戻り値は、そのまま返されます。

### 2. 例外を捕まえる

```erlang:line-numbers=342
    catch
	Class:Reason:Stacktrace ->
	    exit_p(Class, Reason, Stacktrace)
```

本体の中で例外が起きると、`Class`、`Reason`、`Stacktrace` の 3 つを受け取ります。そして、`exit_p/3` に渡します。

### 3. 終了の仕方は exit_p に任せる

この関数は、報告の内容も、プロセスの終わらせ方も、知りません。それらは `exit_p/3` の仕事です。`init_p_do_apply/3` は、例外を捕まえて渡すだけの役割です。

## ここがすごい

### 例外を、必ず 1 か所に集める

プロセスの本体がどこで失敗しても、例外はこの `try` で捕まります。そのため、クラッシュの報告と終了の仕方は、すべて同じ `exit_p/3` を通ります。
どの経路で落ちても、ログの形と後始末がそろいます。

### 本体の戻り値を、そのまま返す

正常に終わったときは、本体の戻り値をそのまま返します。`try` は、例外のときだけ `catch` の枝を使うので、正常系の処理には影響しません。
「正常なら透明に、異常ならまとめて処理する」という書き方です。

## まとめ

- プロセスの本体は、例外を 1 か所で捕まえると、報告と後始末をそろえられます。
- 正常系の戻り値は、捕まえる処理の影響を受けずに返せます。
- 報告と終了の仕方を、別の関数（`exit_p/3`）に分けると、役割がはっきりします。
