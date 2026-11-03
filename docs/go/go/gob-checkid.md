---
title: "gob の組み込みの型番号が正しいかを確かめる checkId。ずれていれば即座に止める"
description: "encoding/gob の checkId。型の番号が期待どおりかを確かめる。違えば、どの番号が来たかを標準エラーに出し、パニックを起こす。プログラムの起動時に、組み込みの型の番号が崩れていないかを見張るための関数。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [621, 626]
function: "checkId"
difficulty: 1
tags: [防御的プログラミング, 型システム, エラー処理]
---

## ひとことで

`checkId(want, got)` は、期待する型の番号 `want` と、実際の番号 `got` を比べます。同じなら何もしません。違えば、ずれた番号を表示して、プログラムを止めます。

gob は、組み込みの型に、あらかじめ決まった番号を付けています。その番号がずれると、データの読み書きが互いに合わなくなります。この関数は、その食い違いを、起動の早い段階で見つけるためにあります。

## コード

```go:line-numbers=621
func checkId(want, got typeId) {
	if want != got {
		fmt.Fprintf(os.Stderr, "checkId: %d should be %d\n", int(got), int(want))
		panic("bootstrap type wrong id: " + got.name() + " " + got.string() + " not " + want.string())
	}
}
```

## 前提知識

- **型の番号（typeId）**: gob が型を区別するために使う整数です。送る側と受ける側で、同じ番号が同じ型を指す必要があります。
- **ブートストラップ**: 型の情報を、最初に組み立てる準備段階のことです。組み込みの型は、ここで番号を決めて登録されます。
- **パニック**: 回復できない誤りを表すときに、プログラムを止める仕組みです。
- **標準エラー（`os.Stderr`）**: 通常の出力とは別に、エラーの情報を書き出す先です。

## 何をしているか

### 1. 番号が違うかを比べる

```go:line-numbers=622
	if want != got {
```

期待した番号と実際の番号を比べます。同じなら、この関数は何もせずに終わります。

### 2. ずれを表示して止める

```go:line-numbers=623
		fmt.Fprintf(os.Stderr, "checkId: %d should be %d\n", int(got), int(want))
		panic("bootstrap type wrong id: " + got.name() + " " + got.string() + " not " + want.string())
```

違えば、実際の番号と期待した番号を標準エラーに書きます。さらに、型の名前を含むメッセージで `panic` を起こして、プログラムを止めます。

## ここがすごい

- **早い段階で止める**: 番号がずれたまま動かすと、後でデータが壊れてから気づきます。起動時に止めれば、原因がすぐ分かります。
- **二つの情報で報告する**: 数字と型の名前の両方を出すので、どの型が違ったのかを、すぐに特定できます。
- **正常時のコストが小さい**: 一致していれば、比べるだけで終わります。毎回の処理に、大きな負担はかかりません。

## まとめ

- `checkId` は、型の番号が期待どおりかを確かめます。
- 違えば、ずれた番号を表示して、`panic` で止めます。
- 組み込みの型の番号が崩れていないかを、起動時に見張ります。
