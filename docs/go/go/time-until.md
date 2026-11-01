---
title: "未来の時刻までの残り時間を求める time.Until"
description: "time.Until は、今から指定した時刻までの残り時間を返します。単調時計の値があれば、それだけで差を求め、無ければ現在時刻との差を計算します。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/time/time.go"
lines: [1237, 1243]
function: "Until"
difficulty: 2
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`time.Until(deadline)` は、期限までの残り時間を `Duration` で返します。`time.Since` を反対向きにした関数で、タイムアウトの計算によく使われます。

## コード

::: code-group

```go:line-numbers=1237 [日本語訳]
func Until(t Time) Duration {
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// 単調時計があるときは、それだけで差が求まるので、近道をとる。
		return subMono(t.ext, runtimeNano()-startNano)
	}
	return t.Sub(Now())
}
```

```go:line-numbers=1237 [原文]
func Until(t Time) Duration {
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// Common case optimization: if t has monotonic time, then Sub will use only it.
		return subMono(t.ext, runtimeNano()-startNano)
	}
	return t.Sub(Now())
}
```

:::

## 前提知識

- **`Since` との関係**: `Since(t)` は「t から今まで」、`Until(t)` は「今から t まで」です。向きが逆になるだけで、仕組みは似ています。
- **単調時計**: 時刻の調整に影響されない時計の値です。経過時間の計算に向いています。
- **`hasMonotonic`**: 単調時計の値が入っていることを示すビットです。
- **負の期間**: 期限を過ぎていると、残り時間は負になります。

## 何をしているか

### 1. 単調時計があれば近道をとる

```go:line-numbers=1238
	if t.wall&hasMonotonic != 0 && !runtimeIsBubbled() {
		// 単調時計があるときは、それだけで差が求まるので、近道をとる。
		return subMono(t.ext, runtimeNano()-startNano)
```

`t` に単調時計の値があれば、`t` の値から現在の単調時計の値を引きます。コメントにあるように、この近道で壁時計の影響を避けます。

### 2. 無ければ一般の計算に任せる

```go:line-numbers=1242
	return t.Sub(Now())
```

単調時計が無いときは、`t.Sub(Now())` で差を求めます。壁時計を使うので、時刻の調整があると結果がずれることがあります。

## ここがすごい

- **期限の計算が正確になる**: タイムアウトを、単調時計で測るとずれにくくなります。
- **近道と一般の道を分ける**: よくある場合を速くし、それ以外は確実な計算に任せます。
- **`Since` と対になる**: 向きを変えるだけなので、覚えやすい関数です。

## まとめ

- 単調時計があれば、その値の差を直接求める。
- 無ければ、現在時刻との差を一般の方法で求める。
- `Since` の反対向きとして、期限までの残りに使える。
