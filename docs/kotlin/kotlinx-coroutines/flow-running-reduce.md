---
title: "途中経過をすべて流す runningReduce"
description: "畳み込みの途中の結果を 1 つずつ下流に流す runningReduce。最初の値を種にする判定を番兵オブジェクト 1 つで済ませている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Transform.kt
lines: [121, 131]
function: "Flow.runningReduce"
difficulty: 2
tags: [非同期, 関数型, 標準ライブラリ]
---

## ひとことで

`runningReduce` は、Flow の値を順に畳み込みながら、**毎回の途中結果をそのまま下流へ流す** 関数です。
`flowOf(1, 2, 3, 4).runningReduce { acc, v -> acc + v }` は、累計の `1, 3, 6, 10` を流します。

`reduce` が最後の答えだけを返すのに対し、こちらは「累計の履歴」を Flow として返します。実装は 10 行ほどで、番兵オブジェクトの使い方の良い見本になっています。

## コード

```kotlin:line-numbers=121
public fun <T> Flow<T>.runningReduce(operation: suspend (accumulator: T, value: T) -> T): Flow<T> = flow {
    var accumulator: Any? = NULL
    collect { value ->
        accumulator = if (accumulator === NULL) {
            value
        } else {
            operation(accumulator as T, value)
        }
        emit(accumulator as T)
    }
}
```

## 前提知識

- **Flow と `flow { ... }`**: Flow は値を順番に流すものです。`flow { ... }` のブロックの中で `emit(値)` を呼ぶと、その値が下流に流れます。中では元の Flow を `collect` して 1 個ずつ受け取れます。
- **拡張関数**: `fun <T> Flow<T>.runningReduce(...)` は、`Flow` 型に外から関数を追加する書き方です。ブロック内の `collect` は元の Flow のものです。
- **畳み込み**: 「累積値」と「次の値」から新しい累積値を作る操作を、要素ごとに繰り返すことです。
- **`Any?` と `NULL`**: `Any?` は何でも（`null` も）入る型です。`NULL` はライブラリ内部の番兵オブジェクトで、「まだ値がない」を表します。
- **`as T`**: 型のキャストです。`accumulator` は `Any?` 型なので、`operation` に渡したり `emit` したりする前に `T` とみなします。このファイルは 3 行目で「未検査のキャスト」の警告をまとめて抑えています。

## 何をしているか

### 1. 番兵で初期化（122 行目）

`accumulator` を `NULL` にします。

### 2. 値ごとに累積して流す（123〜130 行目）

`1, 2, 3, 4` の場合:

| 来た値 | 処理 | 新しい `accumulator` | 流す値 |
| --- | --- | --- | --- |
| 1 | 番兵なので値をそのまま | 1 | 1 |
| 2 | `1 + 2` | 3 | 3 |
| 3 | `3 + 3` | 6 | 6 |
| 4 | `6 + 4` | 10 | 10 |

`if` が式として値を返すので、124〜128 行目は「最初なら値そのもの、そうでなければ `operation` の結果」を 1 つの代入で書いています。

## ここがすごい

- **初期値を流さない**: 同じファイルの `runningFold`（101〜108 行目）は、初期値をまず `emit` してから畳み込みます（`0, 1, 3, 6, 10`）。`runningReduce` は最初の要素を種にするので、出力の数が入力と同じになります。用途に応じて選べるように 2 つ用意されています。
- **空の Flow でも例外にならない**: `reduce` は空だと例外を投げますが、`runningReduce` は「途中経過を流す」ものなので、空なら何も流さずに終わるだけです。番兵の判定は 1 個目の処理にしか使われません。
- **状態は変数 1 つ**: 「1 個目かどうか」のフラグを別に持たず、累積値の変数に番兵を入れておくだけで済んでいます。値として `null` が流れてきても、`NULL` とは別のオブジェクトなので誤判定しません。
- **コルーチンでも素直に書ける**: `operation` が `suspend` 関数でも、普通のループと同じ見た目で書けます。Flow の `collect` が順番に 1 個ずつ呼んでくれるので、ロックなども不要です。

## まとめ

- 「最初の要素を種にする」処理は、番兵オブジェクトで書くと変数が 1 つで済む。
- `runningFold` と `runningReduce` の違いは、初期値を流すかどうか。
- Flow の変換は `flow { collect { ... emit(...) } }` の形で素直に書ける。
