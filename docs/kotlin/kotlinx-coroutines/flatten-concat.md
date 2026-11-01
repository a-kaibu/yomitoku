---
title: "入れ子の Flow を順番に平らにする flattenConcat"
description: "Flow の中に Flow が入っている二重の流れを、内側を 1 つずつ順番に流して 1 本にする flattenConcat。内側の値を emitAll でそのまま下流へ渡す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Merge.kt
lines: [78, 80]
function: "Flow.flattenConcat"
difficulty: 2
tags: [非同期, 関数型, 遅延評価]
format: 2
---

## ひとことで

`flattenConcat()` は、**Flow の中に Flow が入った二重の流れ** を、内側の Flow を 1 つずつ順番に流して、1 本の Flow にまとめる関数です。

前の記事の `flatMapConcat` は、この関数を使って作られています。入れ子の形を平らにするという、基本の部品です。

## コード

```kotlin:line-numbers=78
public fun <T> Flow<Flow<T>>.flattenConcat(): Flow<T> = flow {
    collect { value -> emitAll(value) }
}
```

## 前提知識

- **Flow の入れ子**: `Flow<Flow<T>>` は、「Flow を流す Flow」です。外側の値のひとつひとつが、内側の Flow になっています。
- **`collect`**: 流れてくる値を、1 つずつ受け取る処理です。ここでは外側の値を受け取ります。
- **`emitAll`**: 別の Flow の値を、順番にすべて流す関数です。内側の Flow を、そのまま下流に渡すために使われます。
- **`flow { ... }`**: 自分で値を流す Flow を作る書き方です。ブロックの中で `emit` や `emitAll` を呼びます。
- **「順番に」の意味**: ひとつの内側の Flow が完全に終わってから、次の内側の Flow を始める、という意味です。

## 何をしているか

### 1. 外側の値を受け取る

```kotlin:line-numbers=78
public fun <T> Flow<Flow<T>>.flattenConcat(): Flow<T> = flow {
```

外側の Flow を受け取り、新しい Flow を作ります。新しい Flow の中で、外側の値を順番に扱います。

### 2. 内側の Flow をすべて流す

```kotlin:line-numbers=79
    collect { value -> emitAll(value) }
```

外側の値が来るたびに、その内側の Flow の値をすべて下流に流します。`emitAll` が終わるまで、次の外側の値は受け取りません。そのため、内側の Flow は必ず 1 つずつ順番に流れます。

## ここがすごい

- **待つことで順番を守る**: 次の内側の Flow を受け取るのは、今の内側の Flow が終わってからです。並列にしないことで、値の順番が乱れません。
- **コードが短い**: `collect` と `emitAll` の 1 行だけで、入れ子の流れを 1 本にしています。仕組みを理解すれば、内容はすぐに把握できます。
- **`flatMapConcat` の土台**: 変換の関数と組み合わせると、ファイルの一覧を順番に読むような処理が書けます。土台の部品が小さいので、組み合わせが自在です。
- **並列との対比**: 同時に複数の内側の Flow を動かす `flattenMerge` と比べると、待ち時間は増えますが、順番の保証が得られます。

## まとめ

- `flattenConcat` は、`Flow<Flow<T>>` を、内側を 1 つずつ順番に流す `Flow<T>` にする。
- 外側の値を `collect` で受け取り、`emitAll` で内側の値をそのまま流す。
- 順番が必要な処理の基礎になり、`flatMapConcat` の中で使われている。
