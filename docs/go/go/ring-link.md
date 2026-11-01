---
title: "2 つの輪をつなぐ・切るを 1 つの操作で。ring.Link の対称性"
description: "循環リスト container/ring の Link。2 つの輪をつないで 1 つにする操作と、同じ輪から一部を切り離す操作が、同じ 4 行のポインタ付け替えで実現されています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/container/ring/ring.go"
lines: [90, 102]
function: "(*Ring).Link"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, API設計]
---

## ひとことで

`container/ring` は、最後の要素の次が最初の要素に戻る **循環リスト（輪）** を提供するパッケージです。
`r.Link(s)` は、`r` の直後に `s` をつなぎます。

おもしろいのは、`r` と `s` が **別々の輪なら 2 つが 1 つに合体し、同じ輪なら間の部分が切り離される** ことです。結合と分割という逆の操作が、まったく同じコードで実現されています。

## コード

::: code-group

```go:line-numbers=90 [日本語訳]
func (r *Ring) Link(s *Ring) *Ring {
	n := r.Next()
	if s != nil {
		p := s.Prev()
		// 注意: 多重代入は使えない。
		// 左辺の評価順序が規定されていないため。
		r.next = s
		s.prev = r
		n.prev = p
		p.next = n
	}
	return n
}
```

```go:line-numbers=90 [原文]
func (r *Ring) Link(s *Ring) *Ring {
	n := r.Next()
	if s != nil {
		p := s.Prev()
		// Note: Cannot use multiple assignment because
		// evaluation order of LHS is not specified.
		r.next = s
		s.prev = r
		n.prev = p
		p.next = n
	}
	return n
}
```

:::

## 前提知識

- **連結リスト**: 要素が「次の要素への矢印（ポインタ）」を持ち、矢印をたどって並びを表すデータ構造です。双方向連結リストは「前の要素への矢印」も持ちます。
- **循環リスト**: 最後の要素の「次」が最初の要素を指しているリストです。端がありません。
- **`r.next`、`r.prev`**: 次と前の要素へのポインタです。`r.Next()`、`r.Prev()` はそれを返すメソッドです。
- **`nil`**: ポインタが何も指していないことを表します。
- **多重代入**: Go では `a, b = x, y` のように複数の変数に一度に代入できます。

## 何をしているか

### 1. r の元の次を覚える

```go:line-numbers=91
	n := r.Next()
```

`n` は、つなぐ前の `r` の次の要素です。

### 2. 4 本の矢印を付け替える

```go:line-numbers=93
		p := s.Prev()
		// 注意: 多重代入は使えない。
		// 左辺の評価順序が規定されていないため。
		r.next = s
		s.prev = r
		n.prev = p
		p.next = n
```

`p` は `s` の前の要素です。

- `r.next = s`、`s.prev = r` で、`r → s` をつなぐ
- `n.prev = p`、`p.next = n` で、`p → n` をつなぐ

### 別々の輪の場合（結合）

輪 A が `r → n → ... → r`、輪 B が `s → ... → p → s` だとします。付け替え後は

```
r → s → ... → p → n → ... → r
```

と、1 つの大きな輪になります。

### 同じ輪の場合（分割）

輪が `r → n → x → s → y → r` で、`p` は `s` の前なので `x` です。付け替え後は

- `r → s → y → r`（`r` を含む輪）
- `x → n → x`（切り離された `n`〜`x` の輪）

となり、`r` と `s` の間にあった要素（`n` と `x`）が別の輪として切り離されます。戻り値の `n` がその切り離された輪を指します。

## ここがすごい

- **1 つの操作が 2 役をこなす**: 結合も分割も「4 本の矢印の付け替え」という同じ操作です。輪の構造の数学的な対称性を、そのまま API にしています。実際、同じパッケージの `Unlink` は `Link` を使って書かれています。
- **多重代入をあえて使わない理由が書いてある**:コメントは「左辺の評価順序が規定されていないので多重代入は使えない」と説明しています。`p` と `n` が同じ要素になる場合などに、書き込みの順番が結果に影響するからです。こうした落とし穴をコメントで残しているのは親切です。
- **戻り値が両方の場合で意味を持つ**: 結合なら「元の `r` の次」、分割なら「切り離された輪」を返します。どちらの使い方でも役に立つ値です。

## まとめ

- 循環リストでは、2 つの輪の結合と 1 つの輪の分割が、同じポインタ付け替えで実現できる。
- 構造の対称性に気づくと、API を小さくできる。
- 書き込み順序が意味を持つ場面では、多重代入に頼らず 1 文ずつ書く。
