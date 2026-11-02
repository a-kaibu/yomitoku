---
title: "文字列をバッファの末尾へ書く bytes.Buffer.WriteString"
description: "bytes.Buffer.WriteString は、文字列をバッファの末尾へ書き足します。書き込み先に空きがあれば、その場で書き、足りなければ領域を広げてから書きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/buffer.go"
lines: [205, 212]
function: "WriteString"
difficulty: 2
format: 2
tags: [入出力, メモリ管理, 標準ライブラリ]
---

## ひとことで

`buf.WriteString("こんにちは")` は、文字列を UTF-8 のバイトのまま末尾へ書き、書いたバイト数と、エラーの `nil` を返します。文字列を `[]byte` に直す手間を省けます。

## コード

```go:line-numbers=205
func (b *Buffer) WriteString(s string) (n int, err error) {
	b.lastRead = opInvalid
	m, ok := b.tryGrowByReslice(len(s))
	if !ok {
		m = b.grow(len(s))
	}
	return copy(b.buf[m:], s), nil
}
```

## 前提知識

- **`bytes.Buffer` の末尾への書き込み**: 書いたバイトは、内部のスライスの末尾に並びます。
- **空きの確認**: 今の配列に空きがあれば、新しい配列を作らずに書けます。
- **`lastRead`**: 直前の読み出しの種類を覚えておく欄です。書き込みをしたので、読み戻しはできなくなります。
- **`grow`**: 空きが足りないとき、領域を広げる内部の関数です。

## 何をしているか

### 1. 読み戻しの状態を無効にする

```go:line-numbers=206
	b.lastRead = opInvalid
```

書き込みをすると、直前の読み出しを元に戻せなくなります。`lastRead` を `opInvalid` にして、その状態を記録します。

### 2. 空きに収まるか確かめる

```go:line-numbers=207
	m, ok := b.tryGrowByReslice(len(s))
```

`tryGrowByReslice` で、今の配列の空きに、文字列の長さぶんが収まるかを試します。収まれば、新しい配列は要りません。

### 3. 足りなければ広げてから書く

```go:line-numbers=208
	if !ok {
		m = b.grow(len(s))
	}
```

収まらなければ、`grow` で必要な長さを確保します。確保した位置 `m` から、文字列をコピーします。

### 4. 書いた量を返す

```go:line-numbers=211
	return copy(b.buf[m:], s), nil
```

`copy` の戻り値は、実際にコピーしたバイト数です。その数と、`nil` を返します。

## ここがすごい

- **文字列を直接書ける**: `[]byte(s)` の変換を作らずに、バイトを書けます。大きな文字列でも、余分な確保が減ります。
- **空きを先に使う**: 収まるときは、配列を作り直さずに済みます。
- **書いた量が分かる**: 戻り値で、どれだけ書けたかを確かめられます。

## まとめ

- 読み戻しの状態を無効にして、空きに収まるかを確かめる。
- 足りなければ領域を広げ、文字列を末尾にコピーする。
- 書いた量と `nil` を返す。
