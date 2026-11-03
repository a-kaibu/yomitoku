---
title: "値の型の名前を表示用に作る xml の receiverType"
description: "encoding/xml の receiverType。値 val の型を文字列にする。名前付きの型ならその名前を、名前のない型なら丸括弧で囲んだ文字列を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/read.go"
lines: [196, 202]
function: "receiverType"
difficulty: 1
tags: [リフレクション, 可読性]
---

## ひとことで

`receiverType(val)` は、値 `val` の型を、人が読める文字列にします。名前付きの型と、そうでない型を見分けて表記を変えます。

## コード

```go:line-numbers=196
func receiverType(val any) string {
	t := reflect.TypeOf(val)
	if t.Name() != "" {
		return t.String()
	}
	return "(" + t.String() + ")"
}
```

## 前提知識

- **reflect.TypeOf**: 値の型を、実行時に `reflect.Type` として取り出す関数です。
- **名前付きの型**: `type T struct{}` のように、名前が付いた型です。`Name` で、その名前が取れます。
- **名前のない型**: `*T` や `[]int` のように、名前を持たない型です。

## 何をしているか

### 1. 名前付きの型なら、そのまま書く

```go:line-numbers=197
	t := reflect.TypeOf(val)
	if t.Name() != "" {
		return t.String()
	}
```

`reflect.TypeOf` で型を取り出します。`Name` が空でなければ、名前付きの型です。その場合は、`String` で得た表記をそのまま返します。

### 2. 名前のない型は丸括弧で囲む

```go:line-numbers=201
	return "(" + t.String() + ")"
```

名前のない型は、表記だけでは、どこまでが型なのか分かりにくいことがあります。たとえば `*T` のような表記です。そこで丸括弧で囲み、型の範囲を見やすくします。

## ここがすごい

- **表記の違いを残す**: 名前付きと名前なしを、表記で区別できるので、読む人が型の種類を推測しやすくなります。
- **短く書ける**: 型の分岐は一つだけで、文字列の作り方も単純です。

## まとめ

- `receiverType` は、値の型を表示用の文字列にします。
- 名前付きの型は、そのまま表記します。
- 名前のない型は、丸括弧で囲みます。
