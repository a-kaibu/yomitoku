---
title: "循環する型名を安全に文字にする structType.safeString。見た型は名前だけで止める"
description: "encoding/gob の structType.safeString。構造体の型を、フィールドの型も含めた文字列にする。同じ型を二度見たら、中身を展開せずに名前だけを書く。型が互いを参照していても、無限に続かないように止める。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [422, 436]
function: "safeString"
difficulty: 3
tags: [型システム, 再帰, 防御的プログラミング]
---

## ひとことで

`s.safeString(seen)` は、構造体の型を、人が読める文字列にします。フィールドの型も、その中身まで書き出します。例えば `Point = struct { X int; Y int; }` のような形です。

型が互いに参照しあっていると、中身を展開するたびに、同じ型を何度も辿ることになります。そこで、一度見た型は名前だけで止めて、無限に続かないようにします。

## コード

```go:line-numbers=422
func (s *structType) safeString(seen map[typeId]bool) string {
	if s == nil {
		return "<nil>"
	}
	if _, ok := seen[s.Id]; ok {
		return s.Name
	}
	seen[s.Id] = true
	str := s.Name + " = struct { "
	for _, f := range s.Field {
		str += fmt.Sprintf("%s %s; ", f.Name, f.Id.gobType().safeString(seen))
	}
	str += "}"
	return str
}
```

## 前提知識

- **再帰**: 関数が、自分自身を呼び出して、より小さな部分を処理する書き方です。型の中の型をたどるときに使われます。
- **循環参照**: 型 A が型 B を含み、型 B が型 A を含む、といった輪の形です。そのまま展開すると、終わりがなくなります。
- **`seen`**: 既に見た型の集合です。`map[typeId]bool` で、型の番号が見たかどうかを覚えます。
- **`Sprintf`**: 書式に従って文字列を作る関数です。フィールドの名前と型を並べるのに使います。

## 何をしているか

### 1. nil と既に見た型を先に処理する

```go:line-numbers=423
	if s == nil {
		return "<nil>"
	}
	if _, ok := seen[s.Id]; ok {
		return s.Name
	}
	seen[s.Id] = true
```

`nil` なら `<nil>` と書きます。既に `seen` にある型なら、中身を展開せず、名前だけを返します。まだ見ていなければ、`seen` に印を付けて先へ進みます。

### 2. フィールドを一つずつ書く

```go:line-numbers=430
	str := s.Name + " = struct { "
	for _, f := range s.Field {
		str += fmt.Sprintf("%s %s; ", f.Name, f.Id.gobType().safeString(seen))
	}
	str += "}"
	return str
```

名前から始めて、各フィールドの名前と型を書きます。フィールドの型も `safeString` で文字列にします。同じ `seen` を渡すので、途中で循環に出会っても止まります。

## ここがすごい

- **印で循環を止める**: 見た型を覚えておくことで、どれだけ深く入れ子になっていても、無限に続きません。
- **名前で代用する**: 二度目以降は、中身の代わりに名前だけを書きます。読み手にも、同じ型だと分かります。
- **同じ道具を再帰で使う**: フィールドの型に進むときも、同じ `seen` を渡します。どの深さでも、一つの仕組みで止まります。

## まとめ

- `safeString` は、構造体の型をフィールドまで含めた文字列にします。
- 一度見た型は、中身を展開せずに名前だけを書きます。
- `seen` の印で、循環しても無限に続かないようにします。
