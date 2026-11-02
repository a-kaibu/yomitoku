---
title: "改行の位置で 1 行ずつ渡す strings.Lines。改行は各行に残す"
description: "文字列を行ごとに取り出す strings.Lines。区切りの改行を各行の末尾に残したまま、yield で 1 行ずつ渡す。最後の行に改行がなくても正しく動く。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2024 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/strings/iter.go"
lines: [18, 32]
function: "Lines"
difficulty: 2
tags: [文字列処理, イテレータ]
---

## ひとことで

`strings.Lines(s)` は、文字列を改行で区切って、1 行ずつ順番に渡すイテレータです。`strings.Split(s, "\n")` と違い、**改行の文字を各行の末尾に残します**。例えば `"a\nb\n"` からは `"a\n"` と `"b\n"` が出てきます。

ファイルの内容を 1 行ずつ処理するときに、行末の改行を残しておけば、そのまま出力に書き戻せます。

## コード

```go:line-numbers=18
func Lines(s string) iter.Seq[string] {
	return func(yield func(string) bool) {
		for len(s) > 0 {
			var line string
			if i := IndexByte(s, '\n'); i >= 0 {
				line, s = s[:i+1], s[i+1:]
			} else {
				line, s = s, ""
			}
			if !yield(line) {
				return
			}
		}
	}
}
```

## 前提知識

- **改行文字**: 行の終わりを表す文字です。Go の文字列では `'\n'` と書きます。
- **イテレータ**: 値を 1 つずつ `yield` で渡す仕組みです。`for line := range strings.Lines(s)` のように使います。
- **スライス式 `s[:i+1]`**: 先頭から `i+1` バイト目まで、つまり改行を含めた部分を切り出します。
- **`IndexByte`**: 文字列の中から 1 バイトの位置を探す関数です。改行の位置を探すのに使われます。

## 何をしているか

### 1. 改行を探して、行と残りに分ける

```go:line-numbers=22
				if i := IndexByte(s, '\n'); i >= 0 {
					line, s = s[:i+1], s[i+1:]
```

`IndexByte` で最初の改行を探します。見つかったら、`s[:i+1]` で改行を含めた行を作ります。残りは `s[i+1:]` として、次のループで使います。

ここで `i+1` としているのがポイントです。`i` は改行の位置なので、`i+1` まで切ると改行が行の末尾に残ります。

### 2. 最後の行は改行なしで渡す

```go:line-numbers=25
				line, s = s, ""
```

改行が見つからなければ、残りの文字列全体が最後の行です。その行には改行がないので、そのまま渡して `s` を空にします。`for len(s) > 0` のループは、そこで終わります。

### 3. yield が false なら止める

```go:line-numbers=27
				if !yield(line) {
					return
				}
```

呼び出し側が `break` したら、`yield` は `false` を返します。その場合は、残りの行を探さずに `return` します。

## ここがすごい

- **改行を残す設計**: 行末の改行を取り除かないので、行を連結すると元の文字列がそのまま復元できます。`Split` で分けてから `"\n"` を足し直す手間がありません。
- **末尾の改行で余分な行を出さない**: `"a\nb\n"` の末尾の `\n` の後には、空の行は作られません。`for len(s) > 0` で判定しているためです。
- **同じ道具の組み合わせ**: 改行の探索は `IndexByte`、つまり 1 バイトの探索を使っています。速い専用関数を再利用しています。

## まとめ

- `Lines` は、改行で区切った各行を、改行を含めたまま 1 つずつ渡します。
- 改行の位置 `i` を使い、`s[:i+1]` で改行を行に残します。
- 最後の行に改行がなければ、そのまま最後の行として渡します。
- `yield` が `false` を返したら、すぐに止まります。
