---
title: "固定のオフセットから時間帯を作る fixedZone"
description: "time パッケージの fixedZone。名前とオフセットを一つずつ持つ、変わらない時間帯を作る。過去や未来の切り替えがない、一つの時間帯だけの Location を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/zoneinfo.go"
lines: [130, 140]
function: "fixedZone"
difficulty: 2
tags: [日時, データ構造]
---

## ひとことで

`fixedZone(name, offset)` は、名前と UTC からのずれ（オフセット）だけで決まる時間帯を作ります。時間帯が途中で変わることはありません。

## コード

```go:line-numbers=130
func fixedZone(name string, offset int) *Location {
	l := &Location{
		name:       name,
		zone:       []zone{{name, offset, false}},
		tx:         []zoneTrans{{alpha, 0, false, false}},
		cacheStart: alpha,
		cacheEnd:   omega,
	}
	l.cacheZone = &l.zone[0]
	return l
}
```

## 前提知識

- **Location**: 時間帯を表す型です。名前、時間帯の一覧、切り替えの記録などを持ちます。
- **オフセット**: UTC から何秒ずれているかを表す整数です。日本の標準時なら、9 時間の秒数になります。
- **キャッシュ**: 最後に使った時間帯の情報を、すぐ使えるように覚えておく仕組みです。

## 何をしているか

### 1. 時間帯の一覧と切り替えを作る

```go:line-numbers=131
	l := &Location{
		name:       name,
		zone:       []zone{{name, offset, false}},
		tx:         []zoneTrans{{alpha, 0, false, false}},
		cacheStart: alpha,
		cacheEnd:   omega,
	}
```

`zone` には、この名前とオフセットを一つだけ入れます。`tx` の切り替えの記録は、最初から一つだけ持たせます。`cacheStart` を `alpha`（最も古い時点）、`cacheEnd` を `omega`（最も新しい時点）にすると、どの時刻でも同じ時間帯を使う扱いになります。

### 2. キャッシュに唯一の時間帯を向ける

```go:line-numbers=138
	l.cacheZone = &l.zone[0]
	return l
```

`cacheZone` を、唯一の時間帯 `zone[0]` に向けます。最後に、`Location` を返します。

## ここがすごい

- **切り替えを持たない形**: 時間が変わらないので、切り替えの記録は一つだけで済みます。探す処理が単純になります。
- **キャッシュの初期化を一緒に**: 最初からキャッシュを設定しておくので、時刻を変換するときに、探し直す必要がありません。

## まとめ

- `fixedZone` は、名前とオフセットだけで決まる時間帯を作ります。
- 切り替えは持たず、唯一の時間帯を指すキャッシュを置きます。
- 固定のオフセットを表すときに使われます。
