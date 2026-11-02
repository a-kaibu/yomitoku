---
title: "URL のポート番号が正しい形か調べる validOptionalPort。空か、コロンと数字だけか"
description: "net/url の validOptionalPort。ポート番号の部分が、空か、先頭のコロンの後に 0 から 9 の数字だけが続いているかを調べる。文字を 1 つずつ見て、一つでも外れたら false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [772, 785]
function: "validOptionalPort"
difficulty: 1
tags: [文字列処理, パース, 防御的プログラミング]
---

## ひとことで

`validOptionalPort(port)` は、URL のポート番号の部分が正しい形かを調べます。正しければ `true`、そうでなければ `false` を返します。

ポートは、省略できる部分です。省略されていれば空の文字列になります。書かれているなら、先頭にコロンがあり、その後に数字だけが続きます。例えば `:8080` は正しく、`:80a` は誤りです。

## コード

```go:line-numbers=772
func validOptionalPort(port string) bool {
	if port == "" {
		return true
	}
	if port[0] != ':' {
		return false
	}
	for _, b := range port[1:] {
		if b < '0' || b > '9' {
			return false
		}
	}
	return true
}
```

## 前提知識

- **ポート番号**: サーバーの入口を表す番号です。URL の `http://example.com:8080` の `:8080` の部分です。
- **省略可能**: ポートがなくても、URL は正しいです。その場合、この部分は空の文字列になります。
- **文字の範囲の比較**: `'0'` から `'9'` の文字は、番号順に並んでいます。その性質を使うと、数字かどうかを範囲で判定できます。
- **`range`**: 文字列を先頭から 1 文字ずつ取り出す書き方です。

## 何をしているか

### 1. 空なら正しい

```go:line-numbers=773
	if port == "" {
		return true
	}
```

ポートが書かれていなければ、問題はありません。`true` を返して、省略を正しいと認めます。

### 2. 先頭はコロンでなければならない

```go:line-numbers=776
	if port[0] != ':' {
		return false
	}
```

ポートが書かれているなら、必ず先頭はコロンです。コロンで始まらなければ、形が違うので `false` を返します。

### 3. 残りが数字だけか確かめる

```go:line-numbers=779
	for _, b := range port[1:] {
		if b < '0' || b > '9' {
			return false
		}
	}
	return true
```

コロンの後ろの文字を、1 つずつ確かめます。0 から 9 の範囲にない文字が一つでもあれば、`false` を返します。すべて数字だったら、最後に `true` を返します。

## ここがすごい

- **早く判断を終える**: 一文字でも外れたら、そこで `false` と決まります。残りを見る必要はありません。
- **範囲で判定する**: 数字の一覧を書かず、文字コードの範囲で判定します。短く書けて、読み間違いも少なくなります。
- **空と誤りを分ける**: 空の場合と、形が違う場合を、最初に別々に判定しています。省略を許す仕様が、コードの流れにはっきり表れています。

## まとめ

- `validOptionalPort` は、ポートが空か、コロンと数字だけの形かを調べます。
- 空なら正しく、書かれているなら先頭がコロンであることを確かめます。
- 残りは 1 文字ずつ、数字の範囲にあるかを見て判定します。
