---
title: "読み取り位置を進める Scanner.advance。負の値と読み過ぎを、どちらもエラーにする"
description: "bufio の Scanner.advance。読み取り位置を n バイト進める。n が負なら、負の進みのエラーを記録する。残りのデータを超えて進もうとしたら、進みすぎのエラーを記録する。どちらも false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2013 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/bufio/scan.go"
lines: [243, 254]
function: "advance"
difficulty: 2
tags: [入出力, 防御的プログラミング, エラー処理]
---

## ひとことで

`s.advance(n)` は、`Scanner` の読み取り位置を `n` バイト進めます。進めた後の位置が正しければ `true` を返し、不正なら、エラーを記録して `false` を返します。

`bufio.Scanner` は、入力を区切りごとに読み取る道具です。その中で、読み取り位置を安全に進めるための、小さな番人の役目を果たしています。

## コード

```go:line-numbers=243
func (s *Scanner) advance(n int) bool {
	if n < 0 {
		s.setErr(ErrNegativeAdvance)
		return false
	}
	if n > s.end-s.start {
		s.setErr(ErrAdvanceTooFar)
		return false
	}
	s.start += n
	return true
}
```

## 前提知識

- **読み取り位置（`start`）**: 次に読むデータの位置です。読んだ分だけ、ここが前に進みます。
- **`end`**: 読み込み済みのデータの終わりの位置です。`end - start` が、まだ読んでいないデータの量です。
- **`setErr`**: エラーを `Scanner` に記録する内部の関数です。記録されたエラーは、後で `Err` で取り出せます。
- **`ErrNegativeAdvance` と `ErrAdvanceTooFar`**: 負の進みと、進みすぎを表すエラーの値です。

## 何をしているか

### 1. 負の進みを弾く

```go:line-numbers=244
	if n < 0 {
		s.setErr(ErrNegativeAdvance)
		return false
	}
```

進む量が負なら、位置を戻すことになります。読み取りは前にしか進まないので、エラーを記録して、`false` を返します。

### 2. 残りを超える進みを弾く

```go:line-numbers=248
	if n > s.end-s.start {
		s.setErr(ErrAdvanceTooFar)
		return false
	}
```

進む量が、まだ読んでいないデータの量を超えていれば、読み過ぎになります。`ErrAdvanceTooFar` を記録して、`false` を返します。

### 3. 位置を進める

```go:line-numbers=252
	s.start += n
	return true
```

どちらの判定にも引っかからなければ、位置 `start` を `n` だけ進めて、`true` を返します。

## ここがすごい

- **範囲の判定が 2 段階**: 下限（負の値）と上限（残りの量）の 2 つを確かめるので、読み取り位置は必ず正しい範囲に保たれます。
- **エラーを記録する仕組み**: 失敗の理由を、戻り値とは別に `Scanner` に残します。呼び出し側は、ループの後で、まとめてエラーを確認できます。
- **進みの量だけを変える**: 読み取りの本体は、呼び出し側が決めます。`advance` は、位置の変更が安全かを見るだけの関数です。

## まとめ

- `advance` は、読み取り位置を `n` バイト進めます。
- 負の値と、残りを超える進みは、どちらもエラーとして記録します。
- 正しい場合だけ位置を進め、`true` を返します。
