---
title: "初期値なしで畳み込む reduce と「空なら例外」"
description: "Flow の値を左から順に 1 つにまとめる reduce。初期値がないので最初の値をそのまま種にし、番兵で空かどうかを判定している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/terminal/Reduce.kt
lines: [15, 30]
function: "Flow.reduce"
difficulty: 2
tags: [非同期, 関数型, 標準ライブラリ]
---

## ひとことで

`reduce` は、Flow から流れてくる値を **左から順に 1 つにまとめる** 関数です。
たとえば `flowOf(1, 2, 3, 4).reduce { acc, v -> acc + v }` は `((1 + 2) + 3) + 4 = 10` を返します。

`fold` と違って初期値を渡さないので、**最初の値そのものを出発点** にします。そのため「1 個も来なかったら答えがない」という場合を、番兵オブジェクトで見分けています。

## コード

```kotlin:line-numbers=15
public suspend fun <S, T : S> Flow<T>.reduce(operation: suspend (accumulator: S, value: T) -> S): S {
    var accumulator: Any? = NULL

    collect { value ->
        accumulator = if (accumulator !== NULL) {
            @Suppress("UNCHECKED_CAST")
            operation(accumulator as S, value)
        } else {
            value
        }
    }

    if (accumulator === NULL) throw NoSuchElementException("Empty flow can't be reduced")
    @Suppress("UNCHECKED_CAST")
    return accumulator as S
}
```

## 前提知識

- **畳み込み（reduce / fold）**: 「たまっている値（accumulator、累積値）」と「次の値」を受け取って新しい累積値を返す関数を、要素ごとに繰り返し適用する操作です。合計・最大値・連結などをまとめて表せます。
- **`<S, T : S>`**: 型パラメータ（ジェネリクス）です。`T : S` は「`T` は `S` の一種（サブタイプ）」という制約です。たとえば `Int` の Flow を `Number` として畳み込めるようにしています。
- **`suspend (accumulator: S, value: T) -> S`**: 「累積値と値を受け取って新しい累積値を返す、一時停止できる関数」の型です。
- **`NULL`, `===`, `!==`**: `NULL` は「まだ値がない」を表す内部の番兵オブジェクトです。`===` / `!==` は同じオブジェクトかどうかを比べます。
- **`if` は式**: Kotlin の `if` は値を返せます。`accumulator = if (...) A else B` は、条件に応じて A か B を代入します。
- **`NoSuchElementException`**: 「要素がない」ことを表す標準の例外です。

## 何をしているか

### 1. 累積値を番兵で始める（16 行目）

`accumulator` を `NULL` にしておきます。

### 2. 値ごとに畳み込む（18〜25 行目）

`1, 2, 3, 4` を足し合わせる場合:

- `1` が来る: `accumulator` は `NULL` なので、`1` をそのまま累積値にする（23 行目）
- `2` が来る: `operation(1, 2)` で `3`
- `3` が来る: `operation(3, 3)` で `6`
- `4` が来る: `operation(6, 4)` で `10`

### 3. 空なら例外、そうでなければ返す（27〜29 行目）

Flow が 1 個も流さなかった場合、`accumulator` は `NULL` のままです。初期値がないので答えを作れず、例外を投げます。

## ここがすごい

- **初期値がいらない理由**: 最大値を求めるとき、`fold` なら「最小の値」を初期値として用意する必要があります。`reduce` は最初の要素を種にするので、そうした「ありえない値」を考えずに済みます。
- **フラグ変数を使わない**: 「1 個目かどうか」を `Boolean` で管理すると変数が 2 つになり、更新を忘れる危険があります。番兵 `NULL` を使えば、累積値の変数 1 つで「まだ空」と「値あり」を表せます。値として `null` が来ても `NULL` とは別物なので混ざりません。
- **型を少し広げられる**: `<S, T : S>` のおかげで、結果の型を要素の型より広くできます。標準ライブラリの `Iterable.reduce` と同じ設計で、使い勝手がそろっています。
- **`fold` との違いがよく分かる**: 同じファイルの `fold`（35〜44 行目）は初期値があるので番兵も例外も不要で、`inline` で書かれています。`reduce` と見比べると、初期値の有無が実装をどう変えるかが学べます。

## まとめ

- 初期値なしの畳み込みは、最初の要素を種にして、空の場合だけ特別に扱う。
- 「まだ値がない」は番兵オブジェクトで表すと、変数を増やさず `null` とも衝突しない。
- `reduce` と `fold` は「初期値の有無」が違うだけで、実装の形が大きく変わる。
