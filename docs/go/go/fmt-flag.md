---
title: "書式のフラグが立っているかを返す fmt の Flag。- + # 空白 0 を判定する"
description: "fmt の書式を解析する途中で、フラグ（- + # 空白 0）が指定されているかを調べる pp.Flag。書式の文字ごとに、対応する設定を読んで返す。Printf の Formatter の実装者に使われる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/fmt/print.go"
lines: [180, 194]
function: "Flag"
difficulty: 1
tags: [文字列処理, 設計パターン, API設計]
---

## ひとことで

`fmt.Printf("%+d", 5)` の `+` や、`%-5s` の `-` のように、書式にはフラグを付けられます。`pp.Flag(b)` は、そのフラグが指定されているかを返す関数です。`fmt.Formatter` を実装する型は、この情報を `State.Flag` を通して受け取れます。

## コード

```go:line-numbers=180
func (p *pp) Flag(b int) bool {
	switch b {
	case '-':
		return p.fmt.minus
	case '+':
		return p.fmt.plus || p.fmt.plusV
	case '#':
		return p.fmt.sharp || p.fmt.sharpV
	case ' ':
		return p.fmt.space
	case '0':
		return p.fmt.zero
	}
	return false
}
```

## 前提知識

- **フラグ**: 書式の `%` の直後に付ける記号です。`-` は左詰め、`+` は符号を必ず付ける、`#` は別の形式、空白は符号の場所を空ける、`0` は 0 で埋める、を表します。
- **`fmt.Formatter`**: 自分で書式の表示を決めたい型が実装するインタフェースです。`Format(f State, verb rune)` の形を持ちます。
- **`p.fmt` の状態**: 解析中の書式のフラグを、フィールドに保存しています。`minus` や `plus` などが、それぞれのフラグに対応します。
- **`plusV` と `sharpV`**: `%+v` や `%#v` のように、値を詳しく表示する指定の、別のフラグです。

## 何をしているか

### 1. フラグの文字で分岐する

```go:line-numbers=181
	switch b {
	case '-':
		return p.fmt.minus
	case '+':
		return p.fmt.plus || p.fmt.plusV
```

調べたい文字 `b` で分岐します。`-` なら左詰めのフラグ、`+` なら `plus` または `plusV` を返します。`%+v` のように値の表示を詳しくする指定も、`+` が立っていると見なすので、`plusV` も含めます。

### 2. 残りのフラグも同じように

```go:line-numbers=186
	case '#':
		return p.fmt.sharp || p.fmt.sharpV
	case ' ':
		return p.fmt.space
	case '0':
		return p.fmt.zero
	}
	return false
```

`#` は `sharp` と `sharpV`、空白は `space`、`0` は `zero` を返します。対応しない文字は、フラグではないので `false` です。

## ここがすごい

- **書式の内部状態を外に出さない**: 利用者は、フィールドを直接見ずに、`Flag` の文字だけでフラグを確かめられます。内部の表し方を変えても、この関数の形が保たれます。
- **詳細な指定を同じに扱う**: `%+v` と `%+d` の `+` を、同じ `plus` として判定します。書式の意味を、呼び出し側が統一して扱えます。
- **既定は false**: 知らない文字には、フラグがないことを返すので、安全な既定値になっています。

## まとめ

- `Flag` は、書式のフラグ `- + # 空白 0` が指定されているかを返します。
- 値の詳細表示の指定（`plusV` や `sharpV`）も、対応するフラグとして判定します。
- 対応しない文字は `false` を返します。
- `fmt.Formatter` を実装する人が、書式の指定を読むために使えます。
