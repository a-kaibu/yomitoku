---
title: "同じキーの最初の値を返す url.Values.Get"
description: "url.Values.Get は、クエリのキーに対応する値の最初の 1 つを返します。キーが無い場合や、値が無い場合は空の文字列を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/net/url/url.go"
lines: [908, 914]
function: "Get"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 標準ライブラリ]
---

## ひとことで

`url.Values` は、`?a=1&a=2` のように同じキーが複数あるクエリを、キーごとのスライスで持ちます。`v.Get("a")` は、その最初の値 `"1"` を返します。

## コード

```go:line-numbers=908
func (v Values) Get(key string) string {
	vs := v[key]
	if len(vs) == 0 {
		return ""
	}
	return vs[0]
}
```

## 前提知識

- **`url.Values`**: `map[string][]string` の型名です。1 つのキーに、複数の値を入れられます。
- **マップの読み出し**: 無いキーを読むと、値型のゼロ値が返ります。ここではスライスの `nil` です。
- **`len` で空を判定**: `nil` のスライスの長さは 0 なので、空かどうかを 1 つの条件で確かめられます。
- **添字 0**: スライスの先頭の要素です。

## 何をしているか

### 1. キーに対応する値のスライスを取り出す

```go:line-numbers=909
	vs := v[key]
```

`v[key]` で、そのキーに対応するスライスを取り出します。キーが無いときは、`nil` のスライスになります。

### 2. 値が無ければ空の文字列を返す

```go:line-numbers=910
	if len(vs) == 0 {
		return ""
	}
```

スライスの長さが 0 なら、キーが無いか、値が空です。どちらも区別せず、空の文字列を返します。

### 3. 最初の値を返す

```go:line-numbers=913
	return vs[0]
```

長さが 1 以上なら、先頭の値を返します。2 つ目以降は無視されます。

## ここがすごい

- **nil の扱いを自然にする**: 無いキーの読み出しがそのまま `nil` になるので、特別な検査が要りません。
- **よくある用途に合わせる**: 同じキーが複数あっても、普通は最初の値だけを使うので、その用途に合わせて簡単に取り出せます。
- **全部の値が必要なら別の操作**: 全部の値が欲しい場合は、スライスをそのまま使えばよい、という分け方になっています。

## まとめ

- `Values` は、キーごとに値のスライスを持つ。
- 長さを見て、無ければ空の文字列を返す。
- 最初の値だけを返すので、よくある使い方に合う。
