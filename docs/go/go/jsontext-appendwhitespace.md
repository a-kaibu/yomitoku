---
title: "JSON の区切りの後ろに空白や改行を入れる appendWhitespace。設定に応じて書き分ける"
description: "encoding/json/jsontext の appendWhitespace。JSON を書き出すときに、次の値の前に必要な区切りを判断する。コロンの後ろ、カンマの後ろに、設定に応じた空白を入れ、整形の設定があれば改行とインデントも入れる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/jsontext/encode.go"
lines: [658, 672]
function: "appendWhitespace"
difficulty: 2
tags: [入出力, パース, 可読性]
---

## ひとことで

`e.appendWhitespace(b, next)` は、次の値を書く前に、空白や改行を `b` に追加します。例えば `"a": 1` のように、コロンの後ろに空白を入れるかは、設定で決まります。

JSON は、空白がなくても正しく読めます。ただし、人が読みやすくするために、空白や改行を入れられるようになっています。この関数は、その判断を一か所にまとめています。

## コード

```go:line-numbers=658
func (e *encoderState) appendWhitespace(b []byte, next Kind) []byte {
	if delim := e.Tokens.needDelim(next); delim == ':' {
		if e.Flags.Get(jsonflags.SpaceAfterColon) {
			b = append(b, ' ')
		}
	} else {
		if delim == ',' && e.Flags.Get(jsonflags.SpaceAfterComma) {
			b = append(b, ' ')
		}
		if e.Flags.Get(jsonflags.Multiline) {
			b = e.AppendIndent(b, e.Tokens.NeedIndent(next))
		}
	}
	return b
}
```

## 前提知識

- **区切り（delim）**: 値と値の間に入る記号です。コロン `:` とカンマ `,` の二種類を扱います。
- **`needDelim`**: 次の値の前に、どの区切りが必要かを返すメソッドです。
- **`Flags`**: 書き出しの設定を表す値です。`SpaceAfterColon` などの項目を、`Get` で調べられます。
- **`Multiline`**: 改行とインデントを付けるかを表す設定です。

## 何をしているか

### 1. コロンの後ろの空白を決める

```go:line-numbers=659
	if delim := e.Tokens.needDelim(next); delim == ':' {
		if e.Flags.Get(jsonflags.SpaceAfterColon) {
			b = append(b, ' ')
		}
```

次に必要な区切りがコロンなら、設定 `SpaceAfterColon` が真のときだけ、空白を一つ追加します。

### 2. カンマの後ろと改行を決める

```go:line-numbers=664
		if delim == ',' && e.Flags.Get(jsonflags.SpaceAfterComma) {
			b = append(b, ' ')
		}
		if e.Flags.Get(jsonflags.Multiline) {
			b = e.AppendIndent(b, e.Tokens.NeedIndent(next))
		}
```

区切りがカンマなら、設定に応じて空白を入れます。整形の設定が有効なら、必要な分の改行とインデントを追加します。

## ここがすごい

- **設定で見た目を変える**: 同じ JSON でも、空白の有無や改行の有無を、設定で切り替えられます。書き出しの処理そのものは、変わりません。
- **区切りの種類で分ける**: コロンの後と、カンマの後で、必要な空白が違うので、区切りの種類で分岐しています。
- **改行は整形のときだけ**: 整形の設定がなければ、改行もインデントも入れません。小さな出力を保てます。

## まとめ

- `appendWhitespace` は、区切りの後ろに設定に応じた空白や改行を入れます。
- コロンの後ろとカンマの後ろで、判断を分けています。
- 整形の設定が有効なときだけ、改行とインデントを追加します。
