---
title: "時刻の秒を取り出す time の sec。単調時計の印があれば、ビットから読む"
description: "time パッケージの Time.sec。時刻の秒の部分を返す。wall の上位ビットに単調時計の印があれば、ビットを読み取って秒を計算する。印がなければ、ext に入っている値をそのまま返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [181, 186]
function: "sec"
difficulty: 3
tags: [日時, ビット演算, 最適化]
---

## ひとことで

`t.sec()` は、時刻の「秒」の部分を返します。`time.Time` は、一つの 64 ビット値（`wall`）の中に、単調時計の印やナノ秒の情報を詰めています。秒がどこにあるかは、その印の有無で変わります。

単調時計の印があれば、`wall` の中のビットを取り出して秒を計算します。印がなければ、秒は別の欄 `ext` に入っているので、そのまま返します。

## コード

```go:line-numbers=181
func (t *Time) sec() int64 {
	if t.wall&hasMonotonic != 0 {
		return wallToInternal + int64(t.wall<<1>>(nsecShift+1))
	}
	return t.ext
}
```

## 前提知識

- **単調時計（monotonic clock）**: 時刻の変更に影響されず、常に進み続ける時計です。時間の差を測るのに使われます。
- **`wall` と `ext`**: `Time` の中の二つの欄です。`wall` は、ナノ秒と印などを詰めた値、`ext` は秒を入れる値です。
- **`hasMonotonic`**: `wall` の中に、単調時計の値が入っていることを示す印のビットです。
- **ビットシフト**: `t.wall<<1>>(nsecShift+1)` は、左右にずらして、上位の秒の部分だけを取り出す操作です。

## 何をしているか

### 1. 印があれば、ビットから秒を計算する

```go:line-numbers=182
	if t.wall&hasMonotonic != 0 {
		return wallToInternal + int64(t.wall<<1>>(nsecShift+1))
	}
```

`wall` に印のビットが立っているかを、`&` で調べます。立っていれば、`wall` のビットを左右にずらして、秒の部分だけを取り出します。その値に `wallToInternal` を足して、内部の基準の秒に直します。

### 2. 印がなければ ext をそのまま返す

```go:line-numbers=185
	return t.ext
```

印がなければ、秒は `ext` に入っています。そのまま返します。

## ここがすごい

- **一つの値に詰める**: 秒、ナノ秒、印を一つの 64 ビットにまとめるので、`Time` の大きさを小さく保てます。
- **印で形を切り替える**: 一つのビットを見るだけで、どちらの形で値が入っているかが分かります。
- **必要なときだけ計算**: 印があるときだけ、ビットの計算をします。ないときは、ただの値の読み取りで済みます。

## まとめ

- `sec` は、時刻の秒の部分を返します。
- 単調時計の印があれば、`wall` のビットから計算します。
- 印がなければ、`ext` の値をそのまま返します。
