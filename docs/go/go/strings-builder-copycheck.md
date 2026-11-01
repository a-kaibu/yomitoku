---
title: "値ごとコピーされた Builder を自分のアドレスで見破る"
description: "strings.Builder が値としてコピーされたことを検出するメソッド。最初に使われたときの自分のアドレスを覚えておき、違う場所から使われたら panic します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/builder.go"
lines: [32, 43]
function: "(*Builder).copyCheck"
difficulty: 3
format: 2
tags: [防御的プログラミング, メモリ管理, 標準ライブラリ, ハック]
---

## ひとことで

`strings.Builder` は、中身を **値としてコピーして使ってはいけない** 型です。コピーしたものに書き込むと、文字列が後から変わってしまうといった問題が起きるからです。

`copyCheck` は、Builder の書き込み系メソッドの最初で呼ばれ、**「今使われている Builder が、最初に使われたときと同じ場所にあるか」** を確かめます。違えば、コピーされたものとみなして `panic` します。

## コード

::: code-group

```go:line-numbers=32 [日本語訳]
func (b *Builder) copyCheck() {
	if b.addr == nil {
		// このハックは Go のエスケープ解析の弱点を回避するもので、
		// その弱点のせいで b がエスケープしてヒープに確保されていた。
		// issue 23382 を参照。
		// TODO: issue 7921 が直ったら、単に
		// 「b.addr = b」に戻すこと。
		b.addr = (*Builder)(abi.NoEscape(unsafe.Pointer(b)))
	} else if b.addr != b {
		panic("strings: illegal use of non-zero Builder copied by value")
	}
}
```

```go:line-numbers=32 [原文]
func (b *Builder) copyCheck() {
	if b.addr == nil {
		// This hack works around a failing of Go's escape analysis
		// that was causing b to escape and be heap allocated.
		// See issue 23382.
		// TODO: once issue 7921 is fixed, this should be reverted to
		// just "b.addr = b".
		b.addr = (*Builder)(abi.NoEscape(unsafe.Pointer(b)))
	} else if b.addr != b {
		panic("strings: illegal use of non-zero Builder copied by value")
	}
}
```

:::

## 前提知識

- **値のコピー**: Go で構造体を変数に代入したり関数に渡したりすると、中身がまるごとコピーされます。`b2 := b1` とすると、`b2` は `b1` とは別の場所にある、同じ中身の Builder になります。
- **ポインタ**: 値が置かれている場所（アドレス）を指す値です。`b *Builder` の `b` は Builder のアドレスです。
- **`b.addr`**: Builder が自分のアドレスを覚えておくためのフィールドです。最初は `nil`（何も指していない）です。
- **`panic`**: 重大な誤りを見つけたときにプログラムを止める仕組みです。
- **エスケープ解析**: Go のコンパイラは、変数を高速なスタックに置けるか、ヒープ（後から解放される領域）に置く必要があるかを自動で判断します。ポインタを保存すると「外に漏れる（エスケープする）」と判断されてヒープに置かれやすくなります。

## 何をしているか

### 1. 初めて使われたとき

```go:line-numbers=33
	if b.addr == nil {
		// このハックは Go のエスケープ解析の弱点を回避するもので、
		// その弱点のせいで b がエスケープしてヒープに確保されていた。
		// issue 23382 を参照。
		// TODO: issue 7921 が直ったら、単に
		// 「b.addr = b」に戻すこと。
		b.addr = (*Builder)(abi.NoEscape(unsafe.Pointer(b)))
```

`b.addr` が `nil` なら、今の自分のアドレス `b` を `b.addr` に保存します。
ただし、そのまま `b.addr = b` と書くと、コンパイラが「`b` のアドレスが保存されるから外に漏れる」と判断し、Builder がヒープに置かれてしまいます（コメントにある issue 23382）。
そこで `abi.NoEscape(unsafe.Pointer(b))` で、**コンパイラの目からアドレスの出どころを隠して** から保存しています。

### 2. 2 回目以降

```go:line-numbers=40
	} else if b.addr != b {
		panic("strings: illegal use of non-zero Builder copied by value")
	}
```

`b.addr != b`、つまり **覚えているアドレスと今のアドレスが違う** なら、この Builder は使い始めた後に値ごとコピーされたものです。`panic` で知らせます。

### 具体例

```go
var b1 strings.Builder
b1.WriteString("a")   // b1.addr = &b1 を記録
b2 := b1               // 中身ごとコピー。b2.addr は &b1 のまま
b2.WriteString("b")   // &b2 != b2.addr なので panic
```

`b2` は `b1` と同じバッファを共有したまま書き込もうとしていたので、ここで止めないと `b1.String()` で返した文字列が書き換わる恐れがありました。

## ここがすごい

- **自分のアドレスを「指紋」にする**: 型システムでは「コピー禁止」を表現できないので、実行時に「自分はどこにいるか」を記録して比べる、という発想で解決しています。
- **使い始める前のコピーは許す**: `addr` が `nil` のうちは何も記録されていないので、ゼロ値の Builder をコピーするのは問題ありません。使い始めた後のコピーだけを検出する、ちょうどよい厳しさです。
- **最適化との両立**: 素直な `b.addr = b` ではヒープ確保が起きて遅くなるため、コンパイラの解析をすり抜ける小技を使っています。 TODO コメントで「コンパイラが直ったら元に戻す」と書かれているように、**一時的な回避策であることを明記** しているのもよい習慣です。

## まとめ

- 型で表現できない約束（コピー禁止）は、実行時チェックで守ることができる。
- 自分のアドレスを覚えておけば、値がコピーされたかどうかを見分けられる。
- コンパイラの都合に合わせた回避策には、理由と「いつ戻すか」をコメントで残す。
