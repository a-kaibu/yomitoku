---
title: "エラーがタイムアウトかを調べる url.Error.Timeout。中のエラーに判断を任せる"
description: "net/url の Error.Timeout。URL のエラーを包んでいる中のエラーが、タイムアウトを表すメソッドを持つかを調べる。持っていれば、そのメソッドの結果を返す。持っていなければ false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [42, 47]
function: "Timeout"
difficulty: 2
tags: [エラー処理, 型システム, API設計]
---

## ひとことで

`e.Timeout()` は、URL の処理で起きたエラーが、タイムアウトによるものかを返します。`url.Error` は、元のエラーを包んでいます。この関数は、包んでいるエラーの判断をそのまま使います。

Go では、「タイムアウトかどうか」を知るために、特定のメソッドを持つエラーがあります。包まれたエラーがそのメソッドを持つなら、その答えを借ります。

## コード

```go:line-numbers=42
func (e *Error) Timeout() bool {
	t, ok := e.Err.(interface {
		Timeout() bool
	})
	return ok && t.Timeout()
}
```

## 前提知識

- **エラーの包み**: 元のエラーを、より説明の多いエラーの中に入れることです。`url.Error` は、URL の情報と、元のエラーの両方を持ちます。
- **型アサーション**: 値が、特定の約束（インターフェース）を満たすかを調べて、その型として扱う書き方です。
- **無名のインターフェース**: その場限りの約束を、`interface { Timeout() bool }` と書いたものです。名前を付けずに、メソッドの有無だけを求めます。
- **タイムアウト**: 処理が決められた時間内に終わらなかった、という状態です。

## 何をしているか

### 1. Timeout メソッドを持つかを調べる

```go:line-numbers=43
	t, ok := e.Err.(interface {
		Timeout() bool
	})
```

包まれたエラー `e.Err` が、`Timeout() bool` というメソッドを持つかを調べます。持っていれば、その値を `t` に入れ、`ok` を真にします。

### 2. 持っていれば答えを借りる

```go:line-numbers=46
	return ok && t.Timeout()
```

`ok` が真なら、包まれたエラーの `Timeout` を呼んで、その答えを返します。持っていなければ、`&&` の左側が偽になり、`false` を返します。`t.Timeout()` は、`ok` が真のときだけ呼ばれます。

## ここがすごい

- **判断を元のエラーに任せる**: URL の層は、自分でタイムアウトを判断しません。中のエラーが知っていることを、そのまま伝えます。
- **約束だけで判断する**: 具体的なエラーの型を知らなくても、`Timeout` のメソッドがあるかだけで判断できます。新しいエラーの種類にも、自然に対応します。
- **安全な短絡評価**: `ok && t.Timeout()` の書き方により、メソッドのないエラーで、呼び出しを行うことがありません。

## まとめ

- `Timeout` は、包まれたエラーがタイムアウトを表すかを返します。
- 中のエラーが `Timeout()` を持つなら、その答えを借ります。
- 無名のインターフェースで、メソッドの有無だけを確かめます。
