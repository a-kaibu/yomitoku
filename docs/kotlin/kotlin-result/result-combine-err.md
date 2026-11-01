---
title: "失敗だけを集める combineErr"
description: "Result の列から、すべてが失敗ならエラーを全部集めたリストの失敗にまとめる combineErr。最初の成功が見つかった時点で、その成功を返して打ち切る。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [268, 277]
function: "Iterable<Result<V, E>>.combineErr"
difficulty: 2
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`combineErr()` は、`Result` が並んだリストを **エラーのほうから** 1 つにまとめる関数です。すべてが失敗なら、エラーを順番どおりに並べたリストを包んで返します。どれか 1 つでも成功があれば、その **最初の成功** を返して終わります。

`combine` の、成功と失敗を入れ替えた版にあたります。

## コード

```kotlin:line-numbers=268
public fun <V, E> Iterable<Result<V, E>>.combineErr(): Result<V, List<E>> {
    val errors = map { result ->
        when {
            result.isErr -> result.error
            else -> return result.asOk()
        }
    }

    return Err(errors)
}
```

## 前提知識

- **`combine` との対応**: `combine` は成功の値を集め、最初の失敗で止まりました。`combineErr` はエラーを集め、最初の成功で止まります。どちらも「途中で `return` して打ち切る」という同じ形です。
- **`map` と `return`**: `map` のラムダは、インライン関数の引数です。そのため、ラムダの中の `return` は外側の関数から戻ります。
- **`asOk()`**: 成功の `Result` を、戻り値として使える型の `Ok` に変換する関数です。
- **`Err(errors)`**: 失敗の箱に、エラーのリストを入れて作る関数です。
- **`Result<V, List<E>>`**: 戻り値の型のエラー側が `List<E>` です。個々のエラーではなく、エラーの一覧を持つ結果になります。

## 何をしているか

### エラーを順番に取り出す

```kotlin:line-numbers=269
    val errors = map { result ->
```

`map` で各要素を順番に見て、エラーのリストを作ろうとします。

### 成功を見つけたら即座に返す

```kotlin:line-numbers=271
            result.isErr -> result.error
```

失敗なら、中のエラーをリストに入れます。

```kotlin:line-numbers=272
            else -> return result.asOk()
```

成功が 1 つでも見つかったら、`return` で `combineErr` 全体を終えて、その成功を返します。エラーを集める必要がなくなるからです。

### 全部失敗なら、エラーをまとめる

```kotlin:line-numbers=276
    return Err(errors)
```

`map` が最後まで終われば、すべて失敗だったということです。集めたエラーのリストを `Err` で包んで返します。

## ここがすごい

- **対称な作りの 2 つの関数**: `combine` と `combineErr` は、箱の役割を入れ替えただけの同じ構造です。片方を理解すれば、もう片方もすぐ読めます。
- **成功が見つかった時点で止まる**: 「どれか 1 つでも成功すればよい」という場面では、残りの要素を調べません。無駄な比較が省かれます。
- **エラーの順番が保たれる**: 返されるエラーのリストは、もとの要素の順番のままです。どの候補が失敗したかを、順番に表示する用途に向いています。
- **空の列の扱い**: 要素が 1 つもなければ、エラーのリストは空のまま `Err` になります。`combine` の空の列の扱いとは逆になる点を覚えておくと、読み違いを防げます。

## まとめ

- `combineErr` は、すべてが失敗ならエラーを一覧にして返し、成功があれば最初の成功を返す。
- `combine` と並べると、成功と失敗の役割が入れ替わった関係だと分かる。
- `map` の中の `return` を使うことで、ループを書かずに途中で打ち切っている。
