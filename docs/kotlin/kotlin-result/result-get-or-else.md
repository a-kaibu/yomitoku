---
title: "失敗のときだけ代わりの値を作る getOrElse"
description: "失敗のときだけ、エラーを受け取って代わりの値を作る getOrElse。成功なら値をそのまま返す。Result から普通の値を取り出すための、安全な方法の 1 つ。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Get.kt
lines: [73, 82]
function: "Result.getOrElse"
difficulty: 1
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`Result<V, E>` から **値を普通の型として取り出す** 方法の 1 つが `getOrElse` です。成功なら中の値 `V` をそのまま返します。失敗なら、エラー `E` を受け取る関数を呼んで、その結果を代わりの値として返します。

たとえば `Err("未入力").getOrElse { 0 }` は `0` になり、`Ok(5).getOrElse { 0 }` は `5` になります。失敗しても例外は投げず、必ず `V` の値が手に入ります。

## コード

```kotlin:line-numbers=73
public inline infix fun <V, E> Result<V, E>.getOrElse(transform: (E) -> V): V {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> value
        else -> transform(error)
    }
}
```

## 前提知識

- **`Result<V, E>`**: 成功（`Ok`、値 `V`）か失敗（`Err`、エラー `E`）のどちらかを表す型です。
- **`infix fun`**: `result getOrElse { ... }` のように、中置で呼べる関数です。
- **`inline`**: 呼び出し箇所にコードを展開します。引数の関数も展開されます。
- **`contract { callsInPlace(...) }`**: 引数の関数が最大 1 回だけ呼ばれることを、コンパイラに伝える宣言です。
- **`isOk` と `value`、`error`**: 成功かどうかを調べる性質、成功の値、失敗の値を取り出す性質です。

## 何をしているか

### 1. 成功なら、値をそのまま返す

`isOk` が真なら、中の `value` をそのまま返します。変換の関数は呼ばれません。

```kotlin:line-numbers=79
        isOk -> value
```

### 2. 失敗なら、エラーから代わりの値を作る

失敗なら、エラー `error` を `transform` に渡して、その戻り値を返します。

```kotlin:line-numbers=80
        else -> transform(error)
```

### 3. contract で、呼び出し回数を伝える

`callsInPlace(transform, AT_MOST_ONCE)` で、変換の関数が最大 1 回だけ呼ばれることを伝えています。

```kotlin:line-numbers=75
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

## ここがすごい

- **例外に頼らず値を得る**: 失敗を例外にせず、代わりの値を作る関数を渡すだけで、必ず値が手に入ります。`try` と `catch` を書く必要がありません。
- **エラーの情報を使える**: 代わりの値を作るとき、失敗の中身（エラー）を見られます。「未入力なら 0、範囲外なら最大値」のように、エラーの種類で決められます。
- **`map` や `getOr` と使い分ける**: 固定の代わりの値を渡すなら `getOr`、値を変換するなら `map`、エラーを使って決めるなら `getOrElse`、と目的で選べます。
- **呼び出しを 1 回に限る**: `contract` の情報があるので、コンパイラは変換の関数が 1 回しか呼ばれないと分かって、値の扱いを正しく判断できます。

## まとめ

- 失敗を例外にせず、代わりの値を作る関数で型を確定できる。
- エラーの中身を見て、代わりの値を決められる。
- 固定の値なら `getOr`、エラーに応じて作るなら `getOrElse` と使い分ける。
