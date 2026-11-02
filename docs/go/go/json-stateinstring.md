---
title: "JSON の文字列の中を読む状態。引用符と逆スラッシュで次の状態を決める"
description: "encoding/json のスキャナの stateInString。文字列リテラルの中の 1 文字を見て、終わりの引用符なら値の終わりへ、逆スラッシュなら escape の状態へ進む。制御文字はエラーにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [339, 352]
function: "stateInString"
difficulty: 2
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`stateInString(s, c)` は、JSON の文字列の中にいるときに、次の 1 文字 `c` を受け取って、次の状態を決めます。例えば `"abc"` の中で `c` が `"` なら、文字列が終わったことを表します。

`encoding/json` は、文字を 1 つずつ読みながら、今どの場所にいるかを状態として記録します。この関数は、その中の「文字列の中」の状態を担当しています。

## コード

```go:line-numbers=339
func stateInString(s *scanner, c byte) int {
	if c == '"' {
		s.step = stateEndValue
		return scanContinue
	}
	if c == '\\' {
		s.step = stateInStringEsc
		return scanContinue
	}
	if c < 0x20 {
		return s.error(c, "in string literal")
	}
	return scanContinue
}
```

## 前提知識

- **状態機械**: 今いる状態と、次に来た文字によって、次の状態が決まる仕組みです。文字の列を、順に読むときによく使われます。
- **JSON の文字列**: 引用符 `"` で囲まれた部分です。中に引用符を書くには、`\"` のように逆スラッシュでエスケープします。
- **`scanContinue`**: 「まだ続く」ことを表す値です。文字列の途中にいるときは、この値を返します。
- **制御文字**: 改行やタブなど、表示されない文字です。JSON の文字列の中には、そのまま書けません。`0x20` より小さい値です。

## 何をしているか

### 1. 終わりの引用符で、文字列を閉じる

```go:line-numbers=340
	if c == '"' {
		s.step = stateEndValue
		return scanContinue
	}
```

文字 `c` が引用符なら、文字列が終わります。次の状態を `stateEndValue` にセットして、値の終わりを処理する段階へ進みます。

### 2. 逆スラッシュなら、エスケープの状態へ

```go:line-numbers=344
	if c == '\\' {
		s.step = stateInStringEsc
		return scanContinue
	}
```

逆スラッシュは、次の文字を特別な意味で読む合図です。次の状態を `stateInStringEsc` にして、エスケープの読み方に切り替えます。

### 3. 制御文字はエラーにする

```go:line-numbers=348
	if c < 0x20 {
		return s.error(c, "in string literal")
	}
	return scanContinue
```

`0x20` より小さい文字は、JSON の文字列の中には書けません。エラーを返して、どの文字が悪かったかを伝えます。それ以外の普通の文字は、そのまま `scanContinue` で、文字列の中を読み続けます。

## ここがすごい

- **状態を変えるだけで流れを作る**: 関数の中で、次に読む関数を `s.step` に入れます。大きな 1 つのループを書かずに、状態ごとの小さな関数が、流れを作ります。
- **文字の種類を素早く分ける**: 引用符、逆スラッシュ、制御文字、それ以外の 4 つを、順番に判定するだけです。
- **エラーの位置が分かる**: 制御文字を見つけたら、その文字と説明を一緒に返します。どこで壊れたかが分かりやすくなっています。

## まとめ

- `stateInString` は、JSON の文字列の中で、次の文字に応じて次の状態を決めます。
- 引用符なら文字列が終わり、逆スラッシュならエスケープの状態へ進みます。
- 表示されない制御文字は、エラーとして扱います。
