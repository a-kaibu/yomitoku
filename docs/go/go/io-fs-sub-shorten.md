---
title: "部分ファイルシステムの名前を短くする subFS.shorten。ディレクトリ名を取り除く"
description: "io/fs の subFS.shorten。Sub で作った部分ファイルシステムの中で、元のフルパスの名前から、基準のディレクトリを取り除いた相対名を求める。基準そのものなら \".\" を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/io/fs/sub.go"
lines: [70, 78]
function: "shorten"
difficulty: 2
tags: [文字列処理, 防御的プログラミング, ファイル]
---

## ひとことで

`f.shorten(name)` は、フルパスの名前から、基準のディレクトリの部分を取り除きます。例えば基準が `dir` のとき、`dir/a.txt` は `a.txt` になります。

`io/fs` の `Sub` は、あるディレクトリの下だけを見せる、部分的なファイルシステムを作ります。その中では、名前が短い相対パスで表されるので、この関数で変換します。

## コード

```go:line-numbers=70
func (f *subFS) shorten(name string) (rel string, ok bool) {
	if name == f.dir {
		return ".", true
	}
	if len(name) >= len(f.dir)+2 && name[len(f.dir)] == '/' && name[:len(f.dir)] == f.dir {
		return name[len(f.dir)+1:], true
	}
	return "", false
}
```

## 前提知識

- **基準ディレクトリ（`f.dir`）**: 部分ファイルシステムの根になるディレクトリの名前です。
- **相対名**: 基準からの位置で表された名前です。`dir/a.txt` の相対名は `a.txt` です。
- **`ok`**: 変換が成功したかどうかを表す真偽値です。基準の外の名前は、変換できないので `false` になります。
- **`"."`**: 現在のディレクトリを表す記号です。基準そのものは、この記号で表されます。

## 何をしているか

### 1. 基準そのものなら "." を返す

```go:line-numbers=71
	if name == f.dir {
		return ".", true
	}
```

名前が基準のディレクトリと同じなら、相対名は `"."` です。そのまま `true` で返します。

### 2. 基準の下にあれば、残りを返す

```go:line-numbers=74
	if len(name) >= len(f.dir)+2 && name[len(f.dir)] == '/' && name[:len(f.dir)] == f.dir {
		return name[len(f.dir)+1:], true
	}
```

名前が基準より長く、基準の直後に `/` があり、先頭が基準と一致すれば、基準の下にあります。`len(f.dir)+1` 以降を切り出して、相対名として返します。`+2` の判定は、`/` の後に少なくとも 1 文字あることを確かめるためです。

### 3. 範囲の外は失敗を返す

```go:line-numbers=77
	return "", false
```

どちらの条件も満たさなければ、基準の外の名前です。空の文字列と `false` を返して、変換できなかったことを伝えます。

## ここがすごい

- **範囲の境界を正確に判定**: 基準の直後の `/`、長さ、先頭の一致を、すべて確かめています。似た名前を誤って通さないようにしています。
- **コピーが少ない**: 相対名は、元の文字列の後ろの部分をスライスとして指すだけです。新しい文字列を作りません。
- **失敗を値で返す**: 基準の外の名前は、エラーにせず `ok` で伝えます。呼び出し側は、その結果を見て次の処理を決められます。

## まとめ

- `shorten` は、フルパスから基準のディレクトリの部分を取り除き、相対名を返します。
- 基準そのものなら `"."`、基準の下なら残りの名前を返します。
- 基準の外の名前は `ok` が `false` になります。
