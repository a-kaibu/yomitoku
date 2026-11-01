---
title: "最後の「/」で 2 つに割る。見つからないときも安全な path.Split"
description: "path.Split は、パスを「ディレクトリ」と「ファイル名」に分けます。最後の「/」の位置を 1 回だけ探し、その前と後ろを切り出します。「/」がないときも、添字の計算が自然に正しい結果になります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/path/path.go"
lines: [145, 148]
function: "Split"
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`path.Split("a/b/c.txt")` は、`"a/b/"` と `"c.txt"` の 2 つを返します。ディレクトリの部分は末尾の「/」を含み、ファイル名の部分にはもう「/」がありません。

この 2 つを `+` でつなげると、元のパスに戻ります。

## コード

```go:line-numbers=145
func Split(path string) (dir, file string) {
	i := bytealg.LastIndexByteString(path, '/')
	return path[:i+1], path[i+1:]
}
```

## 前提知識

- **複数の戻り値**: 関数が `(dir, file string)` の 2 つを返します。名前を付けておくと、戻り値の意味が読み手に伝わります。
- **`bytealg.LastIndexByteString`**: 文字列の中で、指定したバイトが最後に現れる位置を返す内部の関数です。見つからないときは `-1` を返します。
- **`path[:i+1]`**: 先頭から `i` を含む位置までの部分です。
- **`path[i+1:]`**: `i` の次から末尾までの部分です。

## 何をしているか

### 1. 最後の「/」の位置を探す

```go:line-numbers=146
	i := bytealg.LastIndexByteString(path, '/')
```

`"a/b/c.txt"` なら、最後の「/」は位置 3 です。

### 2. 2 つに切り出す

```go:line-numbers=147
	return path[:i+1], path[i+1:]
```

`path[:4]` は `"a/b/"`、`path[4:]` は `"c.txt"` です。区切りの「/」は、ディレクトリ側に含めています。

### 3. 「/」がない場合

`path = "c.txt"` では、`i = -1` になります。すると `path[:0]` は空の文字列、`path[0:]` は `"c.txt"` 全体です。特別な分岐を書かなくても、ディレクトリが空でファイル名が元の値、という正しい結果になります。

## ここがすごい

- **添字の計算だけで境界を扱う**: 「/」が見つからない場合を `if` で分けず、`i+1` の計算が `0` になることで自然に扱えています。
- **連結すると元に戻る**: `dir + file` は必ず元の `path` になります。分けても情報が失われないことが保証されているので、呼び出し側は安心して使えます。
- **区切りの置き場所を決める**: 区切りの「/」をディレクトリ側に含めたことで、`path.Join` と組み合わせるときも扱いが揃います。

## まとめ

- 最後の区切りを 1 回探せば、パスは 2 つに分けられる。
- 見つからない場合の添字（`-1`）は、`+1` すると空の範囲になる。
- 分けた結果を連結したら元に戻る、と言える形にすると使いやすい。
