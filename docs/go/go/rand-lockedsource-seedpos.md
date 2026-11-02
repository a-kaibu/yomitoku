---
title: "乱数の種を設定して読み取り位置を戻す seedPos。ロックで守る"
description: "math/rand の lockedSource.seedPos。乱数の種を設定し、読み取り位置を 0 に戻す。複数の goroutine から同時に使われても壊れないように、ロックで守ってから処理する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/rand/rand.go"
lines: [536, 541]
function: "seedPos"
difficulty: 2
tags: [並行処理, 乱数, ロック不要]
---

## ひとことで

`r.seedPos(seed, readPos)` は、乱数生成器に新しい種を設定し、読み取り位置を 0 に戻します。種が同じなら、同じ乱数の列が再び得られます。

乱数生成器は、複数の処理から同時に使われることがあります。その場合、途中で値が壊れないように、ロックで守る必要があります。この関数は、その守りの中で種を設定します。

## コード

```go:line-numbers=536
func (r *lockedSource) seedPos(seed int64, readPos *int8) {
	r.lk.Lock()
	r.seed(seed)
	*readPos = 0
	r.lk.Unlock()
}
```

## 前提知識

- **種（seed）**: 乱数の列の始まりを決める値です。同じ種からは、同じ乱数の列が生まれます。
- **読み取り位置（`readPos`）**: 乱数の列のどこまで読んだかを表す値です。ここでは 0 に戻します。
- **ロック（`lk`）**: 同時に一つの処理だけが中身を変えられるようにする仕組みです。`Lock` で取り、`Unlock` で返します。
- **`seed`**: 実際に生成器へ種を入れる、内部の関数です。

## 何をしているか

### 1. ロックを取る

```go:line-numbers=537
	r.lk.Lock()
	r.seed(seed)
```

まずロックを取り、ほかの処理が生成器に触れないようにします。そのあとで、`seed` により種を設定します。

### 2. 読み取り位置を戻してロックを返す

```go:line-numbers=539
	*readPos = 0
	r.lk.Unlock()
```

読み取り位置を 0 に戻し、最後にロックを返します。ロックを返す処理を、ここで必ず行います。

## ここがすごい

- **種の設定と位置の初期化を一組に**: 種を変えたのに位置が古いままになる、という食い違いを防ぎます。二つの変更を、同じロックの中で行います。
- **ロックの取得と返却が対になる**: `Lock` と `Unlock` が、同じ関数の中に並んでいます。返し忘れによる止まりを、見つけやすくしています。
- **ロックを外から見せない**: 呼び出し側は、ロックのことを気にせずに、種を変えられます。

## まとめ

- `seedPos` は、ロックの中で種を設定し、読み取り位置を 0 に戻します。
- 種と位置の変更を、同じロックの中でまとめて行います。
- 同時に使われても、乱数の状態が壊れないようにします。
