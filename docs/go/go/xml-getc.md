---
title: "XML の入力から 1 バイト読む Decoder.getc。改行の数と位置を同時に数える"
description: "encoding/xml の Decoder.getc。入力から 1 バイトを読み、読み戻し用の記録があればそれを先に使う。改行なら行の番号を進め、位置の番号も一つ増やす。エラーがあるか、入力が終わればすぐに失敗を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [914, 936]
function: "getc"
difficulty: 2
tags: [入出力, パース, 防御的プログラミング]
---

## ひとことで

`d.getc()` は、XML の入力から 1 バイトを読みます。読んだバイトは、そのまま呼び出し側に返されます。同時に、改行なら行の番号を、すべての読み取りで位置の番号を進めます。

エラーの位置を正確に伝えるには、今何行目の何バイト目かを、読みながら数えておく必要があります。この関数は、その数え方を一か所にまとめています。

## コード

```go:line-numbers=914
func (d *Decoder) getc() (b byte, ok bool) {
	if d.err != nil {
		return 0, false
	}
	if d.nextByte >= 0 {
		b = byte(d.nextByte)
		d.nextByte = -1
	} else {
		b, d.err = d.r.ReadByte()
		if d.err != nil {
			return 0, false
		}
		if d.saved != nil {
			d.saved.WriteByte(b)
		}
	}
	if b == '\n' {
		d.line++
		d.linestart = d.offset + 1
	}
	d.offset++
	return b, true
}
```

## 前提知識

- **`d.err`**: 以前の読み取りで起きたエラーを覚えておく欄です。エラーがあれば、以後の読み取りは行いません。
- **`nextByte`**: 読み戻されたバイトを覚えておく欄です。負の値なら、戻されたものはありません。
- **`d.saved`**: 読んだバイトを、必要なときに別の場所へ書き写すための記録です。
- **行番号と位置**: `line` は今の行の番号、`offset` は入力の先頭から数えた位置です。`linestart` は、今の行が始まった位置です。

## 何をしているか

### 1. 以前のエラーがあれば止める

```go:line-numbers=915
	if d.err != nil {
		return 0, false
	}
```

以前にエラーが起きていれば、もう読みません。`false` を返して、読めなかったことを知らせます。

### 2. 戻されたバイトを優先する

```go:line-numbers=918
	if d.nextByte >= 0 {
		b = byte(d.nextByte)
		d.nextByte = -1
	} else {
```

読み戻されたバイトがあれば、それを使います。使ったら、欄を空に戻します。ない場合は、入力から実際に読みます。

### 3. 改行なら行と行頭を更新する

```go:line-numbers=930
	if b == '\n' {
		d.line++
		d.linestart = d.offset + 1
	}
	d.offset++
	return b, true
```

改行なら、行の番号を増やし、次の行の始まりの位置を記録します。そのあと、位置の番号を一つ増やして、読んだバイトを返します。

## ここがすごい

- **読みと数えが同時**: 一バイト読むたびに、行と位置を更新するので、数え忘れがありません。
- **読み戻しと両立**: 戻されたバイトも、位置を一つ進めて数えます。読み直しても、位置の情報は正しいままです。
- **エラーは早く伝える**: エラーがあれば、その場で止まり、以後は読みません。失敗が連鎖して、わけの分からない結果になることを防ぎます。

## まとめ

- `getc` は、入力から 1 バイトを読み、行と位置を数えます。
- 読み戻しのバイトがあれば、それを優先します。
- 以前のエラーがあれば、読まずに失敗を返します。
