---
title: "[]byte を base64 の文字列にして JSON に出す encodeByteSlice"
description: "encoding/json が []byte を JSON に書き出すときに使う encodeByteSlice。nil は null にし、それ以外は base64 にして引用符で囲む。途中の結果は、encodeState の空きバッファに直接書き込む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/encode.go"
lines: [818, 830]
function: "encodeByteSlice"
difficulty: 2
tags: [入出力, 標準ライブラリ, メモリ管理]
---

## ひとことで

Go の `[]byte` を JSON にすると、`"aGVsbG8="` のような base64 の文字列になります。`encodeByteSlice` は、その変換を行う関数です。`nil` のスライスは、JSON の `null` として書きます。

画像などのバイナリを JSON に入れるときの決まりです。JSON には、バイト列を直接書く方法がないので、文字で表せる base64 を使います。

## コード

```go:line-numbers=818
func encodeByteSlice(e *encodeState, v reflect.Value, _ encOpts) {
	if v.IsNil() {
		e.WriteString("null")
		return
	}

	s := v.Bytes()
	b := e.AvailableBuffer()
	b = append(b, '"')
	b = base64.StdEncoding.AppendEncode(b, s)
	b = append(b, '"')
	e.Write(b)
}
```

## 前提知識

- **base64**: 任意のバイト列を、英数字と `+`、`/`、`=` だけの文字列に変える方法です。どんなデータも、テキストとして安全に運べます。
- **`reflect.Value`**: 実行時に値の情報を調べるための型です。`encoding/json` は、構造体の項目を調べるために使っています。
- **`encodeState` のバッファ**: 出力を一時的にためておく領域です。`AvailableBuffer()` は、そこの空きを借りる関数です。
- **`null` の扱い**: JSON では、値がないことを `null` で表します。`nil` のスライスはそれに対応します。

## 何をしているか

### 1. nil は null として書く

```go:line-numbers=819
	if v.IsNil() {
		e.WriteString("null")
		return
	}
```

スライスが `nil` なら、値がないという意味で `null` を書きます。空のスライス `[]byte{}` とは区別されます。空のスライスは `""` になります。

### 2. 空きバッファに base64 を書く

```go:line-numbers=824
	s := v.Bytes()
	b := e.AvailableBuffer()
	b = append(b, '"')
	b = base64.StdEncoding.AppendEncode(b, s)
	b = append(b, '"')
	e.Write(b)
```

`v.Bytes()` で、中のバイト列を取り出します。`AvailableBuffer` で、出力用のバッファの空いている部分を借ります。そこに、引用符、base64 の文字列、引用符を順に追加します。最後に `e.Write(b)` で、まとめて書き出します。

`AppendEncode` は、base64 の結果を、渡したスライスの後ろに追加する関数です。新しいバッファを作らないので、余計なメモリ確保がありません。

## ここがすごい

- **バッファを借りて書く**: 変換のための一時的な文字列を作らず、出力用のバッファに直接書き込みます。大きな画像などでも、コピーを減らせます。
- **nil と空を区別する**: `null` と `""` を別々に書くことで、読み込み側が元の状態を復元できます。
- **標準の base64 を使う**: 独自の変換を書かず、`base64.StdEncoding` の仕様どおりに出力します。他の JSON の読み手と互換になります。

## まとめ

- `[]byte` は、JSON では base64 の文字列として書かれます。
- `nil` のスライスは `null`、それ以外は引用符で囲んだ base64 になります。
- 出力用のバッファの空きに直接書き込んで、無駄なコピーを減らしています。
- 標準の base64 の仕様に従うので、ほかの言語からも読めます。
