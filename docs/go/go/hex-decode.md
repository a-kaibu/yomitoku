---
title: "不正な文字は 256 要素の逆引き表で一発判定する 16 進デコード"
description: "16 進数の文字列をバイト列に戻す hex.Decode。逆引き表で文字を数値に変え、表の値が 15 を超えるかどうかだけで不正な文字を見つけます。エラーの報告順にも気を配っています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/encoding/hex/hex.go"
lines: [87, 113]
function: "Decode"
difficulty: 2
format: 2
tags: [パース, エラー処理, 標準ライブラリ]
---

## ひとことで

`hex.Decode(dst, src)` は、`"1fa0"` のような 16 進数の文字列を `[]byte{0x1f, 0xa0}` のようなバイト列に戻します。
`'g'` などの 16 進数でない文字があれば `InvalidByteError`、文字数が奇数なら `ErrLength` というエラーを返します。

## コード

::: code-group

```go:line-numbers=87 [日本語訳]
func Decode(dst, src []byte) (int, error) {
	i, j := 0, 0
	for ; j < len(src)-1; j += 2 {
		p := src[j]
		q := src[j+1]

		a := reverseHexTable[p]
		b := reverseHexTable[q]
		if a > 0x0f {
			return i, InvalidByteError(p)
		}
		if b > 0x0f {
			return i, InvalidByteError(q)
		}
		dst[i] = (a << 4) | b
		i++
	}
	if len(src)%2 == 1 {
		// 長さがおかしいと報告する前に、不正な文字がないか確かめる。
		// 不正な文字（あれば）のほうが先にある問題だからだ。
		if reverseHexTable[src[j]] > 0x0f {
			return i, InvalidByteError(src[j])
		}
		return i, ErrLength
	}
	return i, nil
}
```

```go:line-numbers=87 [原文]
func Decode(dst, src []byte) (int, error) {
	i, j := 0, 0
	for ; j < len(src)-1; j += 2 {
		p := src[j]
		q := src[j+1]

		a := reverseHexTable[p]
		b := reverseHexTable[q]
		if a > 0x0f {
			return i, InvalidByteError(p)
		}
		if b > 0x0f {
			return i, InvalidByteError(q)
		}
		dst[i] = (a << 4) | b
		i++
	}
	if len(src)%2 == 1 {
		// Check for invalid char before reporting bad length,
		// since the invalid char (if present) is an earlier problem.
		if reverseHexTable[src[j]] > 0x0f {
			return i, InvalidByteError(src[j])
		}
		return i, ErrLength
	}
	return i, nil
}
```

:::

`reverseHexTable` は同じファイルにある 256 文字の文字列で、`'0'`〜`'9'`、`'a'`〜`'f'`、`'A'`〜`'F'` の位置にだけ 0〜15 の値が、それ以外の位置には `0xff` が入っています。

## 前提知識

- **16 進数**: 1 文字が 4 ビット（0〜15）を表すので、2 文字で 1 バイトになります。
- **逆引き表**: 文字（0〜255 のバイト値）を添字にして、その文字が表す数値を引く表です。
- **`(a << 4) | b`**: 上位 4 ビットに `a`、下位 4 ビットに `b` を置いて 1 バイトを作ります。`a = 1, b = 15` なら `0x1f` です。
- **`for ; 条件; 後処理`**: Go の `for` は、初期化を省略して条件と後処理だけ書けます。ループ変数 `j` をループの後でも使うために、外で宣言しています。
- **エラーを戻り値で返す**: Go では、失敗を `(int, error)` の 2 つ目の戻り値で知らせます。`nil` はエラーなしという意味です。

## 何をしているか

### 1. 2 文字ずつ数値に変える

```go:line-numbers=89
	for ; j < len(src)-1; j += 2 {
		p := src[j]
		q := src[j+1]

		a := reverseHexTable[p]
		b := reverseHexTable[q]
		if a > 0x0f {
			return i, InvalidByteError(p)
		}
		if b > 0x0f {
			return i, InvalidByteError(q)
		}
		dst[i] = (a << 4) | b
		i++
	}
```

`src = "1fa0"` なら、`'1'` と `'f'` を表で引いて `a = 1`、`b = 15`。`dst[0] = 0x1f` です。次に `'a'`、`'0'` で `dst[1] = 0xa0` です。

`j < len(src)-1` という条件で、**2 文字そろっている間だけ** 回ります。

### 2. 不正な文字の判定

```go:line-numbers=95
		if a > 0x0f {
			return i, InvalidByteError(p)
		}
		if b > 0x0f {
			return i, InvalidByteError(q)
		}
```

表の値が `0x0f`（15）を超えていれば、16 進数の文字ではありません（表では `0xff` になっています）。範囲チェックが **比較 1 回** で済みます。

### 3. 奇数の長さ

```go:line-numbers=104
	if len(src)%2 == 1 {
		// 長さがおかしいと報告する前に、不正な文字がないか確かめる。
		// 不正な文字（あれば）のほうが先にある問題だからだ。
		if reverseHexTable[src[j]] > 0x0f {
			return i, InvalidByteError(src[j])
		}
		return i, ErrLength
	}
```

`"1fa"` のように奇数文字なら、最後の 1 文字が余ります。このとき、すぐに `ErrLength` を返すのではなく、**先に余った文字が不正でないか** を確かめています。`"1fz"` なら、長さの問題より先に `'z'` が不正な文字だと報告します。

### 4. 戻り値

戻り値の `i` は、エラーになるまでに正しく書き込めたバイト数です。

## ここがすごい

- **大文字にも小文字にも 1 回の表引きで対応**: `'A'` も `'a'` も同じ 10 になるように表を作ってあるので、大文字小文字の変換や分岐が要りません。
- **「範囲外」を値の大きさで表す**: 不正な文字に `0xff` を割り当てることで、「正しい文字か」と「何の値か」を同じ表引きで済ませています。`if 'a' <= c && c <= 'f'` のような比較を何回も書く必要がありません。
- **エラーを報告する順番の配慮**: 入力の前のほうにある問題を先に報告するのは、使う人がエラーの原因を見つけやすくするための親切な設計です。
- **途中まで書いたバイト数を返す**: エラーがあっても、どこまでは正しく変換できたかがわかります。

## まとめ

- 逆引き表に「不正」を表す大きな値を入れておくと、変換と検証を 1 回の表引きでできる。
- 大文字と小文字を同じ値に対応させた表を作れば、場合分けが要らない。
- 複数のエラーがありうるときは、入力の前のほうの問題を先に報告すると親切。
