---
title: "時間を小数の時間数にする time.Duration.Hours"
description: "time.Duration.Hours は、期間を小数の時間数にします。整数の時間の部分と、残りの時間の部分を分けて計算し、精度を保ちます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1104, 1108]
function: "Hours"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`(90 * time.Minute).Hours()` は `1.5` を返します。`time.Duration` は、内部ではナノ秒の整数です。その期間を「時間」の単位の小数に直します。

## コード

```go:line-numbers=1104
func (d Duration) Hours() float64 {
	hour := d / Hour
	nsec := d % Hour
	return float64(hour) + float64(nsec)/(60*60*1e9)
}
```

## 前提知識

- **`Duration`**: 期間を、ナノ秒を単位とする整数で表す型です。`time.Hour` は、その 1 時間ぶんの値です。
- **整数の割り算と余り**: `d / Hour` は、切り捨てた整数の時間数です。`d % Hour` は、1 時間に満たない残りです。
- **`float64` への変換**: 小数の計算にするため、整数を浮動小数点数に変換します。
- **精度の問題**: 大きな整数を先に小数にすると、桁の精度を失うことがあります。

## 何をしているか

### 1. 整数の時間数を取り出す

```go:line-numbers=1105
	hour := d / Hour
```

`d / Hour` は、期間に含まれる完全な時間の数です。整数の割り算なので、端数は切り捨てられます。

### 2. 1 時間未満の残りを求める

```go:line-numbers=1106
	nsec := d % Hour
```

`d % Hour` は、完全な時間を除いた残りの期間です。まだナノ秒の整数のままです。

### 3. 残りを小数にして足す

```go:line-numbers=1107
	return float64(hour) + float64(nsec)/(60*60*1e9)
```

残りを `60*60*1e9`（1 時間のナノ秒数）で割り、小数の時間にします。それに整数の時間数を足すと、全体の時間数になります。

## ここがすごい

- **大きな数を先に小数にしない**: 全体をそのまま小数にすると、ナノ秒の精度が落ちることがあります。整数の部分と端数を分ければ、精度を保てます。
- **割り算を 2 回に分ける**: 完全な時間と残りを分けることで、どちらも扱いやすい値になります。
- **単位を定数で表す**: `Hour` という名前の定数で単位を示すので、数値の意味が読み手にも伝わります。

## まとめ

- 期間を、完全な時間の数と残りに分ける。
- 残りだけを小数にして、整数の時間数に足す。
- 大きな数を先に小数にしないことで、精度を守る。
