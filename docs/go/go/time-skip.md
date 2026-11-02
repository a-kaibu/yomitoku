---
title: "空白を無視して文字を照合する time.skip。書式の一致を先へ進める"
description: "時刻の文字列を書式に合わせて読むときに使う time.skip。書式の文字と入力の文字を 1 つずつ比べて進め、空白は長さが違っても同じものとして扱う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/format.go"
lines: [962, 979]
function: "skip"
difficulty: 2
tags: [日時, パース, 文字列処理]
---

## ひとことで

`time.Parse` は、書式（レイアウト）と入力の文字列を、先頭から照合しながら読みます。`skip(value, prefix)` は、その照合の 1 段を担当します。`prefix` は書式の中で、数字ではない文字（区切り記号や空白など）の部分です。`value` が、その `prefix` と一致するかを確かめて、一致した分だけ先へ進めます。

## コード

```go:line-numbers=962
func skip(value, prefix string) (string, error) {
	for len(prefix) > 0 {
		if prefix[0] == ' ' {
			if len(value) > 0 && value[0] != ' ' {
				return value, errBad
			}
			prefix = cutspace(prefix)
			value = cutspace(value)
			continue
		}
		if len(value) == 0 || value[0] != prefix[0] {
			return value, errBad
		}
		prefix = prefix[1:]
		value = value[1:]
	}
	return value, nil
}
```

## 前提知識

- **書式（レイアウト）**: `time.Parse` の書式は、`2006-01-02` のように、基準の日時 `2006-01-02 15:04:05` を並べて表します。その中の文字が、そのまま照合されます。
- **`errBad`**: 照合に失敗したことを表すエラーです。
- **`cutspace`**: 先頭の空白をまとめて取り除く関数です。空白が連続しても、1 つの空白として扱うためのものです。
- **スライスの先頭を切る**: `value[1:]` は、先頭の 1 バイトを除いた残りです。照合が 1 文字ずつ進むときに使います。

## 何をしているか

### 1. 書式の空白は、入力の空白と合わせる

```go:line-numbers=964
		if prefix[0] == ' ' {
			if len(value) > 0 && value[0] != ' ' {
				return value, errBad
			}
			prefix = cutspace(prefix)
			value = cutspace(value)
			continue
		}
```

書式の先頭が空白なら、入力の先頭も空白でなければなりません。両方の空白の連続をまとめて取り除いて、次の照合に進みます。空白の数が違っても、同じ区切りとして扱うための処理です。

### 2. 他の文字は 1 文字ずつ一致させる

```go:line-numbers=972
		if len(value) == 0 || value[0] != prefix[0] {
			return value, errBad
		}
		prefix = prefix[1:]
		value = value[1:]
```

入力が尽きているか、先頭の文字が違えば、照合は失敗です。一致すれば、両方の先頭を 1 つずつ切り落として進みます。

### 3. 全部一致したら残りを返す

```go:line-numbers=978
	return value, nil
```

書式の区切りを全部照合し終えたら、入力の残りを返します。残りは、次の数字の部分の読み取りに使われます。

## ここがすごい

- **空白だけ特別扱い**: 空白の数の違いを許しながら、それ以外の文字は厳密に比べます。人が書いた日時の揺れに対応しつつ、誤りは見逃しません。
- **先頭から切りながら進む**: 入力を毎回コピーせず、スライスの先頭を切るだけで進めます。速く、メモリも使いません。
- **失敗はすぐ伝える**: 一致しない文字が見つかったら、残りの照合をせずに `errBad` を返します。

## まとめ

- `skip` は、書式の区切り部分を入力と照合して、一致した分だけ進めます。
- 空白は長さが違っても、同じ区切りとして扱います。
- それ以外の文字は、1 文字ずつ厳密に比べます。
- 照合に失敗したら、すぐにエラーを返します。
