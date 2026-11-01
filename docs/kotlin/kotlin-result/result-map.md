---
title: "成功のときだけ値を変換する Result.map"
description: "成功か失敗かを表す Result に対し、成功のときだけ値を変換する map。失敗は中身を変えずにそのまま返す。Kotlin の contract で、変換の関数が最大 1 回だけ呼ばれることを伝えている。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [15, 24]
function: "Result.map"
difficulty: 1
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`Result<V, E>` は、処理の結果を **成功（Ok、値 `V`）** か **失敗（Err、エラー `E`）** のどちらかで表す型です。`map` は、成功のときだけ中の値を変換し、失敗のときは **何もせずそのまま返す** 関数です。

たとえば `Ok(2) map { it * 10 }` は `Ok(20)` になり、`Err("未入力") map { it * 10 }` は `Err("未入力")` のままです。変換の途中で失敗が出ても、後ろの処理は実行されず、最後まで失敗が伝わります。

## コード

```kotlin:line-numbers=15
public inline infix fun <V, E, U> Result<V, E>.map(transform: (V) -> U): Result<U, E> {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> Ok(transform(value))
        else -> this.asErr()
    }
}
```

## 前提知識

- **ジェネリクス**: `<V, E, U>` は、型を後から決める目印です。`V` は成功の値の型、`E` はエラーの型、`U` は変換後の型です。
- **`infix fun`**: `result map { ... }` のように、名前を中置で書ける関数です。
- **`inline`**: 関数を呼び出し箇所に展開します。引数の関数（ここでは `transform`）も展開されるので、余分な関数オブジェクトを作りにくくなります。
- **`contract`**: コンパイラに、関数の振る舞いを伝える宣言です。ここでは、`callsInPlace(transform, AT_MOST_ONCE)` で「`transform` は最大 1 回だけ呼ばれる」と伝えています。
- **`isOk`、`value`、`asErr()`**: 成功かどうかを調べる性質、成功の値を取り出す性質、失敗の型に読み替える関数です。

## 何をしているか

### 1. 成功なら、変換して包み直す

`isOk` が真なら、`transform(value)` を計算して、結果を `Ok` に包みます。

```kotlin:line-numbers=21
        isOk -> Ok(transform(value))
```

### 2. 失敗なら、そのまま返す

失敗なら、変換の関数は呼ばず、同じ失敗を型だけ変えて返します。`transform` は一度も呼ばれません。

```kotlin:line-numbers=22
        else -> this.asErr()
```

### 3. contract で、呼び出し回数を伝える

`contract` の中の `callsInPlace` は、コンパイラに「`transform` はこの関数の中で最大 1 回だけ呼ばれる」と教えます。コンパイラは、その情報を使って、値の確定を賢く扱えます。

```kotlin:line-numbers=17
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

## ここがすごい

- **失敗を勝手に壊さない**: 失敗の値は、変換されずにそのまま流れていきます。途中で失敗した処理の後ろに、余計な変換が入ることはありません。
- **連続した処理を書きやすくする**: `map` をつなげると、成功のときだけ順番に処理が進み、どこかで失敗すると、その時点の失敗が最後まで届きます。`if` の入れ子を減らせます。
- **型で失敗を強制的に扱う**: 成功の値だけが `map` の中に入ります。失敗を無視して値を取り出すことは、型の上でできないので、扱い忘れが起きにくくなります。
- **inline と contract の組み合わせ**: `inline` で関数の呼び出しを減らし、`contract` で呼び出し回数の情報を渡すことで、速さと型の賢さを両立しています。

## まとめ

- 成功と失敗を型で分けると、成功のときだけ処理を続けられる。
- `map` は、失敗の値を変えずに通すので、途中の失敗が後ろへ正しく伝わる。
- `contract` で呼び出し回数を伝えると、コンパイラが値の扱いを賢く判断できる。
