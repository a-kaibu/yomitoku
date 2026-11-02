---
title: "末尾から指定の文字を消す strings.trimRightUnicode。後ろから 1 文字ずつ見る"
description: "strings.TrimRight の内部、trimRightUnicode。文字列の末尾から、カットセットに入っている文字を 1 文字ずつ取り除く。ASCII は 1 バイトで比べ、マルチバイトだけ UTF-8 の末尾の復号を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [1072, 1084]
function: "trimRightUnicode"
difficulty: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.TrimRight(s, cutset)` は、文字列の末尾から、`cutset` に含まれる文字をすべて取り除きます。例えば `strings.TrimRight("hello!!!", "!")` は `"hello"` を返します。その中心の処理が `trimRightUnicode` です。

先頭から切る `trimLeftUnicode` と対になる関数で、後ろから 1 文字ずつ見ていきます。

## コード

```go:line-numbers=1072
func trimRightUnicode(s, cutset string) string {
	for len(s) > 0 {
		r, n := rune(s[len(s)-1]), 1
		if r >= utf8.RuneSelf {
			r, n = utf8.DecodeLastRuneInString(s)
		}
		if !ContainsRune(cutset, r) {
			break
		}
		s = s[:len(s)-n]
	}
	return s
}
```

## 前提知識

- **カットセット**: 取り除きたい文字の集まりを、1 つの文字列で表したものです。`"!?"` なら、`!` と `?` の両方が対象です。
- **UTF-8 の末尾の復号**: 後ろから見るときは、文字の先頭がどこにあるか分からないので、`utf8.DecodeLastRuneInString` を使います。
- **`utf8.RuneSelf`**: 128 のことです。これ未満のバイトは、1 バイトで 1 文字の ASCII です。
- **`ContainsRune`**: 文字列の中に、その文字があるかを調べる関数です。

## 何をしているか

### 1. 末尾の 1 文字を取り出す

```go:line-numbers=1074
		r, n := rune(s[len(s)-1]), 1
		if r >= utf8.RuneSelf {
			r, n = utf8.DecodeLastRuneInString(s)
		}
```

末尾のバイトを、そのまま `rune` として取り出し、長さを 1 とします。そのバイトが 128 以上なら、マルチバイトの文字の途中かもしれないので、末尾から文字を復号し直します。`n` には、その文字のバイト数が入ります。

### 2. カットセットに無ければ止める

```go:line-numbers=1078
		if !ContainsRune(cutset, r) {
			break
		}
		s = s[:len(s)-n]
```

取り出した文字がカットセットに含まれなければ、そこで止めます。含まれていれば、その文字の長さ `n` だけ、末尾を切り落とします。

## ここがすごい

- **ASCII の速い道**: 多くの文字列は ASCII です。その場合は、末尾のバイトをそのまま比べるので、復号の処理を省けます。
- **後ろから読む難しさを隠す**: UTF-8 は前から読むのが自然な形式です。末尾の 1 文字を正しく取るために、`DecodeLastRuneInString` を使い、後ろからでも文字の境目を正しく見つけます。
- **切った結果も正しい UTF-8**: 切るのは文字単位なので、途中で壊れたバイト列を残しません。

## まとめ

- `trimRightUnicode` は、末尾からカットセットの文字を取り除きます。
- 末尾が ASCII なら 1 バイトで比べ、マルチバイトなら末尾の復号を使います。
- カットセットに含まれない文字に当たったら、止めます。
- 切るのは文字単位なので、結果は正しい UTF-8 のままです。
