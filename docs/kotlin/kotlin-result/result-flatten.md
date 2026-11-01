---
title: "二重の結果を一重にする flatten"
description: "成功の中にさらに結果が入っている二重の Result を、1 段の Result にまとめる flatten。外側が失敗ならそのエラーを、内側が失敗ならその内側のエラーを返す。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [71, 76]
function: "Result.flatten"
difficulty: 1
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`flatten()` は、`Result` の中にさらに `Result` が入った **二重の結果** を、普通の 1 段の `Result` にまとめる関数です。外側が失敗ならそのエラーを、外側が成功なら中の結果をそのまま返します。

値が 1 つの箱の中に入っているのを、1 段に平らにする、というイメージです。

## コード

```kotlin:line-numbers=71
public fun <V, E> Result<Result<V, E>, E>.flatten(): Result<V, E> {
    return when {
        isOk -> value
        else -> this.asErr()
    }
}
```

## 前提知識

- **二重の Result**: `Result<Result<V, E>, E>` は、外側の成功の中に、もう 1 つの `Result` が入った形です。たとえば「取得は成功し、その中身の変換が失敗した」のような状態を表せます。
- **`isOk` と `value`**: 外側の `Result` が成功かどうか、成功の中身は何か、を表す値です。ここでの `value` は内側の `Result` そのものです。
- **`this.asErr()`**: 外側の失敗のエラーを、戻り値の型に合わせた `Err` に変換する関数です。
- **`flatMap` との関係**: `flatMap` は、変換しながら二重の結果を平らにする関数です。`flatten` は、変換なしで平らにするだけの関数です。

## 何をしているか

### 分岐の中身

```kotlin:line-numbers=72
    return when {
```

`when` 式で、外側の成功かどうかを調べます。

```kotlin:line-numbers=73
        isOk -> value
```

外側が成功なら、中に入っている内側の `Result` をそのまま返します。内側の `Result` が成功か失敗かは、そのまま引き継がれます。

```kotlin:line-numbers=74
        else -> this.asErr()
```

外側が失敗なら、そのエラーを返します。内側の `Result` は存在しないので、外側のエラーをそのまま使います。

この 2 つの枝で、二重の箱が 1 段の箱になります。型も `Result<V, E>` に変わります。

## ここがすごい

- **型が二重から一重へ変わる**: 入れ子の結果を、扱いやすい形に変えられます。途中で `if` を重ねて確かめる必要がなくなります。
- **エラーの型が 1 つにそろう**: 外側も内側も同じエラーの型 `E` を使っているので、どちらの失敗でも戻り値のエラーは `E` のままです。
- **分岐は 2 つだけ**: 外側の成功か失敗かを見るだけで、内側に進むかどうかが決まります。短くて、読み違いがありません。
- **`flatMap` の土台**: 変換を行ってから平らにする `flatMap` は、言い換えると「`map` したあとに `flatten` する」処理です。`flatten` を理解すると、`flatMap` の仕組みも見えてきます。

## まとめ

- `flatten` は、`Result<Result<V, E>, E>` を `Result<V, E>` に平らにする。
- 外側が失敗ならそのエラーを、成功なら内側をそのまま返す。
- `flatMap` の変換なし版と考えると、2 つの関数の関係が分かりやすい。
