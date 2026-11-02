---
title: "1 文字を引用符で囲むときの処理 appendQuotedRuneWith。無効な文字は代用文字にする"
description: "strconv の appendQuotedRuneWith。1 つの文字を、引用符で囲んで、バイト列に追加する。無効な Unicode の値は、置き換え文字に差し替える。文字のエスケープは、別の関数に任せる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strconv/quote.go"
lines: [54, 62]
function: "appendQuotedRuneWith"
difficulty: 2
tags: [文字列処理, 防御的プログラミング, Unicode]
---

## ひとことで

`appendQuotedRuneWith(buf, r, quote, ASCIIonly, graphicOnly)` は、1 文字 `r` を引用符で囲んで、バイト列 `buf` の末尾に追加します。例えば `'a'` のように、前後に引用符が付きます。

文字によっては、そのまま書くと読みにくいものがあります。その場合は、エスケープと呼ばれる書き方に変換します。この関数は、その変換を別の関数に任せ、外側の引用符だけを担当しています。

## コード

```go:line-numbers=54
func appendQuotedRuneWith(buf []byte, r rune, quote byte, ASCIIonly, graphicOnly bool) []byte {
	buf = append(buf, quote)
	if !utf8.ValidRune(r) {
		r = utf8.RuneError
	}
	buf = appendEscapedRune(buf, r, quote, ASCIIonly, graphicOnly)
	buf = append(buf, quote)
	return buf
}
```

## 前提知識

- **`rune`**: Unicode の 1 文字を表す型です。実体は 32 ビットの整数です。
- **引用符（quote）**: 文字を囲む記号です。`'` や `"` のような、1 バイトの記号が使われます。
- **無効な Unicode**: 文字の範囲から外れた値です。例えば、存在しない巨大な値などが当てはまります。
- **`utf8.RuneError`**: 無効な文字を表す代わりの文字です。見た目は `�` のような記号です。
- **エスケープ**: 表示できない文字や、特別な意味を持つ文字を、`\n` のような別の書き方で表すことです。

## 何をしているか

### 1. 最初の引用符を追加する

```go:line-numbers=55
	buf = append(buf, quote)
```

まず、開始の引用符を `buf` の末尾に追加します。

### 2. 無効な文字を代用文字に差し替える

```go:line-numbers=56
	if !utf8.ValidRune(r) {
		r = utf8.RuneError
	}
```

`r` が有効な Unicode の範囲にない場合は、代わりに `utf8.RuneError` を使います。無効な値をそのまま書くと、正しい形の文字列にならないからです。

### 3. 文字を書いて、終わりの引用符を付ける

```go:line-numbers=59
	buf = appendEscapedRune(buf, r, quote, ASCIIonly, graphicOnly)
	buf = append(buf, quote)
	return buf
```

文字そのものは、エスケープの処理をする `appendEscapedRune` に任せます。その後、終わりの引用符を追加して、結果を返します。

## ここがすごい

- **役割が分かれている**: 外側の引用符、無効な文字の扱い、エスケープの処理、と役割ごとに関数を分けています。
- **必ず正しい形になる**: 無効な値は代用文字になるので、出力は常に、有効な Unicode の文字列として読めます。
- **既存のバッファに追加**: `buf` に続けて書き足すので、新しく配列を作りません。複数の文字を連結するときにも効率的です。

## まとめ

- `appendQuotedRuneWith` は、1 文字を引用符で囲んで、バイト列に追加します。
- 無効な値は `utf8.RuneError` に差し替えます。
- 文字の書き方は別の関数に任せ、この関数は引用符の役目を担います。
