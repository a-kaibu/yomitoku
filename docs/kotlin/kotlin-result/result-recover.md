---
title: "失敗を値で取り戻す recover"
description: "失敗のときに、エラーを受け取って代わりの値を作り、成功に戻す recover。成功のときは何もしない。戻り値の型からエラーの型が消え、必ず成功になることが型で分かる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Recover.kt
lines: [10, 19]
function: "Result.recover"
difficulty: 1
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`recover` は、失敗の `Result` を **代わりの値で成功に戻す** 関数です。失敗のとき、エラーを受け取る関数を呼んで、その戻り値を `Ok` に包みます。成功のときは、何もせずそのまま返します。

たとえば `Err("未入力") recover { 0 }` は `Ok(0)` になります。

## コード

```kotlin:line-numbers=10
public inline infix fun <V, E> Result<V, E>.recover(transform: (E) -> V): Result<V, Nothing> {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> this.asOk()
        else -> Ok(transform(error))
    }
}
```

## 前提知識

- **`Result<V, E>`**: 成功（`Ok`、値 `V`）か失敗（`Err`、エラー `E`）を表す型です。
- **`Nothing`**: どんな型としても扱える、値を持たない型です。戻り値が `Result<V, Nothing>` なら、エラーになる場合がないことを表します。
- **`contract`**: 引数の関数が最大 1 回だけ呼ばれることを伝える宣言です。
- **`asOk()`**: 成功の値を、別のエラー型の `Result` に読み替える関数です。

## 何をしているか

### 1. 成功なら、そのまま返す

```kotlin:line-numbers=16
        isOk -> this.asOk()
```

成功のときは、値を変えずに返します。エラーの型だけを `Nothing` に読み替えています。

### 2. 失敗なら、代わりの値で成功にする

```kotlin:line-numbers=17
        else -> Ok(transform(error))
```

失敗のエラーを `transform` に渡し、その結果を `Ok` に包みます。これで、結果は成功になります。

### 3. 例で確かめる

`Ok(5) recover { 0 }` は `Ok(5)` のままで、`transform` は呼ばれません。`Err("x") recover { it.length }` は `Ok(1)` になります（`"x"` の長さが 1 のため）。

## ここがすごい

- **戻り値の型で保証する**: 戻り値の型が `Result<V, Nothing>` なので、「もう失敗はない」ことが型の上で分かります。呼び出し側は、失敗の扱いを書かずに済みます。
- **失敗を値に置き換える**: 例外を捕まえる代わりに、失敗の内容から代わりの値を作るので、処理の流れが素直になります。
- **エラーの中身を使える**: `transform` にはエラーが渡されるので、「未入力なら 0、範囲外なら最大値」のように、エラーの種類で代わりの値を変えられます。
- **呼び出しは 1 回**: 契約で最大 1 回と伝えているので、コンパイラは、変換の処理が 2 回以上実行されないと判断できます。

## まとめ

- 失敗を代わりの値で成功に戻すなら `recover` を使う。
- 戻り値の型が `Nothing` のエラーになると、失敗がないことが型で分かる。
- 代わりの値は、エラーの内容を見て決められる。
