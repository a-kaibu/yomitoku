---
title: "末尾に要素を追加する list.PushBack"
description: "list.PushBack は、双方向リストの末尾に値を追加します。初めて使うときは番兵の要素を準備し、番兵の前に新しい要素をつなぎます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [150, 153]
function: "PushBack"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, イディオム]
---

## ひとことで

`l.PushBack("x")` は、リストの末尾に値 `"x"` を追加して、その要素を返します。`container/list` の `List` は、ゼロ値のままでも使えるように作られています。

## コード

```go:line-numbers=150
func (l *List) PushBack(v any) *Element {
	l.lazyInit()
	return l.insertValue(v, l.root.prev)
}
```

## 前提知識

- **双方向リスト**: 各要素が、前と次の要素を指しているリストです。末尾への追加も、先頭への追加も速くできます。
- **番兵（センチネル）**: 値を持たない特別な要素です。リストの端に置くことで、空かどうかの場合分けを減らします。
- **`root.prev`**: 番兵の 1 つ前、つまりリストの末尾の要素です。
- **ゼロ値で使える**: `var l list.List` と宣言しただけで、そのまま使えるという設計です。

## 何をしているか

### 1. 番兵がなければ準備する

```go:line-numbers=85
func (l *List) lazyInit() {
	if l.root.next == nil {
		l.Init()
	}
}
```

`lazyInit` は、番兵の `next` がまだ無いかを確かめます。無ければ `Init` で、番兵が自分自身を指す空のリストを作ります。これで、ゼロ値の `List` に追加しても壊れません。

### 2. 末尾の前に挿入する

```go:line-numbers=151
	l.lazyInit()
	return l.insertValue(v, l.root.prev)
```

`l.root.prev` は、末尾の要素です。`insertValue` は、その要素と番兵の間に新しい要素を入れます。番兵の 1 つ前に入るので、結果として末尾への追加になります。

### 3. 新しい要素を作って挿入する

```go:line-numbers=103
func (l *List) insertValue(v any, at *Element) *Element {
	return l.insert(&Element{Value: v}, at)
```

`insertValue` は、値を持つ新しい `Element` を作り、指定した位置の後ろに `insert` でつなぎます。つないだ要素を、呼び出し側へ返します。

## ここがすごい

- **番兵で端の場合分けを消す**: 空のリストでも、末尾の前に入れるだけで済みます。先頭や末尾の特別な処理がほとんどありません。
- **ゼロ値がそのまま使える**: 初期化の関数を呼ばなくても、最初の追加で番兵を作るので、使う側の手間が減ります。
- **返り値で位置を覚えられる**: 追加した要素のポインタを返すので、後で `Remove` や `MoveAfter` に渡せます。

## まとめ

- 初めての追加では、番兵を作って空のリストを整える。
- 末尾の前に新しい要素をつなげば、末尾への追加になる。
- 追加した要素を返すので、後の操作に使える。
