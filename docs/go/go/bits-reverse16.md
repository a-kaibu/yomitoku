---
title: "16 ビットの並びを 2 回の表引きで逆順にする bits.Reverse16"
description: "bits.Reverse16 は、16 ビットの値のビットの並びを逆にします。上位 8 ビットと下位 8 ビットをそれぞれ Reverse8 の表で逆にして、入れ替えて組み立てます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2017 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/bits/bits.go"
lines: [239, 241]
function: "Reverse16"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 標準ライブラリ]
---

## ひとことで

`bits.Reverse16(0x0001)` は `0x8000` を返します。16 ビットの並びを左右反対にします。8 ビットの表を、上下に分けて使うことで、16 ビットの答えを作ります。

## コード

```go:line-numbers=239
func Reverse16(x uint16) uint16 {
	return uint16(rev8tab[x>>8]) | uint16(rev8tab[x&0xff])<<8
}
```

## 前提知識

- **上位と下位のバイト**: 16 ビットの値は、上位 8 ビットと下位 8 ビットに分けられます。
- **右シフト `x>>8`**: 上位 8 ビットを、下位へ移します。
- **マスク `x&0xff`**: 下位 8 ビットだけを取り出します。
- **`rev8tab`**: 8 ビットの逆順の表です。`Reverse8` が使っているものと同じです。

## 何をしているか

### 1. 上位 8 ビットを逆にする

```go:line-numbers=240
	return uint16(rev8tab[x>>8]) | uint16(rev8tab[x&0xff])<<8
```

`x>>8` で上位 8 ビットを下位へ移し、`rev8tab` で逆順にします。これが、結果の下位側に入ります。

### 2. 下位 8 ビットを逆にして上へ移す

```go:line-numbers=240
	return uint16(rev8tab[x>>8]) | uint16(rev8tab[x&0xff])<<8
```

`x&0xff` で下位 8 ビットを取り出し、`rev8tab` で逆順にします。`<<8` で上位側へずらします。元の下位が、逆順になって上位へ入ります。

### 3. 2 つを合わせる

```go:line-numbers=240
	return uint16(rev8tab[x>>8]) | uint16(rev8tab[x&0xff])<<8
```

`|` で 2 つの 8 ビットを合わせると、16 ビット全体の逆順になります。

## ここがすごい

- **表を再利用する**: 16 ビットの表を新しく作らず、8 ビットの表を 2 回使うので、メモリの使用が少なく済みます。
- **分けて考えやすい**: 上位と下位を別々に逆にして、入れ替えるという、理解しやすい手順になっています。
- **ずらしと合成だけで完結する**: 計算はシフトと OR だけなので、速く動きます。

## まとめ

- 上位 8 ビットと下位 8 ビットを、それぞれ `rev8tab` で逆にする。
- 逆にした下位を上位へずらし、上位を下位へ入れる形で合わせる。
- 8 ビットの表だけで、16 ビットの逆順が作れる。
