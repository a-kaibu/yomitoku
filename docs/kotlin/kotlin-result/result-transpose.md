---
title: "中身の null を結果の外に出す transpose"
description: "成功の中に null が入るかもしれない Result を、null のときは結果ごと null に、値があれば普通の Result に組み替える transpose。3 つの枝で分ける。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [56, 62]
function: "Result.transpose"
difficulty: 2
tags: [エラー処理, 関数型, 防御的プログラミング]
format: 2
---

## ひとことで

`transpose()` は、`Result<V?, E>`、つまり **成功の中に null が入るかもしれない結果** を、`Result<V, E>?` に組み替える関数です。成功で値が null なら戻り値は `null`、成功で値があれば普通の成功、失敗ならそのままの失敗になります。

null の扱いを「結果の外側」に出して、判定を分かりやすくする関数です。

## コード

```kotlin:line-numbers=56
public fun <V, E> Result<V?, E>.transpose(): Result<V, E>? {
    return when {
        isOk && value == null -> null
        isOk && value != null -> this.asOk()
        else -> this.asErr()
    }
}
```

## 前提知識

- **`V?`**: 型の後ろに `?` を付けると、null を入れられる型になります。`Result<V?, E>` は、成功の中身が null かもしれない結果です。
- **`Result<V, E>?`**: 戻り値の外側に `?` が付いているので、結果そのものが null になることもある、という意味です。
- **`isOk && value == null`**: 成功していて、中身が null の場合を表す条件です。`&&` の左が `false` なら、右は評価されません。
- **`asOk()` と `asErr()`**: 成功や失敗を、戻り値の型に合わせて作り直す関数です。中身の型を変えても、成功か失敗かの情報は引き継がれます。

## 何をしているか

### 3 つの場合に分ける

```kotlin:line-numbers=58
        isOk && value == null -> null
```

成功の中身が null なら、戻り値は `null` になります。「値がない」という情報を、結果の外側の `null` に移します。

```kotlin:line-numbers=59
        isOk && value != null -> this.asOk()
```

成功の中身があるなら、成功の箱として作り直します。中身は null でないことが分かっているので、型も `V` として扱えます。

```kotlin:line-numbers=60
        else -> this.asErr()
```

失敗なら、そのエラーを引き継ぎます。null かどうかは、失敗の場合には関係ありません。

## ここがすごい

- **null を外に出す**: 成功の中の null と、結果そのものの null を、戻り値の型で区別しています。読み手は「`null` なら値がない」と、戻り値だけで判断できます。
- **条件が 3 つに分かれている**: 成功で null、成功で値あり、失敗、の 3 つをそれぞれ 1 行で表しています。網羅的に書かれているので、抜けが見つけやすいです。
- **`&&` の順番**: 成功かどうかを先に確かめてから中身を見ているので、失敗の中身を参照することはありません。
- **Rust の `transpose` が元**: Rust の `Result::transpose` と同じ名前と役割です。`Option` と `Result` の入れ替えとして、同じ考え方が使われています。

## まとめ

- `transpose` は、`Result<V?, E>` を、null を外側に出した `Result<V, E>?` に組み替える。
- 成功で null なら `null`、成功で値ありなら成功、失敗ならエラーを返す。
- 条件を 3 つに分けて書くので、null の扱いが戻り値の型で分かる。
