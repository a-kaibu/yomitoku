---
title: "リストの末尾の要素を取り出す list.Back"
description: "list.Back は、リストの末尾の要素を返します。要素が無いときは nil を返します。番兵の前の要素が末尾になるので、番兵そのものは返しません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [77, 82]
function: "Back"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`l.Back()` は、末尾の要素のポインタを返します。`for e := l.Back(); e != nil; e = e.Prev()` と書けば、後ろから順に辿れます。

## コード

```go:line-numbers=77
func (l *List) Back() *Element {
	if l.len == 0 {
		return nil
	}
	return l.root.prev
}
```

## 前提知識

- **番兵と末尾**: 番兵の `prev` が、リストの末尾の要素を指します。
- **`Front` との対**: `Front` は先頭、`Back` は末尾を返します。
- **`len` による空の判定**: 要素数が 0 なら、末尾は存在しません。
- **`Prev`**: 要素の 1 つ前を返す関数です。後ろから辿るときに使います。

## 何をしているか

### 1. 空なら nil を返す

```go:line-numbers=78
	if l.len == 0 {
		return nil
	}
```

要素数が 0 なら、末尾はありません。`nil` を返して、空であることを伝えます。

### 2. 番兵の前を返す

```go:line-numbers=81
	return l.root.prev
```

要素があるなら、番兵の `prev` が末尾の要素です。番兵は値を持たないので、利用者には見せません。

## ここがすごい

- **番兵を隠す**: 利用者は、番兵の存在を知らなくても、末尾の要素を得られます。空かどうかを先に `len` で見るので、番兵の中身を誤って返すこともありません。
- **前後の対称性**: `Front` と並べると、先頭と末尾の取り出し方が同じ形で読めます。
- **輪の性質を使う**: 番兵の `prev` が末尾を指すという、輪の性質をそのまま使っています。
- **後ろから順に辿れる**: `for e := l.Back(); e != nil; e = e.Prev()` と書けば、末尾から先頭へ順に辿れます。`Prev` が `nil` を返した時点で、先頭を過ぎたと分かります。

## まとめ

- 要素数が 0 なら `nil` を返す。
- 要素があれば、番兵の `prev`、つまり末尾の要素を返す。
- 番兵を隠し、利用者には末尾の要素だけを見せる。
