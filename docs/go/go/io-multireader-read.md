---
title: "読み終えた読み手を捨てながら、次々に読み続ける MultiReader"
description: "io.MultiReader は、複数の Reader をつないで 1 つの Reader として読めるようにします。最初の Reader が終わったら次へ進み、読み終えた Reader は参照を捨てて、メモリを解放しやすくします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/io/multi.go"
lines: [17, 42]
function: "(*multiReader).Read"
difficulty: 3
format: 2
tags: [入出力, 標準ライブラリ, メモリ管理, 最適化]
---

## ひとことで

`io.MultiReader(r1, r2, r3)` は、`r1` を読み終えたら `r2`、`r2` の次に `r3` と、続けて読める Reader を返します。ファイルを連結して読むような用途で使われます。

`Read` は、今読んでいる Reader から読み、EOF に当たったら次へ移ります。全部読み終えたら、最後に `EOF` を返します。

## コード

::: code-group

```go:line-numbers=17 [日本語訳]
func (mr *multiReader) Read(p []byte) (n int, err error) {
	for len(mr.readers) > 0 {
		// 最初に平らにする。入れ子の MultiReader を最適化する（issue 13558）。
		if len(mr.readers) == 1 {
			if r, ok := mr.readers[0].(*multiReader); ok {
				mr.readers = r.readers
				continue
			}
		}
		n, err = mr.readers[0].Read(p)
		if err == EOF {
			// nil ではなく eofReader を使い、nil のパニックを避ける。
			// 平らにした後の nil のパニックを避けるため（issue 18232）。
			mr.readers[0] = eofReader{} // 早めに GC できるように。
			mr.readers = mr.readers[1:]
		}
		if n > 0 || err != EOF {
			if err == EOF && len(mr.readers) > 0 {
				// まだ EOF を返さない。読み手がまだ残っている。
				err = nil
			}
			return
		}
	}
	return 0, EOF
}
```

```go:line-numbers=17 [原文]
func (mr *multiReader) Read(p []byte) (n int, err error) {
	for len(mr.readers) > 0 {
		// Optimization to flatten nested multiReaders (Issue 13558).
		if len(mr.readers) == 1 {
			if r, ok := mr.readers[0].(*multiReader); ok {
				mr.readers = r.readers
				continue
			}
		}
		n, err = mr.readers[0].Read(p)
		if err == EOF {
			// Use eofReader instead of nil to avoid nil panic
			// after performing flatten (Issue 18232).
			mr.readers[0] = eofReader{} // permit earlier GC
			mr.readers = mr.readers[1:]
		}
		if n > 0 || err != EOF {
			if err == EOF && len(mr.readers) > 0 {
				// Don't return EOF yet. More readers remain.
				err = nil
			}
			return
		}
	}
	return 0, EOF
}
```

:::

## 前提知識

- **`io.EOF`**: 読み終わりを表す値です。途中の Reader の EOF は、全体の終わりではありません。
- **nil のインターフェース**: インターフェースに何も入っていない状態です。そのまま呼び出すと `panic` するので、代わりの値を入れることがあります。
- **`mr.readers[1:]`**: 先頭の要素を取り除いたスライスを作ります。
- **`for len(mr.readers) > 0`**: 残りの Reader がなくなるまで繰り返します。

## 何をしているか

`readers = [r1, r2]` で、`r1` がデータを全部返して `EOF` になり、`r2` にはまだデータがある場合で追います。

### 1. 入れ子の MultiReader を平らにする

```go:line-numbers=20
			if len(mr.readers) == 1 {
				if r, ok := mr.readers[0].(*multiReader); ok {
					mr.readers = r.readers
					continue
				}
			}
```

残りが 1 つで、それが別の `MultiReader` なら、その中身を直接持ってきます。入れ子を減らして、読むたびの間接参照を減らします。

### 2. 先頭から読む

```go:line-numbers=26
		n, err = mr.readers[0].Read(p)
```

先頭の `r1` から読みます。`r1` が `EOF` を返したら、次の手順に進みます。

### 3. 読み終えた Reader を捨てる

```go:line-numbers=27
		if err == EOF {
			// nil ではなく eofReader を使い、nil のパニックを避ける。
			// 平らにした後の nil のパニックを避けるため（issue 18232）。
			mr.readers[0] = eofReader{} // 早めに GC できるように。
			mr.readers = mr.readers[1:]
		}
```

`r1` を外し、先頭の場所に `eofReader{}` を入れておきます。`nil` ではなく `eofReader{}` にするのは、平らにした後で `nil` を呼ぶと `panic` するのを防ぐためです。`mr.readers[1:]` で、読み終えた Reader は参照されなくなり、GC の対象になります。

### 4. まだ続きがあれば EOF を隠す

```go:line-numbers=33
		if n > 0 || err != EOF {
			if err == EOF && len(mr.readers) > 0 {
				// Don't return EOF yet. More readers remain.
				err = nil
			}
			return
		}
```

`r1` から読んだデータがあるか、EOF 以外のエラーなら、そこで返します。そのとき、`r2` が残っていれば `EOF` は返さず `nil` にします。全体の読み終わりは、最後の Reader が終わったときだけです。

## ここがすごい

- **読み終えた参照を捨てる**: 使い終わった Reader を `mr.readers` から外すので、大きなバッファを持った Reader が GC で回収されます。長い連結でもメモリが溜まりにくくなります。
- **EOF の意味を分けている**: 途中の Reader の `EOF` と、全体の `EOF` を区別します。呼び出し側からは、一つの連続した読み手に見えます。
- **panic を防ぐ代わりの値**: `nil` の代わりに、空の読み手 `eofReader{}` を置きます。平らにした後の呼び出しでも、安全に動きます。

## まとめ

- 複数の読み手を連結するときは、読み終えた要素を外してメモリを解放しやすくする。
- 途中の終わりを、全体の終わりと区別して扱う。
- `nil` を残すと、後の処理で `panic` することがあるので、安全な代わりの値を置く。
