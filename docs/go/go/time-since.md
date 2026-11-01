---
title: "今からの経過時間を求める time.Since"
description: "time.Since は、ある時刻から今までの経過時間を返します。単調時計の値を持つ場合は、現在の単調時計との差を直接計算して、壁時計の影響を避けます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1227, 1233]
function: "Since"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`start := time.Now(); ...; time.Since(start)` の形で、処理にかかった時間を測れます。戻り値の `Duration` を表示すると、`1.5s` のような読みやすい形になります。

## コード

::: code-group

```go:line-numbers=1227 [日本語訳]
func Since(t Time) Duration {
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// 単調時計があるときは、それだけで差が求まるので、近道をとる。
		return subMono(runtimeNano()-startNano, t.ext)
	}
	return Now().Sub(t)
}
```

```go:line-numbers=1227 [原文]
func Since(t Time) Duration {
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// Common case optimization: if t has monotonic time, then Sub will use only it.
		return subMono(runtimeNano()-startNano, t.ext)
	}
	return Now().Sub(t)
}
```

:::

## 前提知識

- **`Duration`**: 期間をナノ秒の整数で表す型です。
- **単調時計**: 時刻の調整に影響されず、常に進む時計です。経過時間の測定に向いています。
- **`hasMonotonic`**: `Time` が単調時計の値を持つことを表すビットです。
- **`Now().Sub(t)`**: 現在と `t` の差を求める一般的な方法です。こちらは、壁時計も使って計算されます。

## 何をしているか

### 1. 単調時計があれば直接計算する

```go:line-numbers=1228
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// 単調時計があるときは、それだけで差が求まるので、近道をとる。
		return subMono(runtimeNano()-startNano, t.ext)
```

`t` に単調時計の値が入っていれば、現在の単調時計の値から `t` の値を引きます。コメントにあるように、この場合は単調時計だけを使えばよいので、近道になります。

### 2. 無ければ一般の計算に任せる

```go:line-numbers=1232
	return Now().Sub(t)
```

単調時計が無いときは、`Now().Sub(t)` で差を求めます。壁時計を使うので、時刻が調整されると結果がずれることがあります。

## ここがすごい

- **測定が正確になる**: 単調時計で測れば、NTP による時刻の修正で結果が飛ぶことがありません。
- **近道を用意する**: よくある「開始時刻から今まで」の場合は、比較的少ない計算で求められます。
- **同じ関数で両方を扱う**: 呼び出し側は、どちらの経路を通ったかを気にせず、経過時間を受け取れます。

## まとめ

- 単調時計があれば、現在の値との差を直接求める。
- 無ければ、`Now().Sub(t)` で一般の計算をする。
- 経過時間の測定では、単調時計の近道が正確さを守る。
