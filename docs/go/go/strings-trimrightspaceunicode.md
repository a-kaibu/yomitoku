---
title: "末尾の空白を Unicode の基準で取り除く trimRightSpaceUnicode"
description: "strings パッケージの trimRightSpaceUnicode。文字列の末尾から、Unicode の空白文字を後ろから一文字ずつ取り除く。ASCII の文字は 1 バイトずつ読み、それ以外は最後の一文字だけを復号する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [1097, 1109]
function: "trimRightSpaceUnicode"
difficulty: 3
tags: [文字列処理, Unicode]
---

## ひとことで

`trimRightSpaceUnicode(s)` は、文字列 `s` の末尾にある、Unicode の空白文字を取り除きます。空白でない文字に当たったところで止めます。

## コード

```go:line-numbers=1097
func trimRightSpaceUnicode(s string) string {
	for len(s) > 0 {
		r, n := rune(s[len(s)-1]), 1
		if r >= utf8.RuneSelf {
			r, n = utf8.DecodeLastRuneInString(s)
		}
		if !stringslite.IsSpace(r) {
			break
		}
		s = s[:len(s)-n]
	}
	return s
}
```

## 前提知識

- **UTF-8**: 文字列を、1 文字を 1 から 4 バイトで表す形式です。ASCII の文字は、1 バイトのままです。
- **ルーン（rune）**: 1 文字を表す整数の型です。Unicode の一文字に当たります。
- **空白文字**: 空白やタブ、改行など、表示に幅を与えるだけの文字です。

## 何をしているか

### 1. 末尾の 1 バイトで判断する

```go:line-numbers=1098
	for len(s) > 0 {
		r, n := rune(s[len(s)-1]), 1
		if r >= utf8.RuneSelf {
			r, n = utf8.DecodeLastRuneInString(s)
		}
```

末尾の 1 バイトを `rune` として読み、そのバイト数 `n` を 1 とします。その値が ASCII の範囲（`utf8.RuneSelf` 未満）なら、そのまま使います。範囲外なら、`DecodeLastRuneInString` で末尾の一文字を正しく読み取り、そのバイト数を `n` に入れます。

### 2. 空白でなければ止める

```go:line-numbers=1103
		if !stringslite.IsSpace(r) {
			break
		}
		s = s[:len(s)-n]
	}
```

空白でない文字に当たったら、ループを抜けます。空白なら、その文字のバイト数 `n` だけ末尾を削ります。`n` を使うことで、多バイトの文字も途中で切れません。

### 3. 残りを返す

```go:line-numbers=1108
	return s
```

取り除き終わった文字列を返します。

## ここがすごい

- **ASCII は速く、それ以外は正しく**: 大半の文字は 1 バイトで済ませ、多バイトの文字だけ復号します。
- **バイト数を一緒に持つ**: 削る長さを `n` で覚えておくので、文字の途中で切ることがありません。

## まとめ

- `trimRightSpaceUnicode` は、末尾の Unicode の空白を取り除きます。
- ASCII は 1 バイトずつ、それ以外は末尾の一文字を復号して読みます。
- 削る長さは、文字のバイト数に合わせます。
