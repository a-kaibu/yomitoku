---
title: "構造体のフィールド情報を一度だけ計算して覚える cachedTypeFields。並行処理でも安全に"
description: "encoding/json の cachedTypeFields。型ごとのフィールド情報を、キャッシュから取り出す。なければ計算して保存する。同時に複数の処理から呼ばれても、一つの型の情報が二重に作られないように、sync.Map の読み込みと保存を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [1326, 1332]
function: "cachedTypeFields"
difficulty: 2
tags: [並行処理, キャッシュ, リフレクション]
---

## ひとことで

`cachedTypeFields(t)` は、構造体の型 `t` のフィールドの情報を返します。一度計算した情報は、キャッシュに覚えておき、次からは計算せずに取り出します。

フィールドの情報は、型を調べて作るので、少し手間がかかります。同じ型は何度も使われるので、一度だけ作って覚えておくと、速くなります。

## コード

```go:line-numbers=1326
func cachedTypeFields(t reflect.Type) structFields {
	if f, ok := fieldCache.Load(t); ok {
		return f.(structFields)
	}
	f, _ := fieldCache.LoadOrStore(t, typeFields(t))
	return f.(structFields)
}
```

## 前提知識

- **キャッシュ**: 一度作った結果を保存しておき、次に同じものが必要なときに再利用する仕組みです。
- **`fieldCache`**: フィールドの情報を型ごとに覚えておく、表のような入れ物です。
- **`sync.Map`**: 複数の処理から同時に使っても安全な、キーと値の表です。`Load` と `LoadOrStore` のメソッドを持ちます。
- **`LoadOrStore`**: キーがあれば既存の値を、なければ与えた値を保存して返すメソッドです。

## 何をしているか

### 1. キャッシュにあれば取り出す

```go:line-numbers=1327
	if f, ok := fieldCache.Load(t); ok {
		return f.(structFields)
	}
```

型 `t` の情報がキャッシュにあれば、それを取り出して返します。計算はしません。

### 2. なければ作って保存する

```go:line-numbers=1330
	f, _ := fieldCache.LoadOrStore(t, typeFields(t))
	return f.(structFields)
```

キャッシュになければ、`typeFields(t)` で情報を作ります。`LoadOrStore` は、同時に別の処理が先に保存していれば、その値を使います。こうして、同じ型の情報が二つ残ることを防ぎます。

## ここがすごい

- **同時に呼ばれても安全**: 二つの処理が、同時に同じ型を調べても、保存されるのは一つだけです。`LoadOrStore` が、その競合を解決します。
- **計算は初回だけ**: 二回目以降は、保存された値を取り出すだけなので、とても速く動きます。
- **型をキーにする**: 型そのものをキーにするので、同じ型なら必ず同じ情報が得られます。

## まとめ

- `cachedTypeFields` は、型のフィールド情報をキャッシュから取り出します。
- なければ計算して保存し、同時に作られたときも一つだけを残します。
- 型をキーにした `sync.Map` で、並行処理でも安全に扱います。
