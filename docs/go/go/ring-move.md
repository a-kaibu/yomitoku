---
title: "輪の上で n 個先の要素へ進む ring.Move"
description: "container/ring の Move は、輪の上で現在の要素から n 個先の要素を返します。負の数なら逆向きに進みます。要素が無い輪では、自分自身を初期化して返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [42, 57]
function: "Move"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`r.Move(2)` は、`r` から 2 つ先の要素を返します。輪は終わりがつながっているので、末尾を越えても最初に戻って進み続けます。

## コード

```go:line-numbers=42
func (r *Ring) Move(n int) *Ring {
	if r.next == nil {
		return r.init()
	}
	switch {
	case n < 0:
		for ; n < 0; n++ {
			r = r.prev
		}
	case n > 0:
		for ; n > 0; n-- {
			r = r.next
		}
	}
	return r
}
```

## 前提知識

- **`Ring`**: 要素が輪のようにつながったデータ構造です。
- **`next` と `prev`**: 各要素が持つ、次と前の要素への参照です。
- **`init`**: 単独の要素を、自分だけを指す輪として準備するメソッドです。
- **負の `n`**: 逆向きに進むことを表します。

## 何をしているか

### 1. 空の輪を準備する

```go:line-numbers=43
	if r.next == nil {
		return r.init()
	}
```

`next` が `nil` なら、この要素はまだ輪に入っていません。`init` で自分だけの輪にしてから、その要素を返します。

### 2. 逆向きに進む

```go:line-numbers=46
	switch {
	case n < 0:
		for ; n < 0; n++ {
			r = r.prev
		}
```

`n` が負なら、`prev` をたどって、必要な回数だけ戻ります。

### 3. 順方向に進む

```go:line-numbers=51
	case n > 0:
		for ; n > 0; n-- {
			r = r.next
		}
	}
	return r
```

`n` が正なら、`next` をたどって、必要な回数だけ進みます。`n` が 0 なら、どちらの分岐にも入らず、そのまま `r` を返します。

## ここがすごい

- **輪の性質を生かす**: 末尾という概念がないので、どれだけ進んでも必ず要素が見つかります。
- **未初期化の要素も扱える**: 空の輪を、そのまま使える形にしてから動きます。
- **向きを切り替えられる**: 負の数で逆向きに進めるので、前の要素を探すのも同じ関数で書けます。

## まとめ

- 未初期化なら、自分だけの輪にしてから進む。
- 負の数は `prev`、正の数は `next` をたどる。
- 輪なので、どれだけ進んでも要素が必ず見つかる。
