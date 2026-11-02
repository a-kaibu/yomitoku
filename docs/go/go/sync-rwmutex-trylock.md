---
title: "待たずに読み取りロックを取る RWMutex.TryRLock。CAS で人数を 1 増やす"
description: "sync.RWMutex の TryRLock。書き込みの待ちがなければ、読み取り者の数を CAS（比較して入れ替え）で 1 増やして、すぐに true を返す。待つ必要があれば、即座に false を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sync/rwmutex.go"
lines: [87, 108]
function: "TryRLock"
difficulty: 3
tags: [並行処理, ロック不要, 非同期]
---

## ひとことで

`RWMutex.TryRLock()` は、読み取り用のロックを **待たずに** 取ろうとします。成功すれば `true` を返し、読み取り者を 1 人増やします。書き込み者が待っているなどの理由で今はロックを取れなければ、待たずに `false` を返します。

`RLock` は必要なら待ちますが、`TryRLock` は待たないので、他の仕事を続けたいときに使えます。

## コード

```go:line-numbers=87
func (rw *RWMutex) TryRLock() bool {
	if race.Enabled {
		race.Read(unsafe.Pointer(&rw.w))
		race.Disable()
	}
	for {
		c := rw.readerCount.Load()
		if c < 0 {
			if race.Enabled {
				race.Enable()
			}
			return false
		}
		if rw.readerCount.CompareAndSwap(c, c+1) {
			if race.Enabled {
				race.Enable()
				race.Acquire(unsafe.Pointer(&rw.readerSem))
			}
			return true
		}
	}
}
```

## 前提知識

- **RWMutex（読み書きロック）**: 読み取りは同時に何人でもでき、書き込みは 1 人だけに限る排他制御です。
- **読み取り者の数 `readerCount`**: 今、読み取りロックを持つ人の数です。書き込み者が待っているときは、この値が負になる約束になっています。
- **CAS（Compare-And-Swap）**: 「値が期待どおりなら新しい値に入れ替える」を 1 つの命令でやる操作です。途中で他の goroutine が変えていれば、失敗します。
- **race の検出**: `race.Enabled` は、データ競合を調べるモードのときだけ `true` になります。通常の実行では、その分岐は動きません。

## 何をしているか

### 1. 現在の人数を読んで、書き込み待ちを確かめる

```go:line-numbers=93
		c := rw.readerCount.Load()
		if c < 0 {
			if race.Enabled {
				race.Enable()
			}
			return false
		}
```

現在の読み取り者の数 `c` を読みます。`c` が負なら、書き込み者が待っているか、書き込みが進行中です。このとき、読み取りのロックは取れないので、`false` を返します。

### 2. CAS で 1 人増やす

```go:line-numbers=100
		if rw.readerCount.CompareAndSwap(c, c+1) {
			if race.Enabled {
				race.Enable()
				race.Acquire(unsafe.Pointer(&rw.readerSem))
			}
			return true
		}
```

`CompareAndSwap(c, c+1)` は、「まだ `c` のままなら `c+1` にする」という操作です。成功すれば、この goroutine は読み取りロックを取れたので、`true` を返します。

失敗した場合は、他の goroutine が同時に人数を変えたということなので、`for` ループの先頭に戻って、もう一度読みます。

## ここがすごい

- **待たない選択肢**: `RLock` と違い、ロックが取れないときは、すぐに `false` を返します。呼び出し側は、別の仕事に切り替えられます。
- **ロックなしで人数を変える**: 人数は CAS で更新するので、ミューテックスで囲む必要がありません。競合が少なければ、速く動きます。
- **再試行は必要な分だけ**: CAS が失敗したら、もう一度だけ読み直します。`c < 0` のときは即座に諦めるので、無駄なループがありません。

## まとめ

- `TryRLock` は、読み取りロックを待たずに取ろうとします。
- 書き込み者が待っていれば、すぐに `false` を返します。
- CAS で読み取り者の数を 1 増やすので、ミューテックスなしで更新できます。
- 失敗が競合のせいなら、読み直して、もう一度試します。
