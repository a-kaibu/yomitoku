---
title: "両端の空白を取り除く strings.trimSpaceUnicode。先頭は前から、末尾は後ろから"
description: "strings.TrimSpace の内部、trimSpaceUnicode。先頭の空白を前から UTF-8 の文字単位で取り除き、残りを末尾の処理に渡す。Unicode の空白も含めて判定する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [1086, 1095]
function: "trimSpaceUnicode"
difficulty: 2
tags: [文字列処理, Unicode, 標準ライブラリ]
---

## ひとことで

`strings.TrimSpace(s)` は、文字列の両端にある空白を取り除きます。空白には、スペース、タブ、改行に加えて、全角スペースなどの Unicode の空白も含まれます。`trimSpaceUnicode` は、その中で、マルチバイトの空白を含む場合に使われる処理です。

先頭は前から、末尾は別の関数に任せて、後ろから取り除きます。

## コード

```go:line-numbers=1086
func trimSpaceUnicode(s string) string {
	for len(s) > 0 {
		r, n := utf8.DecodeRuneInString(s)
		if !stringslite.IsSpace(r) {
			break
		}
		s = s[n:]
	}
	return trimRightSpaceUnicode(s)
}
```

## 前提知識

- **空白の判定**: `stringslite.IsSpace` は、空白文字の集まりを判定する内部関数です。Unicode の空白も含みます。
- **`utf8.DecodeRuneInString`**: 先頭から 1 文字を復号し、その文字とバイト数を返す関数です。
- **役割の分担**: 先頭の処理が終わったあと、残りを `trimRightSpaceUnicode` に渡します。末尾の処理は、そこで行います。
- **`s[n:]`**: 先頭の `n` バイトを除いた残りです。

## 何をしているか

### 1. 先頭の空白を文字単位で取り除く

```go:line-numbers=1088
		r, n := utf8.DecodeRuneInString(s)
		if !stringslite.IsSpace(r) {
			break
		}
		s = s[n:]
```

先頭から 1 文字を復号し、それが空白ならその分だけ先頭を切り落とします。空白でない文字に当たったら、そこで止めます。

復号した文字のバイト数 `n` で切るので、マルチバイトの空白（全角スペースなど）も、正しく 1 文字として扱われます。

### 2. 末尾の処理に渡す

```go:line-numbers=1094
	return trimRightSpaceUnicode(s)
```

先頭の空白を取り除いた残りを、末尾の処理 `trimRightSpaceUnicode` に渡して、その結果を返します。末尾にも同じ判定を行います。

## ここがすごい

- **文字単位で判定する**: バイト単位で空白を探すと、マルチバイトの空白を見落とします。復号して 1 文字ずつ判定するので、Unicode の空白も正しく消えます。
- **処理を左右に分ける**: 先頭と末尾を、別々の関数で扱います。それぞれの関数は、自分の方向だけを考えればよいので、読みやすくなります。
- **早く止まる**: 空白でない文字が来たら、残りを見ません。長い文字列でも、先頭の空白の分だけしか読みません。

## まとめ

- `trimSpaceUnicode` は、文字列の先頭の空白を、文字単位で取り除きます。
- 空白を判定するときは、UTF-8 の 1 文字として復号します。
- 先頭の処理が終わると、残りを末尾の処理に渡します。
- 空白でない文字に当たったら、すぐに止まります。
