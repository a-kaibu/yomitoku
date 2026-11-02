---
title: "rune を文字列に変える runtime.intstring。作る先のバッファを選ぶ"
description: "整数の rune を文字列にする runtime.intstring。呼び出し元が用意した 4 バイトのバッファがあればそこに、なければ新しく確保して、UTF-8 に変換する。不正な値は U+FFFD に置き換える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/runtime/string.go"
lines: [312, 325]
function: "intstring"
difficulty: 3
tags: [文字列処理, メモリ管理, Unicode]
---

## ひとことで

Go で `string(r)`（`r` は rune）と書くと、コンパイラは `runtime.intstring` を呼びます。例えば `string(rune(0x3042))` は `"あ"` になります。この関数は、rune を UTF-8 のバイト列にして、文字列として返します。

この関数の面白い点は、**文字列の領域を、呼び出し元が用意した小さなバッファから取る** ことがあるところです。ヒープへの確保を避けられます。

## コード

```go:line-numbers=312
func intstring(buf *[4]byte, v int64) (s string) {
	var b []byte
	if buf != nil {
		b = buf[:]
		s = slicebytetostringtmp(&b[0], len(b))
	} else {
		s, b = rawstring(4)
	}
	if int64(rune(v)) != v {
		v = runeError
	}
	n := encoderune(b, rune(v))
	return s[:n]
}
```

## 前提知識

- **rune と UTF-8**: rune は 1 文字の Unicode の値です。文字列は UTF-8 のバイト列で、1 文字は 1〜4 バイトになります。
- **`runtime` パッケージの内部関数**: 利用者が直接呼ぶものではなく、コンパイラが生成したコードから呼ばれる関数です。
- **`[4]byte` のバッファ**: UTF-8 の 1 文字は最大 4 バイトなので、4 バイトの配列があれば、どんな rune も入ります。
- **`runeError`（U+FFFD）**: 正しくない値の代わりに使う「置き換え文字」です。

## 何をしているか

### 1. 呼び出し元のバッファを使うか決める

```go:line-numbers=313
	var b []byte
	if buf != nil {
		b = buf[:]
		s = slicebytetostringtmp(&b[0], len(b))
	} else {
		s, b = rawstring(4)
	}
```

`buf` が `nil` でなければ、呼び出し元が用意した `[4]byte` の配列を使います。それを一時的な文字列として作ります。`buf` が `nil` なら、ヒープに 4 バイトの文字列を確保します。

呼び出し元が `buf` を渡すのは、結果の文字列が一時的にしか使われない場合です。そのときは、ヒープへの確保を省けます。

### 2. 範囲外の値を置き換える

```go:line-numbers=320
	if int64(rune(v)) != v {
		v = runeError
	}
```

`v` が rune の範囲に収まらないなら、正しい文字として表せません。そこで、置き換え文字 `runeError` に差し替えます。

### 3. UTF-8 に変換して長さを切る

```go:line-numbers=323
	n := encoderune(b, rune(v))
	return s[:n]
```

`encoderune` が、rune を UTF-8 で `b` に書き込み、そのバイト数 `n` を返します。最後に `s[:n]` で、使った分だけの文字列を返します。

## ここがすごい

- **用途に応じて確保先を変える**: 一時的な文字列はスタックのバッファで済ませ、必要なものだけヒープに確保します。同じ関数で、2 通りの効率を選べます。
- **不正な値を黙って直す**: 不正な rune を、エラーにせず U+FFFD に置き換えます。文字列を作る処理は、必ず成功するように設計されています。
- **4 バイト分だけ確保する**: UTF-8 の上限に合わせて確保するので、無駄がありません。

## まとめ

- `string(r)` の変換は、内部で `intstring` が行います。
- 呼び出し元が用意したバッファがあれば、そこに一時的な文字列を作ります。
- 範囲外の値は U+FFFD に置き換えます。
- 変換のバイト数に合わせて、文字列の長さを切ります。
