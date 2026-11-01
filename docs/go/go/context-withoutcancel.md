---
title: "親の値は残して取り消しを切り離す context.WithoutCancel"
description: "context.WithoutCancel は、親の Context が持つ値を引き継ぎ、キャンセルや期限の影響を受けない新しい Context を返します。後処理を、呼び出し元の終了から切り離すときに使います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/context/context.go"
lines: [590, 595]
function: "WithoutCancel"
difficulty: 2
format: 2
tags: [並行処理, 標準ライブラリ, 設計パターン]
---

## ひとことで

`context.WithoutCancel(ctx)` は、`ctx` の値は使えるままで、取り消しや期限切れが届かない新しい `Context` を返します。リクエストは終わっても、ログの書き出しなどは最後まで続けたいときに使います。

## コード

```go:line-numbers=590
func WithoutCancel(parent Context) Context {
	if parent == nil {
		panic("cannot create context from nil parent")
	}
	return withoutCancelCtx{parent}
}
```

## 前提知識

- **`Context`**: 処理の期限、取り消し、値の受け渡しを運ぶ仕組みです。親から子へ、鎖のようにつながります。
- **取り消しの伝播**: 親が取り消されると、その下にあるすべての子も取り消されます。
- **`nil` の親**: `Context` の親に `nil` を渡すのは、誤りとされています。
- **構造体による包み直し**: 既存の `Context` を、別の型で包んで、振る舞いを変えます。

## 何をしているか

### 1. 親が nil でないかを確かめる

```go:line-numbers=591
	if parent == nil {
		panic("cannot create context from nil parent")
	}
```

親が `nil` なら、新しい `Context` の作りようがありません。`panic` で止めて、誤りを知らせます。

### 2. 取り消しを切り離して包む

```go:line-numbers=594
	return withoutCancelCtx{parent}
```

`withoutCancelCtx{parent}` は、親を包んだ新しい値です。値の参照はそのまま親に任せ、`Done` や `Err` は取り消しを伝えない形にします。そのため、親が取り消されても、この `Context` は終わりません。

## ここがすごい

- **値だけを引き継ぐ**: リクエスト ID などの値は残るので、後処理のログにも同じ ID を付けられます。
- **親の寿命から独立する**: 元のリクエストが終わっても、後処理を続けられます。ただし、時間制限も無くなるので、終わりを別に決める必要があります。
- **包むだけで済む**: 新しい仕組みを用意せず、包み直しだけで実現しています。

## まとめ

- 親の値は引き継ぎ、取り消しと期限は切り離す。
- 親が `nil` なら、`panic` で止める。
- 後処理が、呼び出し元の終了に巻き込まれないようにできる。
