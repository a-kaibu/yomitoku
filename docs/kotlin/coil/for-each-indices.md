---
title: "リストの位置を回して、反復子を作らずに全要素を処理する"
description: "リストの要素を、位置の範囲で順に回して処理する forEachIndices。反復子（イテレーター）を作らず、インライン関数として呼び出し先に展開される。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/commonMain/kotlin/coil3/util/collections.kt
lines: [42, 46]
function: "List.forEachIndices"
difficulty: 2
tags: [最適化, 型システム, イディオム]
format: 2
---

## ひとことで

`forEachIndices` は、リストの **すべての要素を順番に処理する** 関数です。標準の `forEach` と同じ働きですが、内部では「位置の範囲（`indices`）」を回して、要素を 1 つずつ取り出します。

Coil は、画像の読み込みのような、何度も呼ばれる処理の中で、リストを回すことがあります。その場合に、少しでも無駄を減らすために、この関数を用意しています。

## コード

```kotlin:line-numbers=42
internal inline fun <T> List<T>.forEachIndices(action: (T) -> Unit) {
    for (i in indices) {
        action(get(i))
    }
}
```

## 前提知識

- **`indices`**: リストの有効な位置の範囲です。要素が 3 つなら、`0..2` にあたります。
- **反復子（イテレーター）**: 要素を順番に取り出すための小さな仕組みです。`for (x in list)` のように書くと、内部で作られます。
- **`inline` 関数**: 呼び出し先のコードに、関数の中身が直接展開される関数です。引数の関数（ラムダ）も、展開されて直接呼ばれます。
- **`get(i)`**: リストの `i` 番目の要素を取り出します。
- **`action: (T) -> Unit`**: 要素を受け取って何かをする関数の型です。戻り値は使いません。

## 何をしているか

### 1. 位置の範囲を回す

```kotlin:line-numbers=43
    for (i in indices) {
```

`indices` の位置を、0 から順に 1 つずつ取り出します。`for` で範囲を回すと、反復子を作らずに済みます。

### 2. 要素を取り出して処理する

```kotlin:line-numbers=44
        action(get(i))
```

位置 `i` の要素を `get(i)` で取り出して、渡された処理 `action` に渡します。

## ここがすごい

- **反復子を作らない**: 標準のループでは、場合によって反復子が作られ、それが小さな無駄になります。位置で回すと、その作成を避けられます。
- **`inline` で関数呼び出しを減らす**: `inline` にすると、`action` の呼び出しが展開されて、余計な関数の呼び出しを減らせます。
- **同じ形の関数を揃える**: 位置だけを使う関数（`forEachIndices`）、位置と要素を使う関数（`forEachIndexedIndices`）、結果を集める関数（`mapNotNullIndices` など）を、同じ書き方で揃えています。
- **標準の関数の代わりとして使う**: 名前の後ろに `Indices` が付いているのは、「位置で回す版」であることを示すためです。使う側は、標準の `forEach` との違いを名前で判断できます。

## まとめ

- 位置の範囲で回すと、反復子を作らずにリストを処理できる。
- `inline` にすると、引数の処理の呼び出しが展開され、余計な呼び出しを減らせる。
- 頻繁に呼ばれる処理では、こうした小さな書き方の違いが効いてくる。
