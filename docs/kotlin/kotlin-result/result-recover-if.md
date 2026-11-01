---
title: "条件に合う失敗だけ取り戻す recoverIf"
description: "失敗のエラーが条件に合うときだけ、代わりの値で成功に戻す recoverIf。条件に合わない失敗や成功は、そのまま返す。エラーの種類を選んで扱うときに使う。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Recover.kt
lines: [41, 54]
function: "Result.recoverIf"
difficulty: 2
tags: [エラー処理, 関数型, 防御的プログラミング]
format: 2
---

## ひとことで

`recoverIf` は、`recover` の **条件つき** の版です。失敗のエラーが、与えられた `predicate`（条件を調べる関数）に合うときだけ、代わりの値で成功にします。

条件に合わない失敗は、そのまま失敗として残します。すべての失敗を取り戻すのではなく、「想定しているエラーだけ」を取り戻すときに使います。

## コード

```kotlin:line-numbers=41
public inline fun <V, E> Result<V, E>.recoverIf(
    predicate: (E) -> Boolean,
    transform: (E) -> V,
): Result<V, E> {
    contract {
        callsInPlace(predicate, InvocationKind.AT_MOST_ONCE)
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isErr && predicate(error) -> Ok(transform(error))
        else -> this
    }
}
```

## 前提知識

- **`predicate`**: エラーを受け取って、真か偽かを返す関数です。ここでは「このエラーを取り戻してよいか」を決めます。
- **`isErr`**: 失敗かどうかを表す性質です。
- **`&&`**: 両方が真のときだけ真になる論理演算子です。`isErr && predicate(error)` は、失敗であり、かつ条件に合うときだけ真になります。
- **`contract`**: 引数の関数が最大 1 回だけ呼ばれることを伝える宣言です。

## 何をしているか

### 1. 失敗で、かつ条件に合うときだけ取り戻す

```kotlin:line-numbers=51
        isErr && predicate(error) -> Ok(transform(error))
```

失敗であり、`predicate` が真を返したときだけ、`transform` で代わりの値を作って `Ok` にします。`&&` の左側が偽なら、右側の `predicate` は呼ばれません。

### 2. それ以外は、そのまま返す

```kotlin:line-numbers=52
        else -> this
```

成功のときや、条件に合わない失敗のときは、何もせずに元の値を返します。

### 3. 呼び出し回数を伝える

```kotlin:line-numbers=46
        callsInPlace(predicate, InvocationKind.AT_MOST_ONCE)
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

どちらの関数も、最大 1 回だけ呼ばれると伝えています。

### 4. 例で確かめる

`Err("timeout") recoverIf({ it == "timeout" }) { 0 }` は `Ok(0)` になります。`Err("fatal") recoverIf({ it == "timeout" }) { 0 }` は、条件に合わないので `Err("fatal")` のままです。

## ここがすごい

- **想定したエラーだけ直す**: すべての失敗を無条件に成功にすると、本当の問題を見落とします。条件で絞ることで、想定どおりのエラーだけを扱えます。
- **条件に合わないものは素通し**: 条件に合わない失敗は、そのまま失敗として返るので、後ろの処理で正しく扱えます。
- **`&&` の短絡**: 失敗でないとき、`predicate` は呼ばれません。成功の場合に、エラーの条件を調べる無駄がありません。
- **戻り値の型は変わらない**: 戻り値は `Result<V, E>` のままです。条件に合わない失敗が残る可能性があるので、型はそのままにしています。

## まとめ

- 失敗のうち、想定したものだけを取り戻すなら `recoverIf` を使う。
- 条件に合わない失敗は、そのまま後ろへ流す。
- 条件の判定は `&&` の短絡で、必要なときだけ行われる。
