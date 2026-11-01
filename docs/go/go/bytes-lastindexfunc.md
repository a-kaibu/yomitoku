---
title: "バイト列を後ろから条件で探す bytes.lastIndexFunc"
description: "bytes.lastIndexFunc は、バイト列を末尾から見て、条件の関数の結果が指定した真偽になる最初の位置を返します。ASCII は 1 バイトのまま、それ以外だけ UTF-8 として復号します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/bytes/bytes.go"
lines: [915, 927]
function: "lastIndexFunc"
difficulty: 3
format: 2
tags: [文字列処理, Unicode, 最適化, 標準ライブラリ]
---

## ひとことで

`bytes.TrimRightFunc` の内部で、バイト列の末尾から条件に合う文字を探すために使われます。末尾が ASCII なら、復号の手間を省いて 1 バイトだけ見ます。

## コード

```go:line-numbers=915
func lastIndexFunc(s []byte, f func(r rune) bool, truth bool) int {
	for i := len(s); i > 0; {
		r, size := rune(s[i-1]), 1
		if r >= utf8.RuneSelf {
			r, size = utf8.DecodeLastRune(s[0:i])
		}
		i -= size
		if f(r) == truth {
			return i
		}
	}
	return -1
}
```

## 前提知識

- **`truth` の役割**: 条件の結果が `truth` と等しい文字を探します。`false` なら、条件に合わない文字を探すことになります。
- **ASCII と多バイトの文字**: 0x80 より小さいバイトは、1 バイトの文字です。それ以上は、複数バイトの一部か、別の文字の始まりになります。
- **`utf8.DecodeLastRune`**: 末尾の 1 文字を、後ろから復号する関数です。文字と、そのバイト数を返します。
- **`utf8.RuneSelf`**: ASCII の上限です。

## 何をしているか

### 1. 末尾の 1 バイトを取り出す

```go:line-numbers=916
	for i := len(s); i > 0; {
		r, size := rune(s[i-1]), 1
```

`i` は、まだ調べていない部分の終わりです。末尾の 1 バイトを `rune` として取り出します。最初は、1 バイトの文字だと仮定します。

### 2. 多バイトの文字なら復号する

```go:line-numbers=918
		if r >= utf8.RuneSelf {
			r, size = utf8.DecodeLastRune(s[0:i])
		}
```

値が `utf8.RuneSelf` 以上なら、多バイトの文字の一部です。`DecodeLastRune` で、末尾の 1 文字をきちんと読み、その幅を `size` に入れます。

### 3. 条件と比べる

```go:line-numbers=921
		i -= size
		if f(r) == truth {
			return i
		}
```

読んだ文字の幅だけ `i` を戻し、`f` の結果が `truth` に一致したら、その位置を返します。見つからなければ、最後に `-1` を返します。

## ここがすごい

- **ASCII の速い道**: 多くのバイト列は ASCII なので、末尾を 1 バイトずつ見るだけで済みます。
- **必要なときだけ復号する**: 多バイトの文字が現れたときだけ、重い復号を行います。
- **文字の境界を守る**: 復号で幅を得るので、途中のバイトで止まることがありません。

## まとめ

- 末尾の 1 バイトを見て、ASCII なら、そのまま条件と比べる。
- 多バイトの文字は、後ろから復号して幅を得る。
- 条件に一致した位置を返し、なければ `-1` を返す。
