---
title: "比較の向きを入れ替えた「包み」を返すだけで、降順に並べる sort.Reverse"
description: "sort.Reverse は、元の並べ替えの対象を包んで、Less の引数の順番を入れ替えた値を返します。並べ替えの関数を書き直さずに、降順にできます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sort/sort.go"
lines: [102, 104]
function: "Reverse"
difficulty: 2
format: 2
tags: [ソート, 設計パターン, 標準ライブラリ, 可読性]
---

## ひとことで

`sort.Sort(sort.Reverse(sort.IntSlice(s)))` のように書くと、整数のスライスを大きい順に並べられます。`sort.Reverse` は、並べ替えの対象を包んだ新しい値を返すだけです。

並べ替えの関数（`sort.Sort`）は、何も知らずに「小さいかどうか」を聞くだけです。その答えを逆にしておけば、結果は降順になります。

## コード

```go:line-numbers=102
func Reverse(data Interface) Interface {
	return &reverse{data}
}
```

## 前提知識

- **`Interface`**: `Len`、`Less`、`Swap` を持つインターフェースです。`sort.Sort` はこのインターフェースを使って並べ替えます。
- **埋め込み（embedding）**: 構造体の中に型を埋め込むと、その型のメソッドを自分のメソッドとして使えます。`reverse` は `Interface` を埋め込んでいるので、`Len` と `Swap` は元の値のものがそのまま使われます。
- **ポインタを返す `&reverse{data}`**: 構造体のポインタを作って、`Interface` として返します。
- **`Less(j, i)`**: 引数を入れ替えると、「小さい」が「大きい」になります。

## 何をしているか

### 1. 包みを作る

```go:line-numbers=103
	return &reverse{data}
```

元のデータを `reverse` の中に入れて、ポインタを返します。データそのものはコピーされません。

### 2. Less の向きを逆にする

```go:line-numbers=98
	return r.Interface.Less(j, i)
```

`reverse` の `Less(i, j)` は、元の `Less(j, i)` を呼びます。`i` が `j` より小さいかを聞くと、元のデータで「`j` が `i` より小さいか」を調べます。つまり、大きいものが前に来る並びになります。

具体例として `[1, 3, 2]` を降順に並べるとき、`Less(1, 0)` は `Interface.Less(0, 1)`（`1 < 3`）になり `true` です。そのため、`3` が先に来るように入れ替えられます。

## ここがすごい

- **アルゴリズムを複製しない**: 降順のための並べ替えを、新しく書く必要がありません。`Less` の答えを逆にするだけで、どんな並べ替えでも降順になります。
- **包むだけで機能が増える**: 元の型を変えず、ラップした値を渡すだけで振る舞いを変えられます。デコレータのような設計です。
- **`Len` と `Swap` は変えない**: 埋め込みを使うので、データの長さや入れ替えの方法は元のままです。変えるのは比べる向きだけに絞られています。

## まとめ

- 並べ替えの向きを変えたいときは、比較の結果を逆にする包みを作る。
- 埋め込みを使うと、変えたいメソッドだけを書き換えられる。
- 元の関数を変えずに振る舞いを変える方法は、設計の基本になる。
