---
title: "成功のときだけ次の失敗しうる処理へつなぐ flatMap"
description: "成功のときだけ、値から新しい Result を作る処理を続ける flatMap。失敗はそのまま後ろへ流れる。Result を返す処理をつなげて書くための基本の関数。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [89, 95]
function: "Result.flatMap"
difficulty: 2
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`map` は、成功のときに値を **普通の値** に変換します。しかし、変換の中でまた失敗しうる処理（`Result` を返す処理）をしたいときは、`map` だと `Result` が二重に包まれてしまいます。

`flatMap` は、成功のときに値から **新しい `Result`** を作り、それをそのまま結果にします。失敗のときは、何もせず失敗を後ろへ流します。

## コード

```kotlin:line-numbers=89
public inline infix fun <V, E, U> Result<V, E>.flatMap(transform: (V) -> Result<U, E>): Result<U, E> {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return andThen(transform)
}
```

## 前提知識

- **`Result<V, E>`**: 成功（`Ok`）か失敗（`Err`）を表す型です。
- **`map` との違い**: `map` の変換は普通の値を返し、`flatMap` の変換は `Result` を返します。
- **`andThen`**: 同じ `Result` 型の別の関数で、`flatMap` はこれを呼ぶだけです。`andThen` は、成功のときだけ次の `Result` へつなぐ処理です。
- **`contract`**: 引数の関数が最大 1 回だけ呼ばれることを伝える宣言です。
- **中置の `flatMap`**: `result flatMap { ... }` と書けます。

## 何をしているか

### 1. 本体は andThen に任せる

`flatMap` は、同じ処理を `andThen(transform)` に渡すだけです。名前が違うだけで、動きは同じです。

```kotlin:line-numbers=94
    return andThen(transform)
```

### 2. 変換の呼び出し回数を伝える

`callsInPlace(transform, AT_MOST_ONCE)` で、変換の関数は最大 1 回だけ呼ばれると伝えます。

```kotlin:line-numbers=91
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

## ここがすごい

- **二重の包みを作らない**: `map` で `Result` を返す関数を渡すと、`Result<Result<U, E>, E>` になってしまいます。`flatMap` なら、ふつうの `Result<U, E>` のまま続けられます。
- **失敗が途中で止まる**: どこかの段階で `Err` になると、後ろの `flatMap` は実行されず、最後まで同じ失敗が届きます。`if` の入れ子を書かずに、順番に処理できます。
- **同じ型の中で連結する**: 成功と失敗の型（`E`）がそろっているので、処理を何個つないでも、エラーの型は変わりません。
- **1 段の名前で意図が伝わる**: 「`Result` を返す処理へつなぐ」という意味が、名前からそのまま分かります。

## まとめ

- 変換の中でまた `Result` が出るなら、`map` ではなく `flatMap` を使う。
- 失敗は途中で止まり、後ろの処理は実行されずに最後まで届く。
- 処理をつなぐと、入れ子の `if` を減らせる。
