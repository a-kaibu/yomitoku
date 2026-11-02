---
title: "正規表現の入力が有効な UTF-8 かを 1 文字ずつ確かめる checkUTF8"
description: "正規表現の文字列が、有効な UTF-8 のバイト列かを確かめる関数。デコードした文字が U+FFFD かつ 1 バイトなら、不正な並びとしてエラーにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [2202, 2211]
function: "checkUTF8"
difficulty: 2
tags: [Unicode, パース, 防御的プログラミング]
---

## ひとことで

`checkUTF8(s)` は、正規表現の文字列 `s` が、UTF-8 として正しいバイト列かを確かめます。不正な並びが見つかると、`ErrInvalidUTF8` というエラーを返します。例えば `"\xff"` のように、UTF-8 として意味を持たないバイトは、ここで弾かれます。

## コード

```go:line-numbers=2202
func checkUTF8(s string) error {
	for s != "" {
		rune, size := utf8.DecodeRuneInString(s)
		if rune == utf8.RuneError && size == 1 {
			return &Error{Code: ErrInvalidUTF8, Expr: s}
		}
		s = s[size:]
	}
	return nil
}
```

## 前提知識

- **UTF-8**: 文字を 1〜4 バイトで表す方式です。ASCII は 1 バイト、日本語の多くは 3 バイトです。
- **`utf8.DecodeRuneInString`**: 文字列の先頭から 1 文字を取り出し、その文字（ルーン）と、使ったバイト数を返す関数です。
- **`utf8.RuneError`**: 復号できなかったときに返される特別な文字（U+FFFD）です。
- **`size == 1` の判定**: 不正なバイトは、1 バイトだけを消費して `RuneError` を返すという約束があります。正しい U+FFFD は 3 バイトなので、両方を見れば区別できます。

## 何をしているか

### 1. 1 文字ずつ復号する

```go:line-numbers=2203
	for s != "" {
		rune, size := utf8.DecodeRuneInString(s)
```

文字列が空になるまで、先頭から 1 文字ずつ復号します。`size` には、その文字が使ったバイト数が入ります。

### 2. 不正なバイトを見つけたら止める

```go:line-numbers=2205
		if rune == utf8.RuneError && size == 1 {
			return &Error{Code: ErrInvalidUTF8, Expr: s}
		}
```

復号結果が `RuneError` で、かつ使ったのが 1 バイトだけなら、そのバイトは UTF-8 として不正です。正しく書かれた U+FFFD は 3 バイトなので、この判定で区別できます。`Error` には、エラーの種類と、問題の部分（残りの文字列）を入れて返します。

### 3. 次の文字へ進む

```go:line-numbers=2208
		s = s[size:]
```

今の文字の分だけ、文字列を前に進めます。最後まで不正がなければ、ループを抜けて `nil` を返します。

## ここがすごい

- **1 バイトのエラーだけを見る**: 正しい U+FFFD と不正なバイトを、サイズだけで見分けています。文字そのものの比較だけでは区別できない場面を、うまく処理しています。
- **残りの文字列をエラーに入れる**: `Expr: s` で、どこから先が不正だったかを伝えています。エラーを見た人が、問題の場所を見つけやすくなります。
- **正規表現の本体より先に検査する**: パースの前に UTF-8 の正しさを確かめるので、以降の処理は正しいバイト列だけを扱えます。

## まとめ

- `checkUTF8` は、正規表現の文字列が正しい UTF-8 かを 1 文字ずつ確かめます。
- 復号結果が `RuneError` で、かつ 1 バイトだけなら、不正なバイトです。
- 不正なら、どこから先が問題かを添えて、エラーを返します。
- 正しい UTF-8 だけを、以降のパース処理に渡せます。
