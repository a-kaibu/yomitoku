---
title: "読み取りの幅の上限を返す fmt の ss.Width。上限がなければ ok を false にする"
description: "fmt パッケージの ss.Width。Scan の途中で、今読んでいるトークンに上限の幅があるかを返す。上限が設定されていなければ、特別な大きな値と比べて ok を false にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/scan.go"
lines: [201, 206]
function: "Width"
difficulty: 1
tags: [入出力, 防御的プログラミング, API設計]
---

## ひとことで

`s.Width()` は、今読んでいる項目の、最大の幅を返します。幅とは、読み取ってよい文字数の上限のことです。上限があれば、その数と `true` を返します。上限がなければ、`0` と `false` を返します。

`fmt` の `Scan` は、入力から値を読むときに、幅を指定できます。読み取りを行う側は、この関数で、今の上限を知ることができます。

## コード

```go:line-numbers=201
func (s *ss) Width() (wid int, ok bool) {
	if s.maxWid == hugeWid {
		return 0, false
	}
	return s.maxWid, true
}
```

## 前提知識

- **幅（width）**: 一つの値を読むときに、読んでよい最大の文字数です。`%5d` のような書式で指定されます。
- **`maxWid`**: 今の上限の値を覚えておく欄です。上限がないときは、特別な大きな値 `hugeWid` が入っています。
- **`hugeWid`**: 上限がないことを表す、非常に大きな値です。実際の幅としては使われません。
- **`ok`**: 上限が本当にあったかどうかを表す真偽値です。

## 何をしているか

### 1. 上限がない場合を判定する

```go:line-numbers=202
	if s.maxWid == hugeWid {
		return 0, false
	}
```

上限の欄が `hugeWid` なら、上限が設定されていません。`0` と `false` を返して、幅の制限がないことを知らせます。

### 2. 上限がある場合は値を返す

```go:line-numbers=205
	return s.maxWid, true
```

上限があれば、その値と `true` を返します。読み取りの途中で、何文字までかを決める材料になります。

## ここがすごい

- **特別な値を番兵にする**: 上限がないことを、別の欄ではなく、大きな値で表しています。欄が一つで済み、状態も単純です。
- **値と有無を分けて返す**: 呼び出し側は、`ok` を見てから値を使えます。上限の値が意味を持つかを、確かめてから使えます。
- **読み取りの中で使う**: この関数は、`Scan` の内部で、読み取りを止める位置を決めるために使われます。

## まとめ

- `Width` は、今の読み取りの幅の上限を返します。
- 上限がなければ、`0` と `false` を返します。
- 上限を `hugeWid` という番兵の値で表しています。
