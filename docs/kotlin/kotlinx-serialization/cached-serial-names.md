---
title: "記述子の要素名を、一度だけ集めて使い回す"
description: "クラスの要素名の集合を作る cachedSerialNames。プラグインが作った記述子は、最初から名前の集合を持っているので、それをそのまま返す。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "Copyright 2017-2021 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license."
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: core/commonMain/src/kotlinx/serialization/internal/Platform.common.kt
lines: [58, 65]
function: "SerialDescriptor.cachedSerialNames"
difficulty: 2
tags: [最適化, データ構造, 防御的プログラミング]
format: 2
---

## ひとことで

`cachedSerialNames` は、`SerialDescriptor` が持つ **要素の名前の集合（`Set<String>`）を返す** 関数です。すでに名前の集合を持っている記述子なら、それをそのまま返します。持っていない場合は、要素の名前を順に集めて、新しい集合を作ります。

JSON などのデータを読むとき、「この名前は、このクラスの要素か」を何度も調べます。そのたびに名前を集め直すと無駄なので、この関数で一度だけ作って使い回せるようにしています。

## コード

```kotlin:line-numbers=58
internal fun SerialDescriptor.cachedSerialNames(): Set<String> {
    if (this is CachedNames) return serialNames
    val result = HashSet<String>(elementsCount)
    for (i in 0 until elementsCount) {
        result += getElementName(i)
    }
    return result
}
```

## 前提知識

- **`SerialDescriptor`**: クラスの名前、要素の数、各要素の名前などを表す情報です。kotlinx.serialization が、読み書きの処理を決めるときに使います。
- **`Set<String>`**: 同じ要素を 2 回持たない、文字列の集まりです。「含まれるか」を素早く調べられます。
- **`CachedNames` インターフェース**: 名前の集合を、あらかじめ持っていることを表すインターフェースです。コンパイラのプラグインが作る記述子が、これを実装しています。
- **`HashSet`**: 順番を持たず、要素の重複を許さない集合です。`HashSet<String>(要素数)` と書くと、最初から必要な大きさを確保します。
- **`elementsCount` と `getElementName(i)`**: 要素の数と、`i` 番目の要素の名前を返す関数です。
- **`+=`**: 集合に要素を追加する書き方です。

## 何をしているか

### 1. 名前の集合を持っていれば、そのまま返す

```kotlin:line-numbers=59
    if (this is CachedNames) return serialNames
```

記述子が `CachedNames` なら、中に用意されている `serialNames` を返します。新しい集合は作りません。

### 2. 持っていなければ、名前を集めて作る

```kotlin:line-numbers=60
    val result = HashSet<String>(elementsCount)
    for (i in 0 until elementsCount) {
        result += getElementName(i)
    }
```

要素の数を見て、その大きさの `HashSet` を用意します。そのあと、要素の名前を 1 つずつ追加します。大きさを最初に決めているので、途中で集合を広げ直す回数が減ります。

### 3. 作った集合を返す

```kotlin:line-numbers=64
    return result
```

集まった名前の集合を返します。

## ここがすごい

- **よくある場合を先に返す**: プラグインが作った記述子は、最初から名前の集合を持っています。その場合は、何も作らずに返すので、速く終わります。
- **必要な大きさを先に確保する**: 要素の数がわかっているので、`HashSet` の大きさを最初に決めています。増やす処理を減らして、無駄な作業を省いています。
- **インターフェースで分岐を表す**: `is CachedNames` で、特別な型かどうかを調べます。記述子の種類を増やしても、この関数はインターフェースだけを見ればよい作りです。
- **結果を集合にする**: 同じ名前が 2 回出ても、集合なので 1 つにまとまります。名前の存在を調べるのに都合のよい形です。

## まとめ

- 必要なデータが最初から手元にあるなら、それを使い回すと、作り直しを省ける。
- 集合の大きさが先にわかっているなら、最初に確保すると無駄な拡張を減らせる。
- 特別な型かどうかは、インターフェースで判断すると、種類を増やしやすい。
