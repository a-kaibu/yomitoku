---
title: "バッファの中身をまとめて書き出す bufio.Writer.Flush。途中で失敗しても残りを守る"
description: "bufio.Writer の Flush。溜めておいたバイト列を、下の writer へ一度に書く。全部書けなかったときは、書けなかった残りをバッファの先頭へ詰め直して、次の Flush で続きを書けるようにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/bufio.go"
lines: [635, 656]
function: "Flush"
difficulty: 2
tags: [入出力, 防御的プログラミング, メモリ管理]
---

## ひとことで

`bufio.Writer` は、小さな書き込みを、内部のバッファにためてから、まとめて下の `io.Writer` へ書きます。`Flush` は、そのたまった分を書き出す関数です。書けなかったときは、まだ書けていない部分を先頭へ詰め直して、次の `Flush` で続きを書けるようにします。

## コード

```go:line-numbers=635
func (b *Writer) Flush() error {
	if b.err != nil {
		return b.err
	}
	if b.n == 0 {
		return nil
	}
	n, err := b.wr.Write(b.buf[0:b.n])
	if n < b.n && err == nil {
		err = io.ErrShortWrite
	}
	if err != nil {
		if n > 0 && n < b.n {
			copy(b.buf[0:b.n-n], b.buf[n:b.n])
		}
		b.n -= n
		b.err = err
		return err
	}
	b.n = 0
	return nil
}
```

## 前提知識

- **バッファリング**: 小さな書き込みを溜めて、まとめて書くことで、システムの呼び出し回数を減らす仕組みです。
- **`b.n`**: バッファに今溜まっているバイト数です。
- **`io.ErrShortWrite`**: 書き込みが、要求した量より少なく終わったことを表すエラーです。
- **`b.err`**: 一度起きたエラーを覚えておく変数です。以後の書き込みは、このエラーで止まります。

## 何をしているか

### 1. 既にエラーがあれば、何もしない

```go:line-numbers=636
	if b.err != nil {
		return b.err
	}
	if b.n == 0 {
		return nil
	}
```

前の書き込みでエラーが起きていれば、そのエラーをそのまま返します。溜まっているものがなければ、書くものがないので `nil` を返します。

### 2. まとめて書き、少なければエラーにする

```go:line-numbers=642
	n, err := b.wr.Write(b.buf[0:b.n])
	if n < b.n && err == nil {
		err = io.ErrShortWrite
	}
```

溜まっている `b.buf[0:b.n]` を、下の writer へ一度に書きます。書けた数 `n` が要求より少ないのに、エラーが `nil` のままなら、`io.ErrShortWrite` を返すことにします。下の writer が、中途半端に書いて終わったことを必ず伝えるためです。

### 3. 失敗したら、残りを先頭へ詰める

```go:line-numbers=647
		if n > 0 && n < b.n {
			copy(b.buf[0:b.n-n], b.buf[n:b.n])
		}
		b.n -= n
		b.err = err
		return err
```

一部だけ書けたなら、書けなかった残りを、バッファの先頭へ詰め直します。`copy` は、重なる範囲でも安全にコピーします。`b.n` から書けた分を引いて、残りの量を正しくし、エラーを `b.err` に記録します。

### 4. 全部書けたら空にする

```go:line-numbers=654
	b.n = 0
	return nil
```

最後まで書けたら、バッファを空にして `nil` を返します。

## ここがすごい

- **書けなかった分を失わない**: 一部だけ書けた場合に、残りを先頭へ詰めるので、次の `Flush` で続きから書けます。データを静かに捨てません。
- **エラーを記録して止める**: `b.err` に残しておくので、以後の書き込みは同じエラーで止まります。壊れた状態で書き続けるのを防ぎます。
- **短い書き込みをエラーとして扱う**: `ErrShortWrite` を作ることで、書けなかったことが見逃されません。

## まとめ

- `Flush` は、バッファに溜まったバイト列を下の writer へ書き出します。
- 書けた数が少なければ、`io.ErrShortWrite` とみなします。
- 一部しか書けなかったときは、残りをバッファの先頭へ詰め直します。
- エラーは `b.err` に記録し、以後の書き込みを止めます。
