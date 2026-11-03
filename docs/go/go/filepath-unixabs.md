---
title: "相対パスを作業ディレクトリと合わせて絶対パスにする unixAbs"
description: "path/filepath の unixAbs。Unix 系のパスを絶対パスにする。すでに絶対パスなら Clean して返す。相対パスなら、現在の作業ディレクトリに結合する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/path/filepath/path.go"
lines: [165, 174]
function: "unixAbs"
difficulty: 2
tags: [文字列処理, 入出力]
---

## ひとことで

`unixAbs(path)` は、Unix 系のパスを、絶対パスにします。すでに絶対パスならそのまま整え、相対パスなら現在の作業ディレクトリをつないで作ります。

## コード

```go:line-numbers=165
func unixAbs(path string) (string, error) {
	if IsAbs(path) {
		return Clean(path), nil
	}
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	return Join(wd, path), nil
}
```

## 前提知識

- **絶対パス**: ルートから始まる、場所を一意に示すパスです。
- **相対パス**: 現在の場所から見た、相対的なパスです。
- **Clean**: `..` や `.`、余分な区切りを整えて、短い形にします。
- **Getwd**: 現在の作業ディレクトリを取得する関数です。失敗すると、エラーを返します。

## 何をしているか

### 1. 絶対パスなら整えて返す

```go:line-numbers=166
	if IsAbs(path) {
		return Clean(path), nil
	}
```

`IsAbs` で、すでに絶対パスかを調べます。絶対パスなら、`Clean` で整えて返します。作業ディレクトリは使わないので、取得の失敗とは無関係です。

### 2. 作業ディレクトリを取得する

```go:line-numbers=169
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
```

相対パスのときは、作業ディレクトリが必要です。`os.Getwd` で取得し、失敗したらエラーをそのまま返します。

### 3. 作業ディレクトリと結合する

```go:line-numbers=173
	return Join(wd, path), nil
```

作業ディレクトリと相対パスを `Join` でつなぎます。`Join` は区切りを整えて、結果を一つの正しいパスにします。

## ここがすごい

- **早く返す**: 絶対パスなら、作業ディレクトリを取らずに済みます。余計な処理と失敗の可能性を減らせます。
- **エラーを隠さない**: 作業ディレクトリが取れなければ、そのエラーを呼び出し側に返します。

## まとめ

- `unixAbs` は、パスを絶対パスにします。
- 絶対パスなら `Clean` だけで返します。
- 相対パスは、作業ディレクトリと `Join` でつなぎます。
