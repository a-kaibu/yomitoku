---
title: "要素を別の要素の後ろへ動かす list.MoveAfter"
description: "list.MoveAfter は、リストの要素を、指定した別の要素の後ろへ移します。同じリストに属しているか、同じ要素ではないかを確かめてから、つなぎ替えます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [212, 217]
function: "MoveAfter"
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`l.MoveAfter(e, mark)` は、要素 `e` を、要素 `mark` の直後へ移します。要素を取り出して入れ直す手間がなく、値も参照も変わりません。

## コード

```go:line-numbers=212
func (l *List) MoveAfter(e, mark *Element) {
	if e.list != l || e == mark || mark.list != l {
		return
	}
	l.move(e, mark)
}
```

## 前提知識

- **`Element.list`**: 各要素が、どのリストに属しているかを覚えている欄です。別のリストの要素を動かそうとしたときの判定に使います。
- **双方向リストの「つなぎ替え」**: 前後の要素のリンクを付け替えることで、要素の位置を変えます。
- **同じ要素の指定**: 自分自身の後ろへ動かすのは、意味がありません。
- **無効な指定は何もしない**: この関数は、エラーを返さず、条件に合わないときは静かに終わります。

## 何をしているか

### 1. 条件に合わないなら何もしない

```go:line-numbers=213
	if e.list != l || e == mark || mark.list != l {
		return
	}
```

`e` が別のリストの要素であるとき、`e` と `mark` が同じ要素であるとき、`mark` が別のリストの要素であるとき、の 3 つのどれかなら、何もせずに戻ります。どれもリストを壊すおそれがあるためです。

### 2. 要素を指定した位置の後ろへ移す

```go:line-numbers=216
	l.move(e, mark)
```

条件を通ったら、`move` で、`e` を `mark` の後ろへつなぎ替えます。`move` は、前後の要素のリンクを付け替えて、要素を新しい位置に置きます。

## ここがすごい

- **確かめてから動かす**: 所属や同一性を先に確かめるので、リストの形が壊れることがありません。
- **エラーを返さない設計**: 失敗の理由を戻り値で伝えず、動かせなかったら何もしないという、簡単な約束になっています。呼び出し側は、結果を見て判断します。
- **要素を作り直さない**: 値の入った要素を、そのまま動かします。要素のポインタを持っている人も、変わらず使えます。

## まとめ

- 所属と同一性を確かめ、条件に合わなければ何もしない。
- 条件を通ったら、`move` で要素を指定の後ろへつなぎ替える。
- 要素はコピーされず、ポインタは変わらない。
