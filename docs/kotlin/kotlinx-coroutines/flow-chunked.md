---
title: "最後の 1 個で無駄な確保をしない chunked"
description: "Flow の値を決まった個数ずつリストにまとめる chunked。リストを必要になるまで作らず、満杯で流した直後にも新しく確保しない工夫がある。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Transform.kt
lines: [149, 166]
function: "Flow.chunked"
difficulty: 2
tags: [非同期, メモリ管理, 最適化]
---

## ひとことで

`chunked(size)` は、Flow から来る値を `size` 個ずつ **リストにまとめて** 流す関数です。
`flowOf(1, 2, 3, 4, 5).chunked(2)` は `[1, 2]`、`[3, 4]`、`[5]` を流します。最後の余りも捨てずに流します。

ポイントは、**リストを「本当に要るとき」まで作らない** ことです。満杯のリストを流した直後に次のリストを用意してしまうと、それが最後の要素だった場合に空のリストが無駄になるからです。

## コード

```kotlin:line-numbers=149
@ExperimentalCoroutinesApi
public fun <T> Flow<T>.chunked(size: Int): Flow<List<T>> {
    require(size >= 1) { "Expected positive chunk size, but got $size" }
    return flow {
        var result: ArrayList<T>? = null // Do not preallocate anything
        collect { value ->
            // Allocate if needed
            val acc = result ?: ArrayList<T>(size).also { result = it }
            acc.add(value)
            if (acc.size == size) {
                emit(acc)
                // Cleanup, but don't allocate -- it might've been the case this is the last element
                result = null
            }
        }
        result?.let { emit(it) }
    }
}
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`flow { ... }` の中で `collect` で上流の値を受け取り、`emit` で下流へ流します。
- **`ArrayList<T>(size)`**: 中身を後から足せる配列リストです。引数の `size` は「最初に確保しておく容量」で、ちょうどその数まで入れても内部の配列を作り直さずに済みます。
- **`T?` と `null`**: 型名の後ろの `?` は「`null` も入る」という意味です。`result` は「リストがあるか、まだない（`null`）か」を表します。
- **`?:`（エルビス演算子）**: `a ?: b` は「`a` が `null` でなければ `a`、`null` なら `b`」です。
- **`.also { result = it }`**: 値をそのまま返しつつ、ついでに処理をするスコープ関数です。ここでは「新しいリストを作って `result` にも覚えさせ、そのリストを使う」を 1 式で書いています。
- **`result?.let { emit(it) }`**: `?.` は「`null` でなければ呼ぶ」という安全呼び出しです。`result` が残っていれば流します。
- **`@ExperimentalCoroutinesApi`**: まだ実験的な API であることを示す注釈です。

## 何をしているか

### 1. 引数チェック（151 行目）

まとめる数は 1 以上でなければいけません。

### 2. 必要になったらリストを作る（153〜156 行目）

最初、`result` は `null` です。値が来るたびに、`result` があればそれを使い、なければ容量 `size` のリストを作って `result` にも入れます。

### 3. 満杯になったら流して、手放す（157〜162 行目）

`size = 2` で `1, 2, 3, 4, 5` の場合:

- `1`: リスト作成 → `[1]`
- `2`: `[1, 2]` で満杯 → 流す → `result = null`
- `3`: リスト作成 → `[3]`
- `4`: `[3, 4]` → 流す → `result = null`
- `5`: リスト作成 → `[5]`

### 4. 余りを流す（164 行目）

上流が終わったとき、`result` に `[5]` が残っているので流します。もし入力が `1, 2, 3, 4` なら `result` は `null` で、何も流しません。

## ここがすごい

- **「確保しない」ことを明示したコメント**: 153 行目の「事前に確保しない」、160 行目の「片付けるが確保はしない。これが最後の要素だったかもしれない」というコメントが意図をはっきり伝えています。流した直後に `ArrayList(size)` を作る素直な書き方だと、入力がちょうど割り切れる場合に毎回 1 個の空リストが無駄になります。
- **流したリストを使い回さない**: `emit(acc)` のあと `acc.clear()` して再利用すると、下流が受け取ったリストの中身が書き換わってしまいます。毎回新しいリストを作ることで、下流は受け取ったリストを安心して保持できます。
- **余りの処理が自然に書ける**: 「まだ流していないリスト」が `result` に残るという形にしたので、最後の `result?.let` 1 行で余りを処理できています。
- **容量の指定**: `ArrayList(size)` と最初から容量を指定しているので、リストが内部で配列を作り直すことがありません。

## まとめ

- 入れ物は「使う直前」に作ると、最後の 1 回の無駄を避けられる。
- 下流に渡したオブジェクトは再利用せず、新しく作るほうが安全。
- 「未処理の残り」を変数に残しておく形にすると、終わりの処理が 1 行で済む。
