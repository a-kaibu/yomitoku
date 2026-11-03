---
title: "型の情報を必ず得る gob の mustGetTypeInfo。失敗は panic で伝える"
description: "encoding/gob の mustGetTypeInfo。型 rt の型の情報を取得する。取得に失敗したら、エラーを返すのではなく panic を起こす。必ず成功することを前提にした場面で、呼び出しを簡単にするための関数。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [790, 796]
function: "mustGetTypeInfo"
difficulty: 1
tags: [防御的プログラミング, エラー処理, 型システム]
---

## ひとことで

`mustGetTypeInfo(rt)` は、型 `rt` の型の情報を取得します。取得に失敗したら、エラーを返さずに `panic` を起こします。名前の `must` は、「必ず成功しなければならない」という意味です。

普通は、エラーを返して、呼び出し側で判断します。しかし、gob の内部では、この型の情報が必ず取れる前提で動く場面があります。その場合に、呼び出し側を単純にするためにこの関数があります。

## コード

```go:line-numbers=790
func mustGetTypeInfo(rt reflect.Type) *typeInfo {
	t, err := getTypeInfo(userType(rt))
	if err != nil {
		panic("getTypeInfo: " + err.Error())
	}
	return t
}
```

## 前提知識

- **`must` の接頭辞**: Go では、失敗を許さない関数に `Must` や `must` を付ける習慣があります。失敗したら、すぐに止まることを表します。
- **`getTypeInfo`**: 型の情報を取得する本体の関数です。エラーを返すことがあります。
- **`userType`**: 利用者の型を、gob の情報に変換する関数です。前の記事で見ました。
- **`panic`**: 回復できない誤りで、プログラムを止める仕組みです。

## 何をしているか

### 1. 型の情報を取得する

```go:line-numbers=791
	t, err := getTypeInfo(userType(rt))
	if err != nil {
```

`userType` で型を変換し、`getTypeInfo` で型の情報を取り出します。エラーが返されたかを確かめます。

### 2. 失敗なら panic を起こす

```go:line-numbers=793
		panic("getTypeInfo: " + err.Error())
	}
	return t
```

エラーがあれば、その内容を含むメッセージで `panic` を起こします。エラーがなければ、取得した型の情報を返します。

## ここがすごい

- **呼び出し側が簡単**: 戻り値はいつも有効な情報なので、呼び出し側は、エラーの分岐を書かずに使えます。
- **失敗を隠さない**: 失敗は `panic` として、必ず目に見える形で伝わります。エラーを無視されて、後で壊れることがありません。
- **役割を限定する**: 前提が正しいと分かっている場所だけで使うように、名前で意図を示しています。

## まとめ

- `mustGetTypeInfo` は、型の情報を必ず取得して返します。
- 取得に失敗したら、`panic` で止めます。
- 失敗が許されない場面で、呼び出しを単純にするために使います。
