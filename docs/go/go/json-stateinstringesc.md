---
title: "JSON の文字列のエスケープを 1 文字で判定する stateInStringEsc"
description: "JSON の文字列の中で、バックスラッシュの次に来る文字を調べる状態の関数。許されたエスケープ文字なら文字列の状態へ戻り、\\u なら 4 桁の 16 進数の状態へ進む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [355, 365]
function: "stateInStringEsc"
difficulty: 2
tags: [パース, 状態機械, 文字列処理]
---

## ひとことで

`stateInStringEsc` は、JSON の文字列の中で `\` が出てきた直後の 1 文字を調べます。`\n` や `\"` のように決められた文字なら、もとの文字列の状態へ戻ります。`\u` なら、続く 4 桁の 16 進数を読む状態へ進みます。どれにも当てはまらなければ、エラーにします。

例えば `"a\nb"` の `\n` はここを通ります。`"a\qb"` の `\q` は、ここでエラーになります。

## コード

```go:line-numbers=355
func stateInStringEsc(s *scanner, c byte) int {
	switch c {
	case 'b', 'f', 'n', 'r', 't', '\\', '/', '"':
		s.step = stateInString
		return scanContinue
	case 'u':
		s.step = stateInStringEscU
		return scanContinue
	}
	return s.error(c, "in string escape code")
}
```

## 前提知識

- **JSON の文字列エスケープ**: `"` や改行などの文字は、`\"` や `\n` のように `\` で始まる書き方で表します。`é` のように、Unicode の文字を 16 進数で書く形もあります。
- **`switch` 文の複数の値**: `case 'b', 'f', 'n':` のように、いくつかの値を 1 つの節にまとめられます。
- **文字リテラル `'\\'`**: バックスラッシュ 1 文字を表す書き方です。Go では `\` 自体を書くために、`'\\'` と 2 つ並べます。
- **状態の戻り**: `s.step = stateInString` で、文字列の中身を読む状態に戻します。文字列の終わり `"` までは、そこで普通の文字として扱われます。

## 何をしているか

### 1. 一般的なエスケープ文字

```go:line-numbers=357
	case 'b', 'f', 'n', 'r', 't', '\\', '/', '"':
		s.step = stateInString
		return scanContinue
```

`b`、`f`、`n`、`r`、`t` は、それぞれ後退、改ページ、改行、復帰、タブを表します。`\\`、`\/`、`\"` は、記号そのものを表します。これらは 1 文字で完結するので、読み終えたら文字列の本体へ戻ります。

### 2. \u は 4 桁の数字を待つ

```go:line-numbers=360
	case 'u':
		s.step = stateInStringEscU
		return scanContinue
```

`\u` の後には 4 桁の 16 進数が続きます。そこで、4 桁を数える状態 `stateInStringEscU` へ進みます。

### 3. それ以外はエラー

```go:line-numbers=364
	return s.error(c, "in string escape code")
```

決められた文字でも `u` でもないなら、`\q` のような不正なエスケープです。`s.error` でエラーを返します。

## ここがすごい

- **状態を使うと、文字列の途中が読める**: 文字列の中の `"` は、エスケープされていなければ終わりを意味します。`\` の直後の状態を別に持つことで、`\"` を終わりと誤解しない仕組みになっています。
- **1 文字で状態を戻せる**: エスケープの 1 文字目を読んだら、すぐに本体の状態へ戻ります。戻る先が決まっているので、単純な 1 行の代入で済みます。
- **文法を表と同じように書く**: JSON の仕様にあるエスケープの一覧を、そのまま `case` の一覧にしています。仕様と並べて確かめやすいコードです。

## まとめ

- `stateInStringEsc` は、`\` の直後の 1 文字で、エスケープの種類を決めます。
- 決められた文字なら文字列の状態に戻り、`u` なら 16 進数の状態へ進みます。
- 決められていない文字は、エラーにします。
- 状態を分けると、文字列の中の `"` を終わりと誤解しない仕組みが作れます。
