---
title: "fmt.Println の中身。引数を空白で区切り、最後に改行を付ける doPrintln"
description: "fmt.Println の処理の本体 doPrintln。各引数の間に空白を入れ、それぞれを値の形式 %v で書き、最後に改行を付ける。出力先のバッファに直接書き込む。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/print.go"
lines: [1204, 1212]
function: "doPrintln"
difficulty: 1
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`fmt.Println(1, "a", true)` は `1 a true` と表示して、最後に改行します。その処理の本体が `doPrintln` です。引数を 1 つずつ書き、2 つ目以降の前には必ず空白を入れ、最後に改行を 1 つ付けます。

引数の型は問いません。それぞれの値を、既定の書式 `%v` で表示します。

## コード

```go:line-numbers=1204
func (p *pp) doPrintln(a []any) {
	for argNum, arg := range a {
		if argNum > 0 {
			p.buf.writeByte(' ')
		}
		p.printArg(arg, 'v')
	}
	p.buf.writeByte('\n')
}
```

## 前提知識

- **`any` 型の引数**: `Println` の引数は `...any` で、どんな型の値も受け取れます。
- **`%v`**: 値を既定の形で表示する書式です。数値は数字に、文字列はそのままの文字列になります。
- **`p.buf`**: 出力のバッファです。ここに書き溜めて、最後にまとめて出力先へ渡します。
- **`printArg`**: 1 つの値を、指定した書式で書き出す関数です。型に応じた処理を行います。

## 何をしているか

### 1. 引数を順に書く

```go:line-numbers=1205
	for argNum, arg := range a {
		if argNum > 0 {
			p.buf.writeByte(' ')
		}
		p.printArg(arg, 'v')
	}
```

引数を先頭から順に取り出します。2 つ目以降の引数の前には、空白を 1 つ書きます。そのあと、`printArg` で、その値を `%v` の形式で書きます。

`argNum > 0` の判定で、最初の引数の前には空白を付けないようにしています。

### 3. 最後に改行を書く

```go:line-numbers=1211
	p.buf.writeByte('\n')
```

全部の引数を書き終えたら、改行を 1 つ書きます。これで、`Println` は行の終わりを表します。

## ここがすごい

- **`Print` との違いを 1 行に**: 空白の入れ方と改行の付け方が、この関数の違いです。`Print` は空白を入れず、`Println` は入れる、という分かれ方になっています。
- **バッファにまとめて書く**: 値ごとに出力先へ書くと、システムの呼び出しが増えます。バッファに溜めてから出すので、速く動きます。
- **型を気にしない**: 引数の型ごとの違いは、`printArg` が引き受けます。この関数は、区切りと改行だけに集中しています。

## まとめ

- `doPrintln` は、引数を空白で区切り、最後に改行を付けてバッファに書きます。
- 各値は既定の `%v` で書かれます。
- 最初の引数の前には空白を入れません。
- 出力は、バッファにまとめて書きます。
