---
title: "失敗のときだけ別の Result に切り替える orElse"
description: "失敗のとき、エラーを受け取って新しい Result を作り、その結果を使う orElse。成功はそのまま通す。失敗を別の処理で取り戻したり、別の失敗に置き換えたりできる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Or.kt
lines: [26, 35]
function: "Result.orElse"
difficulty: 2
tags: [エラー処理, 関数型]
format: 2
---

## ひとことで

`orElse` は、**失敗のときだけ、エラーを受け取って新しい `Result` を作る** 関数です。成功のときは、値を変えずに通します。

`recover` が「失敗を成功の値に変える」のに対して、`orElse` は「失敗を、別の `Result`（成功でも失敗でもよい）に置き換える」関数です。たとえば、1 つ目の入り口が失敗したら、2 つ目の入り口を試す、という使い方ができます。

## コード

```kotlin:line-numbers=26
public inline infix fun <V, E, F> Result<V, E>.orElse(transform: (E) -> Result<V, F>): Result<V, F> {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> this.asOk()
        else -> transform(error)
    }
}
```

## 前提知識

- **`Result<V, E>`**: 成功（`Ok`）か失敗（`Err`）を表す型です。
- **`Result<V, F>` の戻り値**: 戻り値のエラーの型は、新しい `F` です。失敗を置き換えると、型も変わります。
- **`contract`**: 引数の関数が最大 1 回だけ呼ばれることを伝える宣言です。
- **`asOk()`**: 成功の値を、別のエラー型の `Result` に読み替える関数です。

## 何をしているか

### 1. 成功なら、そのまま通す

```kotlin:line-numbers=32
        isOk -> this.asOk()
```

成功のときは、値を変えずに、エラーの型だけを新しい型に読み替えて返します。`transform` は呼ばれません。

### 2. 失敗なら、新しい Result を作る

```kotlin:line-numbers=33
        else -> transform(error)
```

失敗のときは、エラーを `transform` に渡して、その戻り値をそのまま結果にします。戻り値は成功にも失敗にもなりえます。

### 3. 呼び出し回数を伝える

```kotlin:line-numbers=28
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

`transform` は最大 1 回だけ呼ばれると、コンパイラに伝えています。

## ここがすごい

- **失敗の行き先を変えられる**: 失敗のときに、別の入り口や別の処理へ切り替えられます。「第 1 の方法が失敗したら、第 2 の方法」という書き方が、ネストなしで書けます。
- **成功は素通し**: 成功のときは、`transform` が呼ばれず、値もそのままです。無駄な処理がありません。
- **戻り値の型で柔軟性を示す**: 戻り値は `Result<V, F>` です。新しい失敗の型を選べるので、エラーの種類を変えてから、呼び出し側に渡せます。
- **`recover` との違い**: `recover` は必ず成功を返しますが、`orElse` は失敗のままでもよい点が違います。目的に応じて使い分けます。

## まとめ

- 失敗のときだけ、別の `Result` に切り替えるなら `orElse` を使う。
- 成功は値を変えずに通し、失敗だけを処理する。
- 戻り値は成功にも失敗にもなりうる。`recover` と目的で使い分ける。
