---
title: "入力の終わりの印を取り出す Decoder.popEOF。印があれば取り除いて真を返す"
description: "encoding/xml の Decoder.popEOF。スタックの一番上が入力終わりの印なら、それを取り除いて true を返す。印がなければ何もせず false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [451, 457]
function: "popEOF"
difficulty: 1
tags: [データ構造, パース, 状態機械]
---

## ひとことで

`d.popEOF()` は、スタックの一番上が「入力の終わり」を表す印であるかを確かめます。印であれば、取り除いて `true` を返します。印でなければ、何もせずに `false` を返します。

XML の解析では、入力が終わったときに、まだ閉じていない要素がないかを確かめる必要があります。その確かめを、スタックの印で行うための小さな関数です。

## コード

```go:line-numbers=451
func (d *Decoder) popEOF() bool {
	if d.stk == nil || d.stk.kind != stkEOF {
		return false
	}
	d.pop()
	return true
}
```

## 前提知識

- **スタック**: 後から入れたものを先に取り出す構造です。XML の開いた要素や、特別な印を積んで管理します。
- **`stkEOF`**: 入力の終わりを表す印の種類です。
- **`d.pop()`**: スタックの一番上を取り出す関数です。前の記事で見た、空きリストへの移動もここで行われます。
- **真偽値で結果を返す**: 「取り除けたか」を `true` か `false` で伝えます。

## 何をしているか

### 1. 印がなければ false を返す

```go:line-numbers=452
	if d.stk == nil || d.stk.kind != stkEOF {
		return false
	}
```

スタックが空か、一番上が入力終わりの印でなければ、何もせずに `false` を返します。

### 2. 印があれば取り除いて true を返す

```go:line-numbers=455
	d.pop()
	return true
```

一番上の印を `pop` で取り除き、`true` を返します。取り除いた結果は、呼び出し側では使いません。取り除くことだけが目的です。

## ここがすごい

- **条件が一つにまとまる**: 空かどうかと、種類が印かどうかを、一つの `if` で確かめます。
- **結果を真偽値で伝える**: 呼び出し側は、`if d.popEOF()` のように、一行で分岐を書けます。
- **取り除きと判定を分けない**: 印を確かめてから取る、という二段の手間を、一つの関数にまとめています。

## まとめ

- `popEOF` は、スタックの一番上が入力終わりの印なら取り除きます。
- 印があれば `true`、なければ `false` を返します。
- 呼び出し側は、真偽値で次の分岐を決められます。
