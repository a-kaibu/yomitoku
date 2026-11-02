---
title: "JSON を読む前に、1 バイトずつ状態機械に通して正しさを確かめる"
description: "encoding/json の checkValid。JSON として正しいかを、1 バイトずつ次の状態へ進む状態機械に通して調べる。値を作る前に、文法の誤りを見つける仕組み。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [33, 45]
function: "checkValid"
difficulty: 2
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`json.Unmarshal` や `json.Valid` は、JSON の文字列を読む前に、まず文法として正しいかを確かめます。その確認を行うのが `checkValid` です。入力のバイトを 1 つずつ **状態機械（現在の状態と次の文字から、次の状態を決める仕組み）** に渡し、途中で誤りが見つかればその場で返します。

例えば `{"a": 1,}` の末尾のカンマや、閉じていない `"` は、ここでエラーになります。

## コード

```go:line-numbers=33
func checkValid(data []byte, scan *scanner) error {
	scan.reset()
	for _, c := range data {
		scan.bytes++
		if scan.step(scan, c) == scanError {
			return scan.err
		}
	}
	if scan.eof() == scanError {
		return scan.err
	}
	return nil
}
```

## 前提知識

- **JSON**: データを `{"name": "go", "n": 1}` のような文字列で表す形式です。値の種類は、オブジェクト、配列、文字列、数、真偽値、null です。
- **状態機械**: 「今どの状態にいるか」を覚えておき、次の 1 文字で状態を変えていく仕組みです。文字列の形のルールを表すのに向いています。
- **関数の値を入れた変数**: `scan.step` は、今の状態を処理する関数を入れておく変数です。次の状態へ進むときに、この変数を取り替えます。
- **`scan.eof()`**: 入力の終わりを状態機械に知らせる関数です。途中で終わっていないか（例えば `[1,` で止まっていないか）を確かめます。
- **`scanError`**: 文法の誤りが見つかったことを表す値です。

## 何をしているか

### 1. 状態を初期化する

```go:line-numbers=34
	scan.reset()
```

`reset` で、状態機械を最初の状態に戻します。同じ `scanner` を使い回すので、前の入力の状態が残らないように初期化します。

### 2. 1 バイトずつ状態機械に渡す

```go:line-numbers=35
	for _, c := range data {
		scan.bytes++
		if scan.step(scan, c) == scanError {
			return scan.err
		}
	}
```

データを先頭から 1 バイトずつ取り出し、`scan.step` に渡します。`step` は今の状態を処理する関数で、次の状態を `scan.step` に書き込んでから、「続ける」か「エラー」かを返します。エラーが返ったら、そこで止めて、エラーの内容を返します。

`scan.bytes++` は、何バイト目まで読んだかを数えるためのものです。エラーの位置を伝えるときに使われます。

### 3. 最後に入力の終わりを確かめる

```go:line-numbers=41
	if scan.eof() == scanError {
		return scan.err
	}
	return nil
```

全部のバイトを読み終えたら、`eof` で終わり方を確かめます。`{` のまま終わっていれば、ここでエラーになります。どれも問題がなければ `nil`（エラーなし）を返します。

## ここがすごい

- **値を作る前に検査する**: JSON を読みながら値を作ると、途中で失敗したときに半端な値が残ります。先に全体を検査すれば、正しい入力だけが次の処理へ進みます。
- **関数を入れ替えるだけで状態を表す**: 状態ごとに別の関数を用意し、`step` に入れて切り替えます。大きな `switch` で状態を管理するより、それぞれの状態の規則が短く読めます。
- **1 バイトずつ、メモリを増やさない**: 入力全体を解析木にする必要がありません。1 バイトごとに状態を進めるだけなので、大きな JSON でも余分なメモリをあまり使いません。

## まとめ

- `checkValid` は、JSON を読む前に 1 バイトずつ状態機械に通して、文法の誤りを見つけます。
- 状態は `scan.step` という関数で表し、次の 1 バイトごとに差し替えます。
- 誤りが見つかったら、その場でエラーを返します。
- 最後に `eof` で、途中で終わっていないかを確かめます。
