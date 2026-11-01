---
title: "読んだ内容を書き込み先にも複製する io.teeReader.Read"
description: "io.TeeReader が返す teeReader の Read は、元の Reader から読んだ内容を、同時に Writer へも書き込みます。読みながら内容を記録するときに使われます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [627, 635]
function: "Read"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, 設計パターン]
---

## ひとことで

`io.TeeReader(src, dst)` で作った Reader を読むと、読んだ内容が `dst` にも書き込まれます。`tee` は、T 字の配管から、水を 2 方向に分けるように、データを 2 つに分けるという意味です。

## コード

```go:line-numbers=627
func (t *teeReader) Read(p []byte) (n int, err error) {
	n, err = t.r.Read(p)
	if n > 0 {
		if n, err := t.w.Write(p[:n]); err != nil {
			return n, err
		}
	}
	return
}
```

## 前提知識

- **`Reader` と `Writer`**: `Read` と `Write` を持つインターフェースです。データの流れを、どちらも同じ形で扱えます。
- **包み（ラッパー）**: 既存の `Reader` を別の `Reader` で包み、読む動作に追加の仕事を足す方法です。
- **読んだ量 `n`**: `Read` は、読めたバイト数を返します。その分だけ、書き込み先にも書きます。
- **`err` の扱い**: 読みのエラーは、そのまま呼び出し側に返します。

## 何をしているか

### 1. 元の Reader から読む

```go:line-numbers=628
	n, err = t.r.Read(p)
```

`t.r.Read(p)` で、元の `Reader` から `p` に読み込みます。読めた量が `n`、エラーが `err` です。

### 2. 読んだ分を書き込み先へ送る

```go:line-numbers=629
	if n > 0 {
		if n, err := t.w.Write(p[:n]); err != nil {
			return n, err
		}
```

`n > 0` なら、読んだ部分 `p[:n]` を `t.w.Write` で書き込みます。書き込みに失敗したら、その量とエラーを返します。

### 3. 読んだ結果を返す

```go:line-numbers=634
	return
```

読んだ量とエラーを、名前付きの戻り値のまま返します。呼び出し側は、通常の `Read` と同じように結果を受け取ります。

## ここがすごい

- **読みながら記録できる**: 読む処理に記録を重ねるので、データを 2 回読む必要がありません。
- **呼び出し側の形が変わらない**: 包んでも、`Read` の形は同じなので、既存の処理にそのまま渡せます。
- **書き込みの失敗を見逃さない**: 書き込みが失敗したら、そのエラーを返すので、記録の欠けに気づけます。

## まとめ

- 元の `Reader` から読み、読んだ分を書き込み先へ送る。
- 書き込みの失敗は、呼び出し側へエラーとして返す。
- 呼び出し側から見ると、通常の `Reader` と同じ形で使える。
