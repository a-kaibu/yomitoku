---
title: "読んだ文字を 1 つだけ戻す bufio.Reader.UnreadRune。直前の文字だけ戻せる"
description: "bufio.Reader の UnreadRune。直前の ReadRune で読んだ文字を、読み位置から元に戻す。直前の操作が ReadRune でなければ、戻すことはできないのでエラーを返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/bufio.go"
lines: [325, 333]
function: "UnreadRune"
difficulty: 2
tags: [入出力, Unicode, パース]
---

## ひとことで

構文解析では、次の文字を見てから「やっぱり前の文字から読み直したい」ということがよくあります。`bufio.Reader.UnreadRune` は、直前に `ReadRune` で読んだ 1 文字だけを、読み位置から戻すための関数です。

戻せるのは 1 回だけで、しかも直前が `ReadRune` のときだけです。他の読み方をした後では、戻せません。

## コード

```go:line-numbers=325
func (b *Reader) UnreadRune() error {
	if b.lastRuneSize < 0 || b.r < b.lastRuneSize {
		return ErrInvalidUnreadRune
	}
	b.r -= b.lastRuneSize
	b.lastByte = -1
	b.lastRuneSize = -1
	return nil
}
```

## 前提知識

- **`ReadRune`**: 1 文字（rune）を読んで、その文字と長さを返す `bufio.Reader` のメソッドです。
- **`lastRuneSize`**: 直前に読んだ文字の長さです。戻すときに、この分だけ読み位置を後ろから引きます。
- **`lastByte`**: 直前に読んだバイトを覚える変数です。`UnreadRune` の後は、もう一度戻せないように `-1` にします。
- **`ErrInvalidUnreadRune`**: 戻せない状態であることを表すエラーです。

## 何をしているか

### 1. 戻せる状態かを確かめる

```go:line-numbers=326
	if b.lastRuneSize < 0 || b.r < b.lastRuneSize {
		return ErrInvalidUnreadRune
	}
```

直前の操作が `ReadRune` でなければ、`lastRuneSize` は `-1` になっています。また、読み位置が直前の文字の長さより前にあるなら、戻す先がありません。どちらでも、エラーを返します。

### 2. 読み位置を文字の分だけ戻す

```go:line-numbers=329
	b.r -= b.lastRuneSize
	b.lastByte = -1
	b.lastRuneSize = -1
	return nil
```

読み位置 `b.r` を、直前の文字の長さだけ後ろから引きます。これで、その文字が次に読まれるようになります。戻したあとは、`lastByte` と `lastRuneSize` を `-1` にして、もう一度戻せないようにします。

## ここがすごい

- **1 回だけ戻せる仕組み**: 戻したあとに記録を消すので、同じ文字を二重に戻すことができません。読み位置が勝手に壊れることを防ぎます。
- **状態の確認を先に**: 戻せない状態を先に見つけてエラーにするので、無効な位置へ動くことがありません。
- **バッファの中で戻る**: 文字はバッファに入っているので、ファイルに戻るような重い操作は要りません。

## まとめ

- `UnreadRune` は、直前に読んだ 1 文字を読み位置から戻します。
- 直前が `ReadRune` でない場合や、戻す先がない場合は、エラーを返します。
- 戻したあとは記録を消して、二重に戻らないようにします。
- 戻す処理はバッファの中で完結するので、軽い操作です。
