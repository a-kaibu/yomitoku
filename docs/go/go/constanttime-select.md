---
title: "if を使わずに 2 つの値から 1 つを選ぶ。v-1 で作るマスク"
description: "暗号処理で使われる constanttime.Select。条件 v に応じて x か y を返しますが、分岐を使わず、v-1 で作った「全部 0 か全部 1」のマスクで選びます。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2025 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
file: "src/crypto/internal/constanttime/constant_time.go"
lines: [13, 20]
function: "Select"
difficulty: 3
format: 2
tags: [セキュリティ, 暗号, ビット演算, 標準ライブラリ]
---

## ひとことで

`Select(v, x, y)` は、`v` が 0 でなければ `x`、0 なら `y` を返します。つまり `if v != 0 { return x } else { return y }` と同じです。
ただし暗号のコードでは、`if` による分岐が **処理時間の差** を生み、秘密の値が漏れる原因になります。そこでこの関数は、**分岐を使わずにビット演算で値を選びます**。`crypto/subtle.ConstantTimeSelect` の実体です。

## コード

::: code-group

```go:line-numbers=13 [日本語訳]
func Select(v, x, y int) int {
	// これは CMOV のあるアーキテクチャでは組み込み命令に置き換えられる。
	// 次のより広い動作を実装している:
	// ConstantTimeSelect は v != 0 なら x、v == 0 なら y を返す。
	// 移植性のない未定義動作を避けるため、ここでも同じようにする。
	v = int(boolToUint8(v != 0))
	return ^(v-1)&x | (v-1)&y
}
```

```go:line-numbers=13 [原文]
func Select(v, x, y int) int {
	// This is intrinsicified on arches with CMOV.
	// It implements the following superset behavior:
	// ConstantTimeSelect returns x if v != 0 and y if v == 0.
	// Do the same here to avoid non portable UB.
	v = int(boolToUint8(v != 0))
	return ^(v-1)&x | (v-1)&y
}
```

:::

## 前提知識

- **2 の補数**: 負の数の表し方で、`-1` は全ビットが 1 です。`0 - 1 = -1`、`1 - 1 = 0` です。
- **`^`（単項）**: ビットをすべて反転します。`^0` は全ビット 1（-1）、`^(-1)` は 0 です。
- **`&` と `|`**: `a & 全部1` は `a` そのまま、`a & 0` は 0 です。`|` は OR です。
- **`boolToUint8`**: 真偽値を 1 か 0 に変換する内部関数です。Go では `bool` を数値に直接変換できないためにあります。
- **CMOV**: 多くの CPU にある「条件付き移動」命令で、分岐せずに 2 つの値から 1 つを選べます。

## 何をしているか

### 1. v を 0 か 1 にそろえる

```go:line-numbers=18
	v = int(boolToUint8(v != 0))
```

元の仕様では `v` は 0 か 1 だけでしたが、他の値でも安全に動くように、`v != 0` を 1 か 0 に変換します。

### 2. マスクで選ぶ

```go:line-numbers=19
	return ^(v-1)&x | (v-1)&y
```

`v - 1` がマスクになります。

| v | `v - 1` | `^(v - 1)` | 結果 |
| --- | --- | --- | --- |
| 1 | `0`（全部 0） | 全部 1 | `x & 全部1 | y & 0` = `x` |
| 0 | `-1`（全部 1） | 全部 0 | `x & 0 | y & 全部1` = `y` |

たとえば `v = 1, x = 5, y = 9` なら、`^0 & 5 | 0 & 9` = `5 | 0` = `5` です。

### 3. 実際にはさらに速くなる

```go:line-numbers=14
	// これは CMOV のあるアーキテクチャでは組み込み命令に置き換えられる。
```

コメントの通り、CMOV 命令がある CPU では、コンパイラがこの関数を CMOV 1 命令に置き換えます（intrinsic 化）。

## ここがすごい

- **`v - 1` という発想**: 0 と 1 を「全部 1」と「全部 0」に変換するのに、たった 1 回の引き算しか使っていません。2 の補数の性質をうまく利用した、低レイヤでよく見る小技です。
- **分岐がないので時間が一定**: `if` を使うと、CPU の分岐予測が当たるか外れるかで時間が変わります。秘密の値で分岐すると、その時間差から情報が漏れることがあります（サイドチャネル攻撃）。マスクによる選択ならどちらの場合も同じ命令が実行されます。
- **仕様より広く安全にした**:コメントの通り、`v` が 0 か 1 以外のときの動作は以前は保証されていませんでした。「0 以外なら x」というより広い動作に揃えることで、移植性のない未定義の振る舞いをなくしています。

## まとめ

- `v - 1` で、0/1 の値から「全部 1 / 全部 0」のマスクが作れる。
- マスクと `&`・`|` を組み合わせると、分岐なしで 2 つの値から 1 つを選べる。
- 暗号のコードでは、秘密の値で `if` を使わないことが安全性につながる。
