---
title: "表示する文字列を精度の指定で切り詰める fmt の truncateString"
description: "fmt の %.3s のような精度の指定で、文字列を文字単位で切る truncateString。バイト数ではなく、ルーン（文字）の数で数えるので、日本語でも文字が途中で壊れない。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/format.go"
lines: [327, 338]
function: "truncateString"
difficulty: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`fmt.Sprintf("%.3s", "こんにちは")` は `"こんに"` を返します。精度の数字 `3` は、バイト数ではなく **文字の数** を表します。この切り詰めを行うのが、`truncateString` です。

文字の途中でバイト列を切ると、壊れた UTF-8 になってしまいます。この関数は、文字の境目だけで切るように作られています。

## コード

```go:line-numbers=327
func (f *fmt) truncateString(s string) string {
	if f.precPresent {
		n := f.prec
		for i := range s {
			n--
			if n < 0 {
				return s[:i]
			}
		}
	}
	return s
}
```

## 前提知識

- **`fmt` の書式指定**: `%s` は文字列、`%.3s` は「最大 3 文字」という意味です。`.` の後の数字を精度（precision）と呼びます。
- **UTF-8 の可変長**: 日本語の 1 文字は 3 バイトです。バイトで切ると、文字の途中になってしまうことがあります。
- **`for i := range s`**: 文字列の範囲ループは、各文字の先頭バイトの位置 `i` を返します。文字の境目を見つける使い方ができます。
- **`f.precPresent`、`f.prec`**: 精度が指定されたかと、その値を保存しているフィールドです。

## 何をしているか

### 1. 精度が指定されているか確かめる

```go:line-numbers=328
	if f.precPresent {
		n := f.prec
```

`%s` のように精度がなければ、そのまま `s` を返します。精度があれば、残りの文字数を `n` に入れて、数え始めます。

### 2. 文字の境目を 1 つずつ数える

```go:line-numbers=330
		for i := range s {
			n--
			if n < 0 {
				return s[:i]
			}
		}
```

`range` で文字列を回すと、`i` は文字の先頭のバイト位置になります。1 文字ごとに `n` を減らし、`n` が負になったところ（指定した文字数を超えた瞬間）で、`s[:i]` を返します。`i` は文字の境目なので、文字が壊れません。

### 3. 精度より短ければ全部返す

```go:line-numbers=337
	return s
```

ループが終わるまで切らなかったら、文字列は精度より短いということです。そのまま全部返します。

## ここがすごい

- **バイトではなく文字で数える**: `range` の位置は文字の境目なので、切った結果が必ず正しい UTF-8 になります。単純な `s[:n]` より安全です。
- **切る場所を見つけてから切る**: 切るときは、一度だけ `s[:i]` でスライスするので、余分なコピーがありません。
- **精度がない場合は何もしない**: `precPresent` で最初に分岐するので、普段の `%s` には余計な処理がかかりません。

## まとめ

- 精度の指定は、バイト数ではなく文字数を表します。
- `range` で文字列を回すと、文字の境目の位置が分かります。
- その位置で切れば、UTF-8 の文字が壊れません。
- 精度がないときや、文字数が足りないときは、そのまま返します。
