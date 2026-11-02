---
title: "秒の小数部を書式どおりに書き出す appendNano。末尾の 0 を削るかを選ぶ"
description: "time パッケージの appendNano。ナノ秒の値を、書式が指定した桁数だけ小数として書き出す。末尾の 0 を削る指定があれば、0 だけになった小数部は区切り記号ごと取り除く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [512, 533]
function: "appendNano"
difficulty: 3
tags: [日時, 文字列処理, 数値計算]
---

## ひとことで

`appendNano(b, nanosec, std)` は、ナノ秒の値を、小数点の後ろの数字としてバイト列 `b` に追加します。例えば `123456789` ナノ秒を、書式が 3 桁と指定すれば `.123` と書きます。

末尾の 0 を削る指定がある場合は、`.500` を `.5` にし、すべて 0 なら小数点ごと消します。時刻の表示を、書式どおりに整える処理です。

## コード

```go:line-numbers=512
func appendNano(b []byte, nanosec int, std int) []byte {
	trim := std&stdMask == stdFracSecond9
	n := digitsLen(std)
	if trim && (n == 0 || nanosec == 0) {
		return b
	}
	dot := separator(std)
	b = append(b, dot)
	b = appendInt(b, nanosec, 9)
	if n < 9 {
		b = b[:len(b)-9+n]
	}
	if trim {
		for len(b) > 0 && b[len(b)-1] == '0' {
			b = b[:len(b)-1]
		}
		if len(b) > 0 && b[len(b)-1] == dot {
			b = b[:len(b)-1]
		}
	}
	return b
}
```

## 前提知識

- **ナノ秒**: 1 秒の 10 億分の 1 の単位です。時刻の最も細かい部分を表します。
- **桁数（`digitsLen`）**: 小数を何桁書くかを表す値です。書式の指定から求めます。
- **`appendInt`**: 整数を、指定した桁数で、必要なら前に 0 を付けて書き出す内部の関数です。ここでは 9 桁で書きます。
- **末尾の 0**: 小数の一番後ろにある `0` です。値を変えずに削れる場合があります。

## 何をしているか

### 1. 9 桁で書き出してから切り詰める

```go:line-numbers=520
	b = appendInt(b, nanosec, 9)
	if n < 9 {
		b = b[:len(b)-9+n]
	}
```

まず、ナノ秒を必ず 9 桁で書き出します。書式が 9 桁より少ない桁数を求めていれば、後ろを切り落として、指定の桁数に揃えます。切り捨てで、小数の最後の桁が決まります。

### 2. 末尾の 0 を削る

```go:line-numbers=524
	if trim {
		for len(b) > 0 && b[len(b)-1] == '0' {
			b = b[:len(b)-1]
		}
```

削る指定があれば、末尾が 0 である間、1 文字ずつ取り除きます。`.500` は `.5` になります。

### 3. 小数点だけが残ったら消す

```go:line-numbers=528
		if len(b) > 0 && b[len(b)-1] == dot {
			b = b[:len(b)-1]
		}
```

0 をすべて削ったあと、末尾が小数点だけになっていれば、小数点も取り除きます。ナノ秒が 0 なら、小数部そのものが消えます。

## ここがすごい

- **書式の桁数を後から合わせる**: 常に 9 桁で作ってから、必要な桁だけを残します。桁を揃える処理が、短く一か所にまとまっています。
- **0 の扱いが二段階**: 末尾の 0 を削り、それから小数点を削るという順番で、表示の自然さを保ちます。
- **早い段階で戻る**: 削る指定があり、かつ値が 0 なら、最初に `return` します。無駄な処理を省いています。

## まとめ

- `appendNano` は、ナノ秒を書式の桁数の小数として書き出します。
- 9 桁で作ってから、指定の桁数に切り詰めます。
- 末尾の 0 を削る指定があれば、0 だけになった小数部は小数点ごと取り除きます。
