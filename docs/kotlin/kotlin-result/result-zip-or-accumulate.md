---
title: "失敗をすべて集めてから判断する zipOrAccumulate"
description: "2 つの処理を両方とも実行し、どちらか一方が失敗していても、失敗を全部集めてリストで返す zipOrAccumulate。両方が成功したときだけ、値を組み合わせる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Zip.kt
lines: [132, 161]
function: "zipOrAccumulate"
difficulty: 2
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`zip` は、1 つ目が失敗すると 2 つ目を実行せずに止まります。それに対して `zipOrAccumulate` は、**両方を必ず実行** して、失敗をすべて集めます。

入力のチェックなど、「エラーは全部まとめて見せたい」場面に向いています。たとえば、名前とメールアドレスの両方が間違っていたら、2 つのエラーをまとめてユーザーに返せます。

## コード

```kotlin:line-numbers=132
public inline fun <T1, T2, E, V> zipOrAccumulate(
    producer1: Producer<T1, E>,
    producer2: Producer<T2, E>,
    transform: (T1, T2) -> V,
): Result<V, List<E>> {
    contract {
        callsInPlace(producer1, InvocationKind.EXACTLY_ONCE)
        callsInPlace(producer2, InvocationKind.EXACTLY_ONCE)
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    val result1 = producer1()
    val result2 = producer2()

    val results = listOf(
        result1,
        result2,
    )

    return if (results.allOk()) {
        val transformed = transform(
            result1.value,
            result2.value,
        )

        Ok(transformed)
    } else {
        Err(results.filterErr())
    }
}
```

## 前提知識

- **`Producer<T, E>`**: 引数を取らず、`Result<T, E>` を返す関数の別名です。
- **`listOf(...)`**: 要素を並べたリストを作る関数です。
- **`allOk()`**: リストの全部の `Result` が成功かを調べる関数です。
- **`filterErr()`**: リストの中から、失敗のエラーだけを集めてリストにする関数です。
- **`contract` の `EXACTLY_ONCE`**: 引数の関数が必ず 1 回呼ばれることを伝える宣言です。

## 何をしているか

### 1. 両方を必ず実行する

```kotlin:line-numbers=143
    val result1 = producer1()
    val result2 = producer2()
```

1 つ目が失敗しても、2 つ目を実行します。こうすると、両方の失敗を集めることができます。

### 2. 結果をリストにまとめる

```kotlin:line-numbers=146
    val results = listOf(
        result1,
        result2,
    )
```

2 つの `Result` を 1 つのリストに入れて、まとめて調べられるようにします。

### 3. 全部成功なら組み合わせ、どれか失敗なら全部返す

```kotlin:line-numbers=151
    return if (results.allOk()) {
```

全部成功なら、2 つの値を `transform` で組み合わせて `Ok` で返します。失敗があれば、`filterErr()` で失敗だけを集めて `Err` のリストとして返します。

## ここがすごい

- **エラーをすべて報告できる**: `zip` は最初の失敗で止まるので、2 つ目の失敗は分かりません。`zipOrAccumulate` なら両方のエラーが手に入ります。
- **同じ書き方で、結果の形が違う**: 戻り値は `Result<V, List<E>>` で、エラーが 1 つのときもリストになります。呼び出し側は、常にリストとして扱えます。
- **判定と収集を分ける**: 「全部成功か」を `allOk()` で確かめ、失敗の集め方を `filterErr()` に任せるので、関数の本体は短く読みやすくなっています。
- **値の確定は成功時だけ**: `transform` は全部成功したときだけ呼ばれるので、失敗した値を使って計算することがありません。

## まとめ

- 失敗を全部見せたいときは、両方を実行してから結果をまとめて判断する。
- 戻り値をリストにすると、エラーの数が 0、1、2 のどれでも同じ形で扱える。
- 全部成功か確かめてから値を使うと、失敗した値に依存しない。
