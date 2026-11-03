---
title: "型の情報を一度だけ作って覚える gob の getType。既にあれば作らずに返す"
description: "encoding/gob の getType。Go の型 rt に対応する gob の型を、表から探す。既に登録されていればそれを返し、なければ新しく作って表に登録する。同じ型の情報が二つ作られないようにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [609, 619]
function: "getType"
difficulty: 2
tags: [キャッシュ, 型システム, 最適化]
---

## ひとことで

`getType(name, ut, rt)` は、Go の型 `rt` に対応する gob の型の情報を返します。一度作った情報は表に登録されるので、次に同じ型を求められたら、作らずに取り出せます。

型の情報を作るには、型の構造を調べる必要があります。同じ型に何度も手間をかけないように、この関数は表を先に確かめます。

## コード

```go:line-numbers=609
func getType(name string, ut *userTypeInfo, rt reflect.Type) (gobType, error) {
	typ, present := types[rt]
	if present {
		return typ, nil
	}
	typ, err := newTypeObject(name, ut, rt)
	if err == nil {
		types[rt] = typ
	}
	return typ, err
}
```

## 前提知識

- **`types`**: Go の型をキーにして、gob の型の情報を覚えておく表です。
- **`newTypeObject`**: 型の情報を新しく作る内部の関数です。型の構造を調べて、情報を組み立てます。
- **`present`**: キーが表にあったかを表す真偽値です。`types[rt]` の形で、表から値と一緒に取り出せます。
- **キャッシュ**: 作った結果を覚えておき、次の要求に再利用する仕組みです。

## 何をしているか

### 1. 表にあればそのまま返す

```go:line-numbers=610
	typ, present := types[rt]
	if present {
		return typ, nil
	}
```

表に `rt` の登録があれば、その型の情報を返します。作り直す必要はありません。

### 2. なければ作って登録する

```go:line-numbers=614
	typ, err := newTypeObject(name, ut, rt)
	if err == nil {
		types[rt] = typ
	}
	return typ, err
```

表になければ、`newTypeObject` で新しく作ります。作れたときだけ、表に登録します。失敗したときは、登録せずにエラーを返します。失敗した結果を、表に残さないのがこの書き方の大切な点です。

## ここがすごい

- **作るのは一度だけ**: 登録された型は、以後の要求で再利用されます。型の構造を調べる手間が、繰り返されません。
- **失敗を覚えない**: 作れなかった型は表に入りません。次に同じ要求が来れば、もう一度試されます。誤った状態が残りません。
- **返り値を一つの形に**: 既存でも新規でも、同じ `(型, エラー)` の形で返すので、呼び出し側は違いを気にしません。

## まとめ

- `getType` は、型の情報を表から探し、なければ作って登録します。
- 作れた場合だけ、表に登録します。
- 既に登録された型は、作り直さずに再利用します。
