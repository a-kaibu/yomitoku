---
title: "成功なら次の Result を返す and"
description: "2 つの Result を並べて、最初が成功なら 2 つ目をそのまま返す and。最初が失敗なら、その失敗を返す。成功と失敗の値は、どちらも変えずに通す。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/And.kt
lines: [11, 16]
function: "Result.and"
difficulty: 1
tags: [エラー処理, 関数型]
format: 2
---

## ひとことで

`result1 and result2` は、**最初が成功なら 2 つ目の `Result` を返し、最初が失敗ならその失敗を返す** 関数です。2 つの処理を、「両方成功したときだけ、後の結果を使う」形で並べられます。

`Ok(1) and Ok("x")` は `Ok("x")` になります。`Err("エラー") and Ok("x")` は `Err("エラー")` のままです。

## コード

```kotlin:line-numbers=11
public infix fun <V, E, U> Result<V, E>.and(result: Result<U, E>): Result<U, E> {
    return when {
        isOk -> result
        else -> this.asErr()
    }
}
```

## 前提知識

- **`Result<V, E>`**: 成功（`Ok`）か失敗（`Err`）を表す型です。
- **`infix fun`**: `a and b` のように、中置の形で呼べる関数です。
- **引数の評価**: `and` の引数は、呼び出し前に計算されています。`flatMap` のように、後の処理を遅らせるものではありません。
- **`asErr()`**: 失敗の値を、別の成功の型の `Result` に読み替える関数です。

## 何をしているか

### 1. 最初が成功なら、2 つ目を返す

```kotlin:line-numbers=13
        isOk -> result
```

最初が成功なら、引数で渡された 2 つ目の `Result` をそのまま返します。

### 2. 最初が失敗なら、その失敗を返す

```kotlin:line-numbers=14
        else -> this.asErr()
```

最初が失敗なら、2 つ目は見ずに、その失敗を返します。失敗の型は、戻り値の型に読み替えています。

### 4. 例で確かめる

`Ok(1) and Ok("x")` は `Ok("x")` です。`Err("A") and Ok("x")` は `Err("A")` のままです。`Err("A") and Err("B")` は、最初の失敗 `Err("A")` が残ります。

## ここがすごい

- **失敗を後ろへ流す**: 最初が失敗なら、2 つ目の結果は使われません。失敗が、そのまま最後まで伝わります。
- **値を変えない**: `and` は、値を変換しません。成功の値は 2 つ目のものがそのまま使われ、失敗は元のものが残ります。
- **`flatMap` より単純**: 2 つ目の結果を作る処理が、すでに手元にあるとき、`and` は短く書けます。関数を渡す必要がありません。
- **型で単位をそろえる**: 2 つの `Result` のエラーの型 `E` は同じでないといけません。違う失敗が混ざる心配がありません。

## まとめ

- 2 つ目の結果を、1 つ目が成功したときだけ使うなら `and` を使う。
- 失敗は途中で止まり、そのまま最後まで届く。
- 結果が手元にあるときは、関数を渡さずに `and` で短く書ける。
