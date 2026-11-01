---
title: "成功のときだけ使う予備のエラー getErrorOr"
description: "失敗のときは中のエラーを、成功のときは渡された予備のエラーを返す getErrorOr。getOr の対になる関数で、エラーの側から既定値を決める。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Get.kt
lines: [59, 64]
function: "Result.getErrorOr"
difficulty: 1
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`getErrorOr` は、結果（Result）が失敗なら中の **エラー** を、成功なら渡しておいた予備のエラーを返す関数です。前に紹介した `getOr` の、ちょうど反対側にあたります。

## コード

```kotlin:line-numbers=59
public infix fun <V, E> Result<V, E>.getErrorOr(default: E): E {
    return when {
        isOk -> default
        else -> error
    }
}
```

## 前提知識

- **Result の 2 つの側面**: 成功（`Ok`）は値を、失敗（`Err`）はエラーを持ちます。どちらか一方だけが中にあります。
- **`getOr` との対応**: `getOr` は成功側の値を取り出し、失敗なら予備の値を返します。`getErrorOr` は失敗側のエラーを取り出し、成功なら予備のエラーを返します。
- **`isOk` と `error`**: `isOk` は成功かどうかを表す値です。`error` は、失敗のときに入っているエラーです。`Err` の中身を読むプロパティです。
- **型パラメータ `E`**: エラーの型です。`default` も `error` も同じ `E` なので、戻り値の型もそろいます。

## 何をしているか

### 分岐の中身

ここでも `when` の枝は 2 つだけです。

```kotlin:line-numbers=61
        isOk -> default
```

成功のときは、予備のエラーを返します。成功しているので、本当のエラーは存在しません。その場合に「ないものとして扱う既定のエラー」を返す、と読めます。

```kotlin:line-numbers=62
        else -> error
```

失敗のときは、中に入っているエラーをそのまま返します。

`getOr` が成功側の値に注目したのに対して、`getErrorOr` は失敗側の情報に注目しています。エラーを一覧にして表示する場面で、成功のときは「不明」というような文字列を入れておく、といった使い方ができます。

## ここがすごい

- **対になる関数の形がそろっている**: `getOr` と `getErrorOr` は、枝の順序が逆になっただけで、同じ構造です。覚えることが少なく、読み違えにくくなっています。
- **型で左右の役割が決まる**: 成功側は `V`、失敗側は `E` と型が分かれているので、取り出す側を間違えるとコンパイルが通りません。
- **`infix` で文章のように読める**: `result getErrorOr "unknown"` のように書けるので、コードの意図が伝わりやすくなります。
- **例外を使わない**: エラーを `null` にせず、既定値で埋めるので、後続の処理は型だけを見て進められます。

## まとめ

- `getErrorOr` は、失敗のときだけ意味を持つエラーを取り出し、成功のときは予備を返す。
- `getOr` と並べて覚えると、Result の両側を同じ書き方で扱える。
- 型が `V` と `E` に分かれているので、取り出す側の取り違えが型で防がれる。
