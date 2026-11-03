---
title: "パスを区切りごとに分けるとき、文字列とバイナリで同じ結果を返す"
description: "filename:split/1 は、パスを / や \\ の区切りで分けて、部分のリストを返す。文字列の場合は一度 flatten してから、OS に合った分け方を使う。バイナリにも同じ規則を適用する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/filename.erl
lines: [939, 950]
function: "filename:split/1"
difficulty: 2
format: 2
tags: ["ファイル", "文字列処理", "移植性"]
---
## ひとことで

`filename:split/1` は、パスを区切り文字で分けて、部分のリストにします。たとえば Unix の `"/a/b/c.txt"` は、`["/", "a", "b", "c.txt"]` になります。
入力は文字列でもバイナリでも受け付けます。どちらの場合も、今の OS に合った規則で分けます。

## コード

```erlang:line-numbers=939
split(Name) when is_binary(Name) ->
    case os:type() of
	{win32, _} -> win32_splitb(Name);
	_  -> unix_splitb(Name)
    end;

split(Name0) ->
    Name = flatten(Name0),
    case os:type() of
	{win32, _} -> win32_split(Name);
	_  -> unix_split(Name)
    end.
```

## 前提知識

- **区切り文字**: Unix では `/`、Windows では `/` と `\` が使われます。
- **`os:type/0`**: 今の OS を調べます。Windows なら `{win32, _}` を返します。
- **`flatten/1`**: 入れ子のリストを、1 つの平らなリストにします。文字列の入れ子を整えるために使います。
- **文字列とバイナリ**: 同じパスでも、リスト（`"a/b"`）とバイナリ（`<<"a/b">>`）の 2 通りで渡せます。
- **`unix_split/1` と `win32_split/1`**: OS ごとの分け方を書いた補助関数です。ここでは詳しく説明しません。

## 何をしているか

### 1. バイナリで渡されたとき

```erlang:line-numbers=939
split(Name) when is_binary(Name) ->
    case os:type() of
	{win32, _} -> win32_splitb(Name);
	_  -> unix_splitb(Name)
    end;
```

バイナリなら、OS を調べてから `win32_splitb/1` か `unix_splitb/1` を使います。バイナリのまま分けるので、途中で文字列に変換する必要がありません。

### 2. 文字列で渡されたとき

```erlang:line-numbers=945
split(Name0) ->
    Name = flatten(Name0),
    case os:type() of
	{win32, _} -> win32_split(Name);
	_  -> unix_split(Name)
    end.
```

文字列は、まず `flatten/1` で平らにします。入れ子のリストで渡されても、扱えるようにするためです。その後、OS に合った `win32_split/1` か `unix_split/1` で分けます。

## ここがすごい

### 文字列とバイナリの入り口を分けて、中身は OS で揃える

入力の型で、先頭の処理を分けています。バイナリのときは、そのまま分けられるように専用の関数に回します。文字列のときは、平らにしてから分けます。
どちらも、最後は OS に合った規則で分けるので、結果の形は同じになります。

### 分け方の違いを、OS の判定 1 つに閉じ込める

Windows は、`/` と `\` のどちらも区切りになります。Unix は `/` だけです。この違いを、`os:type/0` の結果で分けるだけにしています。
同じ `split/1` を、どの OS でも呼べるように作られています。

## まとめ

- パスの分割は、入力の型（文字列かバイナリか）による入り口と、OS による規則の 2 段に分けると整理できます。
- 入れ子の文字列は、`flatten` で平らにしてから扱うと、後の処理が単純になります。
- 文字列とバイナリで同じ結果が出るように揃えると、利用者が型を気にせず使えます。
