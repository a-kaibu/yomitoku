---
title: "結果の列を 1 つの結果にまとめる combine"
description: "複数の Result を並べたリストを、すべて成功なら値のリストの成功に、どれか 1 つでも失敗なら最初の失敗にまとめる combine。途中で打ち切る return を map の中で使っている。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [215, 224]
function: "Iterable<Result<V, E>>.combine"
difficulty: 2
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`combine()` は、`Result` が並んだリストを **1 つの `Result` にまとめる** 関数です。全部が成功なら、値を順番どおりに並べたリストの成功になります。どれか 1 つでも失敗していれば、その **最初の失敗** を返して、残りは見ません。

## コード

```kotlin:line-numbers=215
public fun <V, E> Iterable<Result<V, E>>.combine(): Result<List<V>, E> {
    val values = map { result ->
        when {
            result.isOk -> result.value
            else -> return result.asErr()
        }
    }

    return Ok(values)
}
```

## 前提知識

- **Iterable**: 順番に並んだ要素の集まりです。`List` や `Set` などが当てはまります。この関数は、`Result` が並んだものに対して呼べます。
- **`map { ... }`**: 各要素を変換して、新しいリストを作る関数です。ここでは各 `Result` を、値に変換しようとしています。
- **`return` とラムダ**: `map` のブロックは「インライン関数」の引数です。そのため、ブロックの中の `return` は、ブロックを抜けるだけでなく、外側の `combine` 全体から戻ることができます。
- **`asErr()`**: 失敗の `Result` を、戻り値に使える型の `Err` に変換する関数です。
- **`Ok(values)`**: 成功の箱に値を入れて作る関数です。

## 何をしているか

### 分岐の中身

### 1. 全部の要素を順番に取り出す

```kotlin:line-numbers=216
    val values = map { result ->
```

`map` で各要素を順番に取り出し、変換したリストを `values` に入れます。

### 2. 成功なら値を、失敗なら即座に返す

```kotlin:line-numbers=218
            result.isOk -> result.value
            else -> return result.asErr()
```

成功した要素は、中の値を取り出してリストに入れます。失敗した要素が 1 つでも出てきたら、`return` で `combine` 全体をそこで終えて、その失敗を返します。

ここが大事なところです。`map` の途中で `return` しているので、残りの要素は一切調べられません。たとえば 100 個の要素のうち 3 番目が失敗なら、4 番目以降は実行されません。

### 3. 全部成功したら、まとめて包む

```kotlin:line-numbers=223
    return Ok(values)
```

`map` が最後まで終わったら、すべて成功だったということです。取り出した値のリストを `Ok` で包んで返します。

## ここがすごい

- **途中で打ち切るのに、ループが要らない**: `for` と `break` を書かなくても、`map` のラムダの中の `return` だけで早期終了が実現できています。インライン関数の性質を使った、Kotlin らしい書き方です。
- **最初の失敗だけが返る**: 失敗を全部集める必要がない場面では、残りを調べないので無駄な処理がありません。エラーが複数あっても、戻り値は 1 つだけです。
- **順番が保たれる**: 結果のリストは、もとの順番のままです。入力の順番と出力の順番が一致するので、画面や API の応答に使っても混乱しません。
- **空のリストも正しく扱える**: 要素が 1 つもなければ `map` は空のリストを返し、`Ok(emptyList)` になります。特別な分岐を書かなくても、正しい結果が得られます。

## まとめ

- `combine` は、全部成功なら値のリストの成功、どれか失敗なら最初の失敗を返す。
- インライン関数の中の `return` を使うと、ループを書かずに途中で打ち切れる。
- 全部のエラーを集めたいときは、`combine` ではなく `combineErr` などの別の関数を使う。
