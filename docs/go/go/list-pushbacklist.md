---
title: "別のリストの要素を末尾に複製する list.PushBackList"
description: "list.PushBackList は、別のリストの要素を先頭から順に、このリストの末尾へ複製して追加します。元のリストは変わらず、値だけが新しい要素として入ります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [221, 226]
function: "PushBackList"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`a.PushBackList(b)` は、`b` の値を順に `a` の末尾へ追加します。`b` は変わりません。2 つのリストを、1 つにまとめたいときに使えます。

## コード

```go:line-numbers=221
func (l *List) PushBackList(other *List) {
	l.lazyInit()
	for i, e := other.Len(), other.Front(); i > 0; i, e = i-1, e.Next() {
		l.insertValue(e.Value, l.root.prev)
	}
}
```

## 前提知識

- **`Len` と `Front`**: 要素数と、先頭の要素を返す関数です。
- **`Next`**: 要素の次を返す関数です。最後の要素の次は `nil` になります。
- **値の複製**: 新しい要素を作って値を入れるので、元の要素とは別物になります。
- **複数の変数の代入**: `i, e = i-1, e.Next()` は、同時に 2 つの値を更新します。

## 何をしているか

### 1. 番兵を準備する

```go:line-numbers=222
	l.lazyInit()
```

`lazyInit` で、空のリストでも使えるように番兵を整えます。

### 2. 個数と先頭を用意して、順に追加する

```go:line-numbers=223
	for i, e := other.Len(), other.Front(); i > 0; i, e = i-1, e.Next() {
		l.insertValue(e.Value, l.root.prev)
```

`other.Len()` を残りの個数 `i` とし、`other.Front()` を先頭から始めます。ループのたびに、個数を 1 減らし、要素を次へ進めます。各要素の `Value` を、このリストの末尾の前に入れます。

### 3. 個数で終わりを決める

```go:line-numbers=223
	for i, e := other.Len(), other.Front(); i > 0; i, e = i-1, e.Next() {
```

個数が 0 になったら、ループを止めます。`Next` の結果で止めるのではなく、数えた個数で止めます。

## ここがすごい

- **元のリストを壊さない**: 要素を移すのではなく、値を複製するので、`other` はそのまま使えます。
- **個数で回す**: 終わりを個数で決めるので、ループの条件が 1 つの数で表せます。
- **既存の関数を組み合わせる**: `insertValue` を使って追加するので、同じ末尾への追加の仕組みを再利用しています。

## まとめ

- 番兵を整えてから、`other` の値を先頭から順に末尾へ追加する。
- 個数で繰り返しを決め、`Next` で次の要素へ進む。
- 元のリストは変えず、値だけを新しい要素として複製する。
