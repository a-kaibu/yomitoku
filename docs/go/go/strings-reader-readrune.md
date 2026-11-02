---
title: "文字列を 1 文字ずつ読む strings.Reader.ReadRune。文字の始まりを覚える"
description: "strings.Reader の ReadRune。位置から UTF-8 の 1 文字を復号して、その文字と長さを返し、読む位置を進める。直前の文字の位置を覚えておくので、すぐに UnreadRune で戻せる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/reader.go"
lines: [87, 96]
function: "ReadRune"
difficulty: 2
tags: [文字列処理, Unicode, 入出力]
---

## ひとことで

`strings.Reader` の `ReadRune` は、読む位置から 1 文字（rune）を取り出します。返り値は、その文字、文字が何バイトか、エラーの 3 つです。例えば `"あい"` の先頭で呼ぶと、`'あ'`、`3`、`nil` が返ります。読み終わると、`io.EOF` が返ります。

文字の途中のバイトで止まらないように、UTF-8 として 1 文字ずつ読みます。

## コード

```go:line-numbers=87
func (r *Reader) ReadRune() (ch rune, size int, err error) {
	if r.i >= int64(len(r.s)) {
		r.prevRune = -1
		return 0, 0, io.EOF
	}
	r.prevRune = int(r.i)
	ch, size = utf8.DecodeRuneInString(r.s[r.i:])
	r.i += int64(size)
	return
}
```

## 前提知識

- **UTF-8 の 1 文字**: 1〜4 バイトの並びで 1 つの文字を表します。日本語の多くは 3 バイトです。
- **`io.EOF`**: 読み終わったことを表すエラーです。読み手は、これを見て読むのをやめます。
- **`utf8.DecodeRuneInString`**: 文字列の先頭の 1 文字と、そのバイト数を返す関数です。
- **`prevRune`**: 直前に読んだ文字の位置です。`UnreadRune` で、その位置へ戻るために使います。

## 何をしているか

### 1. 末尾なら EOF を返す

```go:line-numbers=88
	if r.i >= int64(len(r.s)) {
		r.prevRune = -1
		return 0, 0, io.EOF
	}
```

読む位置が文字列の長さ以上なら、もう読めるものがありません。`io.EOF` を返し、直前の位置の記録も無効にします。

### 2. 今の位置を記録して 1 文字を復号する

```go:line-numbers=92
	r.prevRune = int(r.i)
	ch, size = utf8.DecodeRuneInString(r.s[r.i:])
	r.i += int64(size)
```

今の位置を `prevRune` に覚えておきます。そのあと、残りの文字列から先頭の 1 文字を復号し、その長さ `size` だけ位置を進めます。

## ここがすごい

- **戻れる読み方**: 読む前の位置を覚えておくので、`UnreadRune` を呼べば、ちょうど読んだ文字の前に戻れます。構文解析で先読みするときに役立ちます。
- **位置を文字の境目だけで進める**: 復号した文字の長さだけ進むので、読む位置が文字の途中に来ることがありません。
- **名前付きの戻り値**: `return` だけで、途中で設定した `ch` と `size` を返せます。短くて読みやすい形です。

## まとめ

- `ReadRune` は、読む位置から UTF-8 の 1 文字を取り出して、位置を進めます。
- 文字列の末尾では、`io.EOF` を返します。
- 読む前の位置を `prevRune` に覚えておくので、`UnreadRune` で戻れます。
- 位置は、常に文字の境目で進みます。
