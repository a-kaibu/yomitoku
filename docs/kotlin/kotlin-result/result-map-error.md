---
title: "失敗の型だけを変える mapError"
description: "失敗のエラーの型を、別の型へ変換する mapError。成功の値はそのまま通り、失敗のときだけエラーを作り直す。エラーの型を、呼び出し元に合わせて直すために使う。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [229, 238]
function: "Result.mapError"
difficulty: 1
tags: [エラー処理, 関数型, API設計]
format: 2
---

## ひとことで

`mapError` は、`Result` の **失敗のほうの型** だけを変えます。成功の値はそのまま通り、失敗のときだけ、エラー `E` を別のエラー `F` に変換します。

たとえば、データベースのエラーを、画面に出すためのメッセージの型に変換するときに使います。内部の詳しい型を、外に出す型へ包み直せます。

## コード

```kotlin:line-numbers=229
public inline infix fun <V, E, F> Result<V, E>.mapError(transform: (E) -> F): Result<V, F> {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isErr -> Err(transform(error))
        else -> this.asOk()
    }
}
```

## 前提知識

- **`Result<V, E>`**: 成功（値 `V`）か失敗（エラー `E`）を表す型です。
- **型の変換の意味**: `E` から `F` へ変えると、戻り値は `Result<V, F>` になります。成功の型 `V` は変わりません。
- **`asOk()`**: 成功の型としてそのまま読み替える関数です。成功の値を、別のエラー型の `Result` に移すために使います。
- **`contract`**: 引数の関数が最大 1 回だけ呼ばれることを伝える宣言です。

## 何をしているか

### 1. 失敗なら、エラーを作り直す

`isErr` が真なら、エラーを `transform` に渡し、その結果を新しい `Err` に入れます。

```kotlin:line-numbers=235
        isErr -> Err(transform(error))
```

### 2. 成功なら、値をそのまま移す

成功なら、変換は行わず、値を新しい型の `Result` に読み替えます。

```kotlin:line-numbers=236
        else -> this.asOk()
```

### 4. 使い方の例

たとえば `Err("not found").mapError { NotFoundException(it) }` は、エラーの文字列を例外オブジェクトに包み直します。成功の `Ok(10).mapError { ... }` は、値 `10` のまま、型だけ `Result<Int, 新しい型>` になります。

## ここがすごい

- **成功の値に触れない**: : 変換が必要なのは失敗のときだけです。成功の値は、型だけ読み替えて、中身はそのまま通ります。
- **型で層を分けられる**: 内部のエラー型を、外側の API に合うエラー型へ変えられます。呼び出し元は、内部の事情を知らずに済みます。
- **連結と組み合わせる**: `map`（成功の変換）と `mapError`（失敗の変換）を、順番につなげられます。それぞれが片方だけを変えるので、意図がはっきりします。
- **変換の呼び出しは 1 回**: `contract` の情報で、コンパイラは変換が 1 回しか呼ばれないと判断できます。

## まとめ

- 失敗の型だけを変えたいときは、`mapError` で作り直す。
- 成功の値は変換せず、型だけ読み替えて通す。
- 内部のエラーを外向きのエラーに変えると、呼び出し元が詳細に依存しなくなる。
