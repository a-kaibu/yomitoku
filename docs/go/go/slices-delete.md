---
title: "範囲を取り除き、残りを詰める slices.Delete"
description: "slices.Delete は、スライスの i 以上 j 未満の要素を取り除き、後ろの要素を前に詰めます。取り除いた後ろに残る古い要素は、ゼロ値にして GC の対象にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [224, 235]
function: "Delete"
difficulty: 2
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`slices.Delete(s, 1, 3)` は、添字 1 と 2 の要素を取り除き、後ろを詰めます。取り除いた分だけ、新しいスライスは短くなります。

## コード

::: code-group

```go:line-numbers=224 [日本語訳]
func Delete[S ~[]E, E any](s S, i, j int) S {
	_ = s[i:j:len(s)] // 範囲の確認。

	if i == j {
		return s
	}

	oldlen := len(s)
	s = append(s[:i], s[j:]...)
	clear(s[len(s):oldlen]) // 使われなくなった要素をゼロ値にして、GC が回収できるようにする。
	return s
}
```

```go:line-numbers=224 [原文]
func Delete[S ~[]E, E any](s S, i, j int) S {
	_ = s[i:j:len(s)] // bounds check

	if i == j {
		return s
	}

	oldlen := len(s)
	s = append(s[:i], s[j:]...)
	clear(s[len(s):oldlen]) // zero/nil out the obsolete elements, for GC
	return s
}
```

:::

## 前提知識

- **スライスの `append`**: `append(s[:i], s[j:]...)` は、後ろの要素を前の位置へ詰めます。同じ配列を書き換えます。
- **半開区間 `[i, j)`**: `i` は含み、`j` は含みません。`Delete(s, 1, 3)` は、添字 1 と 2 が対象です。
- **三つ目の添字**: `s[i:j:len(s)]` の 3 つ目は、容量の上限を表します。
- **`clear`**: 組み込み関数で、要素をゼロ値に戻します。

## 何をしているか

### 1. 範囲を確かめる

```go:line-numbers=225
	_ = s[i:j:len(s)] // 範囲の確認。

	if i == j {
		return s
	}
```

`s[i:j:len(s)]` は、範囲が正しいかを確かめるための式です。範囲が不正なら、ここで `panic` します。`i == j` のときは、何も取り除かないので、そのまま `s` を返します。

### 2. 後ろを詰めて古い要素を消す

```go:line-numbers=231
	oldlen := len(s)
	s = append(s[:i], s[j:]...)
```

`oldlen` に元の長さを覚えてから、`append(s[:i], s[j:]...)` で後ろを前へ詰めます。配列の中身は書き換わりますが、長さは短くなります。

### 3. 余った位置をゼロにして返す

```go:line-numbers=233
	clear(s[len(s):oldlen]) // 使われなくなった要素をゼロ値にして、GC が回収できるようにする。
	return s
```

詰めたあとの配列の末尾に、古い要素が残ります。`clear` でゼロ値にして、それらが使われ続けないようにします。これで、GC が回収できるようになります。

## ここがすごい

- **同じ配列の中で詰める**: 新しい配列を確保せず、もとの領域を使うので、速くて無駄がありません。
- **古い要素を残さない**: ポインタを含む型では、取り除いたはずの値が参照され続けるのを防ぎます。
- **範囲の誤りを早く見つける**: 最初の式で範囲を確かめるので、不正な位置で壊れた状態になりません。

## まとめ

- 範囲 `[i, j)` を取り除き、後ろを前へ詰める。
- 詰めたあとの古い要素は、`clear` でゼロ値にする。
- 新しい配列を作らず、同じ領域の中で済ませる。
