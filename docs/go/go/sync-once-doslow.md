---
title: "ロックの中でもう一度確かめ、終わってから「済み」にする"
description: "sync.Once の遅い道 doSlow。ミューテックスを取ってから実行済みかを再確認し、defer を使って関数が終わった後に完了の印を付けます。panic しても印が付く順序の工夫があります。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/sync/once.go"
lines: [73, 80]
function: "(*Once).doSlow"
difficulty: 2
format: 2
tags: [並行処理, エラー処理, 標準ライブラリ, イディオム]
---

## ひとことで

`doSlow` は、`sync.Once.Do` で「まだ実行されていない」と判断されたときに呼ばれる部分です。
**ロックを取ってからもう一度確認し、関数 `f` を実行し、終わってから「実行済み」の印を付ける** という 3 つのことを、わずか 6 行で正しく行っています。

鍵になるのは 2 つの `defer` の使い方です。

## コード

```go:line-numbers=73
func (o *Once) doSlow(f func()) {
	o.m.Lock()
	defer o.m.Unlock()
	if !o.done.Load() {
		defer o.done.Store(true)
		f()
	}
}
```

## 前提知識

- **ミューテックス（`o.m`）**: `Lock()` で鍵をかけ、`Unlock()` で外します。鍵がかかっている間、他のゴルーチンは `Lock()` で待たされます。
- **`defer`**: 関数が終わるとき（`return` や `panic` で抜けるとき）に実行する処理を予約します。複数の `defer` は **後に書いたものから先に** 実行されます。
- **`panic`**: 重大なエラーで関数を抜ける仕組みです。`panic` が起きても `defer` で予約した処理は実行されます。
- **`o.done.Load()` / `Store(true)`**: 「実行済みか」を表すアトミックな真偽値を読み書きします。

## 何をしているか

ゴルーチン A と B が同時に初めて `Do` を呼んだとします。

### 1. ロックを取る

```go:line-numbers=74
	o.m.Lock()
	defer o.m.Unlock()
```

A がロックを取り、B は待たされます。`defer o.m.Unlock()` で、関数を抜けるときに必ずロックを外すよう予約します。

### 2. もう一度確認する

```go:line-numbers=76
	if !o.done.Load() {
```

A は `done` がまだ `false` なので中に入ります。

### 3. 終わってから印を付ける

```go:line-numbers=77
		defer o.done.Store(true)
		f()
```

`defer o.done.Store(true)` を予約してから `f()` を実行します。
`f` が終わって関数を抜けるとき、`defer` は後に書いたものから実行されるので、

1. `o.done.Store(true)`（実行済みの印）
2. `o.m.Unlock()`（ロックを外す）

の順になります。

### 4. 待っていた B

ロックが外れると B が通過します。 `done` を確かめると `true` なので、`f` は実行せずに抜けます。B が `Do` から戻ったとき、A の `f` は確実に終わっています。

## ここがすごい

- **ロックの後の再確認**: B が待っている間に A が実行を終えるので、ロックを取った後にもう一度確認しないと、`f` が 2 回実行されてしまいます。速い道とロック内での二重チェックが、正しさと速さを両立させています。
- **`defer` の順序が正しさを作る**: 印を付けるのはロックを外す前でなければなりません（外した後だと、別のゴルーチンが「まだ」と判断して `f` を再実行するおそれがあります）。`defer` の後入れ先出しの順序を利用して、それを自然に保証しています。
- **panic しても「済み」になる**: `f` が `panic` しても `defer` は実行されるので、`done` は `true` になります。つまり、`f` が失敗しても再実行はされません。これは「1 回だけ」という約束を厳密に守るための意図的な設計です（Go のドキュメントにも明記されています）。
- **`Store` は `f` の後**: `defer` で予約しているので、`f` の実行中に他のゴルーチンが速い道で `done == true` を見てしまうことはありません。

## まとめ

- ロックを取った後に状態を再確認する「二重チェック」で、重複実行を防ぐ。
- `defer` は後に書いたものから実行されるので、後片付けの順序を表現できる。
- 完了の印は処理が終わった後に付ける。`defer` を使えば panic のときも確実に付く。
