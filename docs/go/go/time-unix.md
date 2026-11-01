---
title: "秒とナノ秒から時刻を作る time.Unix"
description: "time.Unix は、1970 年 1 月 1 日からの秒数とナノ秒数から、時刻を作ります。ナノ秒が範囲を外れていれば、秒に繰り上げたり繰り下げたりして正しい値にします。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1653, 1664]
function: "Unix"
difficulty: 2
format: 2
tags: [日時, 数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`time.Unix(1700000000, 0)` は、その秒数に当たる時刻を返します。ナノ秒が 10 億以上や負の値でも、秒の側に吸収して、正しい時刻になります。

## コード

```go:line-numbers=1653
func Unix(sec int64, nsec int64) Time {
	if nsec < 0 || nsec >= 1e9 {
		n := nsec / 1e9
		sec += n
		nsec -= n * 1e9
		if nsec < 0 {
			nsec += 1e9
			sec--
		}
	}
	return unixTime(sec, int32(nsec))
}
```

## 前提知識

- **Unix 時間**: 1970 年 1 月 1 日 00:00:00 UTC からの経過秒数です。
- **ナノ秒の範囲**: 1 秒は 10 億（1e9）ナノ秒です。秒の小数部分は、0 以上 10 億未満になるべきです。
- **整数の割り算**: `nsec / 1e9` は、何秒ぶんかを切り捨てて求めます。
- **符号付きの剰余**: 負のナノ秒を扱うときは、負の側にずれるので、調整が必要です。

## 何をしているか

### 1. 範囲の外なら秒に寄せる

```go:line-numbers=1654
	if nsec < 0 || nsec >= 1e9 {
		n := nsec / 1e9
		sec += n
		nsec -= n * 1e9
```

ナノ秒が 0 未満か、10 億以上なら、その分の秒数を `n` として求めます。`sec` に加え、`nsec` からその分を引きます。

### 2. 負の端数を繰り上げる

```go:line-numbers=1658
		if nsec < 0 {
			nsec += 1e9
			sec--
		}
```

割り算は、ゼロに向かって切り捨てます。そのため、負のナノ秒が残ったときは、1 秒を借りて正の値にします。`sec` を 1 減らすのは、借りた分の帳尻を合わせるためです。

### 3. 時刻を作る

```go:line-numbers=1663
	return unixTime(sec, int32(nsec))
```

範囲に収まった秒とナノ秒を、内部の形に変える `unixTime` に渡して、時刻を作ります。

## ここがすごい

- **どんな値でも正しくなる**: 範囲の外の値を、秒の側に寄せることで、呼び出し側が面倒な計算をしなくて済みます。
- **端数の扱いを明確にする**: 負の端数を 1 秒借りる処理で、常に 0 以上のナノ秒になります。
- **秒の計算を 1 か所に集める**: 繰り上げや繰り下げを、この関数だけで行います。

## まとめ

- ナノ秒が範囲を外れていれば、秒に寄せる。
- 負の端数は、1 秒借りて正の値にする。
- 整った秒とナノ秒から、時刻を作る。
