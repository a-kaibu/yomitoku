---
title: "単調時計の値を時刻に書き込む time の setMono。印がなければ秒を移してから設定する"
description: "time パッケージの Time.setMono。単調時計の値 m を Time に設定する。まだ印がなければ、秒の値が範囲内かを確かめて、wall に印とナノ秒の部分を書き込んでから、ext に m を入れる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [237, 246]
function: "setMono"
difficulty: 3
tags: [日時, ビット演算, 防御的プログラミング]
---

## ひとことで

`t.setMono(m)` は、時刻に単調時計の値 `m` を設定します。単調時計の値は、`ext` に入ります。ただし、その前に、秒の部分を `wall` のビットに移しておく必要があります。

前の記事で見たように、`ext` は秒を入れる場所でもあります。単調時計の値を入れる前に、元の秒を `wall` に退避させておかないと、秒が消えてしまいます。

## コード

```go:line-numbers=237
func (t *Time) setMono(m int64) {
	if t.wall&hasMonotonic == 0 {
		sec := t.ext
		if sec < minWall || maxWall < sec {
			return
		}
		t.wall |= hasMonotonic | uint64(sec-minWall)<<nsecShift
	}
	t.ext = m
}
```

## 前提知識

- **単調時計の値**: 時間の差を測るための、変わらずに進む値です。`ext` に入ります。
- **`wall` の印**: `hasMonotonic` のビットが立っていれば、`ext` は単調時計の値を表します。立っていなければ、`ext` は秒を表します。
- **範囲の確認（`minWall`、`maxWall`）**: `wall` に退避できる秒の範囲です。範囲の外は、退避できないので設定を行いません。
- **ビットの組み立て**: `uint64(sec-minWall)<<nsecShift` は、秒を基準からずらし、所定の位置まで左にずらして、`wall` に入れられる形にします。

## 何をしているか

### 1. 印がなければ秒を wall に移す

```go:line-numbers=238
	if t.wall&hasMonotonic == 0 {
		sec := t.ext
		if sec < minWall || maxWall < sec {
			return
		}
		t.wall |= hasMonotonic | uint64(sec-minWall)<<nsecShift
	}
```

印がまだなければ、今の `ext` の値は秒です。範囲内かを確かめ、範囲の外なら何もせずに戻ります。範囲内なら、秒を `wall` のビットに詰め込み、同時に印を立てます。

### 2. ext に単調時計の値を入れる

```go:line-numbers=245
	t.ext = m
```

秒を `wall` に移したので、`ext` が空きました。そこに単調時計の値 `m` を入れます。

## ここがすごい

- **退避してから上書き**: 秒を失わずに、同じ欄に別の値を入れられます。欄を増やさずに、二つの情報を持てます。
- **範囲外は何もしない**: 範囲を超える秒は、ビットに収まらないので、無理に入れません。安全に止まります。
- **印で状態を示す**: `wall` の印を見るだけで、`ext` の意味が分かります。読む側も、同じ規則で判断できます。

## まとめ

- `setMono` は、単調時計の値を `Time` に設定します。
- 印がなければ、秒を `wall` のビットに移してから、印を立てます。
- 範囲外の秒は、移せないので設定を行いません。
