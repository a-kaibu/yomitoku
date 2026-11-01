---
title: "先頭に要素を追加する list.PushFront"
description: "list.PushFront は、双方向リストの先頭に値を追加します。番兵を準備したあと、番兵の直後に新しい要素を挿入します。末尾への追加と対になる関数です。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [144, 147]
function: "PushFront"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`l.PushFront("x")` は、リストの先頭に値 `"x"` を追加して、その要素を返します。`PushBack` を先頭側に向けた、対になる関数です。

## コード

```go:line-numbers=144
func (l *List) PushFront(v any) *Element {
	l.lazyInit()
	return l.insertValue(v, &l.root)
}
```

## 前提知識

- **番兵の直後が先頭**: 番兵の `next` が、リストの先頭の要素を指します。
- **`lazyInit`**: 番兵がまだ無いときに、空のリストとして準備する内部の関数です。
- **`insertValue`**: 値を持つ新しい要素を作り、指定した位置の後ろに入れる関数です。
- **ゼロ値で使える設計**: 初期化を明示しなくても、最初の追加で番兵が作られます。

## 何をしているか

### 1. 番兵を準備する

```go:line-numbers=145
	l.lazyInit()
```

`lazyInit` で、空のリストでも番兵が使えるように整えます。

### 2. 番兵の直後に挿入する

```go:line-numbers=146
	return l.insertValue(v, &l.root)
```

`insertValue` に、番兵 `&l.root` を渡します。番兵の後ろに入るので、結果として先頭への追加になります。

## ここがすごい

- **番兵の位置で先頭と末尾を分ける**: 先頭への追加は番兵の後ろ、末尾への追加は番兵の前、という対称な作りです。
- **同じ部品を使い回す**: `insertValue` と `lazyInit` を、末尾への追加と共有しているので、重複したコードがありません。
- **追加した要素を返す**: 後で `Remove` や `MoveToBack` に使うために、ポインタを受け取れます。

## まとめ

- 番兵を準備してから、番兵の直後に新しい要素を入れる。
- 末尾への追加と対になり、同じ部品を共有している。
- 追加した要素を返し、後の操作に使えるようにする。
