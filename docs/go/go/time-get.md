---
title: "nil の場所を UTC に読み替える time の Location.get"
description: "time パッケージの Location.get。Location が nil なら UTC の場所を返す。ローカルの場所なら、初めて使うときに一度だけ読み込む。それ以外は、そのまま返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo.go"
lines: [91, 99]
function: "get"
difficulty: 2
tags: [日時, 防御的プログラミング]
---

## ひとことで

`l.get()` は、場所 `l` を、実際に使える場所に変えて返します。`nil` は UTC として扱い、ローカルの場所は、初めて使うときに読み込みます。

## コード

```go:line-numbers=91
func (l *Location) get() *Location {
	if l == nil {
		return &utcLoc
	}
	if l == &localLoc {
		localOnce.Do(initLocal)
	}
	return l
}
```

## 前提知識

- **Location**: 時間帯を表す型です。`nil` の `Location` は、UTC と同じ意味で使われます。
- **ローカルの場所**: 実行している環境の時間帯です。読み込みには、ファイルを調べる処理が必要です。
- **sync.Once（localOnce）**: 中の処理を、一度だけ実行することを保証する仕組みです。

## 何をしているか

### 1. nil なら UTC を返す

```go:line-numbers=92
	if l == nil {
		return &utcLoc
	}
```

場所が `nil` なら、UTC の場所を返します。`nil` を特別な意味として扱うので、ゼロ値の `Time` も UTC として使えます。

### 2. ローカルなら一度だけ読み込む

```go:line-numbers=95
	if l == &localLoc {
		localOnce.Do(initLocal)
	}
```

場所がローカルのものなら、`localOnce.Do` で `initLocal` を呼びます。`Do` は、何回呼んでも `initLocal` を一度しか実行しないので、並行して使われても安全です。

### 3. それ以外はそのまま返す

```go:line-numbers=98
	return l
```

`nil` でもローカルでもなければ、読み込みは要らないので、そのまま返します。

## ここがすごい

- **nil を既定値にする**: ゼロ値を UTC として扱えるので、場所を指定しない `Time` も、すぐに使えます。
- **遅い処理を必要なときだけ**: ローカルの読み込みは、使われたときに一度だけ行います。起動時の負担が減ります。

## まとめ

- `get` は、`nil` を UTC に、ローカルを一度だけ読み込んで返します。
- 読み込みは `sync.Once` で、並行しても一度だけ実行されます。
- それ以外の場所は、そのまま返します。
