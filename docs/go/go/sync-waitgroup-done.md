---
title: "作業の完了を 1 つ減らす sync.WaitGroup.Done"
description: "sync.WaitGroup.Done は、待っている作業の数を 1 つ減らします。内部では Add(-1) を呼ぶだけの短い関数です。作業の終わりに必ず呼ぶことで、Wait が返れるようになります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2011 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sync/waitgroup.go"
lines: [155, 157]
function: "Done"
difficulty: 1
format: 2
tags: [並行処理, 標準ライブラリ, イディオム]
---

## ひとことで

複数の goroutine を起動して、全部終わるまで待つときに使います。各作業の終わりに `wg.Done()` を呼び、待つ側は `wg.Wait()` を呼びます。

## コード

```go:line-numbers=155
func (wg *WaitGroup) Done() {
	wg.Add(-1)
}
```

## 前提知識

- **goroutine**: Go の軽量な並行処理の単位です。`go` キーワードで起動します。
- **`WaitGroup`**: 待つべき作業の数を数えるための型です。`Add` で増やし、`Done` で減らし、`Wait` で 0 になるまで待ちます。
- **`Add(-1)`**: 数を 1 減らす呼び出しです。`Done` は、この短い形を名前で表したものです。
- **0 より小さくなる誤り**: 数が負になると、`panic` が起きます。`Done` の呼び出しは、`Add` と同じ回数だけ行う必要があります。

## 何をしているか

### 1. Add(-1) を呼ぶ

```go:line-numbers=156
	wg.Add(-1)
```

`Done` は、内部で `wg.Add(-1)` を呼ぶだけです。待っている作業の数が 1 つ減ります。

### 2. 0 になれば待ちが終わる

```go:line-numbers=156
	wg.Add(-1)
```

数が 0 になると、`Wait` で止まっていた呼び出し側が再開します。どの作業が最後に終わったかは、数の変化だけで決まります。

## ここがすごい

- **名前で意図を伝える**: `Add(-1)` よりも、`Done` の方が「1 つの作業が終わった」と読めます。
- **仕組みは `Add` に一本化**: 数を変える処理は `Add` だけにあるので、正しさを 1 か所で守れます。
- **`defer` と組み合わせやすい**: 関数の終わりで `defer wg.Done()` と書けば、途中で `return` しても数が減ります。

## まとめ

- `Done` は、待つ数を 1 つ減らす `Add(-1)` の別名である。
- 数が 0 になると、`Wait` で待っていた処理が進む。
- 作業の終わりに、必ず 1 回ずつ呼ぶことが大切である。
