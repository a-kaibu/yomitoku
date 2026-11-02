---
title: "JSON の配列の入り口を記録する pushArray。種類、深さ、名前の三つを確かめてから積む"
description: "encoding/json/jsontext の stateMachine.pushArray。配列が始まったときに、キーの名前が必要な場所ではないか、入れ子の深さが上限を超えていないかを確かめる。問題がなければ、今の状態をスタックに積んで、配列の状態に入る。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2020 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/json/jsontext/state.go"
lines: [337, 351]
function: "pushArray"
difficulty: 2
tags: [パース, 状態機械, データ構造]
---

## ひとことで

`m.pushArray()` は、JSON の配列 `[` を読んだときに呼ばれます。配列は、今いる場所の中に入ることになるので、いくつかの条件を先に確かめます。問題がなければ、今の状態をスタックに積んで、配列の中に入ります。

例えば `{"a": [` の `[` は、キーの後ろに置かれた値なので正しいです。しかし、オブジェクトのキーの位置に `[` が来たら、それは誤りです。

## コード

```go:line-numbers=337
func (m *stateMachine) pushArray() error {
	switch {
	case m.Last.NeedObjectName():
		return ErrNonStringName
	case !m.Last.isValidNamespace():
		return errInvalidNamespace
	case len(m.Stack) == maxNestingDepth:
		return errMaxDepth
	default:
		m.Last.Increment()
		m.Stack = append(m.Stack, m.Last)
		m.Last = stateTypeArray
		return nil
	}
}
```

## 前提知識

- **スタック**: 今いる入れ子の状態を、後入れ先出しで覚える入れ物です。配列やオブジェクトを開くと積み、閉じると取り出します。
- **`NeedObjectName`**: オブジェクトの中で、次に名前（キー）が必要かを表す判定です。その位置に配列は置けません。
- **深さの上限（`maxNestingDepth`）**: 入れ子の深さの上限です。深すぎる入れ子は、処理を止めるために拒否されます。
- **`Increment`**: 今の入れ子で、要素の数を一つ増やすことです。

## 何をしているか

### 1. 条件を順に確かめる

```go:line-numbers=338
	switch {
	case m.Last.NeedObjectName():
		return ErrNonStringName
	case !m.Last.isValidNamespace():
		return errInvalidNamespace
	case len(m.Stack) == maxNestingDepth:
		return errMaxDepth
```

`switch` の `case` を上から順に調べます。キーが必要な場所なら、名前ではないので誤りです。名前の空間が正しくなければ、誤りです。入れ子が上限に達していれば、誤りです。どの条件にも当たらなければ、`default` に進みます。

### 2. 今の状態を積んで、配列に入る

```go:line-numbers=346
		m.Last.Increment()
		m.Stack = append(m.Stack, m.Last)
		m.Last = stateTypeArray
		return nil
```

今いる場所の要素数を一つ増やし、今の状態をスタックに積みます。そのあと、今の状態を「配列」に変えて、中の要素を読める準備をします。エラーがないので `nil` を返します。

## ここがすごい

- **誤りを入り口で止める**: 配列を開く前に、置いてよい場所かどうかを確かめます。後から壊れた状態を直すより、ずっと簡単です。
- **条件を表で読める**: `switch` の `case` が、そのまま判定の表になっています。どの条件で止まるかが、一目で分かります。
- **スタックで入れ子を戻れる**: 積んだ状態を、閉じ括弧で取り出せば、元の場所に戻れます。入れ子の深さが、正確に管理されます。

## まとめ

- `pushArray` は、配列を開くときに、置いてよい場所か、深さの上限を超えないかを確かめます。
- 問題がなければ、今の状態をスタックに積み、配列の状態に入ります。
- 条件が `switch` で並んでいて、判定の流れが読みやすい作りです。
