---
title: "JSON の \\uXXXX を 16 進数の 4 桁として読む getu4"
description: "JSON の文字列に出てくる \\u と 4 桁の 16 進数を、1 文字の rune に変換する encoding/json の getu4。途中に 16 進数でない文字があれば -1 を返して失敗を伝える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/decode.go"
lines: [1171, 1190]
function: "getu4"
difficulty: 2
tags: [パース, Unicode, 文字列処理]
---

## ひとことで

`getu4(s)` は、`é` のような JSON のエスケープを読んで、そこに書かれた 16 進数の値を返します。例えば `é` なら `é` の文字コード 233 を返します。先頭が `\u` でなかったり、4 桁のどこかが 16 進数の文字でなかったりした場合は、`-1` を返して失敗を伝えます。

JSON は、Unicode の文字を `\uXXXX` の形で書けます。文字列を読むときに、この 6 バイトを 1 文字に直すのが、この関数の役目です。

## コード

```go:line-numbers=1171
func getu4(s []byte) rune {
	if len(s) < 6 || s[0] != '\\' || s[1] != 'u' {
		return -1
	}
	var r rune
	for _, c := range s[2:6] {
		switch {
		case '0' <= c && c <= '9':
			c = c - '0'
		case 'a' <= c && c <= 'f':
			c = c - 'a' + 10
		case 'A' <= c && c <= 'F':
			c = c - 'A' + 10
		default:
			return -1
		}
		r = r*16 + rune(c)
	}
	return r
}
```

## 前提知識

- **`\u` エスケープ**: JSON では、`\u` の後ろに 16 進数 4 桁を書いて、1 文字を表します。`あ` は「あ」です。
- **16 進数**: 0〜9 と a〜f（大文字 A〜F も可）を使う数の表し方です。`f` は 15、`10` は 16 です。
- **`rune`**: 1 文字の Unicode の値を表す Go の型です。内部は 32 ビットの整数です。
- **`-1` を失敗の印にする**: 正しい rune は負の値になりえないので、`-1` は「読めなかった」の意味として使えます。

## 何をしているか

### 1. 先頭が \u かを確かめる

```go:line-numbers=1172
	if len(s) < 6 || s[0] != '\\' || s[1] != 'u' {
		return -1
	}
```

`\uXXXX` は 6 バイトです。6 バイトに満たない、または先頭が `\u` でないなら、読めないので `-1` を返します。

### 2. 4 桁の 16 進数を 1 桁ずつ読む

```go:line-numbers=1175
	var r rune
	for _, c := range s[2:6] {
		switch {
		case '0' <= c && c <= '9':
			c = c - '0'
		case 'a' <= c && c <= 'f':
			c = c - 'a' + 10
		case 'A' <= c && c <= 'F':
			c = c - 'A' + 10
		default:
			return -1
		}
```

`s[2:6]` の 4 バイトを 1 つずつ見ます。数字なら `'0'` を引き、小文字の a〜f なら `'a'` を引いて 10 を足し、大文字も同じように処理します。どれにも当てはまらなければ、16 進数ではないので `-1` です。

### 3. 桁を積み上げる

```go:line-numbers=1187
		r = r*16 + rune(c)
```

今までの値を 16 倍して、今の桁を足します。これで、4 桁の 16 進数が 1 つの整数になります。

## ここがすごい

- **変換と検査を 1 つの switch で**: 数字、小文字、大文字の 3 通りを、1 つの `switch` で処理しています。16 進数でない文字は、同じ場所で弾かれます。
- **表を使わない**: `0`〜`f` の表を作らず、文字コードの差を引くだけで値を求めます。短くて、速く動きます。
- **`-1` で失敗を知らせる**: エラーの型を作らずに、負の値で失敗を伝えます。呼び出し側も、`if r < 0` だけで判定できます。

## まとめ

- `getu4` は、`\uXXXX` の 6 バイトを 1 つの rune に変換します。
- 先頭が `\u` でなければ、読めないものとして `-1` を返します。
- 4 桁の 16 進数を、文字コードの差で 1 桁ずつ数値にします。
- 16 進数でない文字が 1 つでもあれば、`-1` を返します。
