---
title: "ASCII の文字を集合にまとめる strings.makeASCIISet"
description: "strings.makeASCIISet は、切り取る文字の並びを、ASCII の集合を表すビットの配列にまとめます。TrimLeft などが、1 文字ずつ速く判定できるように準備します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/strings/strings.go"
lines: [952, 961]
function: "makeASCIISet"
difficulty: 2
format: 2
tags: [文字列処理, データ構造, 最適化, 標準ライブラリ]
---

## ひとことで

`strings.Trim(s, "abc")` のような切り取りでは、同じ判定を何度も行います。`makeASCIISet("abc")` は、判定を速くするために、文字の並びを「どの文字が含まれるか」の集合に変えます。

## コード

```go:line-numbers=952
func makeASCIISet(chars string) (as asciiSet, ok bool) {
	for i := 0; i < len(chars); i++ {
		c := chars[i]
		if c >= utf8.RuneSelf {
			return as, false
		}
		as[c] = true
	}
	return as, true
}
```

## 前提知識

- **`asciiSet`**: ASCII の文字が含まれるかを、ビットの配列で覚える型です。文字の番号に対応するビットを立てます。
- **`utf8.RuneSelf`**: ASCII の上限です。これ以上のバイトが混ざると、集合では表せません。
- **`ok` の戻り値**: 集合にできたかを返します。`false` のときは、呼び出し側が別の方法を使います。
- **文字列のバイト**: `chars[i]` は、`i` 番目のバイトです。ASCII の文字は、1 バイトに収まります。

## 何をしているか

### 1. 文字を 1 つずつ見る

```go:line-numbers=953
	for i := 0; i < len(chars); i++ {
		c := chars[i]
```

`chars` を先頭から、1 バイトずつ取り出します。ASCII の文字は、それぞれ 1 バイトです。

### 2. ASCII 以外が混ざっていたら諦める

```go:line-numbers=955
		if c >= utf8.RuneSelf {
			return as, false
		}
```

バイトの値が `utf8.RuneSelf` 以上なら、ASCII ではありません。集合では表せないので、`false` を返します。呼び出し側は、通常の比較のやり方に切り替えます。

### 3. 集合に入れる

```go:line-numbers=958
		as[c] = true
```

`as[c] = true` で、その文字に対応するビットを立てます。同じ文字が何度も現れても、ビットは 1 つのままです。

### 4. 結果を返す

```go:line-numbers=960
	return as, true
```

すべての文字が ASCII なら、集合と `true` を返します。

## ここがすごい

- **判定が 1 回のビット参照になる**: 後の切り取り処理は、文字ごとに並びを探す代わりに、集合のビットを 1 つ見るだけで済みます。
- **対応できないものを正直に返す**: 非 ASCII の文字が混ざると `false` を返し、速い方法を無理に使いません。
- **重複を気にしない**: 同じ文字が何度並んでも、結果は変わりません。集合は、含まれるかどうかだけを表すからです。

## まとめ

- 切り取る文字の並びを、ASCII の集合に変える。
- 非 ASCII が混ざっているときは `false` を返し、別の方法に任せる。
- 集合にすると、後の判定が 1 回のビット参照で済む。
