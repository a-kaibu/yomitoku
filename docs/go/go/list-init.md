---
title: "空の状態に戻す list.Init"
description: "list.Init は、リストを空の状態に初期化します。番兵の要素が自分自身を指す輪を作り、長さを 0 にします。既に要素があった場合は、それらを切り離します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [54, 59]
function: "Init"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`l.Init()` は、リストを空に戻します。`var l list.List` と書いたゼロ値も、`Init` を呼べば同じ空の状態になります。

## コード

```go:line-numbers=54
func (l *List) Init() *List {
	l.root.next = &l.root
	l.root.prev = &l.root
	l.len = 0
	return l
}
```

## 前提知識

- **番兵（センチネル）**: リストの端に置く、値を持たない特別な要素です。`root` という名前で持たれています。
- **輪になった双方向リスト**: 番兵の `next` が先頭、`prev` が末尾を指します。空のときは、番兵が自分自身を指します。
- **`len`**: リストの要素数を覚えておく欄です。
- **返り値のリスト**: `Init` は、自分自身を返すので、`list.New().Init()` のように続けて書けます。

## 何をしているか

### 1. 番兵の前後を自分自身にする

```go:line-numbers=55
	l.root.next = &l.root
	l.root.prev = &l.root
```

番兵の `next` と `prev` の両方を、番兵自身のアドレスにします。すると、番兵だけの輪になり、空のリストの形になります。

### 2. 要素数を 0 にする

```go:line-numbers=57
	l.len = 0
```

要素が無くなったので、`len` を 0 にします。

### 3. 自分自身を返す

```go:line-numbers=58
	return l
```

呼び出し側は、戻り値を使って、そのまま続けて操作できます。

## ここがすごい

- **番兵の付け替えだけで空にする**: 中の要素を 1 つずつ消さずに、つながりを切ります。切り離された要素は、GC が回収します。
- **ゼロ値と同じ扱いにできる**: `lazyInit` と同じ形になるので、初期化の仕組みがそろっています。
- **自分を返す設計**: 「作って初期化する」を 1 行で書けるようにしています。

## まとめ

- 番兵の前後を自分自身にして、空の輪を作る。
- 要素数を 0 に戻す。
- 自分自身を返して、続けて使えるようにする。
