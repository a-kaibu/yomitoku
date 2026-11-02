---
title: "NaN を最小として比べる cmp.Less"
description: "cmp.Less は、2 つの値の大小を比べます。浮動小数点数の NaN は、どの数とも大小が決まらないので、NaN を最小とみなして、並べ替えが壊れないようにします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2023 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/cmp/cmp.go"
lines: [28, 30]
function: "Less"
difficulty: 2
format: 2
tags: [型システム, ジェネリクス, ソート, 防御的プログラミング]
---

## ひとことで

`cmp.Less(1.0, 2.0)` は `true` を返します。ふつうの `<` と同じ結果になりますが、NaN が混ざったときにも、並べ替えが正しく終わるように作られています。

## コード

```go:line-numbers=28
func Less[T Ordered](x, y T) bool {
	return (isNaN(x) && !isNaN(y)) || x < y
}
```

## 前提知識

- **NaN**: 数でないことを表す浮動小数点数の値です。NaN と比べると、`<` は必ず偽になります。
- **全順序**: どの 2 つの値についても、前後の関係が必ず 1 つに決まる比べ方です。並べ替えは、全順序を前提にします。
- **ジェネリクス**: `T Ordered` の制約で、整数、文字列、浮動小数点数など、比べられる型に同じ関数を使えます。
- **`isNaN`**: 値が自分自身と等しくないかで、NaN を判定する内部の関数です。

## 何をしているか

### 1. NaN を最小とみなす

```go:line-numbers=29
	return (isNaN(x) && !isNaN(y)) || x < y
```

`isNaN(x) && !isNaN(y)` は、`x` だけが NaN のときに真です。NaN を、どの数よりも小さいとみなします。

### 2. 通常の大小を比べる

```go:line-numbers=29
	return (isNaN(x) && !isNaN(y)) || x < y
```

それ以外は、`x < y` で通常どおり比べます。`||` の右側がそれにあたります。

## ここがすごい

- **全順序が保たれる**: NaN を含んでも、どの 2 つの値の前後も決まるので、並べ替えが安定して終わります。
- **分岐が 1 行に収まる**: 特別な場合を、条件式の 1 行で表しています。
- **`Compare` と揃っている**: 同じ決まりを `Compare` でも使っているので、2 つの関数の結果が食い違いません。

## まとめ

- NaN は、ほかのどの数よりも小さいとみなす。
- それ以外は、通常の `<` で比べる。
- 全順序を保つので、並べ替えが正しく終わる。
