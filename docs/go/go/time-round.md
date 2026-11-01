---
title: "単位の倍数に最も近い値へ丸める time.Time.Round"
description: "time.Time.Round は、時刻を指定した期間の倍数のうち、最も近いものへ丸めます。半分より小さければ切り捨て、そうでなければ切り上げます。単調時計の値は取り除きます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1797, 1807]
function: "Round"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Round(time.Hour)` は、時刻を最も近い時間の始まりに揃えます。`Truncate` が切り捨てるのに対して、こちらは「近い方」へ丸めます。

## コード

```go:line-numbers=1797
func (t Time) Round(d Duration) Time {
	t.stripMono()
	if d <= 0 {
		return t
	}
	_, r := div(t, d)
	if lessThanHalf(r, d) {
		return t.Add(-r)
	}
	return t.Add(d - r)
}
```

## 前提知識

- **`Truncate` との違い**: `Truncate` は、常に小さい方の倍数へ切り捨てます。`Round` は、近い方の倍数を選びます。
- **`div`**: 時刻を期間で割った商と余りを返す内部の関数です。余りは、直前の倍数からの経過です。
- **`lessThanHalf`**: 余りが期間の半分より小さいかを判定する内部の関数です。
- **単調時計**: 壁時計の上で丸めるために、先に取り除きます。

## 何をしているか

### 1. 単調時計を取り除き、不正な期間を除く

```go:line-numbers=1798
	t.stripMono()
	if d <= 0 {
		return t
	}
```

丸めは壁時計の上で行うので、単調時計の値を先に取り除きます。期間が 0 以下なら、丸める先がないので、時刻をそのまま返します。

### 2. 余りを求める

```go:line-numbers=1802
	_, r := div(t, d)
```

`div` で、期間の倍数からの余り `r` を求めます。

### 3. 半分より小さければ切り捨てる

```go:line-numbers=1803
	if lessThanHalf(r, d) {
		return t.Add(-r)
	}
```

余りが期間の半分より小さいなら、直前の倍数が近いので、余りを引きます。

### 4. 半分以上なら切り上げる

```go:line-numbers=1806
	return t.Add(d - r)
```

そうでなければ、次の倍数の方が近いので、期間から余りを引いたぶんを足します。

## ここがすごい

- **近い方へ丸める**: 半分との比較で、切り捨てと切り上げを切り替えるので、誤差が最も小さくなります。
- **`Truncate` と部品を共有する**: 余りを求める `div` を使い回し、丸めの方向だけを変えています。
- **不正な期間を黙って通す**: 0 以下の期間は、そのまま返すので、呼び出し側は値を前提にできます。

## まとめ

- 余りが期間の半分より小さければ切り捨て、そうでなければ切り上げる。
- `Truncate` と同じ余りの計算を使い、丸めの方向だけを変える。
- 単調時計を先に取り除いてから、壁時計の上で丸める。
