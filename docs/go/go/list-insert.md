---
title: "双方向リストに要素を差し込む list.insert。4 本の参照を正しく付け替える"
description: "container/list の内部関数 insert。要素 e を、指定した要素 at の直後に差し込む。前後の 4 本の参照を正しい順で付け替え、要素数を 1 増やす。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/container/list/list.go"
lines: [92, 100]
function: "insert"
difficulty: 2
tags: [データ構造, 型システム]
---

## ひとことで

`container/list` は、要素同士が前と次をつないだ双方向リストです。`insert(e, at)` は、新しい要素 `e` を、既存の要素 `at` の **直後** に差し込みます。`PushBack` や `InsertAfter` など、公開の関数は、すべてこの関数を使って要素を追加します。

## コード

```go:line-numbers=92
func (l *List) insert(e, at *Element) *Element {
	e.prev = at
	e.next = at.next
	e.prev.next = e
	e.next.prev = e
	e.list = l
	l.len++
	return e
}
```

## 前提知識

- **双方向リスト**: 各要素が、前の要素 `prev` と次の要素 `next` を指す並びです。どちらの方向へもたどれます。
- **番兵（センチネル）**: リストの端を表す、特別な要素です。値を持たず、リストの先頭と末尾の間に入ります。`at` は、この番兵を含めた任意の要素です。
- **`list` フィールド**: 要素がどのリストに属しているかを指すフィールドです。取り外すときの確認に使われます。
- **`l.len`**: リストの要素数です。差し込むたびに 1 増やします。

## 何をしているか

### 1. 新しい要素の前と後ろを決める

```go:line-numbers=93
	e.prev = at
	e.next = at.next
```

`e` の `prev` を `at` にして、`e` の `next` を `at` の次の要素にします。まだ `at` と `at.next` の間に、`e` が割り込んだ形にはなっていません。ここでは、`e` 自身の 2 本の参照だけを先に決めています。

### 2. 隣の要素の参照を e に向ける

```go:line-numbers=95
	e.prev.next = e
	e.next.prev = e
```

`at` の `next` と、`at.next` の `prev` を `e` に向けます。これで、2 つの隣が `e` を指すようになり、リストが正しくつながります。

この順番が大事です。先に `at.next` を書き換えると、`at.next` の元の値を失ってしまいます。そのため、`e.next` へ先に保存してから、隣を書き換えています。

### 3. 所属と要素数を更新する

```go:line-numbers=97
	e.list = l
	l.len++
	return e
```

`e` がこのリストに属することを記録して、要素数を 1 増やします。最後に `e` を返すので、呼び出し側はその要素をすぐに使えます。

## ここがすごい

- **4 本の参照を正しい順番で**: 双方向リストの差し込みは、参照の書き換えの順番を間違えると、要素を失います。`e` の参照を先に決めてから、隣を向けるのが安全な順番です。
- **番兵があるので分岐がない**: 先頭や末尾に差し込む場合も、番兵を `at` にすれば同じ処理で済みます。特別な場合分けがいりません。
- **要素数を一緒に管理**: 差し込みのたびに `len` を更新するので、`Len()` は常に正しい値を返せます。

## まとめ

- `insert` は、要素 `e` を `at` の直後に差し込みます。
- 4 本の参照を、正しい順番で付け替えます。
- 番兵を使うので、先頭や末尾の場合も同じ処理で済みます。
- 所属と要素数を更新して、新しい要素を返します。
