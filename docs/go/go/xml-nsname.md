---
title: "XML の名前を名前空間と局所名に分ける Decoder.nsname。コロンが二つあれば失敗"
description: "encoding/xml の Decoder.nsname。名前をコロンで二つに分け、接頭辞と局所名を作る。コロンが二つ以上あれば、不正な名前として失敗する。コロンがないか、どちらかが空なら、全体を局所名として扱う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [1175, 1189]
function: "nsname"
difficulty: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`d.nsname()` は、XML の名前を、接頭辞と局所名の二つに分けます。例えば `x:book` は、接頭辞 `x` と局所名 `book` になります。

コロンが二つ以上ある名前は、どこで分けるべきか決められないので、失敗とします。コロンがない名前は、接頭辞がないものとして扱います。

## コード

```go:line-numbers=1175
func (d *Decoder) nsname() (name Name, ok bool) {
	s, ok := d.name()
	if !ok {
		return
	}
	if strings.Count(s, ":") > 1 {
		return name, false
	} else if space, local, ok := strings.Cut(s, ":"); !ok || space == "" || local == "" {
		name.Local = s
	} else {
		name.Space = space
		name.Local = local
	}
	return name, true
}
```

## 前提知識

- **局所名（`Local`）**: 名前空間の中での、名前の本体です。`x:book` の `book` にあたります。
- **接頭辞（`Space`）**: 名前空間を表す部分です。`x:book` の `x` にあたります。
- **`d.name()`**: 次の名前を文字列として読む内部の関数です。
- **`strings.Cut`**: 文字列を、最初の区切りで二つに分ける関数です。区切りが見つかったかも返します。

## 何をしているか

### 1. コロンが二つ以上なら失敗する

```go:line-numbers=1180
	if strings.Count(s, ":") > 1 {
		return name, false
	} else if space, local, ok := strings.Cut(s, ":"); !ok || space == "" || local == "" {
		name.Local = s
	} else {
```

コロンの数を数えて、二つ以上なら失敗として返します。どこで区切るべきかが決まらないからです。

コロンが一つでも、接頭辞か局所名のどちらかが空なら、全体を局所名として扱います。`strings.Cut` は、最初のコロンで文字列を二つに分けて、区切りが見つかったかも返します。

### 2. 両方そろえば接頭辞と局所名を入れる

```go:line-numbers=1185
		name.Space = space
		name.Local = local
	}
	return name, true
```

どちらも空でなければ、接頭辞と局所名をそれぞれ入れて、成功を返します。

## ここがすごい

- **曖昧な名前を拒否する**: コロンが二つある名前を無理に分けず、失敗とします。誤った解釈で、後の処理が壊れることを防ぎます。
- **空の場合は全体を名前とする**: `:book` や `x:` のような不完全な名前も、局所名として扱い、データを失いません。
- **`Cut` で一度に分ける**: 最初のコロンで分けることと、分けられたかを確かめることを、一行で書いています。

## まとめ

- `nsname` は、名前を接頭辞と局所名に分けます。
- コロンが二つ以上なら、不正な名前として失敗します。
- 分けられないときは、全体を局所名として扱います。
