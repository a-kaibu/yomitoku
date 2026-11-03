---
title: "精度の向きを決める makeAcc。above なら Above を返す"
description: "math/big の makeAcc。丸めた結果が元の値より大きいかどうかを bool で受け取り、精度の向きを表す Above か Below を返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2014 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/math/big/float.go"
lines: [192, 197]
function: "makeAcc"
difficulty: 1
tags: [数値計算, 可読性]
---

## ひとことで

`makeAcc(above)` は、丸めた結果が元の値より大きいかどうかを、`Accuracy` の値に変えます。大きければ `Above`、そうでなければ `Below` を返します。

## コード

```go:line-numbers=192
func makeAcc(above bool) Accuracy {
	if above {
		return Above
	}
	return Below
}
```

## 前提知識

- **Accuracy**: 丸めた後の値が、元の値より大きいか小さいかを表す型です。`Above` と `Below` のどちらかの値を持ちます。
- **丸め**: 桁数が足りないときに、値を近い値に直すことです。直した向きを記録しておくと、後で誤差を正しく扱えます。
- **bool**: 真か偽の値です。ここでは、大きいかどうかを表します。

## 何をしているか

### 1. 大きい場合は Above を返す

```go:line-numbers=193
	if above {
		return Above
	}
```

`above` が真なら、丸めた結果は元の値より大きいです。その場合は `Above` を返します。

### 2. そうでなければ Below を返す

```go:line-numbers=196
	return Below
```

`above` が偽なら、丸めた結果は元の値より小さいか、同じです。どちらも `Below` として扱います。

## ここがすごい

- **真偽を型にする**: 呼び出し側は、大小の向きを `Accuracy` の値として受け取れます。意味の分からない数字を扱う必要がありません。
- **関数が一行分の判断だけ**: 本当に必要な判断は、真偽の値を決めるところにあり、この関数は値を変換するだけです。

## まとめ

- `makeAcc` は、真偽の値を `Accuracy` の値に変えます。
- 大きければ `Above`、そうでなければ `Below` を返します。
- 丸めの向きを、型で表せるようにします。
