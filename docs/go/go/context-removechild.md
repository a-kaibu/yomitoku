---
title: "キャンセルされた子を親の一覧から外す context.removeChild"
description: "子の context が終わったとき、親が子を覚えている一覧から取り除く関数。ふつうの親なら map から削除し、独自の停止機能を持つ親には stop を呼ぶ。登録が残ってメモリが増えるのを防ぐ。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/context/context.go"
lines: [400, 414]
function: "removeChild"
difficulty: 3
tags: [並行処理, メモリ管理]
---

## ひとことで

`removeChild(parent, child)` は、子の context がキャンセルされたとき、親が覚えている子の一覧から、その子を取り除きます。親が長生きしていて、子を作っては終わらせる、という使い方をしても、一覧が増え続けないようにするための関数です。

## コード

```go:line-numbers=400
func removeChild(parent Context, child canceler) {
	if s, ok := parent.(stopCtx); ok {
		s.stop()
		return
	}
	p, ok := parentCancelCtx(parent)
	if !ok {
		return
	}
	p.mu.Lock()
	if p.children != nil {
		delete(p.children, child)
	}
	p.mu.Unlock()
}
```

## 前提知識

- **親子の関係の登録**: 親の `cancelCtx` は、子を `children` という map に覚えておきます。キャンセルのとき、この map を使って子に知らせます。
- **map からの削除**: `delete(m, k)` は、キー `k` の組を map から取り除きます。
- **`mu`（ミューテックス）**: 複数の goroutine が同時に map を触らないように、ロックをかけるための道具です。`Lock` と `Unlock` で囲みます。
- **型アサーション `parent.(stopCtx)`**: 親の値が `stopCtx` という型かを調べ、そうなら変換して使う書き方です。
- **`stop` メソッド**: 独自の context が、自分の登録を止めるために持つ機能です。

## 何をしているか

### 1. 停止機能を持つ親は、その機能を使う

```go:line-numbers=401
	if s, ok := parent.(stopCtx); ok {
		s.stop()
		return
	}
```

親が `stopCtx` という型なら、その親は独自の方法で登録を止めます。`stop()` を呼んで、そのまま終わります。`map` を直接触る必要はありません。

### 2. 普通の親なら、親の cancelCtx を探す

```go:line-numbers=405
	p, ok := parentCancelCtx(parent)
	if !ok {
		return
	}
```

それ以外の親では、`parentCancelCtx` を使って、このパッケージのキャンセル可能な親を探します。見つからなければ、覚えている子はないので、何もせずに戻ります。

### 3. ロックをかけて map から消す

```go:line-numbers=409
	p.mu.Lock()
	if p.children != nil {
		delete(p.children, child)
	}
	p.mu.Unlock()
```

子の一覧は、複数の goroutine から触られるので、`mu` で囲んで消します。`children` が `nil` なら、まだ誰も子を登録していないので、何もしません。

## ここがすごい

- **親の種類に合わせて後始末を変える**: 独自の親は `stop` で、標準の親は map から削除、という 2 通りに分けています。どちらも、子の登録を正しく消せます。
- **登録を残さない**: 子が終わったのに親の map に残っていると、長く使われる親のメモリがどんどん増えます。キャンセルのたびに消すことで、この漏れを防ぎます。
- **`nil` の確認**: `children` が `nil` のときは `delete` を呼ばないようにしています。登録が 1 つもない親でも、安全に処理できます。

## まとめ

- `removeChild` は、キャンセルされた子を親の一覧から外します。
- 停止機能を持つ親には `stop` を呼び、普通の親には map からの削除を行います。
- 一覧はロックで守り、他の goroutine と同時に触らないようにします。
- 子の登録を消し忘れないことで、長生きする親のメモリ使用量を抑えます。
