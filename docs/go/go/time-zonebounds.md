---
title: "タイムゾーンが切り替わる時刻を返す time.Time.ZoneBounds"
description: "time.Time の ZoneBounds。ある時刻が属するタイムゾーンの有効期間の始まりと終わりを返す。夏時間の切り替えなどの境目を知るのに使い、範囲が無限の場合は、ゼロの時刻のままにする。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [1411, 1422]
function: "ZoneBounds"
difficulty: 3
tags: [日時, 防御的プログラミング, API設計]
---

## ひとことで

同じ地域でも、夏時間（サマータイム）の開始と終了で、UTC からのずれが変わります。`ZoneBounds()` は、ある時刻が属する時間帯（ゾーン）の、**始まりと終わりの時刻** を返します。どちらかが無限に続く場合は、その側はゼロの `Time` になります。

例えば、ある日の正午がどの期間の中にあるかを調べ、次の切り替え時刻を知るときに使えます。

## コード

```go:line-numbers=1411
func (t Time) ZoneBounds() (start, end Time) {
	_, _, startSec, endSec, _ := t.loc.lookup(t.unixSec())
	if startSec != alpha {
		start = unixTime(startSec, 0)
		start.setLoc(t.loc)
	}
	if endSec != omega {
		end = unixTime(endSec, 0)
		end.setLoc(t.loc)
	}
	return
}
```

## 前提知識

- **タイムゾーン（`Location`）**: 地域ごとの時刻のずれや、夏時間のルールをまとめたものです。`time.LoadLocation` で作ります。
- **Unix 時間**: 1970 年 1 月 1 日からの秒数です。`time` の内部では、ほとんどの計算がこの秒数で行われます。
- **番兵の値 `alpha` と `omega`**: 期間が始まる前、または終わった後であることを表す、特別な秒数です。
- **ゼロの `Time`**: `time.Time{}` は、西暦 1 年 1 月 1 日の 0 時（UTC）を表す値です。ここでは「範囲が無限」を表すために使われます。

## 何をしているか

### 1. 現在の時刻のゾーンの範囲を調べる

```go:line-numbers=1412
	_, _, startSec, endSec, _ := t.loc.lookup(t.unixSec())
```

`lookup` は、その時刻が属するゾーンの情報を返します。ここでは、ゾーンの開始と終了の Unix 秒だけを使います。

### 2. 始まりと終わりを時刻にする

```go:line-numbers=1413
	if startSec != alpha {
		start = unixTime(startSec, 0)
		start.setLoc(t.loc)
	}
```

開始の秒数が `alpha`（番兵）でなければ、それを `Time` にして、元の `Location` を設定します。番兵のままなら、`start` はゼロの `Time` のまま残ります。終わりの `end` も、同じ考え方で決まります。

## ここがすごい

- **無限の範囲を番兵で表す**: 期間に終わりがないとき、特別な値を使って「ない」ことを表します。呼び出し側は、ゼロの `Time` かどうかを見れば判断できます。
- **元のタイムゾーンを引き継ぐ**: `setLoc` で、結果の時刻が元の地域の表示になるように揃えます。境目の時刻を、同じ地域の時計で読めます。
- **名前付きの戻り値**: `start` と `end` を名前付きで返すので、初期値（ゼロ）のまま返す処理が自然に書けます。

## まとめ

- `ZoneBounds` は、ある時刻が属するゾーンの、始まりと終わりを返します。
- 期間に始まりや終わりがなければ、その側はゼロの `Time` になります。
- 結果は、元の時刻と同じタイムゾーンで表されます。
- 夏時間の切り替え時刻を調べるのに役立ちます。
