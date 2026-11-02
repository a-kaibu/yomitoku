---
title: "インターフェースの値を中身の値として書き出す interfaceEncoder。nil は null にする"
description: "encoding/json の interfaceEncoder。インターフェースの値が nil なら、JSON の null を書く。nil でなければ、その中に入っている具体的な値を、同じ仕組みで書き出す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [689, 695]
function: "interfaceEncoder"
difficulty: 1
tags: [型システム, リフレクション, API設計]
---

## ひとことで

`interfaceEncoder(e, v, opts)` は、インターフェースの型の値を JSON にします。インターフェースは、中に別の型の値を入れて持つことができます。この関数は、その中身を取り出して書き出します。

インターフェースそのものに型の書き方はありません。書くべきなのは、中に入っている具体的な値です。中身が何もなければ、`null` と書きます。

## コード

```go:line-numbers=689
func interfaceEncoder(e *encodeState, v reflect.Value, opts encOpts) {
	if v.IsNil() {
		e.WriteString("null")
		return
	}
	e.reflectValue(v.Elem(), opts)
}
```

## 前提知識

- **インターフェース**: 「この操作ができる」という約束を表す型です。値を入れると、その中身の型が動きます。
- **`nil` のインターフェース**: 何も入っていない状態です。中身の型も値もありません。
- **`v.Elem()`**: インターフェースが持っている中身の値を取り出すメソッドです。
- **`reflectValue`**: 値を JSON に書き出す、内部の関数です。中身の型に応じた書き方が選ばれます。

## 何をしているか

### 1. 中身がなければ null を書く

```go:line-numbers=690
	if v.IsNil() {
		e.WriteString("null")
		return
	}
```

インターフェースに何も入っていなければ、JSON の `null` を書いて戻ります。

### 2. 中身を取り出して書く

```go:line-numbers=694
	e.reflectValue(v.Elem(), opts)
```

中身があれば、`Elem` で中身の値を取り出し、通常の書き出しの仕組みに任せます。インターフェースの中身が何であっても、その型に合った書き方になります。

## ここがすごい

- **包みを透かす**: インターフェースという包みを外して、中身だけを書きます。呼び出し側は、中の型を気にする必要がありません。
- **nil の扱いを一か所に**: 空の場合の書き方を、この関数の最初で決めています。中身の型ごとの処理とは、はっきり分かれています。
- **同じ仕組みに戻す**: 中身の書き出しを、通常の仕組みに渡します。特別な書き方を増やさずに、どんな型でも対応できます。

## まとめ

- `interfaceEncoder` は、インターフェースの中身を取り出して JSON に書きます。
- 中身が何もなければ、`null` を書きます。
- 中身の書き方は、通常の仕組みに任せます。
