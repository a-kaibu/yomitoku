---
title: "拡張子は、最後の . の後ろで、スラッシュを含まないときだけ取り出す"
description: "filename:extension/1 のバイナリ版は、最後の . を探し、その後ろに区切り文字が無いときだけ拡張子を返す。ディレクトリ名に含まれる . を、拡張子と誤認しないための判定が核になる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/filename.erl
lines: [536, 561]
function: "filename:extension/1"
difficulty: 3
format: 2
tags: ["ファイル", "文字列処理", "パース"]
---
## ひとことで

`filename:extension/1` は、パスの拡張子（最後の `.` 以降の部分）を返します。`"/tmp/report.txt"` なら `".txt"` です。
バイナリで渡されたときは、この記事のコードが処理します。拡張子が無いときは、空のバイナリ `<<>>` を返します。

## コード

```erlang:line-numbers=536
extension(Name) when is_binary(Name) ->
    {Dsep,_} = separators(),
    SList = case Dsep of
		Sep when is_integer(Sep) -> 
		    [ <<Sep>> ];
		_ ->
		    []
	    end,
    case binary:matches(Name,[<<".">>]) of
	[] ->
	    <<>>;
	List ->
	    case lists:last(List) of
		{0,_} ->
		    <<>>;
		{Pos, _} ->
		    <<_:(Pos-1)/binary,Part/binary>> = Name,
		    case binary:match(Part,[<<"/">>|SList]) of
			nomatch ->
			    <<_:Pos/binary,Result/binary>> = Name,
			    Result;
			_ ->
			    <<>>
		    end
	    end
    end;
```

## 前提知識

- **拡張子**: ファイル名の最後の `.` から後ろの部分です。ここでは `.` を含めて返します。
- **区切り文字**: パスの中でディレクトリを分ける記号です。Unix では `/`、Windows では `\` も使われます。
- **`binary:matches/2`**: バイナリの中で、指定したパターンが出てくる位置を、すべて `{位置, 長さ}` の組で返します。
- **`lists:last/1`**: リストの最後の要素を返します。
- **`<<_:(Pos-1)/binary, Part/binary>>`**: バイナリの先頭から指定の長さを読み捨てて、残りを `Part` に束縛する形です。

## 何をしているか

### 1. `.` を探す

```erlang:line-numbers=537
    {Dsep,_} = separators(),
    SList = case Dsep of
		Sep when is_integer(Sep) -> 
		    [ <<Sep>> ];
		_ ->
		    []
	    end,
```

まず、区切り文字の一覧 `SList` を作ります。OS によっては区切り文字が無いこともあるので、その場合は空のリストになります。

```erlang:line-numbers=544
    case binary:matches(Name,[<<".">>]) of
	[] ->
	    <<>>;
```

`binary:matches/2` で、バイナリ中のすべての `.` の位置を探します。1 つも無ければ、拡張子は無いので空のバイナリを返します。

### 2. 最後の `.` を確かめる

```erlang:line-numbers=547
	List ->
	    case lists:last(List) of
		{0,_} ->
		    <<>>;
```

最後の `.` の位置を `lists:last/1` で取り出します。その位置が先頭（位置 0）なら、`.bashrc` のような隠しファイルです。拡張子として扱わず、空を返します。

### 3. `.` 以降に区切り文字が無いか確かめる

```erlang:line-numbers=551
		{Pos, _} ->
		    <<_:(Pos-1)/binary,Part/binary>> = Name,
		    case binary:match(Part,[<<"/">>|SList]) of
```

最後の `.` より後ろの部分 `Part` を取り出し、そこに区切り文字があるかを調べます。区切り文字があれば、`.` はディレクトリ名に属していたことになるので、拡張子ではありません。

### 4. 拡張子を返す

```erlang:line-numbers=554
			nomatch ->
			    <<_:Pos/binary,Result/binary>> = Name,
			    Result;
```

区切り文字が無ければ、最後の `.` から後ろを切り出して、結果として返します。

## ここがすごい

### `.` が見つかっても、その後ろで打ち消す

`/home/user.name/readme` のように、ディレクトリ名に `.` を含むパスがあります。単に最後の `.` を探すと、`.name/readme` を拡張子と誤認してしまいます。
この関数は、最後の `.` より後ろに区切り文字が無いことを確かめます。ディレクトリに属する `.` を、正しく除外しています。

### 先頭の `.` を、特別扱いする

`.profile` のように、先頭にだけ `.` があるファイルは、拡張子を持たないと考えます。位置 0 の `.` を調べる分岐は、この慣習を表しています。
細かな規則を、1 つずつ分岐として書き出しているので、どの場合にどう動くかを読み取りやすいです。

## まとめ

- 拡張子は、最後の `.` だけを見ても、正しく判定できない場合があります。
- `.` の後ろに区切り文字が無いことを確かめると、ディレクトリ名との混同を防げます。
- 先頭の `.` や、`.` が無い場合を分岐で書くと、規則を一つずつ確かめられます。
