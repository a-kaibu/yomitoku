---
title: "パスに \"..\" が含まれるかを調べる containsDotDot"
description: "time パッケージの containsDotDot。文字列の中に、連続する二つのピリオド \"..\" が含まれるかを調べる。含まれていれば true を返す。ファイルのパスを安全に扱うために使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo.go"
lines: [704, 714]
function: "containsDotDot"
difficulty: 2
tags: [文字列処理, 防御的プログラミング]
---

## ひとことで

`containsDotDot(s)` は、文字列 `s` の中に、`..` が連続して含まれるかを調べます。含まれていれば `true` を返します。

## コード

```go:line-numbers=704
func containsDotDot(s string) bool {
	if len(s) < 2 {
		return false
	}
	for i := 0; i < len(s)-1; i++ {
		if s[i] == '.' && s[i+1] == '.' {
			return true
		}
	}
	return false
}
```

## 前提知識

- **`..`**: 一つ上のディレクトリを表すパスの書き方です。外のファイルを指すために悪用されることがあります。
- **パス**: ファイルの場所を表す文字列です。時間帯の名前も、ファイルの場所として扱われることがあります。
- **部分の比較**: `s[i]` と `s[i+1]` を並べて比べると、連続する二つの文字を調べられます。

## 何をしているか

### 1. 長さが 2 未満なら含まない

```go:line-numbers=705
	if len(s) < 2 {
		return false
	}
```

二文字分の長さがなければ、`..` は含まれません。この確認で、後の添字の範囲外読み出しを避けます。

### 2. 連続する二文字を比べる

```go:line-numbers=708
	for i := 0; i < len(s)-1; i++ {
		if s[i] == '.' && s[i+1] == '.' {
			return true
		}
	}
```

先頭から一文字ずつ見て、その文字と次の文字が、両方 `.` かを確かめます。両方なら、`true` を返します。ループは `len(s)-1` までなので、`s[i+1]` が範囲外になることはありません。

### 3. 見つからなければ false

```go:line-numbers=713
	return false
```

最後まで見つからなければ、`false` を返します。

## ここがすごい

- **範囲を先に確かめる**: 長さの確認と、ループの上限の両方で、範囲外の読み出しを防いでいます。
- **単純な全走査**: 特別な検索の道具を使わず、一文字ずつ見るので、動きが明らかです。

## まとめ

- `containsDotDot` は、`..` が含まれるかを調べます。
- 長さの確認と、ループの上限で範囲を守ります。
- ファイルの場所を安全に扱うための確認に使われます。
