---
title: "他のリストの要素を外そうとしたら何もしない、安全な container/list の Remove"
description: "container/list の Remove は、リストから要素を取り除き、その値を返します。要素がこのリストに属していない場合は、何もせずに値だけを返します。取り除いた要素の参照も消し、メモリの漏れを防ぎます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/list/list.go"
lines: [134, 141]
function: "(*List).Remove"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`list.Remove(e)` は、要素 `e` をリストから取り除いて、その値（`e.Value`）を返します。`e` が別のリストの要素や、どのリストにも入っていない要素だった場合は、リストを変えずに値だけを返します。

この関数は、取り除く前に、その要素が本当に `l` に属しているかを確かめます。違うリストの要素を誤って外すと、リストの中身が壊れるからです。

## コード

::: code-group

```go:line-numbers=134 [日本語訳]
func (l *List) Remove(e *Element) any {
	if e.list == l {
		// e.list == l なら、e を挿入したときに l は初期化されている。
		// または l == nil（e がゼロ値の Element）なら、l.remove がクラッシュする。
		l.remove(e)
	}
	return e.Value
}
```

```go:line-numbers=134 [原文]
func (l *List) Remove(e *Element) any {
	if e.list == l {
		// if e.list == l, l must have been initialized when e was inserted
		// in l or l == nil (e is a zero Element) and l.remove will crash
		l.remove(e)
	}
	return e.Value
}
```

:::

## 前提知識

- **`e.list`**: 各要素は、自分が属しているリストへのポインタを持っています。取り除かれた要素では `nil` になります。
- **ゼロ値の要素**: 初期化されていない `Element` は、`list` が `nil` です。
- **`any`**: どんな型の値でも入る型です。`Value` にはどんな値も入れられます。
- **`l.remove`**: 実際に取り除く処理をする、内部のメソッドです。

## 何をしているか

### 1. 本当にこのリストの要素かを確かめる

```go:line-numbers=135
	if e.list == l {
```

`e.list` が `l` と同じときだけ、取り除きます。`e` が別のリストに属していれば、この `if` は偽になります。

### 2. 取り除く処理

内部の `remove` は、次のように動きます。

```go:line-numbers=108
func (l *List) remove(e *Element) {
	e.prev.next = e.next
	e.next.prev = e.prev
	e.next = nil // avoid memory leaks
	e.prev = nil // avoid memory leaks
	e.list = nil
	l.len--
}
```

前後の要素のつながりを飛ばして、`e` を輪から外します。そのあと `e` の `next` と `prev` を `nil` にします。これで、`e` から先のリストをたどれなくなり、GC がその要素を回収できます。最後に、要素の数を 1 減らします。

### 3. 値を返す

```go:line-numbers=140
	return e.Value
```

取り除いた要素の値を返します。`e.list != l` のときは、リストは変わらずに値だけが返ります。

## ここがすごい

- **所属の確認を 1 行で**: 要素が自分のリストのものかを、`e.list == l` で確かめるだけです。誤った要素を外す事故を、安い比較で防げています。
- **参照を消してメモリを守る**: 外した要素が前後の要素を指し続けると、使われていないのにメモリが残ります。`nil` にしてつながりを切ります。
- **何もしないことも安全な結果**: 所属していない要素は、エラーにせずに値だけを返します。呼び出し側は、結果を気にせず使えます。

## まとめ

- 要素の操作では、その要素が本当に自分のものかを先に確かめる。
- 外した要素の参照は消すと、GC が回収できる。
- 所属していない場合を「何もしない」と決めると、呼び出し側が簡単になる。
