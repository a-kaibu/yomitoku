---
title: "通知を待つ Cond.Wait。ロックを外して待ち、起きたら取り直す"
description: "sync パッケージの Cond.Wait。待機の登録をしてから、関連するロック c.L を外し、通知を受けるまで待つ。通知を受けたら、ロックを取り直してから戻る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/sync/cond.go"
lines: [67, 73]
function: "Wait"
difficulty: 2
tags: [並行処理, 可読性]
---

## ひとことで

`c.Wait()` は、条件が変わるのを待つために、ロックを外して眠ります。通知を受けたら、ロックを取り直して戻ります。

## コード

```go:line-numbers=67
func (c *Cond) Wait() {
	c.checker.check()
	t := runtime_notifyListAdd(&c.notify)
	c.L.Unlock()
	runtime_notifyListWait(&c.notify, t)
	c.L.Lock()
}
```

## 前提知識

- **Cond**: 条件の変化を、待っている処理に知らせるための型です。
- **c.L**: `Cond` に結び付いたロックです。`Wait` の前後で、このロックを外したり取り直したりします。
- **通知リスト**: 待っている処理を並べておく仕組みです。通知が来ると、その処理を起こします。

## 何をしているか

### 1. 待機を登録し、ロックを外す

```go:line-numbers=68
	c.checker.check()
	t := runtime_notifyListAdd(&c.notify)
	c.L.Unlock()
```

`checker.check` で、この `Cond` が正しく使われているかを確かめます。次に、通知リストに自分を登録し、その番号を `t` に受け取ります。登録した後で `c.L` を外すので、通知を取りこぼさずに眠れます。

### 2. 通知を待つ

```go:line-numbers=71
	runtime_notifyListWait(&c.notify, t)
```

登録した番号 `t` で、通知が来るまで眠ります。

### 3. ロックを取り直す

```go:line-numbers=72
	c.L.Lock()
```

通知を受けたら、外していたロックを取り直して、呼び出し側に戻ります。呼び出し側は、ロックの下で条件を調べ直します。

## ここがすごい

- **取りこぼしを防ぐ**: 眠る前に登録するので、ロックを外してから通知が来ても、目覚めの合図を見逃しません。
- **ロックの持ち方を揃える**: 戻るときは必ずロックを持っているので、呼び出し側は、通常のロックの下の処理として書けます。

## まとめ

- `Wait` は、ロックを外して通知を待ち、戻るときにロックを取り直します。
- 登録してからロックを外すので、通知を取りこぼしません。
- 呼び出し側は、戻った後に条件を調べ直します。
