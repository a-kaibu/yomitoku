---
title: "要素を別の要素の前へ移す List.MoveBefore。同じリストかどうかを先に確かめる"
description: "container/list の MoveBefore。要素 e を、要素 mark の直前へ移す。e や mark が、このリストの要素でなければ何もしない。移動そのものは、内部の move に任せる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/container/list/list.go"
lines: [202, 207]
function: "MoveBefore"
difficulty: 1
tags: [データ構造, 防御的プログラミング, 型システム]
---

## ひとことで

`l.MoveBefore(e, mark)` は、要素 `e` を、要素 `mark` の直前に移します。ただし、`e` や `mark` がこのリストの要素でなければ、何もしません。

連結リストの要素は、どのリストに属しているかを覚えています。別のリストの要素を、勝手に動かすと、二つのリストが壊れてしまいます。そのため、最初に所属を確かめます。

## コード

```go:line-numbers=202
func (l *List) MoveBefore(e, mark *Element) {
	if e.list != l || e == mark || mark.list != l {
		return
	}
	l.move(e, mark.prev)
}
```

## 前提知識

- **所属（`list`）**: 要素がどのリストに属しているかを表す欄です。リストが違えば、移動してはいけません。
- **自分自身への移動**: `e` と `mark` が同じ要素なら、移す場所がありません。何もしません。
- **`mark.prev`**: `mark` の一つ前の要素です。その後ろに `e` を置けば、`e` は `mark` の直前に入ります。
- **`move`**: 要素を新しい位置へつなぎ替える、内部の関数です。前の記事で見ました。

## 何をしているか

### 1. 移動してはいけない場合を弾く

```go:line-numbers=203
	if e.list != l || e == mark || mark.list != l {
		return
	}
```

`e` が別のリストの要素であるか、`e` と `mark` が同じか、`mark` が別のリストの要素であれば、何もせずに戻ります。三つの条件のどれかに当たれば、移動は起きません。

### 2. 直前の位置へ移す

```go:line-numbers=206
	l.move(e, mark.prev)
```

`mark` の一つ前の要素を基準にして、`e` を移します。そうすると、`e` は `mark` の直前に入ります。

## ここがすごい

- **所属を確かめてから動かす**: 別のリストの要素には触れないので、リストどうしのつながりが守られます。
- **同じ場所への移動を省く**: 自分自身を基準にする移動は、起きないように弾きます。無駄な付け替えがなくなります。
- **移動の手順を一か所に**: 実際のつなぎ替えは `move` に任せ、この関数は条件を確かめるだけです。役割がはっきり分かれています。

## まとめ

- `MoveBefore` は、要素を別の要素の直前へ移します。
- 別のリストの要素や、同じ要素への移動は、何もしません。
- 移動の仕事は内部の `move` に任せます。
