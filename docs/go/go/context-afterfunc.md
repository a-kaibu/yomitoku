---
title: "キャンセルされたら別の goroutine で関数を呼ぶ context.AfterFunc"
description: "context が終わったときに関数を別の goroutine で実行する context.AfterFunc。戻り値の stop で、まだ実行されていない関数を取り消せる。実行と取り消しが同時に起きても 1 回だけになるよう once で守っている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/context/context.go"
lines: [326, 341]
function: "AfterFunc"
difficulty: 3
tags: [並行処理, 非同期, 防御的プログラミング]
---

## ひとことで

`context.AfterFunc(ctx, f)` は、`ctx` がキャンセルされたときに関数 `f` を **別の goroutine で** 実行するように登録します。戻り値の `stop` を呼ぶと、まだ `f` が実行されていなければ、登録を取り消せます。`stop` は、取り消せたときに `true` を返します。

例えば、接続が閉じられたら後片付けを行う、といった処理を、キャンセルを待つ goroutine を用意せずに書けます。

## コード

```go:line-numbers=326
func AfterFunc(ctx Context, f func()) (stop func() bool) {
	a := &afterFuncCtx{
		f: f,
	}
	a.cancelCtx.propagateCancel(ctx, a)
	return func() bool {
		stopped := false
		a.once.Do(func() {
			stopped = true
		})
		if stopped {
			a.cancel(true, Canceled, nil)
		}
		return stopped
	}
}
```

## 前提知識

- **goroutine**: Go の軽量な並行実行の単位です。`go f()` と書くと、`f` が別の流れで動きます。
- **context**: キャンセルや期限を、関数の呼び出しを通じて伝えるための仕組みです。`ctx.Done()` が閉じられると、キャンセルされたことを意味します。
- **`sync.Once`**: `Do(f)` を何回呼んでも、`f` を 1 回しか実行しない道具です。ここでは「実行」と「取り消し」のどちらか一方だけを成功させるために使われています。
- **親子関係**: context は親から子へ、キャンセルを伝えます。子を登録しておくと、親がキャンセルされたときに子にも伝わります。

## 何をしているか

### 1. 登録用の構造体を作り、親に繋ぐ

```go:line-numbers=327
	a := &afterFuncCtx{
		f: f,
	}
	a.cancelCtx.propagateCancel(ctx, a)
```

`afterFuncCtx` は、`f` を持つ子の context です。`propagateCancel` で、親 `ctx` のキャンセルを、この子に伝わるように繋ぎます。親がキャンセルされると、子の内部で `f` を呼ぶ処理が起きます。

### 2. stop を返す

```go:line-numbers=331
	return func() bool {
		stopped := false
		a.once.Do(func() {
			stopped = true
		})
```

`stop` は、`once.Do` で「まだ実行されていないか」を確かめます。`Do` の中に入れたら、`stopped` を `true` にします。`Do` は 1 回しか中身を実行しないので、`stop` が 2 回目以降に呼ばれても、結果は `false` になります。

### 3. 取り消せたら子を片づける

```go:line-numbers=336
		if stopped {
			a.cancel(true, Canceled, nil)
		}
		return stopped
```

取り消せた（`stopped` が `true`）なら、子を `cancel` して、親の子リストから外します。`f` は、この後実行されません。`stopped` が `false` なら、すでに `f` が始まっているので、何もせずに `false` を返します。

## ここがすごい

- **実行と取り消しを 1 つの仕組みで決める**: `once` が、「`f` が先に走る」か「`stop` が先に勝つ」かのどちらか一方だけを選びます。2 つの処理が競争しても、`f` が 2 回走ったり、取り消しが無視されたりしません。
- **待つ goroutine が不要**: 「キャンセルを待って関数を呼ぶ」ためだけの goroutine を書かずに済みます。キャンセルされなければ、何も残りません。
- **`stop` で後始末もできる**: 取り消したときに子を `cancel` するので、親の子リストに古い登録が残りません。メモリ漏れを防ぎます。

## まとめ

- `AfterFunc` は、context のキャンセル時に、関数を別の goroutine で実行するよう登録します。
- `stop` は、まだ実行されていなければ登録を取り消し、`true` を返します。
- 実行と取り消しは `sync.Once` で排他的に決まるので、どちらか一方だけが起きます。
- 取り消したときは子を片づけ、親の子リストに登録が残らないようにします。
