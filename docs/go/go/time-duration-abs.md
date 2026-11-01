---
title: "期間の絶対値を求める time.Duration.Abs"
description: "time.Duration.Abs は、期間の符号を取り除いた絶対値を返します。最小の負の値だけは、符号を反転すると範囲を超えるので、最大の値に寄せて返します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1158, 1167]
function: "Abs"
difficulty: 2
format: 2
tags: [日時, 数値計算, 防御的プログラミング]
---

## ひとことで

`(-3 * time.Second).Abs()` は `3s` を返します。負の期間を、大きさだけの正の期間にする関数です。

## コード

```go:line-numbers=1158
func (d Duration) Abs() Duration {
	switch {
	case d >= 0:
		return d
	case d == minDuration:
		return maxDuration
	default:
		return -d
	}
}
```

## 前提知識

- **`Duration` の範囲**: `Duration` は、ナノ秒を入れる符号付きの整数です。表せる範囲には、上限と下限があります。
- **整数の符号反転**: 符号付き整数の最小値を反転すると、正の側の上限を超えてしまいます。そのため、特別扱いが必要です。
- **`minDuration` と `maxDuration`**: 表せる最小と最大の期間を表す定数です。
- **`switch` の条件式**: 上から順に条件を調べ、最初に真になったものを実行します。

## 何をしているか

### 1. 0 以上ならそのまま返す

```go:line-numbers=1159
	switch {
	case d >= 0:
		return d
```

期間が 0 以上なら、もう絶対値なので、そのまま返します。

### 2. 最小の負の値は最大の値にする

```go:line-numbers=1162
	case d == minDuration:
		return maxDuration
```

最小の負の値を反転すると、表せる範囲を超えてしまいます。そこで、代わりに最大の期間を返します。ほぼ同じ大きさの期間として扱うための、妥協の決まりです。

### 3. それ以外は符号を反転する

```go:line-numbers=1164
	default:
		return -d
```

残りの負の値は、`-d` で符号を反転すれば、正しい絶対値になります。

## ここがすごい

- **範囲の限界を先に見る**: 反転で起きる溢れを、事前の判定で防いでいます。
- **結果が常に 0 以上になる**: 戻り値は、最大の値を除いて負にならないことが保証されます。
- **短い分岐で済む**: 3 つの場合に分けるだけで、正確さと読みやすさを両立しています。

## まとめ

- 0 以上なら、そのまま返す。
- 最小の負の値は、溢れを防ぐために最大の値に寄せる。
- それ以外は、符号を反転して返す。
