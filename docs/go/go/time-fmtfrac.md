---
title: "末尾の 0 と小数点を、書く前に省く小数部分のフォーマット"
description: "Duration の文字列化で小数部分を書く fmtFrac。下の桁から 1 桁ずつ求めながら、0 でない桁が出るまでは書かずに飛ばすことで、\"1.500s\" ではなく \"1.5s\" を作ります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1034, 1052]
function: "fmtFrac"
difficulty: 2
format: 2
tags: [文字列処理, 日時, 標準ライブラリ]
---

## ひとことで

`fmtFrac` は、`time.Duration` を文字列にするときの **小数部分** を書く関数です。
たとえば 1.5 秒（1500000000 ナノ秒）を `"1.5s"` と表示するとき、`".5"` の部分を担当します。

ポイントは、**末尾の不要な 0 を書かない** ことです。`"1.500000000s"` ではなく `"1.5s"` になり、小数部分がすべて 0 なら小数点も書きません（`"2s"`）。

## コード

::: code-group

```go:line-numbers=1034 [日本語訳]
func fmtFrac(buf []byte, v uint64, prec int) (nw int, nv uint64) {
	// 末尾のゼロを、小数点も含めて省く。
	w := len(buf)
	print := false
	for i := 0; i < prec; i++ {
		digit := v % 10
		print = print || digit != 0
		if print {
			w--
			buf[w] = byte(digit) + '0'
		}
		v /= 10
	}
	if print {
		w--
		buf[w] = '.'
	}
	return w, v
}
```

```go:line-numbers=1034 [原文]
func fmtFrac(buf []byte, v uint64, prec int) (nw int, nv uint64) {
	// Omit trailing zeros up to and including decimal point.
	w := len(buf)
	print := false
	for i := 0; i < prec; i++ {
		digit := v % 10
		print = print || digit != 0
		if print {
			w--
			buf[w] = byte(digit) + '0'
		}
		v /= 10
	}
	if print {
		w--
		buf[w] = '.'
	}
	return w, v
}
```

:::

## 前提知識

- **名前付き戻り値 `(nw int, nv uint64)`**: 戻り値に名前を付けています。ここでは最後に `return w, v` と値を指定して返しています。
- **右から書く**: バッファ `buf` の末尾から前へ向かって書き込みます。`w` は「次に書く位置の 1 つ後ろ」で、書くたびに 1 減らします。
- **`v % 10`、`v /= 10`**: 10 で割った余りがいちばん下の桁、10 で割ると次の桁が下に来ます。
- **`print = print || digit != 0`**: `||` は「または」です。一度 `true` になった `print` は、その後ずっと `true` のままです。
- **`byte(digit) + '0'`**: 数字 0〜9 を文字 `'0'`〜`'9'` に変えます。

## 何をしているか

1.5 秒を秒単位で書く場合、`v = 1500000000`（ナノ秒）、`prec = 9`（小数点以下 9 桁）です。

### 1. 下の桁から 9 桁ぶん見る

```go:line-numbers=1038
	for i := 0; i < prec; i++ {
		digit := v % 10
		print = print || digit != 0
		if print {
			w--
			buf[w] = byte(digit) + '0'
		}
		v /= 10
	}
```

下の桁から順に、`0, 0, 0, 0, 0, 0, 0, 0, 5` と求まります。

- 最初の 8 桁は 0 なので、`print` は `false` のまま。何も書きません。
- 9 桁目で `5` が出て、`print` が `true` になります。`'5'` を書きます。

9 回の割り算の後、`v = 1`（整数部分）が残ります。

### 2. 小数点を書く

```go:line-numbers=1047
	if print {
		w--
		buf[w] = '.'
	}
```

何か 1 桁でも書いていれば（`print` が `true`）、その前に `'.'` を書きます。

### 3. 位置と残りの値を返す

```go:line-numbers=1051
	return w, v
```

書き始めた位置と、整数部分 `v = 1` を返します。呼び出し元は、この後ろに `"s"`、前に整数部分 `"1"` を書いて `"1.5s"` を完成させます。

### 小数部分がすべて 0 の場合

2 秒なら 9 桁すべて 0 なので、何も書かず、小数点も書きません。結果は `"2s"` になります。

## ここがすごい

- **書いてから消すのではなく、最初から書かない**: 末尾の 0 を後から削ると、文字列の操作が増えます。下の桁から求めるので「0 でない桁が出るまで」がちょうど末尾の 0 にあたり、そこを飛ばすだけで済みます。
- **1 つのフラグで 2 つの判断**: `print` は「この桁を書くか」と「小数点を書くか」の両方の判断に使われています。
- **割り算と桁の取り出しを同時に**: 小数部分を書く過程で、整数部分も `v` に残ります。呼び出し側はそれをそのまま使えるので、計算に無駄がありません。

## まとめ

- 下の桁から求める処理では、末尾の 0 を「書かずに飛ばす」だけで省ける。
- 一度 `true` になったら変わらないフラグは、`print = print || 条件` で書ける。
- 関数が計算の副産物（整数部分）も返すと、呼び出し側の計算を減らせる。
