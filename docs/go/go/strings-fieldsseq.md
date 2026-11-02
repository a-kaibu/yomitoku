---
title: "空白で区切る strings.FieldsSeq。ASCII の 1 バイトを表で素早く判定"
description: "空白の位置で文字列を分けるイテレータ strings.FieldsSeq。ASCII の空白は表で 1 回の添字アクセスで判定し、マルチバイト文字だけ UTF-8 の復号と unicode の判定を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/iter.go"
lines: [83, 110]
function: "FieldsSeq"
difficulty: 3
tags: [文字列処理, イテレータ, 最適化]
---

## ひとことで

`strings.FieldsSeq(s)` は、空白文字（スペース、タブ、改行など）で区切られた単語を、1 つずつ順番に渡すイテレータです。`strings.Fields` と同じ結果を、配列を作らずに得られます。例えば `"  go   is  fun "` からは `"go"`、`"is"`、`"fun"` の 3 つが順に出てきます。

この関数は、1 文字ずつ見ていく処理を 1 本の `for` ループで書いています。空白の判定には、ASCII 用の表と、Unicode 用の判定を使い分けています。

## コード

```go:line-numbers=83
func FieldsSeq(s string) iter.Seq[string] {
	return func(yield func(string) bool) {
		start := -1
		for i := 0; i < len(s); {
			size := 1
			r := rune(s[i])
			isSpace := asciiSpace[s[i]] != 0
			if r >= utf8.RuneSelf {
				r, size = utf8.DecodeRuneInString(s[i:])
				isSpace = unicode.IsSpace(r)
			}
			if isSpace {
				if start >= 0 {
					if !yield(s[start:i]) {
						return
					}
					start = -1
				}
			} else if start < 0 {
				start = i
			}
			i += size
		}
		if start >= 0 {
			yield(s[start:])
		}
	}
}
```

## 前提知識

- **空白文字**: スペース、タブ、改行などの、見た目では何もない文字です。Unicode では全角スペースなども空白に入ります。
- **UTF-8 の 1 文字**: 1 文字が 1〜4 バイトで表されます。ASCII（英数字や記号）は 1 バイトで、128 未満の値です。
- **`utf8.RuneSelf`**: 128 のことです。これ未満のバイトは ASCII の 1 文字であることを表します。
- **`asciiSpace` 表**: 256 個の要素を持つ配列で、ASCII の空白のバイトだけが 0 でない値になっています。`asciiSpace[b] != 0` で 1 回の添字アクセスで空白かを判定できます。
- **`start` 変数**: 現在の単語の開始位置を表します。`-1` は「今は単語の外にいる」という意味です。

## 何をしているか

### 1. ASCII の空白は表で判定する

```go:line-numbers=89
				isSpace := asciiSpace[s[i]] != 0
```

まず、現在のバイトが ASCII の空白かどうかを、表 `asciiSpace` で調べます。表を引くのは 1 回の配列アクセスだけなので、多くの場合はこれで判定が終わります。

### 2. マルチバイト文字だけ復号して判定する

```go:line-numbers=90
				if r >= utf8.RuneSelf {
					r, size = utf8.DecodeRuneInString(s[i:])
					isSpace = unicode.IsSpace(r)
				}
```

バイトの値が 128 以上なら、UTF-8 の 1 文字として復号します。`size` には、その文字が何バイトかが入ります。全角スペースのように、表に載っていない空白は `unicode.IsSpace` で判定します。

ASCII の文字は、この部分をまるごと飛ばせるので、英語の文章では速く進みます。

### 3. 単語の始まりと終わりで yield する

```go:line-numbers=101
				} else if start < 0 {
					start = i
				}
```

空白でないバイトが来て、まだ単語の外にいるなら、`start` に今の位置を記録します。空白に来たら、直前の単語 `s[start:i]` を `yield` で渡します。

最後の単語は、ループを抜けた後の `if start >= 0 { yield(s[start:]) }` で渡します。文字列が空白で終わるときは、この処理は何もしません。

## ここがすごい

- **1 バイトの判定を表で済ませる**: 空白の種類は限られているので、256 要素の表にしてしまえば、条件式を何個も並べる必要がありません。
- **ASCII と Unicode を分ける**: 大部分の文章は ASCII なので、重い UTF-8 の復号は、必要な場合だけ行われます。速さと正しさを両立させる設計です。
- **単語を複製しない**: 単語は `s[start:i]` という部分文字列として渡されます。新しいメモリは作られず、元の文字列を指すだけです。

## まとめ

- `FieldsSeq` は、空白で区切られた単語を 1 つずつ `yield` で渡すイテレータです。
- ASCII の空白は表で 1 回の判定で済みます。
- 128 以上のバイトだけ UTF-8 として復号し、`unicode.IsSpace` で判定します。
- 単語は部分文字列として渡すので、コピーが起きません。
