---
title: "整数の秒と小数の秒に分けてから、浮動小数点数に直す Duration.Seconds"
description: "time.Duration.Seconds は、時間の長さを秒の小数で返します。ナノ秒の整数をまず秒と端数に分け、秒の部分は整数のまま、端数だけを小数にしてから足すことで、大きな値でも精度を保ちます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1090, 1094]
function: "(Duration).Seconds"
difficulty: 2
format: 2
tags: [数値計算, 日時, 標準ライブラリ]
---

## ひとことで

`time.Duration` は、ナノ秒の整数で時間の長さを表します。`Seconds()` は、それを秒の小数（`float64`）にして返します。`1500 * time.Millisecond` は `1.5` を返します。

ふつうに `float64(d) / 1e9` と書けばよさそうですが、この関数は計算の順番に工夫をしています。

## コード

```go:line-numbers=1090
func (d Duration) Seconds() float64 {
	sec := d / Second
	nsec := d % Second
	return float64(sec) + float64(nsec)/1e9
}
```

## 前提知識

- **`Duration`**: `int64` の別名で、ナノ秒の数を表します。`Second` は `1e9` ナノ秒の定数です。
- **整数の割り算と余り**: `d / Second` は秒の整数部分、`d % Second` は余りのナノ秒です。
- **`float64` の精度**: `float64` の仮数部は 53 ビットです。整数はおよそ 2^53 までなら正確に表せますが、それを超えると 1 ずつの違いが消えます。
- **`1e9`**: 10 の 9 乗、1 秒のナノ秒数です。

## 何をしているか

`d = 1500000000`（1.5 秒）で追います。

### 1. 整数の秒と余りに分ける

```go:line-numbers=1091
	sec := d / Second
	nsec := d % Second
```

`sec = 1`、`nsec = 500000000` です。どちらも整数なので、誤差は出ません。

### 2. 別々に小数に直して足す

```go:line-numbers=1093
	return float64(sec) + float64(nsec)/1e9
```

`float64(sec) = 1.0`、`float64(nsec)/1e9 = 0.5` を足して `1.5` を返します。

## ここがすごい

- **大きな値で精度を保つ**: ナノ秒の総量を一度に `float64` にすると、長い時間では 1 ナノ秒の違いが消えてしまいます。秒の部分は整数のまま保ち、小さい端数だけを小数にするので、秒の部分は正確です。
- **端数は必ず 1 秒未満**: `nsec` は 0 から `1e9-1` の間なので、`float64(nsec)/1e9` は 1 未満の小数です。その分の誤差は、結果全体に対して小さくなります。
- **割り算を 1 回ずつ**: 整数の割り算と余りを、それぞれ 1 回だけ使います。短い式で、意図が読み取りやすくなっています。

## まとめ

- 大きな整数を小数に直すときは、整数部分と端数に分けて扱うと精度が保たれる。
- 整数の割り算と余りを使うと、分ける処理が簡単になる。
- 浮動小数点数の仮数部の大きさを意識すると、精度の問題が見えてくる。
