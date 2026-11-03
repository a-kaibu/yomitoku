---
title: "読み込みに使うバッファを指定する Scanner.Buffer。Scan の後は呼べない"
description: "bufio パッケージの Scanner.Buffer。読み込みに使うバッファと、トークンの最大サイズを設定する。Scan を呼んだ後に呼ぶと panic する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/scan.go"
lines: [275, 281]
function: "Buffer"
difficulty: 2
tags: [入出力, 防御的プログラミング]
---

## ひとことで

`s.Buffer(buf, max)` は、スキャナが読み込みに使うバッファと、一つのトークンの最大サイズを設定します。

## コード

```go:line-numbers=275
func (s *Scanner) Buffer(buf []byte, max int) {
	if s.scanCalled {
		panic("Buffer called after Scan")
	}
	s.buf = buf[0:cap(buf)]
	s.maxTokenSize = max
}
```

## 前提知識

- **Scanner**: 入力を、行や単語などのトークンに分けて読む型です。
- **トークン**: 分けた一つ分の部分です。たとえば、一行や一語です。
- **バッファ**: データを一時的に置いておく領域です。容量（cap）が、読み込める大きさを決めます。

## 何をしているか

### 1. 既に読み始めていれば panic する

```go:line-numbers=276
	if s.scanCalled {
		panic("Buffer called after Scan")
	}
```

`Scan` が一度でも呼ばれていると、既に内部のバッファを使っています。その状態で差し替えると、読み取りが壊れます。そのため、`Buffer` は `Scan` の後では使えず、panic で知らせます。

### 2. バッファの容量全体を使う

```go:line-numbers=279
	s.buf = buf[0:cap(buf)]
```

渡されたバッファの長さを、容量まで広げて使います。確保された領域を余すことなく、読み込みに使えるようにします。

### 3. 最大サイズを記録する

```go:line-numbers=280
	s.maxTokenSize = max
```

一つのトークンの最大サイズを記録します。トークンがこの大きさを超えると、スキャナはエラーを返します。

## ここがすごい

- **使い始めの前に設定する**: `Scan` の前だけに設定を許すので、途中で内部の状態が変わる心配がありません。
- **容量を使い切る**: 長さではなく容量を使うので、呼び出し側が確保した領域を無駄にしません。

## まとめ

- `Buffer` は、読み込みのバッファと、トークンの最大サイズを設定します。
- `Scan` の後に呼ぶと、panic します。
- バッファは、容量の全体を読み込みに使います。
