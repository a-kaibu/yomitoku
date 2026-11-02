---
title: "%q の引用符を付ける fmt の fmtQ。バッククォートとエスケープを使い分ける"
description: "fmt の %q の処理 fmtQ。# 付きならバッククォートで囲み、+ 付きなら ASCII だけで表す。どちらでもなければ strconv の Quote で、制御文字を \\n などに書き換える。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/format.go"
lines: [447, 459]
function: "fmtQ"
difficulty: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`fmt.Sprintf("%q", "a\nb")` は `"a\nb"` という文字列（引用符つき、改行が `\n` に書き換えられたもの）を返します。`%q` は、Go の文字列リテラルとして読める形で、値を表示するための書式です。この処理を行うのが `fmtQ` です。

## コード

```go:line-numbers=447
func (f *fmt) fmtQ(s string) {
	s = f.truncateString(s)
	if f.sharp && strconv.CanBackquote(s) {
		f.padString("`" + s + "`")
		return
	}
	buf := f.intbuf[:0]
	if f.plus {
		f.pad(strconv.AppendQuoteToASCII(buf, s))
	} else {
		f.pad(strconv.AppendQuote(buf, s))
	}
}
```

## 前提知識

- **`%q`**: 文字列を Go の文字列リテラルの形で表す書式です。ダブルクォートで囲み、特殊な文字はエスケープします。
- **フラグ `sharp` と `plus`**: `%#q` の `#` が `sharp`、`%+q` の `+` が `plus` です。`#` はバッククォートで囲む形、`+` は ASCII だけで表す形を選びます。
- **バッククォートの文字列**: `` `text` `` と書く生の文字列です。中のエスケープは効かず、改行もそのまま書けます。
- **`strconv.Quote`**: 文字列をダブルクォートで囲み、表示できない文字をエスケープする関数です。
- **`f.pad`**: 幅の指定に合わせて、空白で埋めて出力する関数です。

## 何をしているか

### 1. 精度で切り詰めてから引用する

```go:line-numbers=448
	s = f.truncateString(s)
```

`%.2q` のように精度がある場合は、まず文字の数で切り詰めます。その後で引用符を付けるので、切り取られた文字列が正しく引用されます。

### 2. # 付きならバッククォートで囲む

```go:line-numbers=449
	if f.sharp && strconv.CanBackquote(s) {
		f.padString("`" + s + "`")
		return
	}
```

`%#q` の場合、`CanBackquote` で、その文字列がバッククォートに入るかを確かめます。改行やバッククォート自身を含まなければ、`` `text` `` の形で、そのまま書きます。エスケープが要らないので読みやすい形です。

### 3. 通常の引用は strconv に任せる

```go:line-numbers=453
	buf := f.intbuf[:0]
	if f.plus {
		f.pad(strconv.AppendQuoteToASCII(buf, s))
	} else {
		f.pad(strconv.AppendQuote(buf, s))
	}
```

`f.intbuf` は、もともと数字用に確保してある小さなバッファです。その先頭を使って、引用文字列を組み立てます。`+` 付きなら ASCII だけに変換し、それ以外は `AppendQuote` で表示できない文字をエスケープします。

## ここがすごい

- **バッファを使い回す**: 引用の文字列を作るために、新しいバッファを確保しません。`intbuf` を使い回すので、ほとんどの場合、メモリを追加で使いません。
- **フラグで形を選べる**: 同じ `%q` でも、`#` でバッククォート、`+` で ASCII と、読み手の目的に応じた形を選べます。
- **切り詰めと引用の順番**: 先に切ってから引用するので、エスケープの途中で切れて、文字列が壊れることがありません。

## まとめ

- `%q` は、Go の文字列リテラルとして読める形で、値を表示します。
- `#` 付きならバッククォートで囲み、`+` 付きなら ASCII だけで表します。
- それ以外は `strconv.AppendQuote` で、表示できない文字をエスケープします。
- 精度の切り詰めは、引用より前に行います。
