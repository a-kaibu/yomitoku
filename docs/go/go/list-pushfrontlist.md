---
title: "別のリストを先頭へまとめて差し込む List.PushFrontList。末尾から順に入れる"
description: "container/list の PushFrontList。other のリストの要素を、値をコピーして、このリストの先頭に差し込む。他のリストの末尾から順に先頭へ入れていくので、元の順番を保つ。自分自身を渡しても、途中で壊れないように作られている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/container/list/list.go"
lines: [230, 235]
function: "PushFrontList"
difficulty: 2
tags: [データ構造, イディオム, 可読性]
---

## ひとことで

`l.PushFrontList(other)` は、リスト `other` の全部の要素を、リスト `l` の先頭に差し込みます。`other` の要素の値はコピーされ、`other` 自身は変わりません。

差し込むときは、`other` の末尾から先頭へ向かって一つずつ入れます。そうすることで、`other` の並びの順番が、`l` の先頭に正しく並びます。

## コード

```go:line-numbers=230
func (l *List) PushFrontList(other *List) {
	l.lazyInit()
	for i, e := other.Len(), other.Back(); i > 0; i, e = i-1, e.Prev() {
		l.insertValue(e.Value, &l.root)
	}
}
```

## 前提知識

- **連結リスト**: 要素が前後のつながりで並ぶ構造です。先頭と末尾に、すぐに触れられます。
- **`Back` と `Prev`**: 末尾の要素を取り出し、その前の要素へ戻るためのメソッドです。
- **`insertValue`**: 値を、指定した位置の後ろに差し込む内部の関数です。
- **`lazyInit`**: リストがまだ初期化されていなければ、初期化する準備の処理です。空のリストでも使えるようにします。

## 何をしているか

### 1. 使う前に準備する

```go:line-numbers=231
	l.lazyInit()
```

空のリストでも使えるように、まず初期化を確かめます。すでに初期化されていれば、何もしません。

### 2. 末尾から順に先頭へ差し込む

```go:line-numbers=232
	for i, e := other.Len(), other.Back(); i > 0; i, e = i-1, e.Prev() {
		l.insertValue(e.Value, &l.root)
	}
```

`other` の末尾から、要素の数だけ繰り返します。各要素の値を、`l` の先頭（`&l.root` の直後）に差し込みます。末尾から差し込むので、最後には `other` と同じ順番で並びます。

## ここがすごい

- **逆順に入れて順番を保つ**: 先頭に一つずつ入れるだけで、元の並びを守れます。並べ直す処理が要りません。
- **数で繰り返しを止める**: 長さを先に数えておき、その回数だけ進むので、途中でつながりが壊れても止まり方が決まっています。
- **値だけを移す**: 要素そのものを動かさず、値をコピーして入れます。`other` の並びは元のまま残ります。

## まとめ

- `PushFrontList` は、別のリストの値を、先頭へまとめて差し込みます。
- `other` の末尾から順に入れるので、並びの順番が保たれます。
- 空のリストでも、初期化してから使えます。
