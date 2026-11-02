---
title: "値を持つ context を作るときに、キーの条件を先に確かめる WithValue"
description: "context に値を付け足す context.WithValue。親か、キーか、キーの型の比較可能性を、作る前に確かめて、後で map のキーとして使えないものを弾く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/context/context.go"
lines: [732, 743]
function: "WithValue"
difficulty: 2
tags: [防御的プログラミング, 並行処理, API設計]
---

## ひとことで

`context.WithValue(parent, key, val)` は、親の context に値 `val` を付け足した新しい context を返します。値は、後から `ctx.Value(key)` で取り出せます。リクエストごとの ID など、関数の引数に並べたくない情報を運ぶために使います。

この関数は、作る前に 3 つの条件を確かめて、条件に合わないときは `panic` します。

## コード

```go:line-numbers=732
func WithValue(parent Context, key, val any) Context {
	if parent == nil {
		panic("cannot create context from nil parent")
	}
	if key == nil {
		panic("nil key")
	}
	if !reflectlite.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
	return &valueCtx{parent, key, val}
}
```

## 前提知識

- **context の鎖**: context は親を持ち、子は親の `Value` に問い合わせることができます。鎖をたどって、キーに一致する値を見つけます。
- **`any`**: どんな型の値も入る型です。`interface{}` と同じ意味です。
- **`panic`**: プログラムを止める、回復できないエラーです。呼び出し側の書き間違いを、早い段階で知らせるために使われます。
- **比較可能な型**: `==` で比べられる型です。map のキーにできるのは比較可能な型だけです。`[]int` や `map` は比較できません。
- **`reflectlite.TypeOf`**: 値の型情報を調べる関数です。`Comparable()` でその型が比較可能かを確かめます。

## 何をしているか

### 1. 親と、キーが nil でないかを確かめる

```go:line-numbers=733
	if parent == nil {
		panic("cannot create context from nil parent")
	}
	if key == nil {
		panic("nil key")
	}
```

親が `nil` なら、鎖をたどれません。キーが `nil` なら、そもそも何を探すか決まりません。どちらも、書き間違いを早く見つけるため、`panic` で止めます。

### 2. キーの型が比較可能かを確かめる

```go:line-numbers=739
	if !reflectlite.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
```

`Value` の内部では、キーを `==` で比べます。比べられない型（例えばスライス）をキーにすると、後で検索したときに問題が起きます。そこで、キーの型が比較可能かを、作る時点で確かめます。

### 3. 値を持つ新しい context を返す

```go:line-numbers=742
	return &valueCtx{parent, key, val}
```

条件を通ったら、親、キー、値をまとめた `valueCtx` を作って返します。親の情報は変わらず、この 1 段だけが値を追加します。

## ここがすごい

- **失敗を作る時点で気づかせる**: 比べられないキーは、使うまで問題が見えません。`WithValue` で止めることで、問題の発生場所と原因が近くなります。
- **親を変えない**: 新しい context は親を包むだけなので、親はそのまま使い続けられます。同じ親から、違う値を持つ子をいくつも作れます。
- **キーの型で衝突を避ける慣習**: `key` は、他のパッケージと衝突しないように、独自の型で作るのが普通です。この関数は、その型が比較可能であることだけを確かめます。

## まとめ

- `WithValue` は、親に値を付け足した新しい context を作ります。
- 親が `nil`、キーが `nil`、キーが比較不可能、のどれかなら、`panic` で止めます。
- キーは後で `==` で比べられるので、比較できる型でなければなりません。
- 親は変わらず、子だけが値を持つので、同じ親から複数の子を作れます。
