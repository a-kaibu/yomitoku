---
title: "パスの種類を、今の OS の書き方で判定する"
description: "filename:pathtype/1 は、パスが絶対パスか相対パスかを、実行している OS の規則で判定する。Windows と Unix で、区切りや先頭の書き方が違うので、os:type/0 で振り分けている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/filename.erl
lines: [777, 785]
function: "filename:pathtype/1"
difficulty: 1
format: 2
tags: ["ファイル", "標準ライブラリ", "移植性"]
---
## ひとことで

`filename:pathtype/1` は、パスの種類を返します。`absolute`（絶対パス）、`relative`（相対パス）、`volumerelative`（ドライブ指定を含む相対パス、Windows のみ）のどれかです。
どの OS で動いているかを `os:type/0` で調べて、その OS の規則で判定する関数に任せます。

## コード

```erlang:line-numbers=777
pathtype(Atom) when is_atom(Atom) ->
    pathtype(atom_to_list(Atom));
pathtype(Name) when is_list(Name); is_binary(Name) ->
    case os:type() of
	{win32, _} ->
	    win32_pathtype(Name);
	{_, _}  ->
	    unix_pathtype(Name)
    end.
```

## 前提知識

- **絶対パス**: ルート（Unix なら `/`）から始まる、場所を完全に指定したパスです。
- **相対パス**: 今いる場所を基準にしたパスです。`a/b.txt` のような形です。
- **`os:type/0`**: 今の OS の種類を、`{unix, Name}` や `{win32, Name}` の形で返します。
- **ボリューム（ドライブ）**: Windows の `C:` のような、記憶装置の名前です。
- **`is_atom`、`is_list`、`is_binary`**: 値の型を確かめるガードです。`pathtype/1` は、アトム、文字列、バイナリのどれも受け付けます。

## 何をしているか

### 1. アトムで渡されたとき

```erlang:line-numbers=777
pathtype(Atom) when is_atom(Atom) ->
    pathtype(atom_to_list(Atom));
```

アトムは、文字列に変換してから判定します。`pathtype(foo)` は、`pathtype("foo")` と同じ扱いになります。

### 2. 文字列かバイナリのとき

```erlang:line-numbers=779
pathtype(Name) when is_list(Name); is_binary(Name) ->
    case os:type() of
	{win32, _} ->
	    win32_pathtype(Name);
	{_, _}  ->
	    unix_pathtype(Name)
    end.
```

Windows なら `win32_pathtype/1` に、それ以外なら `unix_pathtype/1` に任せます。OS の違いは、この 1 か所の振り分けにまとめられています。
Unix では、先頭が `/` なら絶対パス、そうでなければ相対パスになります。Windows では、ドライブ指定の有無や、区切り文字の種類も見ます。

## ここがすごい

### 違いを 1 か所で振り分ける

パスの書き方は、OS によって大きく違います。その違いを、呼び出し側に見せずに、`os:type/0` の結果で振り分けています。
利用者は同じ関数を呼ぶだけで、どの OS でも正しい種類が返ります。移植性を、関数の入り口で守る設計です。

### 型の違いを、ガードの一覧で受け止める

`pathtype/1` の節は、アトム、文字列、バイナリの 3 つを受け付けます。アトムは文字列に直し、残りはそのまま判定に回します。
入力の型を広く受け付けて、中では 1 つの形に揃える、という流れが読み取れます。

## まとめ

- パスの判定のような OS 依存の処理は、OS を調べる一か所に振り分けを集めると、移植しやすくなります。
- 入力の型は、受け取る側で広く認めて、内部では 1 つの形にそろえると、扱いが単純になります。
- 絶対と相対の区別は、パスを扱うプログラムの基礎になります。
