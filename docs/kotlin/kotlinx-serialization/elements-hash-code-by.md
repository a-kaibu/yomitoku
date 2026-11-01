---
title: "要素の並びから、順番を含むハッシュ値を作る"
description: "リストの各要素の値から、順番まで含めたハッシュ値を作る elementsHashCodeBy。1 から始めて 31 を掛けて足す、List の hashCode と同じ計算。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "Copyright 2017-2021 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license."
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: core/commonMain/src/kotlinx/serialization/internal/Platform.common.kt
lines: [159, 161]
function: "Iterable.elementsHashCodeBy"
difficulty: 2
tags: [ハッシュ, 数値計算, データ構造]
format: 2
---

## ひとことで

`elementsHashCodeBy` は、リストの要素を並べたものから、**1 つの整数（ハッシュ値）を作る** 関数です。要素が同じでも、並びの順番が違えば、別のハッシュ値になります。

kotlinx.serialization は、クラスの構造を表す `SerialDescriptor` に、この関数でハッシュ値を付けています。そのため、「同じ名前の要素が同じ順番で並んでいるか」を、数値の比べ方で素早く判断できます。

## コード

```kotlin:line-numbers=159
internal inline fun <T, K> Iterable<T>.elementsHashCodeBy(selector: (T) -> K): Int {
    return fold(1) { hash, element -> 31 * hash + selector(element).hashCode() }
}
```

## 前提知識

- **ハッシュ値**: あるものから作られる、小さな整数の「指紋」です。同じものからは必ず同じ値になり、違うものからも同じ値になることがあります。そのため、ハッシュ値が違えば必ず別のもの、とはいえます。
- **`Iterable`**: 順番に要素を取り出せる集まりの型です。`List` や `Set` などが含まれます。
- **`fold(初期値) { 累積, 要素 -> ... }`**: 初期値から始めて、要素を 1 つずつ順に処理しながら値を積み上げる関数です。`reduce` の一種で、初期値を明示できます。
- **`selector`**: 要素から、ハッシュ値を作る対象の値を取り出す関数です。引数として渡されます。
- **`hashCode()`**: 値からハッシュ値を求めるメソッドです。すべての Kotlin の値が持っています。
- **`inline` 関数**: 呼び出し先に中身が展開される関数です。`selector` のような関数の引数も、呼び出し先で直接使われます。

## 何をしているか

### 1. 初期値を 1 にして積み上げる

```kotlin:line-numbers=160
    return fold(1) { hash, element -> 31 * hash + selector(element).hashCode() }
```

初期値の `1` から始めて、要素を 1 つずつ処理します。毎回、今までの値に `31` を掛けて、その要素のハッシュ値を足します。最後の値が、全体のハッシュ値になります。

### 2. 順番の影響が残る理由

`31 * hash` のように、前の結果を掛けてから次の値を足すので、同じ要素でも並びが変わると、途中の値が変わります。そのため、順番まで含めた値になります。

### 3. なぜ 31 なのか

31 は、素数であり、かつ `31 * x` が `(x shl 5) - x` と書ける数です。掛け算が、ビットずらしと引き算で速く計算できるという理由で、Java や Kotlin の標準のハッシュの計算でよく使われてきました。

## ここがすごい

- **少ない計算で、順番まで反映する**: 1 つの要素に対して、掛け算と足し算だけで済みます。どの要素も、前の結果を介して全体に影響するので、順番の違いが値に表れます。
- **標準の `List.hashCode` と同じ形**: Java の `List` の `hashCode` も、初期値 1 と 31 の積み上げで作られています。そのため、この関数の結果は、標準の List のハッシュと一致します。ほかの部品と比べるときに、食い違いが起きません。
- **比べる値を選べる**: `selector` を渡すことで、要素のどの部分を使うかを呼び出し側が決められます。ここでは、要素の名前（`serialName`）だけを使う場面があります。
- **`inline` で余計な呼び出しを減らす**: `inline` にしてあるので、`selector` の呼び出しは、利用する場所に直接展開されます。

## まとめ

- 初期値 1 から、要素ごとに 31 を掛けて足すと、順番まで含んだハッシュ値になる。
- この計算は、標準の `List.hashCode` と同じ形なので、他の部品と値が揃う。
- 比べたい値は `selector` で選ぶと、同じ計算を別の情報にも使える。
