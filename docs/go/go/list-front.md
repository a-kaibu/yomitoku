---
title: "リストの先頭の要素を取り出す list.Front"
description: "list.Front は、リストの先頭の要素を返します。要素が無いときは nil を返します。番兵の次の要素が先頭になるので、番兵そのものは返しません。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [69, 74]
function: "Front"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`l.Front()` は、先頭の要素のポインタを返します。空のリストなら `nil` を返します。`for e := l.Front(); e != nil; e = e.Next()` のような繰り返しの出発点になります。

## コード

```go:line-numbers=69
func (l *List) Front() *Element {
	if l.len == 0 {
		return nil
	}
	return l.root.next
}
```

## 前提知識

- **番兵の位置**: 番兵は値を持たない要素で、リストの先頭と末尾の間に置かれています。
- **`Element`**: リストの 1 つの要素です。`Value` と、前後へのつながりを持ちます。
- **`len` による空の判定**: 要素数が 0 なら、先頭は存在しません。
- **`nil` の使い方**: 繰り返しを止める目印として使われます。

## 何をしているか

### 1. 空なら nil を返す

```go:line-numbers=70
	if l.len == 0 {
		return nil
	}
```

要素数が 0 なら、先頭はありません。`nil` を返して、呼び出し側に空であることを伝えます。

### 2. 番兵の次を返す

```go:line-numbers=73
	return l.root.next
```

要素があるなら、番兵の `next` が先頭の要素です。番兵そのものは値を持たないので、その次を返します。

## ここがすごい

- **番兵を見せない**: 利用者は、番兵の存在を意識せずに、最初の要素を得られます。
- **空を `len` で判定する**: 番兵の `next` を見るより、要素数を見る方が明確です。
- **`nil` で終わりを表す**: 繰り返しの条件として、そのまま使えます。

## まとめ

- 要素数が 0 なら、`nil` を返す。
- 要素があれば、番兵の次、つまり先頭の要素を返す。
- 番兵を隠して、利用者には最初の要素だけを見せる。
