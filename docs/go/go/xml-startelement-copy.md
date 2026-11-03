---
title: "属性の並びを複製する xml の StartElement.Copy"
description: "encoding/xml の StartElement.Copy。開始要素の属性のスライスを、新しく確保した配列へコピーする。元の要素と、属性の並びを共有しないコピーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [61, 66]
function: "Copy"
difficulty: 2
tags: [メモリ管理, データ構造]
---

## ひとことで

`e.Copy()` は、開始要素 `e` のコピーを返します。属性の並びは、新しく作った配列にコピーするので、元の要素と共有しません。

## コード

```go:line-numbers=61
func (e StartElement) Copy() StartElement {
	attrs := make([]Attr, len(e.Attr))
	copy(attrs, e.Attr)
	e.Attr = attrs
	return e
}
```

## 前提知識

- **StartElement**: XML の開始タグを表す型です。名前と属性の並びを持ちます。
- **スライスの共有**: スライスは、同じ配列を指す見方を複数持てます。片方を書き換えると、もう片方にも影響が出ます。
- **copy 関数**: スライスの要素を、別のスライスへ写す組み込みの関数です。

## 何をしているか

### 1. 同じ長さの新しい配列を作る

```go:line-numbers=62
	attrs := make([]Attr, len(e.Attr))
```

元の属性と同じ長さで、新しい配列を作ります。これは、元の配列とは別のメモリです。

### 2. 属性を写す

```go:line-numbers=63
	copy(attrs, e.Attr)
```

元の属性の内容を、新しい配列にコピーします。`Attr` の値そのものが写されるので、新しい配列を変えても、元には影響しません。

### 3. コピーした属性を入れて返す

```go:line-numbers=64
	e.Attr = attrs
	return e
```

`e` は値として受け取っているので、`e.Attr` を書き換えても、呼び出し元の値は変わりません。新しい属性を入れた `e` を返します。

## ここがすごい

- **元の値を守る**: 属性の並びを別に持つので、コピーの側で書き換えても、元の要素はそのままです。
- **値渡しの性質を使う**: `e` は値として受け取るので、戻り値に入れ替えるだけで、コピーが完成します。

## まとめ

- `Copy` は、開始要素の属性を新しい配列に写して返します。
- 元の要素と、属性の配列を共有しません。
- 値として受け取る性質を使い、簡潔に書いています。
