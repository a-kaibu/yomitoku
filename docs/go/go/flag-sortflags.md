---
title: "コマンドラインの一覧を名前順に並べる flag.sortFlags"
description: "flag パッケージで、登録された全フラグを名前の順に並べて返す sortFlags。map の順番に頼らずに、ヘルプの表示を毎回同じ順番にする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/flag/flag.go"
lines: [418, 429]
function: "sortFlags"
difficulty: 1
tags: [CLI, 標準ライブラリ, ソート]
---

## ひとことで

`flag` パッケージは、コマンドラインのオプション（フラグ）を `map` に保存しています。しかし、`map` の要素の順番は毎回ばらばらです。`sortFlags` は、その map の中身を **名前の順に並べたスライス** にして返します。`-h` でヘルプを出すときに、毎回同じ順番で表示されるようにするための関数です。

## コード

```go:line-numbers=418
func sortFlags(flags map[string]*Flag) []*Flag {
	result := make([]*Flag, len(flags))
	i := 0
	for _, f := range flags {
		result[i] = f
		i++
	}
	slices.SortFunc(result, func(a, b *Flag) int {
		return strings.Compare(a.Name, b.Name)
	})
	return result
}
```

## 前提知識

- **`flag` パッケージ**: `-verbose` や `-port 8080` のようなオプションを、解析して値に入れる標準のパッケージです。
- **map の順番**: Go の `map` を `range` で回す順番は、決まっていません。毎回違うことがあります。
- **`make([]*Flag, n)`**: 長さ `n` のスライスを作る書き方です。要素はすべてゼロ値（`nil`）で始まります。
- **`slices.SortFunc`**: 比較関数を渡して、スライスを並べ替える関数です。比較関数は、負・0・正の値を返します。

## 何をしているか

### 1. map の値をスライスに詰める

```go:line-numbers=419
	result := make([]*Flag, len(flags))
	i := 0
	for _, f := range flags {
		result[i] = f
		i++
	}
```

map の要素の数だけの長さのスライスを作り、フラグを 1 つずつ入れていきます。ここでは、map の順番のまま入ります。並べ替えは次の段階です。

### 2. 名前で比べて並べ替える

```go:line-numbers=425
	slices.SortFunc(result, func(a, b *Flag) int {
		return strings.Compare(a.Name, b.Name)
	})
	return result
```

`SortFunc` に比較関数を渡します。`strings.Compare` は、2 つの名前を辞書順に比べて、`-1`、`0`、`1` を返します。その結果で、名前の順に並べ替えてから返します。

## ここがすごい

- **map の順番の不確かさを 1 か所で解消**: 並べ替えを、この関数だけでやっています。呼び出し側は、いつも同じ順番のリストを受け取れます。
- **必要な長さを先に確保**: `make` で長さを決めてから入れるので、途中で配列を作り直しません。
- **比較関数だけを指定**: 並べ替えのアルゴリズムは `slices` に任せ、ここでは「何で比べるか」だけを書いています。

## まとめ

- `sortFlags` は、フラグの map を名前の順のスライスにします。
- map の順番は決まっていないので、いったんスライスに詰めてから並べ替えます。
- 比較は `strings.Compare` で、辞書順に行います。
- ヘルプの表示が、毎回同じ順番になります。
