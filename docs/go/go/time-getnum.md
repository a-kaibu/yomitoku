---
title: "1 桁か 2 桁の数字を読む time.getnum"
description: "time.getnum は、文字列の先頭から 1 桁か 2 桁の数字を読み、残りの文字列とともに返します。fixed が true のときは必ず 2 桁であることを求めます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/format.go"
lines: [926, 937]
function: "getnum"
difficulty: 2
format: 2
tags: [パース, 日時, 防御的プログラミング]
---

## ひとことで

`time.Parse` は、`2006-01-02` のような書式を読むときに、月や日の数字を取り出します。その取り出しを担当するのが `getnum` です。`"05"` のような 2 桁の数字を、1 回の呼び出しで読みます。

## コード

```go:line-numbers=926
func getnum(s string, fixed bool) (int, string, error) {
	if !isDigit(s, 0) {
		return 0, s, errBad
	}
	if !isDigit(s, 1) {
		if fixed {
			return 0, s, errBad
		}
		return int(s[0] - '0'), s[1:], nil
	}
	return int(s[0]-'0')*10 + int(s[1]-'0'), s[2:], nil
}
```

## 前提知識

- **`isDigit`**: 文字列の指定した位置が、数字かを判定する関数です。
- **`s[0] - '0'`**: 数字の文字を、0 から 9 の数値に直す計算です。`'7' - '0'` は 7 です。
- **`fixed` の意味**: 書式で 2 桁と決まっているなら、1 桁の数字は誤りです。
- **戻り値の 3 つ**: 読んだ数、残りの文字列、エラーの組です。

## 何をしているか

### 1. 先頭が数字でなければ失敗

```go:line-numbers=927
	if !isDigit(s, 0) {
		return 0, s, errBad
	}
```

先頭の 1 文字が数字でないときは、読めません。`errBad` を返して、元の文字列はそのまま残します。

### 2. 2 桁目が無ければ 1 桁として扱う

```go:line-numbers=930
	if !isDigit(s, 1) {
		if fixed {
			return 0, s, errBad
		}
		return int(s[0] - '0'), s[1:], nil
```

2 桁目が数字でないときは、1 桁の数です。ただし `fixed` が `true` なら、2 桁でなければならないので、失敗にします。

### 3. 2 桁の数を組み立てる

```go:line-numbers=936
	return int(s[0]-'0')*10 + int(s[1]-'0'), s[2:], nil
```

先頭の数字に 10 を掛け、2 桁目を足して 2 桁の数にします。読んだ 2 文字ぶんを飛ばした残りの文字列も、一緒に返します。

## ここがすごい

- **1 桁か 2 桁かを先読みする**: 次の文字を見てから読み方を決めるので、`"5"` と `"05"` を書式に合わせて区別できます。
- **書式で誤りを決める**: `fixed` のときだけ厳しく判定するので、同じ関数で両方の書式を扱えます。
- **文字列を減らして返す**: 残りを返すことで、呼び出し側が次の部分をそのまま続けて読めます。

## まとめ

- 1 桁か 2 桁かを、次の文字の有無で判定する。
- `fixed` の書式では、2 桁でなければ失敗にする。
- 読んだ数と残りの文字列を返し、続きの読み取りを助ける。
