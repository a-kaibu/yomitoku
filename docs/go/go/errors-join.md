---
title: "空のエラーを取り除いて、複数のエラーを 1 つにまとめる"
description: "errors.Join は、複数のエラーを 1 つのエラーにまとめます。nil のエラーは最初に取り除き、本当のエラーが 1 つもなければ nil を返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2022 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/errors/join.go"
lines: [20, 39]
function: "Join"
difficulty: 2
format: 2
tags: [エラー処理, API設計, 標準ライブラリ]
---

## ひとことで

`errors.Join(err1, err2, err3)` は、複数のエラーを 1 つの `error` にまとめます。まとめたエラーの文字列には、各エラーの内容が改行で並びます。

まとめるエラーに `nil` が混じっていても、それは無視されます。すべて `nil` なら、結果も `nil` です。

## コード

```go:line-numbers=20
func Join(errs ...error) error {
	n := 0
	for _, err := range errs {
		if err != nil {
			n++
		}
	}
	if n == 0 {
		return nil
	}
	e := &joinError{
		errs: make([]error, 0, n),
	}
	for _, err := range errs {
		if err != nil {
			e.errs = append(e.errs, err)
		}
	}
	return e
}
```

## 前提知識

- **`error` 型**: `Error() string` メソッドを持つインターフェースです。`nil` は「エラーなし」を表します。
- **可変長引数 `errs ...error`**: 関数に任意の数の引数を渡せる書き方です。関数の中では、`errs` は `[]error` として扱われます。
- **`make([]error, 0, n)`**: 長さ 0、容量 `n` のスライスを作ります。容量を先に決めておくと、`append` のたびに確保し直す必要がなくなります。
- **`joinError`**: `errors.Join` の結果を表す、この関数の中で使われる内部の型です。

## 何をしているか

`errs = [nil, errA, nil, errB]` で追います。

### 1. 本当のエラーを数える

```go:line-numbers=21
	n := 0
	for _, err := range errs {
		if err != nil {
			n++
		}
	}
```

`nil` ではないものは `errA` と `errB` の 2 つなので、`n = 2` になります。

### 2. 1 つもなければ nil

```go:line-numbers=27
	if n == 0 {
		return nil
	}
```

本当のエラーがなければ、`nil` を返します。こうしておくと、呼び出し側は `if err != nil` だけで判断できます。

### 3. 容量を決めて、非 nil だけを入れる

```go:line-numbers=30
	e := &joinError{
		errs: make([]error, 0, n),
	}
	for _, err := range errs {
		if err != nil {
			e.errs = append(e.errs, err)
		}
	}
	return e
```

数えた `n` を容量にして、長さ 0 のスライスを作ります。そこへ `errA` と `errB` だけを追加して、`joinError` を返します。

## ここがすごい

- **容量を先に確保する**: 1 回目のループで数えておくので、2 回目のループで `append` しても、確保は 1 回で済みます。ループを 2 回回す代わりに、無駄な確保をなくしています。
- **`nil` を呼び出し側から隠す**: 呼び出し側は、どれが `nil` だったかを気にしなくてよくなります。`nil` を混ぜても安全に使える、扱いやすい API になっています。
- **元のエラーを失わない**: まとめたエラーは、中身のエラーを保持します。`errors.Is` などは、まとめた中のエラーを探して判定できます。

## まとめ

- 複数のエラーを 1 つにまとめる関数は、`nil` を除外して、残りがなければ `nil` を返すと使いやすい。
- 数を先に数えて容量を決めると、スライスの確保を 1 回で済ませられる。
- まとめたものでも、中のエラーを失わないようにする。
