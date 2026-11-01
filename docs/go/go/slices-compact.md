---
title: "隣り合う重複を、同じ配列の中で詰める。余った部分はゼロにする Compact"
description: "slices.Compact は、隣り合って並んだ同じ値を 1 つにまとめます。新しい配列を作らず、読む位置より後ろには書かないことで、元の配列の中だけで詰めます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2021 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/slices/slices.go"
lines: [371, 390]
function: "Compact"
difficulty: 2
format: 2
tags: [アルゴリズム, メモリ管理, 標準ライブラリ, ジェネリクス]
---

## ひとことで

`slices.Compact(s)` は、同じ値が隣り合って続いている部分を、1 つにまとめます。`[1, 1, 2, 2, 3]` は `[1, 2, 3]` になります。

ふつうは、結果を入れる新しいスライスを作りたくなりますが、この関数は **元の配列の中で詰めて** 結果を返します。新しいメモリを確保しないので、効率がよい関数です。

## コード

::: code-group

```go:line-numbers=371 [日本語訳]
func Compact[S ~[]E, E comparable](s S) S {
	if len(s) < 2 {
		return s
	}
	for k := 1; k < len(s); k++ {
		if s[k] == s[k-1] {
			s2 := s[k:]
			for k2 := 1; k2 < len(s2); k2++ {
				if s2[k2] != s2[k2-1] {
					s[k] = s2[k2]
					k++
				}
			}

			clear(s[k:]) // 不要になった要素をゼロ値（nil）にする。GC のため。
			return s[:k]
		}
	}
	return s
}
```

```go:line-numbers=371 [原文]
func Compact[S ~[]E, E comparable](s S) S {
	if len(s) < 2 {
		return s
	}
	for k := 1; k < len(s); k++ {
		if s[k] == s[k-1] {
			s2 := s[k:]
			for k2 := 1; k2 < len(s2); k2++ {
				if s2[k2] != s2[k2-1] {
					s[k] = s2[k2]
					k++
				}
			}

			clear(s[k:]) // zero/nil out the obsolete elements, for GC
			return s[:k]
		}
	}
	return s
}
```

:::

## 前提知識

- **`comparable`**: `==` で比べられる型を表す制約です。`int` や `string` は使えますが、スライスそのものは使えません。
- **`clear(s[k:])`**: 範囲の要素をすべてゼロ値にする組み込み関数です。ポインタの要素ならば `nil` になります。
- **ガベージコレクタ（GC）**: 使われなくなったメモリを自動で回収する仕組みです。配列の後ろに古い参照が残っていると、回収されずに残ってしまいます。
- **スライスの再スライス `s[:k]`**: 先頭から `k` 個だけの長さを持つ、新しいスライスを作ります。コピーはしません。

## 何をしているか

`s = [1, 1, 2, 2, 3]` で追います。

### 1. 最初の重複を探す

```go:line-numbers=375
	for k := 1; k < len(s); k++ {
		if s[k] == s[k-1] {
```

`k = 1` で `s[1] == s[0]`（`1 == 1`）を見つけます。ここから詰める作業を始めます。

### 2. 残りを前に詰める

```go:line-numbers=377
			s2 := s[k:]
			for k2 := 1; k2 < len(s2); k2++ {
				if s2[k2] != s2[k2-1] {
					s[k] = s2[k2]
					k++
				}
			}
```

`s2 = [1, 2, 2, 3]` で、値が変わったところだけを前へ書きます。`2` が出たところで `s[1] = 2` にし、次の `3` で `s[2] = 3` にします。`k` は書いた個数になり、`k = 3` になります。書く位置は、読んでいる位置より後ろに出ないので、読み取り中の値を壊しません。

### 3. 余りをゼロにして切る

```go:line-numbers=385
			clear(s[k:]) // zero/nil out the obsolete elements, for GC
			return s[:k]
```

`s` は `[1, 2, 3, 2, 3]` の状態です。後ろの 2 要素をゼロにして `[1, 2, 3, 0, 0]` とし、`s[:3]` を返します。

## ここがすごい

- **書く位置は読む位置を追い越さない**: 書き込み先の `k` は、読んでいる `k2` より必ず後ろか同じです。だから、まだ読んでいない値を上書きする心配がありません。
- **新しい配列を作らない**: 結果は元の配列の先頭部分です。メモリの確保は一度もありません。
- **余りをゼロにする理由がコメントにある**: 切り捨てた後ろの部分に古いポインタが残ると、GC がその先のオブジェクトを回収できません。`clear` でそれを防いでいます。

## まとめ

- 重複を除く処理は、読む位置と書く位置を分けると、同じ配列の中で詰められる。
- 切り捨てた後ろの要素は、ゼロにしてから返すと、GC の負担が増えない。
- 結果の長さは `s[:k]` で表せば、コピーなしで済む。
