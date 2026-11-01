---
title: "成功でも失敗でも中身を取り出す merge"
description: "成功の値と失敗のエラーが同じ型のとき、どちらか中に入っている方を 1 つの値として取り出す merge。型の上限を使って、両方を同じ型として扱えるようにしている。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Get.kt
lines: [133, 138]
function: "Result.merge"
difficulty: 2
tags: [エラー処理, ジェネリクス, 関数型]
format: 2
---

## ひとことで

`merge()` は、結果（Result）の中身を **成功でも失敗でも、どちらか入っているほうを 1 つの値として取り出す** 関数です。成功なら値、失敗ならエラーを、同じ型の値として返します。

成功の型と失敗の型が同じ（たとえば両方が文字列）ときに役立ちます。

## コード

```kotlin:line-numbers=133
public fun <V : U, E : U, U> Result<V, E>.merge(): U {
    return when {
        isOk -> value
        else -> error
    }
}
```

## 前提知識

- **型パラメータの上限 `V : U` と `E : U`**: 「`V` は `U` の仲間である」「`E` も `U` の仲間である」という制約です。この制約があるから、戻り値の型を `U` 1 つで表せます。
- **`Result<V, E>`**: 成功の値の型 `V` と、失敗のエラーの型 `E` を持つ箱です。
- **`when` 式**: 条件を上から調べて、最初に当てはまった枝の値を結果にします。
- **`isOk` と `value` と `error`**: `isOk` は成功かどうか、`value` は成功の中身、`error` は失敗の中身です。

## 何をしているか

### 分岐の中身

```kotlin:line-numbers=134
    return when {
```

`when` 式の結果がそのまま関数の戻り値になります。

```kotlin:line-numbers=135
        isOk -> value
```

成功なら、中の値を返します。

```kotlin:line-numbers=136
        else -> error
```

失敗なら、中のエラーを返します。

どちらの枝も型は `U` になります。`V` も `E` も `U` の仲間なので、コンパイラはどちらを返しても `U` として扱えると確かめられます。だから `when` の結果は、型を変換せずにそのまま戻り値になります。

## ここがすごい

- **型の上限で両方をまとめる**: 「成功の型」と「失敗の型」を、共通の親の型 `U` で受け止める仕組みです。型の違いを無理に変換せず、そのまま 1 つの型として使えます。
- **分岐は 1 つだけ**: 成功か失敗かを見て、どちらかの中身を返す。それだけの関数です。読むのに迷いがありません。
- **`getOr` や `getOrElse` との違い**: それらは失敗のときに別の値を作ります。`merge` は別の値を作らず、入っているものをそのまま使います。
- **Scala の `Either.merge` が元**: 関数の名前と役割は、Scala の `Either` にある同名の関数から来ています。別の言語の考え方を取り入れた例として読めます。

## まとめ

- `merge` は、成功の値とエラーを、共通の型 `U` の 1 つの値として取り出す。
- 型の上限 `V : U` と `E : U` が、この関数を成り立たせている。
- 別の値を作らずに中身をそのまま使うので、`getOr` より単純な場面で使える。
