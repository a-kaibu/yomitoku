---
title: "空の要素を飛ばして「/」でつなぎ、最後に Clean で整える path.Join"
description: "path.Join は、いくつかのパスの要素を「/」でつなぎ、Clean で整えます。空の要素は、ほかに何もなければ無視し、そうでなければ区切りを 1 つだけ入れます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/path/path.go"
lines: [155, 173]
function: "Join"
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`path.Join("a", "b", "c")` は `"a/b/c"` を返します。要素のあいだに「/」を入れてつなぎます。

要素が空の文字列のときや、連続する「/」が生まれるときも、結果が整うように作られています。`path.Join("a", "", "b")` は `"a/b"` です。

## コード

```go:line-numbers=155
func Join(elem ...string) string {
	size := 0
	for _, e := range elem {
		size += len(e)
	}
	if size == 0 {
		return ""
	}
	buf := make([]byte, 0, size+len(elem)-1)
	for _, e := range elem {
		if len(buf) > 0 || e != "" {
			if len(buf) > 0 {
				buf = append(buf, '/')
			}
			buf = append(buf, e...)
		}
	}
	return Clean(string(buf))
}
```

## 前提知識

- **可変長引数 `elem ...string`**: 呼び出し側が文字列をいくつでも渡せます。関数の中では `[]string` として扱われます。
- **`make([]byte, 0, size)`**: 長さ 0、容量 `size` のバイトのスライスを作ります。最終的な長さが分かっているので、途中で確保し直さずに済みます。
- **`Clean`**: 「.」や「..」、連続する「/」を整理する関数です。`Join` の最後に呼ばれます。
- **`string(buf)`**: バイトのスライスを文字列に変換します。ここでは、変換時に 1 回コピーされます。

## 何をしているか

`elem = ["a", "", "b//"]` で追います。

### 1. 必要な容量を数える

```go:line-numbers=156
	size := 0
	for _, e := range elem {
		size += len(e)
	}
	if size == 0 {
		return ""
	}
```

要素の長さを合計します。`"a" + "" + "b//"` で 5 です。全部が空なら、そのまま空の文字列を返します。

### 2. 空でない要素の前に「/」を入れる

```go:line-numbers=163
	buf := make([]byte, 0, size+len(elem)-1)
	for _, e := range elem {
		if len(buf) > 0 || e != "" {
			if len(buf) > 0 {
				buf = append(buf, '/')
			}
			buf = append(buf, e...)
		}
	}
```

先頭の空の要素は飛ばします。`buf` に何か書かれていれば、次の要素の前に「/」を入れます。`"a"` を書いた後、空の `""` が来ると「/」を書いて、そのまま空を書きます。最後の `"b//"` の前にも「/」が入るので、`buf = "a//b//"` になります。

### 3. Clean で整える

```go:line-numbers=172
	return Clean(string(buf))
```

連続する「/」と末尾の「/」を整理して、`"a/b"` を返します。

## ここがすごい

- **容量を先に決める**: 要素の長さと区切りの数から、必要なバイト数を先に計算しています。`append` の途中で確保し直すことが、ほとんどありません。
- **整える仕事を Clean に任せる**: 区切りの重なりや、余分な「/」の処理を `Clean` に任せています。`Join` の中では、つなぐことだけに集中できます。
- **空の要素の扱いを 1 か所に**: 先頭の空の要素と、途中の空の要素を、同じ条件式で扱っています。規則が短く、読んで分かります。

## まとめ

- パスをつなぐ前に、必要な容量を合計しておくと確保が 1 回で済む。
- 空の要素の扱いは、「先頭か途中か」を条件に含めて一つの規則で書く。
- 結果の整形は、専用の関数（ここでは `Clean`）に任せると分かりやすい。
