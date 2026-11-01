---
title: "エルビス演算子で「null なら何もしない」を 1 行で書く mapNotNull"
description: "変換して null になったものを捨てる mapNotNull。?: return と inline 展開の組み合わせで、分岐も一時オブジェクトもほとんどない形にしている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Transform.kt
lines: [56, 59]
function: "Flow.mapNotNull"
difficulty: 1
tags: [非同期, イディオム, 標準ライブラリ]
---

## ひとことで

`mapNotNull` は、Flow の値を 1 つずつ変換し、**変換結果が `null` になったものは捨てて**、それ以外を流す関数です。
`flowOf("1", "x", "3").mapNotNull { it.toIntOrNull() }` は `1, 3` を流します（`"x"` は数値にできず `null` になるので消えます）。

`map` と `filterNotNull` を 1 回で行うもので、Kotlin らしい `?: return` の書き方が詰まった 3 行です。

## コード

```kotlin:line-numbers=56
public inline fun <T, R: Any> Flow<T>.mapNotNull(crossinline transform: suspend (value: T) -> R?): Flow<R> = transform { value ->
    val transformed = transform(value) ?: return@transform
    return@transform emit(transformed)
}
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。
- **`transform { value -> ... }`**: Flow の値を受け取り、好きな回数だけ `emit` できる汎用の変換です。このファイルでは 12 行目で、チェックを省いた軽量版 `unsafeTransform` を `transform` という名前でインポートしています。
- **`R?` と `R : Any`**: `R?` は「`R` か `null`」です。`R : Any` という制約は「`R` 自体は `null` を含まない型」という意味で、結果の Flow が `null` を流さないことを型で保証します。
- **`?:`（エルビス演算子）**: `a ?: b` は「`a` が `null` でなければ `a`、`null` なら `b`」です。右側に `return` を書くと、「`null` ならここで抜ける」という意味になります。
- **`return@transform`**: ラムダの中から、そのラムダだけを抜けるラベル付きの return です。
- **`inline` と `crossinline`**: `inline` は呼び出し元にコードを埋め込む指定です。`crossinline` は、埋め込まれたラムダを別の場所（ここでは `transform` のラムダの中）から呼ぶときに付けます。

## 何をしているか

### 1. 変換して、null なら抜ける（57 行目）

`transform(value)` を呼び、結果が `null` なら `return@transform` でこの値の処理を終えます。何も `emit` しないので、値は捨てられたことになります。

### 2. null でなければ流す（58 行目）

ここに来た時点で `transformed` は `null` ではないと分かっているので、コンパイラは型を `R`（`null` なし）として扱います（スマートキャスト）。それを `emit` します。

`"1", "x", "3"` の場合:

- `"1"` → `1` → 流す
- `"x"` → `null` → 抜ける
- `"3"` → `3` → 流す

## ここがすごい

- **`?: return` イディオム**: 「`null` なら早めに抜ける」を `if` 文なしに 1 行で書けます。抜けたあとの行では、変数が `null` でないことが型で保証されるので、以降のコードに `!!` や `?.` が要りません。
- **中間の Flow を作らない**: `map { ... }.filterNotNull()` と書くと Flow の変換が 2 段になり、値ごとに 2 回の呼び出しが入ります。`mapNotNull` は 1 段で済みます。
- **`inline` で関数呼び出しも消える**: `mapNotNull` と引数のラムダは呼び出し元に展開されるので、ラムダのためのオブジェクトも作られません。
- **型で約束する**: 戻り値の型は `Flow<R>` で、`R : Any` なので `null` を流さないことがコンパイラに伝わります。受け取る側は `null` チェックを書かずに済みます。

## まとめ

- `val x = f() ?: return` で「`null` なら抜ける」を短く書ける。その後 `x` は `null` でない型として扱える。
- 2 段の変換を 1 段にまとめると、値ごとの処理が減る。
- 型パラメータに `: Any` の制約を付けると、「`null` を含まない」ことを型で表せる。
