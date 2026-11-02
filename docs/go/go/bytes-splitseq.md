---
title: "バイトスライスを分けるとき、容量を切り詰めて安全にする bytes.splitSeq"
description: "[]byte を区切り文字で分けるイテレータの内部。断片のスライスを 3 つ目の添字で切り詰めて、受け取った側が append しても元のデータを書き換えないようにしている。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bytes/iter.go"
lines: [36, 61]
function: "splitSeq"
difficulty: 3
tags: [文字列処理, イテレータ, メモリ管理]
---

## ひとことで

`bytes.SplitSeq(b, sep)` は、バイトのスライス `b` を区切り文字で分けて、断片を 1 つずつ渡すイテレータです。中身は `strings.SplitSeq` とほぼ同じですが、ひとつ大事な違いがあります。**渡す断片のスライスの容量（cap）を、長さに合わせて切り詰めています。**

## コード

```go:line-numbers=36
func splitSeq(s, sep []byte, sepSave int) iter.Seq[[]byte] {
	return func(yield func([]byte) bool) {
		if len(sep) == 0 {
			for len(s) > 0 {
				_, size := utf8.DecodeRune(s)
				if !yield(s[:size:size]) {
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
			if !yield(frag[:len(frag):len(frag)]) {
				return
			}
			s = s[i+len(sep):]
		}
		yield(s[:len(s):len(s)])
	}
}
```

## 前提知識

- **スライスの長さと容量**: スライスには `len`（今使っている長さ）と `cap`（後ろに伸ばせる上限）の 2 つがあります。`cap` は、同じ配列の後ろの部分まで含みます。
- **3 つ目の添字（フルスライス式）**: `s[low:high:max]` の形で、結果の容量を `max - low` に制限できます。`s[:n:n]` は、`cap` を `n` にそろえるという意味です。
- **`append` の振る舞い**: `cap` に余裕があると、`append` は元の配列の後ろを書き換えます。これが、別の断片を壊す原因になります。
- **`utf8.DecodeRune`**: `[]byte` 版の、先頭の 1 文字を復号する関数です。

## 何をしているか

### 1. 空の区切りでは 1 文字ずつ、容量も切り詰める

```go:line-numbers=40
				_, size := utf8.DecodeRune(s)
				if !yield(s[:size:size]) {
```

1 文字ずつ渡すときも、断片は `s[:size:size]` で作ります。3 つ目の添字で容量を `size` に合わせているので、この断片に `append` しても、後ろの文字（まだ渡していない文字）は壊れません。

### 2. 区切り文字で切り出すときも同じ処理

```go:line-numbers=53
				frag := s[:i+sepSave]
				if !yield(frag[:len(frag):len(frag)]) {
```

区切りで切った断片 `frag` も、`frag[:len(frag):len(frag)]` で容量を長さに合わせてから渡します。元の `s` は、断片の後ろに続きのデータを持っています。もし容量が余っていると、受け取った側の `append` が、その続きのデータを書き換えてしまいます。

### 3. 最後の断片も同じように

```go:line-numbers=59
			yield(s[:len(s):len(s)])
```

最後に残った部分も、同じく容量を切り詰めて渡します。

## ここがすごい

- **スライスは「窓」で、元の配列を共有する**: `[]byte` の断片は、元の配列を指しているだけです。コピーをしていないので速いのですが、容量が余っていると、思わぬ場所を書き換える危険があります。
- **3 つ目の添字で「窓」を狭める**: `s[:n:n]` と書けば、コピーせずに容量だけを切り詰められます。速さを保ったまま、安全性を確保しています。
- **文字列版とほぼ同じ構造**: `strings.SplitSeq` と並べて読むと、違いは容量の切り詰めだけです。`[]byte` は書き換えられるので、この 1 行が必要になります。

## まとめ

- `bytes.SplitSeq` は、断片を 1 つずつ `yield` で渡すイテレータです。
- 断片は元の配列を共有するので、そのままでは後ろの `append` に巻き込まれる危険があります。
- `s[low:high:max]` の 3 つ目の添字で、容量を長さに合わせると、この危険を防げます。
- 文字列版と違い、`[]byte` は書き換え可能なので、この注意が必要です。
