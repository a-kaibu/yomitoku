---
title: "名前付きグループの名前として使える文字だけを通す isValidCaptureName"
description: "正規表現の (?P<name>...) の名前に使ってよいかを確かめる関数。空でなく、英数字とアンダースコアだけからなるかを 1 文字ずつ調べる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/regexp/syntax/parse.go"
lines: [1260, 1270]
function: "isValidCaptureName"
difficulty: 1
tags: [正規表現, パース, 防御的プログラミング]
---

## ひとことで

`isValidCaptureName(name)` は、正規表現の名前付きグループ `(?P<name>...)` の `name` が使えるかを判定します。空の名前はだめで、英字・数字・アンダースコア（`_`）だけからなる名前は使えます。例えば `year_2024` は使えますが、`a-b` や空文字列は使えません。

## コード

```go:line-numbers=1260
func isValidCaptureName(name string) bool {
	if name == "" {
		return false
	}
	for _, c := range name {
		if c != '_' && !isalnum(c) {
			return false
		}
	}
	return true
}
```

## 前提知識

- **名前付きキャプチャ**: 正規表現の一部分に名前を付けて、後から取り出せるようにする書き方です。Go では `(?P<year>\d+)` のように書きます。
- **キャプチャ（捕獲）**: 正規表現が一致した部分文字列を覚えておくことです。
- **`for _, c := range name`**: 文字列を 1 文字（ルーン）ずつ取り出して、`c` に入れる書き方です。`_` は位置を捨てる記号です。
- **`isalnum`**: 英字か数字かを判定する、この パッケージ内の関数です。

## 何をしているか

### 1. 空の名前はだめ

```go:line-numbers=1261
	if name == "" {
		return false
	}
```

名前が空なら、名前を付けた意味がないので、すぐに `false` を返します。`for` ループの前に確かめるので、空のときはループが 1 回も回りません。

### 2. 1 文字ずつ、英数字かアンダースコアかを見る

```go:line-numbers=1264
	for _, c := range name {
		if c != '_' && !isalnum(c) {
			return false
		}
	}
	return true
```

名前を 1 文字ずつ見ます。アンダースコアでもなく、英字・数字でもない文字が 1 つでもあれば、`false` を返します。全部の文字が条件を満たしたら、最後に `true` を返します。

`c != '_' && !isalnum(c)` は、「アンダースコアでなく、かつ英数字でもない」という条件です。`&&` の順番で、どちらかが満たされれば通すように読めます。

## ここがすごい

- **早く落とす**: 最初の不正な文字が見つかれば、残りを見ずに終わります。
- **Unicode 全体を許さない**: `isalnum` は、ASCII の英数字だけを対象にしています。日本語の名前を付けるとエラーになります。正規表現の名前は、こうした簡単な規則に決められています。
- **条件を 1 行で書く**: 「アンダースコアでも英数字でもない」という判定が、1 行の条件式にまとまっています。

## まとめ

- `isValidCaptureName` は、名前付きグループの名前を判定します。
- 空の名前は使えません。
- 英字・数字・アンダースコアだけからなる名前だけを許します。
- 1 文字でも不正なものがあれば、すぐに `false` を返します。
