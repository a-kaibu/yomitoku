---
title: "分割数に上限を付けて、残りを最後の要素にまとめる strings.genSplit"
description: "strings.Split や SplitN の本体 genSplit。分割数の上限を決めて先に配列を確保し、余った部分は最後の 1 要素として残すことで、無駄な確保をなくしている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/strings.go"
lines: [274, 300]
function: "genSplit"
difficulty: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`strings.Split(s, ",")` や `strings.SplitN(s, ",", 2)` は、文字列を区切り文字で分けて `[]string` にして返します。この実際の仕事は、非公開の関数 `genSplit` が引き受けています。

`genSplit` は、分割の回数を `n` で制限し、区切り文字が見つからなくなったら残りをそのまま最後の要素に入れます。例えば `"a,b,c,d"` を `n = 2` で分けると、`["a", "b,c,d"]` になります。

## コード

```go:line-numbers=274
func genSplit(s, sep string, sepSave, n int) []string {
	if n == 0 {
		return nil
	}
	if sep == "" {
		return explode(s, n)
	}
	if n < 0 {
		n = Count(s, sep) + 1
	}

	n = min(n, len(s)+1)
	a := make([]string, n)
	n--
	i := 0
	for i < n {
		m := Index(s, sep)
		if m < 0 {
			break
		}
		a[i] = s[:m+sepSave]
		s = s[m+len(sep):]
		i++
	}
	a[i] = s
	return a[:i+1]
}
```

## 前提知識

- **スライス**: 配列の一部を指す可変長の並びです。`make([]string, n)` は長さ `n` の文字列の配列を確保します。
- **`sepSave`**: 区切り文字を結果に残すかどうかを表す数です。`SplitAfter` では 1 を渡して、区切り文字を前の要素に残します。
- **`n` の意味**: `n < 0` は「全部分ける」、`n == 0` は「何も返さない」、正の数は「最大 `n` 個の要素まで」という約束です。
- **`explode`**: 区切り文字が空のとき、1 文字（UTF-8 の 1 文字）ずつに分ける関数です。

## 何をしているか

### 1. 特別な指定を先に処理する

```go:line-numbers=275
	if n == 0 {
		return nil
	}
	if sep == "" {
		return explode(s, n)
	}
```

`n == 0` なら何も返しません。区切り文字が空なら、1 文字ずつ分ける `explode` に任せます。ここで早く返すことで、以降の処理は「区切り文字が 1 つ以上ある」場合だけを考えればよくなります。

### 2. 分割数を決めて配列を確保する

```go:line-numbers=281
	if n < 0 {
		n = Count(s, sep) + 1
	}

	n = min(n, len(s)+1)
	a := make([]string, n)
	n--
```

`n < 0` のときは、`Count` で区切り文字の数を数えて「全部分ける」数を決めます。そのあと `min(n, len(s)+1)` で、文字列の長さを超える数の配列を作らないように抑えます。

`n--` は小さなトリックです。最後の 1 要素は「残り全部」用に空けておく必要があるので、ループで使う回数を 1 つ減らしています。

### 3. 区切り文字を探して切り出す

```go:line-numbers=289
	for i < n {
		m := Index(s, sep)
		if m < 0 {
			break
		}
		a[i] = s[:m+sepSave]
		s = s[m+len(sep):]
		i++
	}
```

`Index` で区切り文字の位置を探し、その前までを 1 要素として `a[i]` に入れます。`s` は区切りの後ろだけに縮めます。区切りが見つからなければ `break` で抜けます。

### 4. 残りを最後の要素にする

```go:line-numbers=298
	a[i] = s
	return a[:i+1]
```

ループを抜けたら、残っている文字列全体を `a[i]` に入れます。区切りが足りなかった場合も、この 1 行で「残り」が正しく入ります。最後に `a[:i+1]` で、使った分だけのスライスを返します。

## ここがすごい

- **配列を先に 1 回だけ確保する**: 要素を `append` で増やすと、途中で何度もメモリを取り直すことになります。`genSplit` は個数の上限を先に決めて `make` で 1 回だけ確保しています。
- **上限を超えた分は捨てずに残す**: `SplitN` は「最大 n 個」なので、余った文字列を捨てることはできません。残り全部を最後の 1 要素に入れる設計により、結果を失わずに済みます。
- **同じ関数で複数の API を実装する**: `Split`、`SplitN`、`SplitAfter`、`SplitAfterN` は、引数を変えて同じ `genSplit` を呼ぶだけです。コードの重複がほとんどありません。

## まとめ

- `Split` 系の関数は、すべて `genSplit` を呼ぶ薄いラッパーです。
- 分割数の上限を先に決めると、配列の確保が 1 回で済みます。
- 上限に達したら、残りの文字列を最後の要素にまとめます。
- `n--` のように、最後の 1 要素を「残り用」に空けておくと、ループと後処理を分けずに済みます。
