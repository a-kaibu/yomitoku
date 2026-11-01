---
title: "1 行のビット演算で「大きさは f、符号は sign」の数を作る"
description: "math.Copysign は、f の絶対値に sign の符号を付けた値を返します。符号ビットだけを入れ替えるビット演算 1 行で書かれています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2010 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/math/copysign.go"
lines: [9, 11]
function: "Copysign"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

`math.Copysign(f, sign)` は、**大きさ（絶対値）は `f`、符号は `sign`** の浮動小数点数を返します。
`Copysign(3, -1)` は `-3`、`Copysign(-3, 2)` は `3`、`Copysign(0, -1)` は `-0` です。

中身は 1 行で、`f` の符号ビットを消し、`sign` の符号ビットだけを持ってきて合成しています。

## コード

```go:line-numbers=9
func Copysign(f, sign float64) float64 {
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
}
```

`signMask` は `1 << 63`、最上位ビット（符号ビット）だけが 1 の値です。

## 前提知識

- **`float64` の符号ビット**: `float64` の 64 ビットのうち、最上位の 1 ビットが符号です（0 なら正、1 なら負）。残りの 63 ビットが大きさを表します。
- **`Float64bits` と `Float64frombits`**: `float64` のビットを、そのまま `uint64` の整数として取り出したり、戻したりする関数です。
- **`&^`**: AND NOT。`a &^ m` は `a` から `m` の 1 の位置を消します。
- **`&`**: AND。`a & m` は `a` のうち `m` の 1 の位置だけを残します。
- **`|`**: OR。2 つのビット列を合わせます。
- **演算子の優先順位**: Go では `&^` と `&` が `|` より先に計算されます。

## 何をしているか

```go:line-numbers=10
	return Float64frombits(Float64bits(f)&^signMask | Float64bits(sign)&signMask)
```

式を分解すると次の 3 段階です。

1. `Float64bits(f) &^ signMask` … `f` の符号ビットを 0 にする（絶対値のビット）
2. `Float64bits(sign) & signMask` … `sign` の符号ビットだけを取り出す
3. 2 つを `|` で合わせる

### 具体例: `Copysign(3, -1)`

```
3  のビット = 0x4008000000000000
-1 のビット = 0xBFF0000000000000

3 &^ signMask  = 0x4008000000000000
-1 & signMask  = 0x8000000000000000
OR             = 0xC008000000000000  → -3
```

## ここがすごい

- **比較を使わない**: `if sign < 0 { return -Abs(f) }` のように書くこともできますが、`-0` の符号を判定できません（`-0 < 0` は偽）。ビットで符号を取り出せば、`-0` の符号も NaN の符号もそのままコピーできます。
- **符号付きゼロを作れる**: `Copysign(0, x)` は「`x` と同じ符号の 0」を作る定番の書き方で、`math.Trunc` などの内部でも使われています。計算の途中で符号を失わないための重要な道具です。
- **「大きさ」と「符号」を分けて考える**: IEEE 754 の浮動小数点数は、符号と大きさが別のビットで表されています（符号と絶対値表現）。この構造を素直に使うと、符号に関する操作はすべて 1 ビットの操作になります。`Abs`、`Signbit`、`Copysign` はすべてこの考え方で書かれています。

## まとめ

- `float64` の符号は最上位の 1 ビットだけで表されている。
- マスクで「大きさのビット」と「符号のビット」を切り分け、OR で合成すれば符号のコピーができる。
- 比較では扱えない `-0` や NaN の符号も、ビット演算なら正しく扱える。
