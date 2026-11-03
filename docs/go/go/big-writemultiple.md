---
title: "同じ文字列を何度も書き出す writeMultiple。書けるならまとめて書く書き方を選ぶ"
description: "math/big の writeMultiple。整数の書式で、同じ文字列を指定の回数だけ出力先に書く。書き出し先が 1 バイト書き込みや文字列書き込みに対応していれば、その方法を使い、なければ一般の Write で書く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2015 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/intconv.go"
lines: [44, 66]
function: "writeMultiple"
difficulty: 2
tags: [入出力, 文字列処理, 最適化]
---

## ひとことで

`writeMultiple(s, text, count)` は、同じ文字列 `text` を `count` 回、書き出し先 `s` に書きます。例えば、整数の桁を揃えるための空白や 0 を、大量に書き出すときに使われます。

同じものを何度も書くときは、書き出し先に応じて、一番速い方法を選びます。書き出し先が対応していれば、1 文字ずつ、あるいは文字列のまま書きます。

## コード

```go:line-numbers=44
func writeMultiple(s fmt.State, text string, count int) {
	if len(text) <= 0 || count <= 0 {
		return
	}
	if len(text) == 1 {
		if bw, ok := s.(io.ByteWriter); ok {
			for range count {
				bw.WriteByte(text[0])
			}
			return
		}
	}
	if sw, ok := s.(io.StringWriter); ok {
		for range count {
			sw.WriteString(text)
		}
		return
	}
	b := []byte(text)
	for range count {
		s.Write(b)
	}
}
```

## 前提知識

- **`fmt.State`**: `fmt` の書式処理で、書き出し先として渡される値です。`Write` で、バイト列を書けます。
- **`io.ByteWriter`**: 1 バイトずつ書けることを表す約束です。`WriteByte` を持ちます。
- **`io.StringWriter`**: 文字列をそのまま書けることを表す約束です。`WriteString` を持ちます。
- **`for range count`**: Go 1.22 以降で使える、整数の回数だけ繰り返す書き方です。

## 何をしているか

### 1. 何も書かない場合を弾く

```go:line-numbers=45
	if len(text) <= 0 || count <= 0 {
		return
	}
```

文字列が空か、回数が 0 以下なら、書くものがありません。すぐに戻ります。

### 2. 文字列を書けるならまとめて書く

```go:line-numbers=56
	if sw, ok := s.(io.StringWriter); ok {
		for range count {
			sw.WriteString(text)
		}
		return
	}
```

書き出し先が `WriteString` を持つなら、文字列のまま、回数だけ書きます。文字列を一度バイト列に変える必要がないので、無駄がありません。

### 3. どちらも使えないときは一般の方法で書く

```go:line-numbers=62
	b := []byte(text)
	for range count {
		s.Write(b)
	}
```

どちらの約束も持たない場合は、一度だけバイト列に変えて、その同じ値を何度も `Write` で書きます。変換は一回だけで済みます。

## ここがすごい

- **書き出し先の能力に合わせる**: 同じ仕事を、相手ができる一番効率のよい方法で行います。呼び出し側は、相手の種類を気にしません。
- **変換を一回にまとめる**: 一般の方法でも、文字列からバイト列への変換は一度だけです。回数が多くても、無駄なコピーは増えません。
- **空の入力を先に弾く**: 何も書かないなら、以後の判定を飛ばして戻ります。

## まとめ

- `writeMultiple` は、同じ文字列を指定の回数だけ書き出します。
- 書き出し先が `WriteString` を持てば、それを使います。
- どちらも使えなければ、一度だけバイト列に変えて `Write` で書きます。
