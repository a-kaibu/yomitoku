---
title: "1 つ目が失敗したら 2 つ目を作らない zip"
description: "2 つの処理（それぞれ Result を返す）の値を組み合わせる zip。1 つ目が失敗すれば、2 つ目の処理は呼ばれずに止まる。成功した値だけを transform に渡す。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Zip.kt
lines: [14, 30]
function: "zip"
difficulty: 2
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`zip(producer1, producer2) { v1, v2 -> ... }` は、2 つの処理の結果（それぞれ `Result`）を組み合わせて、**両方が成功したときだけ** 新しい値を作る関数です。

ここで「処理」は、`Result` を返す関数（`Producer`）として渡します。値そのものではなく、関数を渡すことで、必要になるまで計算を始めません。

## コード

```kotlin:line-numbers=14
public inline fun <T1, T2, E, V> zip(
    producer1: Producer<T1, E>,
    producer2: Producer<T2, E>,
    transform: (T1, T2) -> V,
): Result<V, E> {
    contract {
        callsInPlace(producer1, InvocationKind.EXACTLY_ONCE)
        callsInPlace(producer2, InvocationKind.AT_MOST_ONCE)
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return producer1().flatMap { v1 ->
        producer2().map { v2 ->
            transform(v1, v2)
        }
    }
}
```

## 前提知識

- **`Producer<T, E>`**: 引数を取らず、`Result<T, E>` を返す関数の別名です。`() -> Result<T, E>` と同じ意味です。
- **`flatMap` と `map`**: 成功のときだけ、次の処理へつなぐ関数です。`flatMap` は `Result` を返す処理へ、`map` は普通の値を返す処理へつなぎます。
- **`contract`**: 引数の関数が何回呼ばれるかを、コンパイラに伝える宣言です。`EXACTLY_ONCE` は必ず 1 回、`AT_MOST_ONCE` は 0 回か 1 回を表します。
- **`inline`**: 呼び出し箇所に展開される関数です。

## 何をしているか

### 1. 1 つ目を実行し、成功したら次へ

```kotlin:line-numbers=25
    return producer1().flatMap { v1 ->
```

最初の処理を呼び出します。失敗ならここで終わり、後ろは実行されません。成功すると、その値 `v1` を使って続きに進みます。

### 2. 2 つ目を実行し、値を組み合わせる

```kotlin:line-numbers=26
        producer2().map { v2 ->
            transform(v1, v2)
        }
```

2 つ目を呼び出し、成功したら `transform` で 2 つの値を組み合わせます。失敗ならそのまま失敗を返します。

### 3. 呼び出し回数を伝える

```kotlin:line-numbers=20
        callsInPlace(producer1, InvocationKind.EXACTLY_ONCE)
        callsInPlace(producer2, InvocationKind.AT_MOST_ONCE)
```

1 つ目は必ず 1 回呼ばれますが、2 つ目は 1 つ目が失敗したときには呼ばれないので、「0 回か 1 回」と伝えています。

## ここがすごい

- **失敗したら後の計算をしない**: 1 つ目が失敗したとき、2 つ目の処理（重い通信や計算かもしれない）を始めずに済みます。無駄な処理が省かれます。
- **関数で渡すので、遅延する**: 値を先に計算せず、関数を渡すことで、必要になったときだけ実行されます。
- **`flatMap` と `map` をつなぐ**: 2 つの処理を `flatMap` と `map` の組み合わせで書くので、`if` の入れ子がなく、読みやすい形になっています。
- **呼び出し回数の情報**: `contract` の情報によって、コンパイラは 2 つ目が必ず呼ばれるとは限らないと理解し、値の扱いを正しく判断できます。

## まとめ

- 2 つの処理の結果を組み合わせるとき、1 つ目が失敗したら 2 つ目を実行しない。
- 処理そのものを関数で渡すと、必要になるまで計算を始めずに済む。
- `contract` で呼び出し回数を伝えると、コンパイラの判断が正確になる。
