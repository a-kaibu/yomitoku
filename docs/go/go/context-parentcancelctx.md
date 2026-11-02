---
title: "親が本当に自分の知っているキャンセル可能な context かを確かめる parentCancelCtx"
description: "親の context の中に、キャンセル可能な cancelCtx が本当に入っているかを確かめる関数。Done の channel が同じかを比べて、途中で包み直された偽物を弾く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/context/context.go"
lines: [383, 397]
function: "parentCancelCtx"
difficulty: 3
tags: [並行処理, 防御的プログラミング, 型システム]
---

## ひとことで

`parentCancelCtx(parent)` は、親の context が、このパッケージが作った **キャンセル可能な `cancelCtx`** かどうかを調べます。見つかれば、その `cancelCtx` と `true` を返します。そうでなければ `false` を返します。

context は、他の人が独自の型で包むこともできます。そのため、型だけでは判断できず、`Done` の channel が同じかどうかまで確かめています。

## コード

```go:line-numbers=383
func parentCancelCtx(parent Context) (*cancelCtx, bool) {
	done := parent.Done()
	if done == closedchan || done == nil {
		return nil, false
	}
	p, ok := parent.Value(&cancelCtxKey).(*cancelCtx)
	if !ok {
		return nil, false
	}
	pdone, _ := p.done.Load().(chan struct{})
	if pdone != done {
		return nil, false
	}
	return p, true
}
```

## 前提知識

- **context の `Done()`**: キャンセルされたときに閉じられる channel を返すメソッドです。閉じた channel からは、値を読むとすぐに終わります。
- **`cancelCtx`**: このパッケージの内部の型で、キャンセルを子へ伝える仕組みを持っています。
- **`Value` による検索**: `parent.Value(key)` は、context の鎖をたどって、そのキーの値を探します。`&cancelCtxKey` は、このパッケージだけが使う特別なキーです。
- **`atomic` の読み出し**: `p.done.Load()` は、複数の goroutine から安全に値を読める書き方です。
- **channel の同一性**: 2 つの channel が「同じもの」かは、`==` で比べられます。

## 何をしているか

### 1. 閉じられない・キャンセルされない親は対象外

```go:line-numbers=384
	done := parent.Done()
	if done == closedchan || done == nil {
		return nil, false
	}
```

`Done()` が `nil` の context（例えば `Background`）は、キャンセルされることがありません。`closedchan` は、すでにキャンセル済みの context が使う特別な channel です。どちらも、子をつなぐ必要がないので、`false` を返します。

### 2. 内側に cancelCtx があるかを探す

```go:line-numbers=388
	p, ok := parent.Value(&cancelCtxKey).(*cancelCtx)
	if !ok {
		return nil, false
	}
```

このパッケージのキーで `Value` を呼び、`*cancelCtx` に変換できるかを試します。できなければ、親はこのパッケージの `cancelCtx` を含んでいません。

### 3. Done の channel が同じかを比べる

```go:line-numbers=392
	pdone, _ := p.done.Load().(chan struct{})
	if pdone != done {
		return nil, false
	}
	return p, true
```

見つかった `cancelCtx` の `done` と、最初に取った `parent.Done()` を比べます。同じ channel なら、外側の包みが `Done` を変えていないので、安全に子をつなげます。違えば、包み直されていると判断して `false` を返します。

## ここがすごい

- **型だけでは信用しない**: 独自の context が `cancelCtx` を埋め込んでいて、`Done` だけを別のものにすることもできます。型が一致しても、キャンセルの流れは一致しないかもしれません。channel の同一性で、その食い違いを見つけます。
- **鍵の値を外に出さない**: キーは `&cancelCtxKey` という、このパッケージだけの値です。他のパッケージと衝突せず、外から偽の値を入れられません。
- **速い判定で先に返す**: `Background` のような、キャンセルのない context を先に弾くので、無駄な検索をしません。

## まとめ

- `parentCancelCtx` は、親の中に、このパッケージのキャンセル可能な context があるかを探します。
- `Done` の channel が同じかを比べて、包み直された context を見分けます。
- キャンセルされない親や、すでに終わった親は、最初に除外します。
- 見つかった `cancelCtx` を使えば、キャンセルの伝達を正しく子へつなげられます。
