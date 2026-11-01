---
title: "キーと値の両方が一致するかを、null を含めて確かめる"
description: "Map に、指定したキーと値の組（エントリ）が入っているかを調べる containsEntry。値が null のときは、キーが存在するかで判断する。"
language: kotlin
project: "kotlinx.collections.immutable"
repo: https://github.com/Kotlin/kotlinx.collections.immutable
license: Apache-2.0
copyright: "Copyright 2016-2026 JetBrains s.r.o."
commit: "9f961e4dd419dff58ffea164dd41ebba68acc8d6"
file: core/commonMain/src/internal/mapFunctions.kt
lines: [9, 11]
function: "Map.containsEntry"
difficulty: 2
tags: [データ構造, 型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`containsEntry` は、`Map` に **「このキーに、この値が対応している」** という組（エントリ）が入っているかを調べる拡張関数です。キーだけでも、値だけでもなく、両方が一致して初めて `true` になります。

Kotlin の `Map` には、キーがあるかを調べる `containsKey` はありますが、キーと値の組を直接調べる関数は標準では用意されていません。この関数は、それを足すための小さな実装です。`null` の値も扱えるように、少し工夫した書き方をしています。

## コード

```kotlin:line-numbers=9
internal fun <K, V> Map<K, V>.containsEntry(element: Map.Entry<K, V>): Boolean =
    this[element.key]?.let { candidate -> candidate == element.value }
        ?: (element.value == null && containsKey(element.key))
```

## 前提知識

- **`Map.Entry`**: `Map` の 1 つの組（キーと値）を表す型です。`entry.key` と `entry.value` で、それぞれを取り出せます。
- **`this[key]`**: キーに対応する値を取り出す書き方です。キーがなければ `null` を返します。`null` は「キーがない」だけでなく「値が `null`」の場合にも返るので、この区別が問題になります。
- **`?.let { ... }`**: 値が `null` でなければ、ブロックを実行して結果を返します。`null` なら、何もせずに `null` を返します。
- **セーフコールと `?:`（エルビス演算子）**: `?.let` の結果が `null` のときだけ、右側の値を使います。
- **`containsKey`**: キーが存在するかを調べる関数です。値が `null` でも、キーがあれば `true` になります。

## 何をしているか

### 1. 値を取り出して比べる

```kotlin:line-numbers=10
    this[element.key]?.let { candidate -> candidate == element.value }
```

まず、エントリのキーに対応する値を取り出します。値が `null` でなければ、その値と、調べたいエントリの値を `==` で比べます。結果は `true` か `false` です。

### 2. 値が null のときの判定

```kotlin:line-numbers=11
        ?: (element.value == null && containsKey(element.key))
```

`this[element.key]` が `null` だったとき、それは「キーがない」か「値が `null` で入っている」かのどちらかです。調べたいエントリの値が `null` なら、`containsKey` でキーが存在するかを確かめます。両方が成り立つときだけ `true` です。

## ここがすごい

- **`null` の 2 通りの意味を分けている**: `this[key]` の `null` は、キーがないのか、値が `null` なのかが区別できません。だから `containsKey` を使って、その区別を補っています。
- **エルビス演算子で分岐を 1 行に**: 「値が取れたとき」と「取れなかったとき」の 2 通りを、`?.let` と `?:` で 1 つの式にまとめています。
- **比較の順番が安全**: 値が `null` のときは、`element.value == null` を先に確かめてから `containsKey` を呼びます。値が `null` でない場合は、無駄に `containsKey` を呼びません。
- **短い拡張関数で再利用**: 不変の Map の実装が、この関数を使い回しています。標準にない操作を、小さく確実に足す書き方のよい例です。

## まとめ

- `Map` の値が `null` かどうかと、キーが存在するかは別の情報なので、両方を分けて確かめる。
- 「値が取れたら比べる」「取れなかったらキーの存在を確かめる」を、`?.let` と `?:` で書くと短くまとまる。
- 標準にない組の判定は、小さな拡張関数にすると、他の場所でも使い回せる。
