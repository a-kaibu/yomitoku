---
title: "マップのキーの型が使えるかを確かめて、エンコーダーを作る newMapEncoder"
description: "encoding/json の newMapEncoder。マップのキーが、文字列、整数、またはテキストとして書ける型かを確かめる。使えない型なら、対応していないエンコーダーを返す。使えるなら、値のエンコーダーを包んだマップ用の関数を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [804, 816]
function: "newMapEncoder"
difficulty: 2
tags: [型システム, リフレクション, API設計]
---

## ひとことで

`newMapEncoder(t)` は、マップの型 `t` を JSON に書くための関数を作ります。JSON のキーは文字列でなければならないので、マップのキーの型がその条件を満たすかを、最初に確かめます。

満たさない型のマップは、JSON にできません。その場合は、対応していないことを伝える関数を返します。

## コード

```go:line-numbers=804
func newMapEncoder(t reflect.Type) encoderFunc {
	switch t.Key().Kind() {
	case reflect.String,
		reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
	default:
		if !t.Key().Implements(textMarshalerType) {
			return unsupportedTypeEncoder
		}
	}
	me := mapEncoder{typeEncoder(t.Elem())}
	return me.encode
}
```

## 前提知識

- **マップ**: キーと値の組を覚える型です。`map[string]int` などの形で書きます。
- **JSON のキー**: JSON のオブジェクトのキーは、必ず文字列です。そのため、マップのキーも文字列として書ける型である必要があります。
- **テキストとして書ける型**: `MarshalText` という約束を持つ型は、文字列に変換できるので、キーとして使えます。
- **`mapEncoder`**: マップの各要素を書き出すための、値のエンコーダーを持つ型です。

## 何をしているか

### 1. キーの型を確かめる

```go:line-numbers=805
	switch t.Key().Kind() {
	case reflect.String,
		reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
	default:
		if !t.Key().Implements(textMarshalerType) {
			return unsupportedTypeEncoder
		}
	}
```

キーの種類が、文字列か整数なら、そのまま使えます。それ以外の型は、テキストとして書ける約束を持つかを確かめます。持たなければ、対応していないエンコーダーを返します。

### 2. 値の書き方を包んで返す

```go:line-numbers=814
	me := mapEncoder{typeEncoder(t.Elem())}
	return me.encode
```

マップの値の型のエンコーダーを取り出し、`mapEncoder` に包みます。その `encode` メソッドを返すと、マップ全体を書き出す関数になります。

## ここがすごい

- **キーの条件を一か所に**: どの型がキーとして使えるかを、この `switch` だけで決めています。規則を読めば、すべてが分かります。
- **失敗を関数で返す**: 使えない型でも、エラーで止めずに、「対応していない」関数を返します。書き出しの途中で、失敗が伝えられます。
- **値の書き方を再利用**: 値の型のエンコーダーを使い回し、マップ全体の書き方に組み込みます。

## まとめ

- `newMapEncoder` は、マップのキーが JSON のキーとして使えるかを確かめます。
- 文字列や整数はそのまま、他の型はテキストとして書ける約束が必要です。
- 使えるときは、値の書き方を包んだ関数を返します。
