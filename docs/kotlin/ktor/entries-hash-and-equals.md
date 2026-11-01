---
title: "名前と値のリストの集まりを、等しさとハッシュ値で比べる"
description: "名前から複数の値への対応の集まりを比べる entriesEquals と、そのハッシュ値を作る entriesHashCode。名前の大文字と小文字を区別しないハッシュ値の作り方と組み合わせて使う。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/common/src/io/ktor/util/StringValues.kt
lines: [669, 675]
function: "entriesEquals, entriesHashCode"
difficulty: 2
tags: [ハッシュ, データ構造, 型システム]
format: 2
---

## ひとことで

`entriesEquals` と `entriesHashCode` は、Ktor の `StringValues`（名前から複数の値を引ける入れ物）の **中身を比べるため** の 2 つの関数です。等しさの判定と、ハッシュ値の計算を、それぞれ 1 つの関数で行います。

HTTP のパラメーターやヘッダーは、同じ名前に複数の値が入ることがあります。この 2 つの関数は、その集まりを 1 つの単位として比べられるようにしています。

## コード

```kotlin:line-numbers=669
private fun entriesEquals(a: Set<Map.Entry<String, List<String>>>, b: Set<Map.Entry<String, List<String>>>): Boolean {
    return a == b
}

private fun entriesHashCode(entries: Set<Map.Entry<String, List<String>>>, seed: Int): Int {
    return seed * 31 + entries.hashCode()
}
```

## 前提知識

- **`Map.Entry`**: 対応表の 1 つの組（キーと値）を表す型です。`StringValues` の中身は、名前と値のリストの組の集まりとして表されます。
- **`Set`**: 同じものを 2 回持たない集まりです。順番を持たないので、要素の追加の順番が違っても、同じ中身なら等しくなります。
- **`hashCode()` と `equals()`**: 等しいものは、ハッシュ値も等しくなければいけません。この 2 つは、`Map` や `Set` で使われる約束事です。
- **`seed`**: ハッシュ値を計算するときの、最初の値です。別の情報（ここでは名前）を混ぜるために使います。
- **`31 * x + y`**: 要素を順番に混ぜていく、定番のハッシュの作り方です。

## 何をしているか

### 1. 中身が等しいかを比べる

```kotlin:line-numbers=670
    return a == b
```

2 つの集まりの `==` は、要素が同じかを比べます。`Set` の `==` は、順番を無視して、同じ要素を持つかを確かめるので、名前と値の組の順番に左右されません。

### 2. ハッシュ値を作る

```kotlin:line-numbers=674
    return seed * 31 + entries.hashCode()
```

最初の値（`seed`）に 31 を掛けて、集まりのハッシュ値を足します。`seed` を変えることで、同じ中身でも、別の情報を混ぜた結果になります。

### 3. 呼び出し側で seed を決める

`StringValues` の `hashCode` は、`31 * caseInsensitiveName.hashCode()` を `seed` として渡しています。名前を大文字と小文字を区別しない形で作ったハッシュ値を混ぜることで、名前の扱いを含んだ値になります。

## ここがすごい

- **比べる単位を揃える**: 名前と値の組をまとめて 1 つの集まりとして比べます。個々の要素を 1 つずつ比べるより、判定の意味がはっきりします。
- **ハッシュの計算を分離する**: 中身のハッシュ値の計算と、外から混ぜる値（`seed`）を分けています。呼び出し側が、どの情報を混ぜるかを決められます。
- **等しさとハッシュ値の約束を守る**: 等しい集まりは、必ず同じハッシュ値になります。`Set` の比較は順番に左右されないので、ハッシュ値も順番に左右されない必要があり、`Set` の `hashCode` はそのように作られています。
- **短い関数に役割を絞る**: 2 つの関数とも 1 行で、読むだけで何を比べているかが分かります。

## まとめ

- 複数の値を持つ入れ物は、中身の集まりとして比べると、等しさの判定が分かりやすい。
- ハッシュ値は、等しい集まりが同じ値になるように作る。
- 外から混ぜる値（`seed`）を引数にすると、同じ仕組みを別の用途に使える。
