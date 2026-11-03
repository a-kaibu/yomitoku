---
title: "異常終了のとき、クラッシュの報告を出してから落ちる"
description: "proc_lib:exit_p/3 は、proc_lib で起動したプロセスが例外で終わるときに呼ばれる。初期呼び出しの情報からクラッシュ報告を出し、最後に exit として再び投げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proc_lib.erl
lines: [358, 369]
function: "proc_lib:exit_p/3"
difficulty: 2
format: 2
tags: ["並行処理", "エラー処理"]
---
## ひとことで

`proc_lib:exit_p/3` は、`proc_lib` で起動されたプロセスが、捕まえられなかった例外で終わるときに呼ばれます。
まずクラッシュ報告（ログ）を出し、そのあとで `erlang:raise/3` により、プロセスを `exit` として終わらせます。報告に使う関数の情報は、プロセスの辞書から取ります。

## コード

::: code-group

```erlang:line-numbers=358 [日本語訳]
exit_p(Class, Reason, Stacktrace) ->
    case get('$initial_call') of
	{M,F,A} when is_atom(M), is_atom(F), is_integer(A) ->
	    MFA = {M,F,make_dummy_args(A, [])},
	    crash_report(Class, Reason, MFA, Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace);
	_ ->
	    %% プロセス辞書が消されたか、
	    %% 書き換えられた可能性があります。
	    crash_report(Class, Reason, [], Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace)
    end.
```

```erlang:line-numbers=358 [原文]
exit_p(Class, Reason, Stacktrace) ->
    case get('$initial_call') of
	{M,F,A} when is_atom(M), is_atom(F), is_integer(A) ->
	    MFA = {M,F,make_dummy_args(A, [])},
	    crash_report(Class, Reason, MFA, Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace);
	_ ->
	    %% The process dictionary has been cleared or
	    %% possibly modified.
	    crash_report(Class, Reason, [], Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace)
    end.
```

:::

## 前提知識

- **`proc_lib`**: 手続き的なプロセスを、OTP の仕組みに乗せて起動するためのモジュールです。`gen_server` などの土台になっています。
- **クラッシュ報告**: プロセスが異常終了したときに、原因や状態をログに出す仕組みです。運用中に、何が起きたかを追うために使います。
- **プロセス辞書**: プロセスごとに持てる、キーと値の表です。`get/1` で値を読みます。`'$initial_call'` は、プロセスが最初に呼ばれた関数を記録する項目です。
- **`erlang:raise/3`**: 指定したクラス（`exit`、`error`、`throw`）と理由で、例外を投げ直します。スタックトレースも指定できます。
- **`Class`, `Reason`, `Stacktrace`**: 例外の種類、理由、呼び出しの履歴です。

## 何をしているか

### 1. 初期呼び出しの情報があるとき

```erlang:line-numbers=359
    case get('$initial_call') of
	{M,F,A} when is_atom(M), is_atom(F), is_integer(A) ->
	    MFA = {M,F,make_dummy_args(A, [])},
	    crash_report(Class, Reason, MFA, Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace);
```

プロセス辞書の `'$initial_call'` に、`{M, F, A}`（モジュール、関数、引数の数）があれば、それを使います。引数の中身は、もう分からないので、同じ数の仮の値を作ります。その情報を使って `crash_report/4` で報告を出します。
そのあと `erlang:raise/3` で、`exit` として例外を投げ直します。

### 2. 情報が消えているとき

```erlang:line-numbers=364
	_ ->
	    %% The process dictionary has been cleared or
	    %% possibly modified.
	    crash_report(Class, Reason, [], Stacktrace),
	    erlang:raise(exit, exit_reason(Class, Reason, Stacktrace), Stacktrace)
```

プロセス辞書が消されたり、書き換えられたりしていると、初期呼び出しは分かりません。この場合は、引数を `[]` にして報告します。そのあとの処理は同じです。

## ここがすごい

### 報告と終了を、必ずセットにする

例外を投げ直すだけでは、何が起きたのかが記録されません。報告だけを出しても、プロセスは終わりません。
この関数は、報告を先に出し、そのあとで必ず終了させます。どちらの分岐でも、報告と終了の 2 つが必ず行われます。

### 壊れた状態でも報告を出す

プロセス辞書は、プログラムが自由に書き換えられます。そのため、情報がない場合を想定しています。`case` の 2 つ目の分岐は、情報がなくても報告を出すための安全策です。
エラーの処理の中で、さらにエラーが起きて報告が出ないことを防いでいます。

## まとめ

- 異常終了のときは、報告を出してから終了させると、後から原因を追えます。
- プロセス辞書のような、書き換え可能な情報に頼るときは、無い場合の処理も用意します。
- `erlang:raise/3` で例外の種類を指定すると、終わり方を制御できます。
