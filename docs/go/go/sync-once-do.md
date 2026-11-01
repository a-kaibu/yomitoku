---
title: "「1 回だけ実行」の正しい作り方。CAS だけではダメな理由"
description: "sync.Once の Do は、関数を一度だけ実行することを保証します。コメントには「よくある間違った実装」が載っていて、なぜそれではだめなのかまで説明されています。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sync/once.go"
lines: [52, 71]
function: "(*Once).Do"
difficulty: 2
format: 2
tags: [並行処理, 設計パターン, 最適化, 標準ライブラリ]
---

## ひとことで

`sync.Once` は、ある処理を **プログラム全体でちょうど 1 回だけ** 実行するための型です。設定ファイルの読み込みや、重い初期化を「最初に必要になったときに一度だけ」行うのに使います。

```go
var once sync.Once
once.Do(loadConfig) // 何回呼んでも loadConfig は 1 回だけ実行される
```

この `Do` メソッドのコメントには、**一見正しそうで実は間違っている実装** が書かれていて、そこから正しい設計の理由を学べます。

## コード

::: code-group

```go:line-numbers=52 [日本語訳]
func (o *Once) Do(f func()) {
	// 注意: ここに Do の誤った実装を示す:
	//
	//	if o.done.CompareAndSwap(false, true) {
	//		f()
	//	}
	//
	// Do は、戻ったときに f が完了していることを保証する。
	// 上の実装はその保証を満たさない。
	// 2 つの呼び出しが同時に来ると、CAS に勝ったほうが
	// f を呼び、もう一方は f の呼び出しの完了を待たずに
	// すぐ戻ってしまう。
	// だから遅い経路ではミューテックスに頼り、また
	// o.done.Store を f が戻ったあとまで遅らせる必要がある。

	if !o.done.Load() {
		// 遅い経路を外に出して、速い経路をインライン化できるようにしている。
		o.doSlow(f)
	}
}
```

```go:line-numbers=52 [原文]
func (o *Once) Do(f func()) {
	// Note: Here is an incorrect implementation of Do:
	//
	//	if o.done.CompareAndSwap(false, true) {
	//		f()
	//	}
	//
	// Do guarantees that when it returns, f has finished.
	// This implementation would not implement that guarantee:
	// given two simultaneous calls, the winner of the cas would
	// call f, and the second would return immediately, without
	// waiting for the first's call to f to complete.
	// This is why the slow path falls back to a mutex, and why
	// the o.done.Store must be delayed until after f returns.

	if !o.done.Load() {
		// Outlined slow-path to allow inlining of the fast-path.
		o.doSlow(f)
	}
}
```

:::

## 前提知識

- **ゴルーチン**: Go の軽量なスレッドです。複数のゴルーチンが同時に `Do` を呼ぶことがあります。
- **`o.done`**: `atomic.Bool` 型のフィールドで、「もう実行したか」を表します。アトミック（不可分）な操作で読み書きするので、複数のゴルーチンから同時に触っても壊れません。
- **`Load()`、`Store(v)`**: アトミックに値を読む・書く操作です。
- **CAS（CompareAndSwap）**: 「今の値が期待どおりなら、新しい値に置き換える」をアトミックに行う操作です。
- **ミューテックス（`o.m`）**: 同時に 1 つのゴルーチンだけが処理を進められるようにする鍵です。

## 何をしているか

### 1. 実行済みなら何もしない

```go:line-numbers=67
	if !o.done.Load() {
```

`o.done.Load()` が `true` なら、すでに実行済みなので何もせずに戻ります。2 回目以降の呼び出しはほぼすべてここで終わり、とても速いです。

### 2. まだなら遅い道へ

```go:line-numbers=68
		// 遅い経路を外に出して、速い経路をインライン化できるようにしている。
		o.doSlow(f)
```

まだ実行されていなければ、別のメソッド `doSlow` に任せます。`doSlow` ではミューテックスを取ってから、もう一度 `done` を確かめ、実行していなければ `f` を実行します。

### 間違った実装

```go:line-numbers=53
	// 注意: ここに Do の誤った実装を示す:
	//
	//	if o.done.CompareAndSwap(false, true) {
	//		f()
	//	}
```

```go
if o.done.CompareAndSwap(false, true) {
	f()
}
```

これでも `f` は 1 回しか実行されません。しかし、ゴルーチン A と B が同時に呼ぶと、CAS に勝った A が `f` を実行している最中に、負けた B は **すぐに戻ってしまいます**。B は「初期化が終わった」と思って続きを実行しますが、実際にはまだ終わっていません。

`Do` が保証するのは「戻ったときには `f` が **終わっている**」ことです。そのために、遅い道ではミューテックスで待ち合わせ、`done` を `true` にするのは `f` が終わった後にしています。

## ここがすごい

- **速い道をインライン化できるように分けている**:コメントの通り、`Do` 本体を「`done` を読んで分岐するだけ」の小さな関数にし、重い部分を `doSlow` に追い出しています。こうすると `Do` がインライン展開され、2 回目以降の呼び出しはほぼコストゼロになります。
- **間違いをコメントで教える**: 「こう書きたくなるが、こういう理由で間違い」という説明は、並行処理のコードを書く人にとって非常に価値があります。正しいコードだけでなく、なぜそうなのかが残されています。
- **二重チェック**: 速い道でアトミックに確認し、遅い道でロックを取った後にもう一度確認します。これは「ダブルチェックロッキング」と呼ばれるパターンを、アトミック変数で正しく実装したものです。

## まとめ

- 「1 回だけ実行」には、「実行が終わるまで他の呼び出し側を待たせる」ことも含まれる。
- CAS だけでは「実行中」の状態を表せないので、待ち合わせにはロックが要る。
- よく通る速い道を小さく保ち、遅い道を別関数に分けるとインライン化が効く。
