---
title: "NaN を最小として並べる比べ方 sort.Float64Slice.Less"
description: "sort.Float64Slice.Less は、2 つの float64 の大小を比べます。NaN は、ほかのどの数よりも小さいとみなして、並べ替えの中で位置が決まるようにします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/sort.go"
lines: [144, 144]
function: "Less"
difficulty: 2
format: 2
tags: [ソート, 数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`sort.Float64s([]float64{2, math.NaN(), 1})` は、NaN を先頭にして `[NaN 1 2]` のように並べます。NaN は比べると必ず偽になるので、特別な扱いを入れないと、並べ替えが壊れます。

## コード

```go:line-numbers=144
func (x Float64Slice) Less(i, j int) bool { return x[i] < x[j] || (isNaN(x[i]) && !isNaN(x[j])) }
```

## 前提知識

- **NaN**: 「数でない」ことを表す浮動小数点数の値です。NaN と何を比べても、`<` も `==` も偽になります。
- **並べ替えの前提**: 並べ替えは、比べ方が一貫していることを前提にします。NaN が混ざると、その前提が崩れます。
- **`isNaN`**: `f != f` で NaN を判定します。NaN だけが自分自身と等しくないという性質を使います。
- **`x[i] < x[j]`**: 通常の大小の比べ方です。

## 何をしているか

### 1. 普通の大小を比べる

```go:line-numbers=144
func (x Float64Slice) Less(i, j int) bool { return x[i] < x[j] || (isNaN(x[i]) && !isNaN(x[j])) }
```

まず、`x[i] < x[j]` で通常の大小を比べます。どちらも NaN でなければ、これだけで正しく判定できます。

### 2. NaN を小さい側とみなす

```go:line-numbers=144
func (x Float64Slice) Less(i, j int) bool { return x[i] < x[j] || (isNaN(x[i]) && !isNaN(x[j])) }
```

`isNaN(x[i]) && !isNaN(x[j])` は、`i` だけが NaN のときに `true` になります。NaN を、ほかのどの数よりも小さいとみなします。こうすると、NaN どうしや、NaN と数の比較でも、一貫した順序が保たれます。

### 3. 1 行にまとめる

```go:line-numbers=144
func (x Float64Slice) Less(i, j int) bool { return x[i] < x[j] || (isNaN(x[i]) && !isNaN(x[j])) }
```

2 つの条件を `||` でつなぐので、1 行の関数になっています。

## ここがすごい

- **比べ方に全順序を与える**: NaN を含んでも、どの 2 つも必ず大小が決まるので、並べ替えが安定して終わります。
- **NaN の位置が決まる**: 先頭に寄るという決まりがあるので、結果を予想できます。
- **短い式で表現する**: 特別な扱いを、1 行の条件に収めています。

## まとめ

- 通常の大小は `<` で比べる。
- NaN だけが自分と等しくない性質を使って、NaN を最小とみなす。
- 比べ方に全順序を与えると、並べ替えが正しく終わる。
