---
title: "XML の名前の名前空間を、登録された URL に置き換える Decoder.translate"
description: "encoding/xml の Decoder.translate。要素や属性の名前の接頭辞を、宣言された名前空間の URL に置き換える。接頭辞 xml は決まった URL になり、対応がなければ既定の名前空間を使う。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/xml/xml.go"
lines: [346, 362]
function: "translate"
difficulty: 2
tags: [パース, 文字列処理, 型システム]
---

## ひとことで

`d.translate(n, isElementName)` は、XML の名前 `n` の接頭辞を、本当の名前空間の URL に置き換えます。例えば `x:book` の `x` が、どの URL を指すかを調べて、名前の空間の部分を書き換えます。

XML では、同じ名前でも、名前空間が違えば別のものになります。そのため、接頭辞だけでは意味が決まらず、宣言された対応を調べる必要があります。

## コード

```go:line-numbers=346
func (d *Decoder) translate(n *Name, isElementName bool) {
	switch {
	case n.Space == xmlnsPrefix:
		return
	case n.Space == "" && !isElementName:
		return
	case n.Space == xmlPrefix:
		n.Space = xmlURL
	case n.Space == "" && n.Local == xmlnsPrefix:
		return
	}
	if v, ok := d.ns[n.Space]; ok {
		n.Space = v
	} else if n.Space == "" {
		n.Space = d.DefaultSpace
	}
}
```

## 前提知識

- **名前空間（namespace）**: 名前の衝突を避けるための区切りです。接頭辞と URL の組で宣言されます。
- **接頭辞（`Space`）**: `x:book` の `x` にあたる部分です。実際の URL は、宣言によって決まります。
- **`d.ns`**: 宣言された接頭辞と URL の対応表です。
- **`isElementName`**: 名前が要素の名前かどうかを表す真偽値です。属性の名前は、接頭辞がなければ名前空間に属さない決まりがあります。

## 何をしているか

### 1. 変換しない場合を先に処理する

```go:line-numbers=348
	case n.Space == xmlnsPrefix:
		return
```

`xmlns` の接頭辞は、名前空間の宣言そのものを表すので、変換せずに戻ります。

### 2. 対応表で URL を探す

```go:line-numbers=357
	if v, ok := d.ns[n.Space]; ok {
		n.Space = v
	} else if n.Space == "" {
		n.Space = d.DefaultSpace
	}
```

対応表に接頭辞があれば、その URL に書き換えます。対応がなく、接頭辞も空なら、既定の名前空間を使います。どちらにも当たらなければ、名前はそのままです。

## ここがすごい

- **例外を先に返す**: 変換しない名前を最初の `switch` で弾くので、残りの処理は通常の名前だけに限られます。
- **接頭辞の対応が一か所**: 対応表を見るのは、この関数の一か所だけです。名前の意味は、いつも同じ規則で決まります。
- **既定の空間を扱う**: 接頭辞がないときの扱いも、同じ関数の中で決められています。

## まとめ

- `translate` は、名前の接頭辞を宣言された URL に置き換えます。
- 変換しない名前は先に戻ります。
- 対応がなければ、既定の名前空間を使います。
