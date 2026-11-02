---
title: "PEM の 1 行を取り出す encoding/pem の getLine。CRLF の改行にも対応する"
description: "PEM 形式のデータから 1 行を切り出す getLine。LF と CRLF のどちらの改行でも行を取り出し、行末の空白を消して、残りのデータと消費したバイト数を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/pem/pem.go"
lines: [40, 53]
function: "getLine"
difficulty: 2
tags: [パース, 入出力, 文字列処理]
---

## ひとことで

PEM は、証明書や鍵を `-----BEGIN ...-----` のような行で囲んだテキスト形式です。`getLine(data)` は、その中から 1 行を取り出す関数です。戻り値は、行の中身 `line`、残りのデータ `rest`、今回読んだバイト数 `consumed` の 3 つです。

Windows 形式の改行（`\r\n`）と、Unix 形式（`\n`）の両方を扱えます。

## コード

```go:line-numbers=40
func getLine(data []byte) (line, rest []byte, consumed int) {
	i := bytes.IndexByte(data, '\n')
	var j int
	if i < 0 {
		i = len(data)
		j = i
	} else {
		j = i + 1
		if i > 0 && data[i-1] == '\r' {
			i--
		}
	}
	return bytes.TrimRight(data[0:i], " \t"), data[j:], j
}
```

## 前提知識

- **PEM 形式**: Base64 で書いたデータを、先頭と末尾の行で囲んだ形式です。TLS の証明書などでよく使われます。
- **改行の違い**: Unix は `\n`、Windows は `\r\n` で行を終えます。
- **`bytes.IndexByte`**: バイト列の中から、1 バイトの最初の位置を探す関数です。改行の位置を探すのに使います。
- **`bytes.TrimRight`**: 右端から指定した文字を取り除く関数です。行末の空白を消します。

## 何をしているか

### 1. 改行の位置を探す

```go:line-numbers=41
	i := bytes.IndexByte(data, '\n')
```

改行 `\n` の位置を探します。見つからなければ `i` は `-1` です。

### 2. 改行がなければ全部を 1 行にする

```go:line-numbers=43
	if i < 0 {
		i = len(data)
		j = i
	} else {
		j = i + 1
		if i > 0 && data[i-1] == '\r' {
			i--
		}
	}
```

改行がなければ、残り全部が最後の行です。改行があれば、次の行の始まり `j` を改行の後ろにします。もし改行の直前が `\r` なら、`i` を 1 つ戻して、`\r` を行に含めないようにします。これで、CRLF の改行も LF と同じように扱えます。

### 3. 行末の空白を消して返す

```go:line-numbers=52
	return bytes.TrimRight(data[0:i], " \t"), data[j:], j
```

行の末尾にある空白とタブを消して返します。残りのデータは `data[j:]`、消費したバイト数は `j` です。呼び出し側は `j` を使って、次の行へ進めます。

## ここがすごい

- **改行の種類を 1 か所で吸収**: `\r` の確認を 1 か所に入れるので、呼び出し側は改行の違いを気にしなくて済みます。
- **スライスの共有で速い**: 行も残りも、元のデータを指すスライスです。コピーをせずに、行を切り出せます。
- **消費量を返す**: 読んだバイト数を返すので、呼び出し側は、読み取り位置を正確に進められます。

## まとめ

- `getLine` は、データから 1 行を取り出して、残りと消費量を返します。
- 改行は `\n` を探し、直前の `\r` があれば行から外します。
- 行末の空白とタブを消します。
- 戻り値の消費量で、次の行の読み取りへ進めます。
