---
title: "空の配列を毎回作らずに、使い回す"
description: "要素のリストを配列にするとき、空やなしの場合は共通の空配列を返す compactArray。空配列を何度も作る無駄を省いている。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "Copyright 2017-2021 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license."
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: core/commonMain/src/kotlinx/serialization/internal/Platform.common.kt
lines: [73, 74]
function: "List<SerialDescriptor>?.compactArray"
difficulty: 1
tags: [最適化, 防御的プログラミング, 型システム]
format: 2
---

## ひとことで

`compactArray` は、`SerialDescriptor`（クラスの構造を表す記述子）のリストを、**配列に変えて返す** 関数です。リストが `null` か空のときは、新しい配列を作らずに、最初から用意してある空の配列を返します。

kotlinx.serialization は、クラスごとに多くの記述子を作ります。その中には、型パラメーターを持たないクラスなど、中身が空の場合がたくさんあります。そのたびに空の配列を作ると無駄になるので、この関数で同じ空配列を使い回しています。

## コード

```kotlin:line-numbers=73
internal fun List<SerialDescriptor>?.compactArray(): Array<SerialDescriptor> =
    takeUnless { it.isNullOrEmpty() }?.toTypedArray() ?: EMPTY_DESCRIPTOR_ARRAY
```

## 前提知識

- **`SerialDescriptor`**: kotlinx.serialization で、クラスの名前や要素の構造を説明する情報です。
- **`List<T>?`**: 要素のリストか、リストがない（`null`）ことを表す型です。
- **`takeUnless { 条件 }`**: 条件が偽のときだけ、元の値を返す標準関数です。ここでは「空でない」ときだけ、配列に変えます。
- **`toTypedArray()`**: リストを、要素の型を持つ配列に変換します。
- **エルビス演算子 `?:`**: 左側が `null` のときに、右側の値を使う書き方です。
- **`private val`**: ファイルの中だけで使える、変更できない値です。ここでは、空配列を 1 つだけ作るために使います。

## 何をしているか

### 1. 共通の空配列を用意する

```kotlin:line-numbers=67
private val EMPTY_DESCRIPTOR_ARRAY: Array<SerialDescriptor> = arrayOf()
```

空の配列を、ファイルに 1 つだけ作っておきます。この関数が呼ばれるたびに、同じ配列が返されます。

### 2. 空でなければ配列に変える

```kotlin:line-numbers=74
    takeUnless { it.isNullOrEmpty() }?.toTypedArray() ?: EMPTY_DESCRIPTOR_ARRAY
```

`takeUnless` で、`null` でも空でもないリストだけを残します。残ったリストは `toTypedArray()` で配列にします。`null` か空の場合は、`takeUnless` が `null` を返すので、エルビス演算子の右側の共通の空配列が使われます。

## ここがすごい

- **空の結果を使い回す**: 空の配列は中身がないので、何個あっても同じものを共有して問題ありません。毎回の割り当てを省けるので、記述子を大量に作る場面で効きます。
- **分岐を 1 行にまとめる**: 「空かどうか」の判断と「配列にするかどうか」が、`takeUnless` とエルビス演算子で 1 つの式になっています。
- **`null` と空を同じ扱いにする**: 呼び出し側は、リストが `null` か空かを気にせず、そのまま渡せます。
- **`private` で閉じる**: 共通の空配列はファイルの中だけに置いてあるので、外から書き換えられることはありません。

## まとめ

- 中身が空の配列は、共通のものを 1 つ用意して使い回すと、割り当てを減らせる。
- `takeUnless` とエルビス演算子を組み合わせると、空かどうかの分岐を 1 つの式に書ける。
- `null` と空を同じ扱いにすると、呼び出し側の書き方が簡単になる。
