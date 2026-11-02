---
title: "読み取りの位置を動かす strings.Reader.Seek。基準を 3 通りから選ぶ"
description: "strings.Reader の Seek。文字列の先頭、現在地、末尾のどれを基準にするかを選んで、読む位置を動かす。負の位置や不正な基準はエラーにし、直前の rune の記録も消す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/reader.go"
lines: [112, 130]
function: "Seek"
difficulty: 2
tags: [入出力, 文字列処理, 防御的プログラミング]
---

## ひとことで

`strings.NewReader(s)` で作った `Reader` は、文字列を先頭から順に読みます。`Seek(offset, whence)` は、その読む位置を自由に動かします。`whence` で基準を決め、`offset` だけずらした位置を、新しい読む位置にします。

ファイルの `Seek` と同じ形の関数なので、ファイルを扱う関数に、文字列をそのまま渡せます。

## コード

```go:line-numbers=112
func (r *Reader) Seek(offset int64, whence int) (int64, error) {
	r.prevRune = -1
	var abs int64
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = r.i + offset
	case io.SeekEnd:
		abs = int64(len(r.s)) + offset
	default:
		return 0, errors.New("strings.Reader.Seek: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("strings.Reader.Seek: negative position")
	}
	r.i = abs
	return abs, nil
}
```

## 前提知識

- **`io.Seeker`**: `Seek` を持つインタフェースです。ファイルや `strings.Reader` などが、同じ形で位置を動かせるように決まっています。
- **`whence`（基準）**: `io.SeekStart`（先頭から）、`io.SeekCurrent`（今の位置から）、`io.SeekEnd`（末尾から）の 3 種類です。
- **`prevRune`**: 直前に `ReadRune` で読んだ文字の位置を覚えておく変数です。`UnreadRune` で戻すときに使います。
- **負の位置**: 先頭より前は存在しないので、エラーにします。

## 何をしているか

### 1. 直前の文字の記録を消す

```go:line-numbers=113
	r.prevRune = -1
```

位置を動かすと、直前に読んだ文字の記録は意味がなくなります。`-1` を入れて、`UnreadRune` で戻せないようにします。

### 2. 基準に応じて絶対位置を求める

```go:line-numbers=115
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = r.i + offset
	case io.SeekEnd:
		abs = int64(len(r.s)) + offset
	default:
		return 0, errors.New("strings.Reader.Seek: invalid whence")
	}
```

基準によって、`offset` の足し方が変わります。先頭基準は `offset` そのもの、現在地基準は今の `r.i` に足し、末尾基準は文字列の長さに足します。どれでもなければ、不正な基準としてエラーです。

### 3. 負の位置を禁じて、移動する

```go:line-numbers=125
	if abs < 0 {
		return 0, errors.New("strings.Reader.Seek: negative position")
	}
	r.i = abs
	return abs, nil
```

計算した位置が負なら、先頭より前なのでエラーです。問題なければ、`r.i` を新しい位置にして、その値を返します。末尾より後ろへの移動は、ここでは禁じていません。読もうとすると、`io.EOF` が返ります。

## ここがすごい

- **3 つの基準を 1 つの式に**: 基準の違いは、「どこからの距離か」だけです。`switch` で基準の起点を決め、後の処理は共通にしています。
- **古い状態を捨てる**: 位置を動かしたら、`prevRune` を `-1` にします。位置と記録が食い違う状態を残さないためです。
- **エラーは文脈付きで**: `strings.Reader.Seek: negative position` のように、どの関数のエラーかが分かる文面です。

## まとめ

- `Seek` は、先頭・現在地・末尾の 3 つを基準にして、読む位置を動かします。
- 基準が不正なら、エラーを返します。
- 計算した位置が負なら、先頭より前なのでエラーです。
- 位置を動かすときに、直前の文字の記録も消します。
