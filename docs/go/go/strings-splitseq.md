---
title: "分割結果を配列にせず、1 つずつ渡す strings の分割イテレータ"
description: "Go 1.24 で入った strings.SplitSeq の中身。分割結果を配列に全部集めず、yield 関数に 1 つずつ渡すので、途中で止めたときの無駄を減らせる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/iter.go"
lines: [36, 61]
function: "splitSeq"
difficulty: 3
tags: [イテレータ, 文字列処理, 遅延評価]
---

## ひとことで

`strings.SplitSeq(s, ",")` は、区切り文字で分けた断片を **配列にせず、1 つずつ順番に取り出せる** イテレータを返します。`for part := range strings.SplitSeq(s, ",") { ... }` と書けます。

イテレータは、分けた結果がすべて必要ないときに効果があります。最初の数個だけ使えば十分なら、残りの分割は行われません。

## コード

```go:line-numbers=36
func splitSeq(s, sep string, sepSave int) iter.Seq[string] {
	return func(yield func(string) bool) {
		if len(sep) == 0 {
			for len(s) > 0 {
				_, size := utf8.DecodeRuneInString(s)
				if !yield(s[:size]) {
					return
				}
				s = s[size:]
			}
			return
		}
		for {
			i := Index(s, sep)
			if i < 0 {
				break
			}
			frag := s[:i+sepSave]
			if !yield(frag) {
				return
			}
			s = s[i+len(sep):]
		}
		yield(s)
	}
}
```

## 前提知識

- **イテレータ（`iter.Seq`）**: 値を 1 つずつ順番に渡す仕組みです。Go では `func(yield func(T) bool)` という関数の形で表します。
- **`yield` 関数**: イテレータが値を 1 つ渡すために呼ぶ関数です。戻り値が `false` になったら、呼び出し側が途中で止めたという意味なので、処理を終わらせます。
- **`range` での利用**: `for x := range seq { ... }` と書くと、`seq` が `yield` を呼ぶたびに本体が実行されます。`break` すると `yield` が `false` を返します。
- **`sepSave`**: 区切り文字を断片に残すかどうかを表す数です。`SplitAfter` では 1 が渡されます。

## 何をしているか

### 1. 区切り文字が空なら 1 文字ずつ渡す

```go:line-numbers=38
			if len(sep) == 0 {
				for len(s) > 0 {
					_, size := utf8.DecodeRuneInString(s)
					if !yield(s[:size]) {
						return
					}
					s = s[size:]
				}
				return
			}
```

区切り文字が空のときは、UTF-8 の 1 文字ずつに分けます。`utf8.DecodeRuneInString` は、先頭の 1 文字の長さを返します。日本語の文字は 3 バイトなので、`size` も 3 になります。

`yield` の戻り値が `false` なら、呼び出し側が `break` したので、すぐに `return` します。

### 2. 区切り文字で切り出して渡す

```go:line-numbers=53
				frag := s[:i+sepSave]
				if !yield(frag) {
					return
				}
				s = s[i+len(sep):]
```

`Index` で区切りの位置を探し、その前の断片を `yield` で渡します。断片を渡したら、その後ろだけを残して次の探索に進みます。配列に溜めていないので、断片はその場で使われて捨てられます。

### 3. 最後の断片を渡す

```go:line-numbers=59
			yield(s)
```

区切りが見つからなくなったら、残りの文字列全体を最後の断片として渡します。`yield` の結果は、もう使わないので無視しています。

## ここがすごい

- **配列を作らない**: `strings.Split` は、結果の `[]string` を全部作ってから返します。イテレータ版は、必要な分だけ作るので、メモリを節約できます。
- **途中で止められる**: `for ... range` の中で `break` すると、残りの探索は起きません。大きな文字列の先頭だけを見たいときに効きます。
- **同じ探索を共有する**: 内部では `Split` と同じ `Index` を使っています。新しい探索アルゴリズムを作らず、流れの書き方だけを変えています。

## まとめ

- `SplitSeq` は、分割結果を配列ではなく、1 つずつ渡すイテレータです。
- イテレータは `yield` 関数を呼んで値を渡し、`false` が返ったら止まります。
- 区切り文字が空のときは、UTF-8 の 1 文字ずつに分けます。
- 途中で `break` すると、残りの分割を行わないので、大きな入力で効果があります。
