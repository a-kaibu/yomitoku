---
title: "単位の倍数に切り捨てる time.Time.Truncate"
description: "time.Time.Truncate は、時刻を指定した期間の倍数に切り捨てます。単調時計の値は取り除き、期間が 0 以下なら何もしません。たとえば 1 時間単位に揃えるときに使います。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1780, 1787]
function: "Truncate"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`t.Truncate(time.Hour)` は、時刻の分と秒を 0 にして、その時間の始まりに揃えます。ログを時間ごとに集計するときなどに使えます。

## コード

```go:line-numbers=1780
func (t Time) Truncate(d Duration) Time {
	t.stripMono()
	if d <= 0 {
		return t
	}
	_, r := div(t, d)
	return t.Add(-r)
}
```

## 前提知識

- **期間の倍数**: 起点（ゼロ時刻）から数えて、期間の整数倍になる時刻です。
- **余り**: `div` は、時刻を期間で割ったときの商と余りを返す内部の関数です。余りが、期間の始まりからの経過です。
- **単調時計の除去**: `stripMono` は、単調時計の値を取り除きます。切り捨ての結果は、壁時計の時刻として扱われます。
- **期間が 0 以下**: 割り算ができないので、時刻をそのまま返します。

## 何をしているか

### 1. 単調時計を取り除く

```go:line-numbers=1781
	t.stripMono()
```

切り捨ては、壁時計の上での位置を求めます。そのため、単調時計の値を先に取り除きます。

### 2. 期間が正しいかを確かめる

```go:line-numbers=1782
	if d <= 0 {
		return t
	}
```

期間が 0 以下なら、割れる倍数が無いので、時刻をそのまま返します。

### 3. 余りを引いて揃える

```go:line-numbers=1785
	_, r := div(t, d)
	return t.Add(-r)
```

`div` で、期間の何倍目かを表す余り `r` を求めます。その余りを時刻から引けば、期間の倍数の時刻になります。

## ここがすごい

- **割り算を 1 回で済ませる**: 商を捨てて余りだけを使うので、切り捨ての計算は 1 回の割り算になります。
- **不正な期間を黙って通す**: 0 以下の期間は、エラーにせずそのまま返します。呼び出し側は、期間が正しいことを前提にできます。
- **単調時計との関係を明確にする**: 壁時計の上での処理と分けて、取り除く手順を最初に置いています。

## まとめ

- 単調時計を取り除き、壁時計の上で切り捨てを行う。
- 期間が 0 以下なら、時刻をそのまま返す。
- 余りを引くと、期間の倍数の時刻に揃う。
