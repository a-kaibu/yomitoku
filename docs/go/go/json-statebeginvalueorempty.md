---
title: "JSON の配列の先頭を読む状態。空の配列の閉じ括弧を見分ける"
description: "encoding/json のスキャナの stateBeginValueOrEmpty。配列の開き括弧の直後にいるときの処理。空白は読み飛ばし、閉じ括弧 ] なら空の配列として終わらせ、それ以外は値の始まりとして扱う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/scanner.go"
lines: [206, 214]
function: "stateBeginValueOrEmpty"
difficulty: 2
tags: [パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`stateBeginValueOrEmpty(s, c)` は、JSON の配列の開き括弧 `[` の直後にいるときに、次の文字 `c` を見て次の状態を決めます。配列の中身が空なら、閉じ括弧 `]` が来ることがあるからです。

例えば `[]` は空の配列で、`[1]` は値が一つ入った配列です。この関数は、その 2 つを同じ入り口で処理します。

## コード

```go:line-numbers=206
func stateBeginValueOrEmpty(s *scanner, c byte) int {
	if isSpace(c) {
		return scanSkipSpace
	}
	if c == ']' {
		return stateEndValue(s, c)
	}
	return stateBeginValue(s, c)
}
```

## 前提知識

- **状態機械**: 今いる状態と、次の文字によって、次の状態が決まる仕組みです。`encoding/json` は、この仕組みで JSON の形を確かめます。
- **空白**: スペース、タブ、改行などです。値の意味には関係がないので、読み飛ばします。
- **`scanSkipSpace`**: 空白を読み飛ばしていることを表す値です。状態は変わりません。
- **`stateBeginValue`**: 値の始まりとして、次の文字を処理する関数です。数字、文字列、オブジェクトなどの形を判定します。

## 何をしているか

### 1. 空白は読み飛ばす

```go:line-numbers=207
	if isSpace(c) {
		return scanSkipSpace
	}
```

開き括弧の後に空白があれば、無視して次の文字を待ちます。状態は変えません。

### 2. 閉じ括弧なら空の配列として終わらせる

```go:line-numbers=210
	if c == ']' {
		return stateEndValue(s, c)
	}
```

閉じ括弧 `]` なら、中身のない配列が終わったことになります。値の終わりを処理する `stateEndValue` に、同じ文字を渡して任せます。

### 3. それ以外は値の始まりとして扱う

```go:line-numbers=213
	return stateBeginValue(s, c)
```

閉じ括弧でも空白でもなければ、配列の最初の値が始まったことになります。`stateBeginValue` で、その値の形を調べます。

## ここがすごい

- **入り口を一つにまとめる**: 空の配列と、要素を持つ配列の両方が、ここから分岐します。二つの場合を別々に書かずに済みます。
- **役割を他の関数に任せる**: この関数は、空白、閉じ括弧、それ以外の 3 つを振り分けるだけです。値の細かい形は、別の関数が担当します。
- **状態を変える処理が分かりやすい**: 関数の戻り値が、次に処理される状態そのものを表すので、流れを追いやすくなっています。

## まとめ

- `stateBeginValueOrEmpty` は、配列の開き括弧の直後の文字を処理します。
- 空白は読み飛ばし、閉じ括弧なら空の配列として終わらせます。
- それ以外は、値の始まりとして次の関数に任せます。
