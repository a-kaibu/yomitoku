---
title: "環状リストを n 個まとめて作る container/ring.New"
description: "要素が円を作る双方向リスト ring の New。n 個の要素を前後の参照で順につなぎ、最後の要素が最初へ戻るようにして、1 回のループで作る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/container/ring/ring.go"
lines: [60, 73]
function: "New"
difficulty: 2
tags: [データ構造, 標準ライブラリ]
---

## ひとことで

`ring.New(n)` は、`n` 個の要素からなる **環（リング）** を作ります。各要素は次と前の要素への参照を持ち、最後の要素の次は最初の要素に戻ります。例えば `ring.New(3)` は、A → B → C → A と戻る輪です。

環は、同じ並びを何周も回したいときや、一定数の履歴を回し続けるときに便利です。

## コード

```go:line-numbers=60
func New(n int) *Ring {
	if n <= 0 {
		return nil
	}
	r := new(Ring)
	p := r
	for i := 1; i < n; i++ {
		p.next = &Ring{prev: p}
		p = p.next
	}
	p.next = r
	r.prev = p
	return r
}
```

## 前提知識

- **ポインタ**: 別の値のアドレスを指す値です。`*Ring` は、`Ring` の値を指す参照です。`new(Ring)` は、新しい `Ring` を作ってそのポインタを返します。
- **双方向リスト**: 各要素が、次（`next`）と前（`prev`）の両方への参照を持つ並びです。
- **`nil` の判定**: `n <= 0` のときは、要素が 1 つもないので、`nil` を返します。
- **環**: 最後の要素の `next` が最初の要素を指している状態です。どこから回っても、必ず戻ってきます。

## 何をしているか

### 1. 要素がなければ nil を返す

```go:line-numbers=61
	if n <= 0 {
		return nil
	}
```

要素数が 0 以下なら、環は作れません。`nil` を返して、呼び出し側に「空だ」と知らせます。

### 2. 最初の要素を作り、p で末尾を追いかける

```go:line-numbers=64
	r := new(Ring)
	p := r
	for i := 1; i < n; i++ {
		p.next = &Ring{prev: p}
		p = p.next
	}
```

最初の要素 `r` を作ります。`p` は、今いちばん後ろの要素を指す変数です。ループで、`p` の次に新しい要素を作って、`prev` をつなぎ、`p` を新しい要素へ進めます。これを `n - 1` 回繰り返すと、一直線の並びが完成します。

### 3. 末尾と先頭をつなぐ

```go:line-numbers=70
	p.next = r
	r.prev = p
	return r
```

一直線の並びの最後 `p` の `next` を、先頭 `r` に向けます。同時に、先頭の `prev` を末尾 `p` に向けます。これで輪が閉じて、`r` を返します。

## ここがすごい

- **1 回のループで作る**: 要素を作りながら、直前の要素につなぐので、後から全体を走査する必要がありません。
- **先頭を覚えておく**: `r` を変えずに返すので、呼び出し側はどの要素からでも輪を回れます。最後の 2 行で輪が閉じるのは、先頭を覚えているからです。
- **ポインタで直接つなぐ**: 配列で番号を計算する代わりに、参照で次と前を指します。要素の並べ替えや挿入も、参照を付け替えるだけで済みます。

## まとめ

- `ring.New(n)` は、`n` 個の要素を、前後に参照を持つ環にします。
- 一直線に作ってから、最後と先頭をつないで輪にします。
- `n <= 0` のときは `nil` を返します。
- 先頭を覚えておくことで、どの要素からも回れる環になります。
