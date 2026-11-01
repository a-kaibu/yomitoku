---
title: "1 段だけ元のエラーを取り出す errors.Unwrap"
description: "errors.Unwrap は、エラーが Unwrap() error というメソッドを持っていれば、その中にある 1 段下のエラーを返します。持っていなければ nil を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2018 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/errors/wrap.go"
lines: [17, 25]
function: "Unwrap"
difficulty: 1
format: 2
tags: [エラー処理, 標準ライブラリ, 型システム]
---

## ひとことで

`errors.Unwrap(fmt.Errorf("読み込み: %w", io.EOF))` は、包まれていた `io.EOF` を返します。エラーを、外側の文脈と、元の原因に分けて扱えます。

## コード

```go:line-numbers=17
func Unwrap(err error) error {
	u, ok := err.(interface {
		Unwrap() error
	})
	if !ok {
		return nil
	}
	return u.Unwrap()
}
```

## 前提知識

- **エラーの包み**: `fmt.Errorf` の `%w` は、元のエラーを中に保ったまま、新しい説明を付けます。
- **匿名のインターフェース**: `interface { Unwrap() error }` は、名前を付けずに、メソッドの形だけを表します。
- **型アサーション `err.(...)`**: 値が、その形のメソッドを持つかを実行時に調べます。
- **`nil`**: 包まれていないエラーからは、取り出せるものがありません。

## 何をしているか

### 1. Unwrap を持つかを調べる

```go:line-numbers=18
	u, ok := err.(interface {
		Unwrap() error
	})
```

`err` を、「`Unwrap() error` を持つ型」として見られるかを確かめます。見られなければ `ok` は `false` です。

### 2. 持たなければ nil を返す

```go:line-numbers=21
	if !ok {
		return nil
	}
```

メソッドが無いエラーは、包まれていないということです。その場合は `nil` を返して、取り出すものが無いことを伝えます。

### 3. 持っていれば中身を返す

```go:line-numbers=24
	return u.Unwrap()
```

メソッドがあれば、その結果、つまり 1 段下のエラーを返します。`Unwrap` を繰り返せば、包みを順にたどれます。

## ここがすごい

- **型を宣言せずに使える**: 「`Unwrap` を持つ」という形だけで判定するので、どのパッケージのエラーにも効きます。
- **包みの有無を安全に確かめる**: 型アサーションの `ok` で、持たない場合を `panic` なしに扱えます。
- **1 段ずつ掘れる**: 繰り返し呼べば、元の原因まで辿れます。`errors.Is` や `errors.As` も、この仕組みを使っています。

## まとめ

- `Unwrap() error` を持つかを、型アサーションで調べる。
- 持っていれば 1 段下のエラーを、持たなければ `nil` を返す。
- この仕組みを繰り返すと、包まれた原因を順に辿れる。
