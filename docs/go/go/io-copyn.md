---
title: "「最後まで読んだ」と「途中で止まった」を区別して、必要な量だけコピーする"
description: "io.CopyN は、読み手から指定した量のバイトだけを書き手へコピーします。途中で読み手が止まったときは、その理由を EOF として返すことで、呼び出し側が結果を判断できるようにしています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/io.go"
lines: [363, 373]
function: "CopyN"
difficulty: 2
format: 2
tags: [入出力, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`io.CopyN(dst, src, n)` は、`src` から `n` バイトだけを読んで `dst` に書きます。`n` バイトに届く前に `src` が終わったら、`err` に `io.EOF` を入れて返します。

ファイルの先頭の一部だけを別のファイルへ写す、といった用途で使われます。

## コード

::: code-group

```go:line-numbers=363 [日本語訳]
func CopyN(dst Writer, src Reader, n int64) (written int64, err error) {
	written, err = Copy(dst, LimitReader(src, n))
	if written == n {
		return n, nil
	}
	if written < n && err == nil {
		// src が途中で止まった。これは EOF のはず。
		err = EOF
	}
	return
}
```

```go:line-numbers=363 [原文]
func CopyN(dst Writer, src Reader, n int64) (written int64, err error) {
	written, err = Copy(dst, LimitReader(src, n))
	if written == n {
		return n, nil
	}
	if written < n && err == nil {
		// src stopped early; must have been EOF.
		err = EOF
	}
	return
}
```

:::

## 前提知識

- **`io.Reader` と `io.Writer`**: データを読む型と書く型のインターフェースです。ファイル、ネットワーク、メモリのバッファなど、どれも同じ方法で使えます。
- **`io.EOF`**: データが最後まで読み終わったことを表す特別なエラーです。
- **`io.LimitReader`**: 読めるバイト数の上限を決めた `Reader` を作ります。上限に達すると EOF を返します。
- **名前付き戻り値**: `(written int64, err error)` のように名前を付けると、関数の中で値を代入して、最後に `return` だけで返せます。

## 何をしているか

### 1. 上限をかけてコピーする

```go:line-numbers=364
	written, err = Copy(dst, LimitReader(src, n))
```

`LimitReader` で、`src` から読める量を `n` バイトまでに制限します。それを `Copy` で `dst` に書きます。`written` には、実際に書けたバイト数が入ります。

### 2. ちょうど n バイト書けたら成功

```go:line-numbers=365
	if written == n {
		return n, nil
	}
```

書けた量が `n` と同じなら、エラーはないとして `nil` を返します。

### 3. 途中で止まったら EOF にする

```go:line-numbers=368
	if written < n && err == nil {
		// src stopped early; must have been EOF.
		err = EOF
	}
```

書けた量が `n` より少ないのに、エラーがない場合を見ています。その場合は `src` が途中で終わったはずなので、`EOF` を返します。コメントは、この理由を説明しています。

## ここがすごい

- **結果の意味を戻り値で伝える**: 書いた量と、エラーの 2 つで状況を表します。`written == n` なら完全に成功、`EOF` なら途中で終わった、と呼び出し側が判断できます。
- **上限を読み手の側で決める**: `LimitReader` で上限を付けるので、コピー関数そのものは「上限」を知らなくてもよくなります。部品を組み合わせる設計です。
- **EOF を「正常な終わり」に近づける**: `src` が途中で終わったことを、ただのエラーではなく `EOF` で表します。読み手の終わりを表す共通の言葉を使うことで、呼び出し側の扱いが揃います。

## まとめ

- 「指定した量だけ読む」は、上限付きの読み手を作って通常のコピーに任せると簡単になる。
- 戻り値の量とエラーを組み合わせると、途中で終わった理由を伝えられる。
- 共通の終わりの印（`EOF`）を使うと、呼び出し側が統一的に扱える。
