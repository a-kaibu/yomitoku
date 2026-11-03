---
title: "型の情報を表から探す lookupTypeInfo。初期化の途中かどうかで読む表を変える"
description: "encoding/gob の lookupTypeInfo。Go の型から、gob が覚えておいた型の情報を探す。初期化の途中で使う一時的な表があればそれを使い、なければ並行処理に安全な表から読み出す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [708, 714]
function: "lookupTypeInfo"
difficulty: 2
tags: [並行処理, キャッシュ, 型システム]
---

## ひとことで

`lookupTypeInfo(rt)` は、Go の型 `rt` に対応する、gob の型の情報を返します。情報は、一度作られた後は表に覚えられているので、探すだけで取り出せます。

ただし、パッケージが初期化されている途中では、まだ表が完成していないことがあります。その場合は、初期化のための一時的な表を使います。この関数は、その切り替えを行います。

## コード

```go:line-numbers=708
func lookupTypeInfo(rt reflect.Type) *typeInfo {
	if m := typeInfoMapInit; m != nil {
		return m[rt]
	}
	m, _ := typeInfoMap.Load().(map[reflect.Type]*typeInfo)
	return m[rt]
}
```

## 前提知識

- **型の情報（typeInfo）**: gob が、ある型をどう書き、どう読むかを覚えておく記録です。一度作れば、何度でも使えます。
- **表（map）**: キーから値を探す仕組みです。ここでは、`reflect.Type` をキーにします。
- **`atomic.Value` の `Load`**: 並行処理の中で、一つの値を安全に読み出すための仕組みです。書き換えが起きても、読む側が壊れません。
- **初期化の途中**: パッケージが動き始める前の段階です。この時点では、並行処理用の表が準備されていないことがあります。

## 何をしているか

### 1. 初期化中の一時的な表があれば使う

```go:line-numbers=709
	if m := typeInfoMapInit; m != nil {
		return m[rt]
	}
```

初期化のための一時的な表 `typeInfoMapInit` が存在すれば、それを使って探します。並行処理の仕組みが整う前でも、安全に探せます。

### 2. 通常は並行処理に安全な表から探す

```go:line-numbers=712
	m, _ := typeInfoMap.Load().(map[reflect.Type]*typeInfo)
	return m[rt]
```

通常は、`typeInfoMap` を `Load` で読み出し、その表から `rt` を探します。読み出しの途中で表が書き換えられても、読む側は一貫した表を見られます。

## ここがすごい

- **二段階の表**: 初期化中と通常時で、読む表を分けています。準備の途中の表を、通常の処理に使わずに済みます。
- **読むときは待たない**: 並行処理用の表は、`Load` で読むだけなので、探すたびにロックを取る必要がありません。
- **見つからなければゼロ値**: キーがなければ、`nil` が返ります。呼び出し側は、その結果で「まだ登録されていない」と判断できます。

## まとめ

- `lookupTypeInfo` は、Go の型から gob の型の情報を探します。
- 初期化の途中では一時的な表、通常は並行処理に安全な表を使います。
- 読み出しはロックなしで行い、速く探せます。
