---
title: "書き出す前に、だいたいの長さを確保する引用符付き文字列"
description: "strconv の内部関数 appendQuotedWith は、文字列を Go の文字列リテラルの形（引用符で囲み、特殊文字を \\ で書き換えたもの）に変換して、バイト列に追加します。先にまとめて容量を確保して、追加の確保を減らします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strconv/quote.go"
lines: [31, 52]
function: "appendQuotedWith"
difficulty: 2
format: 2
tags: [文字列処理, メモリ管理, 標準ライブラリ]
---

## ひとことで

`strconv.Quote("a\"b")` は、`"a\"b"` のように、文字列を Go のリテラルの形で囲んだものを返します。この関数は、その処理の中心で、結果を **バイト列 `buf` の末尾に追加** します。

`appendQuotedWith` という名前の `with` は、「ASCII だけにするか」「表示できる文字だけにするか」などの指定を受け取ることを意味します。

## コード

::: code-group

```go:line-numbers=31 [日本語訳]
func appendQuotedWith(buf []byte, s string, quote byte, ASCIIonly, graphicOnly bool) []byte {
	// 多くの場合、大きな文字列を渡されるので、先に確保しておく。引用符が付く場合も、
	// これは保守的な見積もりだが、それでも大いに役立つ。
	if cap(buf)-len(buf) < len(s) {
		nBuf := make([]byte, len(buf), len(buf)+1+len(s)+1)
		copy(nBuf, buf)
		buf = nBuf
	}
	buf = append(buf, quote)
	for r, width := rune(0), 0; len(s) > 0; s = s[width:] {
		r, width = utf8.DecodeRuneInString(s)
		if width == 1 && r == utf8.RuneError {
			buf = append(buf, `\x`...)
			buf = append(buf, lowerhex[s[0]>>4])
			buf = append(buf, lowerhex[s[0]&0xF])
			continue
		}
		buf = appendEscapedRune(buf, r, quote, ASCIIonly, graphicOnly)
	}
	buf = append(buf, quote)
	return buf
}
```

```go:line-numbers=31 [原文]
func appendQuotedWith(buf []byte, s string, quote byte, ASCIIonly, graphicOnly bool) []byte {
	// Often called with big strings, so preallocate. If there's quoting,
	// this is conservative but still helps a lot.
	if cap(buf)-len(buf) < len(s) {
		nBuf := make([]byte, len(buf), len(buf)+1+len(s)+1)
		copy(nBuf, buf)
		buf = nBuf
	}
	buf = append(buf, quote)
	for r, width := rune(0), 0; len(s) > 0; s = s[width:] {
		r, width = utf8.DecodeRuneInString(s)
		if width == 1 && r == utf8.RuneError {
			buf = append(buf, `\x`...)
			buf = append(buf, lowerhex[s[0]>>4])
			buf = append(buf, lowerhex[s[0]&0xF])
			continue
		}
		buf = appendEscapedRune(buf, r, quote, ASCIIonly, graphicOnly)
	}
	buf = append(buf, quote)
	return buf
}
```

:::

## 前提知識

- **`append`**: スライスの末尾に値を追加する組み込み関数です。容量が足りないときは、新しく大きい配列を確保して、中身をコピーします。
- **`cap` と `len`**: `cap(buf)-len(buf)` は、確保済みで、まだ使っていない場所の大きさです。
- **`utf8.DecodeRuneInString`**: 文字列の先頭の 1 文字を取り出し、そのバイト数（`width`）を返します。
- **`\x`**: Go の文字列リテラルで、1 バイトを 16 進数で書くエスケープです。
- **`rune`**: 1 文字を表す型です。

## 何をしているか

### 1. 先に場所を確保する

```go:line-numbers=32
	// Often called with big strings, so preallocate. If there's quoting,
	// this is conservative but still helps a lot.
	if cap(buf)-len(buf) < len(s) {
		nBuf := make([]byte, len(buf), len(buf)+1+len(s)+1)
		copy(nBuf, buf)
		buf = nBuf
	}
```

引用符が付くと、結果は元の文字列より長くなります。ただし、正確な長さは最後まで分かりません。そこで、「元の文字列の長さ + 引用符 2 つ」の分を、最初にまとめて確保します。

### 2. 1 文字ずつ書く

```go:line-numbers=39
	buf = append(buf, quote)
```

先頭の引用符を書きます。続いて、文字列を 1 文字ずつ読んで、必要な書き換えを加えながら追加していきます。

### 3. 不正な UTF-8 のバイトは `\x` で書く

```go:line-numbers=42
		if width == 1 && r == utf8.RuneError {
			buf = append(buf, `\x`...)
			buf = append(buf, lowerhex[s[0]>>4])
			buf = append(buf, lowerhex[s[0]&0xF])
			continue
		}
```

UTF-8 として正しくないバイトは、置換文字になります。そこでこの場合だけ、元のバイトを `\x` と 16 進数 2 桁で書き出します。こうすると、元のバイトがそのまま復元できます。

## ここがすごい

- **確保を 1 回にまとめる**: 追加のたびに容量が足りなくなると、何度も配列の作り直しが起きます。大きさを先に見積もれば、確保は 1 回で済むことが多くなります。
- **見積もりが保守的でも効果がある**: 引用符で増える分を正確に数えずに、最大でも足りる量を確保します。少し多めに確保しても、正しさは変わりません。
- **不正なバイトも失わない**: 置換文字に変えてしまうと元の値が分からなくなります。`\x` で書くので、読む側は元のバイト列を取り出せます。

## まとめ

- 結果の長さがある程度分かるなら、先に確保して `append` の回数を減らせる。
- 見積もりは多めでよく、足りないことだけを避ければよい。
- 変換で情報が失われるときは、元の値を復元できる書き方を選ぶ。
