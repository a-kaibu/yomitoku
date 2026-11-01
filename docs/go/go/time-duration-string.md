---
title: "配列をスタックに置き、必要なときだけヒープへ。Duration.String の工夫"
description: "time.Duration を \"1h2m3.5s\" のような文字列にするメソッド。固定長の配列に右から書き込み、最後に必要な部分だけを文字列にします。インライン化でメモリ確保を減らす狙いがあります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [947, 953]
function: "(Duration).String"
difficulty: 2
format: 2
tags: [最適化, メモリ管理, 日時, 標準ライブラリ]
---

## ひとことで

`time.Duration` は時間の長さ（ナノ秒単位の整数）を表す型です。`String()` は、それを **`"1h2m3.5s"` や `"150ms"` のような人が読める文字列** にします。

本体はわずか 3 行で、実際の変換は `format` メソッドに任せています。この「分け方」に、メモリ確保を減らすための工夫があります。

## コード

::: code-group

```go:line-numbers=947 [日本語訳]
func (d Duration) String() string {
	// これはインライン化できるので、「関数の外出し」の利点を生かせる。
	// つまり、文字列をヒープに確保するかどうかを呼び出し側が決められる。
	var arr [32]byte
	n := d.format(&arr)
	return string(arr[n:])
}
```

```go:line-numbers=947 [原文]
func (d Duration) String() string {
	// This is inlinable to take advantage of "function outlining".
	// Thus, the caller can decide whether a string must be heap allocated.
	var arr [32]byte
	n := d.format(&arr)
	return string(arr[n:])
}
```

:::

## 前提知識

- **`Duration`**: `type Duration int64` と定義された型で、ナノ秒（10 億分の 1 秒）の数を表します。`1 * time.Second` は `1000000000` です。
- **`var arr [32]byte`**: 長さ 32 のバイト配列です。配列は（スライスと違って）大きさが固定で、ふつうは関数のスタック（関数の実行中だけ使う高速な領域）に置かれます。
- **`&arr`**: 配列のアドレスを渡しています。`format` はこの配列に直接書き込みます。
- **`string(arr[n:])`**: 配列の `n` 番目から最後までを文字列に変換します。このときバイトがコピーされます。
- **ヒープとスタック**: スタックは関数が終わると自動で片付く速い領域、ヒープはガベージコレクタが管理する領域です。ヒープへの確保は比較的遅く、回収の手間もかかります。
- **インライン展開**: 関数呼び出しを、呼び出し先の中身で置き換えるコンパイラの最適化です。

## 何をしているか

### 1. 作業用の配列を用意する

```go:line-numbers=950
	var arr [32]byte
```

32 バイトあれば、どんな `Duration` でも文字列にできます（最大でも `"-2562047h47m16.854775808s"` の 25 文字程度）。

### 2. 右から書き込む

```go:line-numbers=951
	n := d.format(&arr)
```

`format` は配列の **末尾から前に向かって** 文字を書き、書き始めた位置 `n` を返します。数字は下の桁から求まるので、右から書くと並べ替えが要りません。
`1h2m3.5s` なら、配列の後ろ 8 バイトに書かれ、`n = 24` が返ります。

### 3. 使った部分だけを文字列にする

```go:line-numbers=952
	return string(arr[n:])
```

`arr[24:]` の 8 バイトを文字列にして返します。

## ここがすごい

コメントが核心です。

- **インライン化させるために小さくしている**: `String` を 3 行の小さな関数にしておくと、呼び出し元にインライン展開されます。すると `arr` は呼び出し元の関数の中の配列として扱われます。
- **文字列をヒープに置くかを呼び出し元が決められる**: インライン展開された後、コンパイラは「この文字列が関数の外に出ていくか」を呼び出し元の文脈で判断できます。たとえば `fmt.Println(d.String())` のように外に出るならヒープに置きますが、`if d.String() == "1s"` のようにその場で使って捨てるなら、文字列もスタックに置けます。これが「function outlining」（重い本体を外に出し、軽い外側をインライン化する手法）の狙いです。
- **右から書く**: 数字を下の桁から求めて右から書けば、一時的な並べ替えも余計なバッファも要りません。

## まとめ

- 固定長の配列は、スタックに置ける作業用バッファとして使える。
- 小さな外側の関数と重い本体を分けると、外側がインライン化され、メモリ確保を呼び出し元の状況に合わせて減らせる。
- 数字を文字にするときは、配列の右から書くと反転が要らない。
