---
title: "行の先頭の位置を返す token.File.LineStart。範囲外は panic で知らせる"
description: "go/token の File.LineStart。行番号から、その行の先頭の位置を返す。行番号が 1 より小さい、または行数を超えるときはパニックし、読み書きは mutex で守る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/go/token/position.go"
lines: [238, 248]
function: "LineStart"
difficulty: 2
tags: [並行処理, 防御的プログラミング, API設計]
---

## ひとことで

`go/token` は、ソースファイルの各行の先頭の位置を、配列に記録しています。`LineStart(line)` は、指定した行の先頭の `Pos` を返します。`Pos` は、ファイル全体のなかの位置を表す整数です。

行番号が範囲外のときは、呼び出しの誤りとして、パニックで知らせます。

## コード

```go:line-numbers=238
func (f *File) LineStart(line int) Pos {
	if line < 1 {
		panic(fmt.Sprintf("invalid line number %d (should be >= 1)", line))
	}
	f.mutex.Lock()
	defer f.mutex.Unlock()
	if line > len(f.lines) {
		panic(fmt.Sprintf("invalid line number %d (should be < %d)", line, len(f.lines)))
	}
	return Pos(f.base + f.lines[line-1])
}
```

## 前提知識

- **`Pos`**: `FileSet` の中の位置を表す整数です。ファイルの基点（base）と、ファイル内の位置を足した値です。
- **行の先頭の配列**: `f.lines` は、各行が始まるファイル内の位置を入れた配列です。最初の行は 0 から始まります。
- **`mutex`**: 複数の goroutine から同時に触られても壊れないように、ロックをかける道具です。
- **`defer`**: 関数を抜けるときに実行する命令を予約します。ここでは、ロックを必ず解除するために使われています。

## 何をしているか

### 1. 行番号が 1 より小さければパニック

```go:line-numbers=239
	if line < 1 {
		panic(fmt.Sprintf("invalid line number %d (should be >= 1)", line))
	}
```

行番号は 1 から数えます。0 以下は、呼び出し側の誤りなので、パニックで知らせます。

### 2. ロックをかけて範囲を確かめる

```go:line-numbers=242
	f.mutex.Lock()
	defer f.mutex.Unlock()
	if line > len(f.lines) {
		panic(fmt.Sprintf("invalid line number %d (should be < %d)", line, len(f.lines)))
	}
```

行の配列 `f.lines` を読むので、ロックをかけます。`defer` で、関数を抜けるときに必ず解除します。行番号が行数を超えていれば、パニックします。

### 3. 行の先頭を求めて返す

```go:line-numbers=247
	return Pos(f.base + f.lines[line-1])
```

配列は 0 から始まるので、`line-1` を添字にします。その値に、ファイルの基点 `f.base` を足して、`Pos` として返します。

## ここがすごい

- **誤りを早く止める**: 範囲外の行を、適当な値で返さずに、パニックにしています。間違った行の情報が、後で静かに広がることを防げます。
- **defer で解除を忘れない**: 途中でパニックしても、`defer` でロックが解除されます。
- **基点を足して全体の位置にする**: ファイルごとの相対位置を、`FileSet` 全体で一意の値に変換しています。

## まとめ

- `LineStart` は、行番号から、その行の先頭の `Pos` を返します。
- 行番号が 1 未満、または行数を超えるときは、パニックします。
- 行の配列を、ロックで守りながら読みます。
- 相対位置に基点を足して、全体での位置にします。
