---
title: "成功なら変換し、失敗なら既定値を返す mapOr"
description: "成功のときは値を変換し、失敗のときは渡された既定値をそのまま返す mapOr。変換と既定値を 1 回の呼び出しでまとめて決められる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [247, 259]
function: "Result.mapOr"
difficulty: 2
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`mapOr()` は、結果（Result）が成功なら中の値に **変換の関数を当てて** 結果を返し、失敗なら **渡しておいた既定値** をそのまま返す関数です。変換と既定値の指定を、1 回の呼び出しでまとめて書けます。

`map` で変換してから `getOr` で既定値を入れる、という 2 段階の処理を、1 段にまとめた形です。

## コード

```kotlin:line-numbers=247
public inline fun <V, E, U> Result<V, E>.mapOr(
    default: U,
    transform: (V) -> U,
): U {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> transform(value)
        else -> default
    }
}
```

## 前提知識

- **`map` と `getOr` の組み合わせ**: `result.map { ... }.getOr(0)` は、成功なら変換、失敗なら既定値という同じ結果になります。`mapOr` はその 2 段を 1 段にまとめています。
- **`inline` と `contract`**: `inline` は呼び出し箇所に関数を展開します。`contract` の `callsInPlace` は、`transform` が最大 1 回だけ呼ばれることを、コンパイラに伝えています。
- **戻り値の型 `U`**: 変換後の型と既定値の型は同じ `U` にそろえます。どちらの枝を通っても、戻り値の型が変わりません。
- **`isOk` と `value`**: 成功かどうかを表すプロパティと、成功の中身です。

## 何をしているか

### 成功と失敗で分ける

```kotlin:line-numbers=256
        isOk -> transform(value)
```

成功なら、中の値を `transform` に渡した結果を返します。

```kotlin:line-numbers=257
        else -> default
```

失敗なら、最初に渡された既定値をそのまま返します。エラーの中身は見ません。

`transform` は成功のときだけ呼ばれるので、失敗が続く場合は変換の処理が一度も走りません。既定値は呼び出し前に用意されているので、重い既定値を使うときは、その点を意識すると安心です。

## ここがすごい

- **1 回の呼び出しで完結する**: 変換と既定値の指定を並べて書けるので、途中の `Result` を変数に入れずに済みます。読むときも、一続きの意味として理解できます。
- **型が 1 つに決まる**: 変換後の `U` と既定値の型が一致するので、戻り値は `U` のままです。`null` を混ぜる必要がありません。
- **変換は失敗時に走らない**: `transform` が呼ばれるのは成功のときだけです。失敗が多い処理でも、余計な計算を避けられます。
- **Rust の `map_or` が元**: Rust の `Result::map_or` と同じ名前と役割です。別の言語の書き方を知っていると、すぐに意味が分かります。

## まとめ

- `mapOr` は、成功なら変換、失敗なら既定値を、1 回の呼び出しで返す。
- 変換は成功のときだけ実行され、既定値は戻り値の型 `U` にそろえる。
- `map` と `getOr` を続けて書くのと同じ結果を、より短く表せる。
