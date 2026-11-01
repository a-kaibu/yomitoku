---
title: "残りの量を減らしながら読む。上限に達したら EOF を返す LimitedReader"
description: "io.LimitedReader は、読める量の上限が決まった Reader です。読むたびに残りの量を減らし、上限に達すると EOF を返します。読み手の受け取る大きさを、読む側のバッファに合わせて切ることも行います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [472, 482]
function: "(*LimitedReader).Read"
difficulty: 2
format: 2
tags: [入出力, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`io.LimitReader(r, 100)` は、`r` から最大 100 バイトしか読めないようにした Reader を返します。ネットワークの応答の大きさを制限したり、ファイルの先頭だけを読んだりするために使われます。

`Read` は、残りの量 `N` を見ながら読みます。`N` が 0 になると、それ以上は EOF を返します。

## コード

```go:line-numbers=472
func (l *LimitedReader) Read(p []byte) (n int, err error) {
	if l.N <= 0 {
		return 0, EOF
	}
	if int64(len(p)) > l.N {
		p = p[0:l.N]
	}
	n, err = l.R.Read(p)
	l.N -= int64(n)
	return
}
```

## 前提知識

- **`Reader` インターフェース**: `Read(p []byte) (n int, err error)` を持つ型です。`p` に読んだデータを入れ、読んだバイト数を返します。
- **ポインタのレシーバ `(l *LimitedReader)`**: 残りの量 `N` を書き換えるので、ポインタを受け取ります。
- **`int64(len(p))`**: バッファの長さを `int64` に変えています。`N` も `int64` なので、型をそろえて比べます。
- **`p[0:l.N]`**: バッファの先頭から `N` バイトだけを使う、短いスライスを作ります。

## 何をしているか

`N = 5` で、`p` の長さが 10 の場合で追います。

### 1. 残りがなければ EOF

```go:line-numbers=473
	if l.N <= 0 {
		return 0, EOF
	}
```

上限に達していれば、読まずに `EOF` を返します。

### 2. バッファを残りの量に切る

```go:line-numbers=476
	if int64(len(p)) > l.N {
		p = p[0:l.N]
	}
```

`len(p)` は 10 で、`N` は 5 です。`p` を先頭の 5 バイトだけにします。こうすると、元のバッファを超えて読む心配がありません。

### 3. 読んで残りを減らす

```go:line-numbers=479
	n, err = l.R.Read(p)
	l.N -= int64(n)
	return
```

元の `Reader` から読み、実際に読んだ `n` だけ残りを減らします。`n` は 5 以下なので、`N` が負になることはありません。

## ここがすごい

- **バッファを切って上限を守る**: 読む量を、呼び出し側のバッファではなく、残りの量で決めます。上限を超えて読まないことを、この 1 行で保証しています。
- **実際に読んだ量で数える**: 要求した量ではなく、`n` で減らします。途中で読みが少なくなっても、残りを正しく計算できます。
- **小さな部品を組み合わせる**: この型は、ほかの `Reader` を包むだけです。上限という機能を、元の読み手の実装を変えずに付けられます。

## まとめ

- 上限付きの読み手は、バッファを残りの量に切ってから読むと安全。
- 残りの量は、要求した量ではなく、実際に読んだ量で減らす。
- 機能を包む部品にすると、どんな読み手にも同じ仕組みを付けられる。
