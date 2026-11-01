---
title: "指定の個数だけ流して上流を打ち切る take"
description: "先頭から指定の個数だけ値を流す take。最後の値を流したあと例外で上流を止める。途中の値は状態機械を使わずに流し、終わるときだけ例外を使う。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Limit.kt
lines: [47, 68]
function: "Flow.take"
difficulty: 3
tags: [非同期, 遅延評価, 最適化]
format: 2
---

## ひとことで

`take()` は、Flow（非同期に流れる値の列）の先頭から **指定した個数だけ** を流し、そのあとで上流の処理を止める関数です。たとえば `take(3)` なら、最初の 3 個だけを下流に渡します。

4 個目以降の値は、そもそも下流に流れません。そこで上流の収集を、例外を使って打ち切っています。

## コード


::: code-group

```kotlin:line-numbers=47 [日本語訳]
public fun <T> Flow<T>.take(count: Int): Flow<T> {
    require(count > 0) { "Requested element count $count should be positive" }
    return flow {
        val ownershipMarker = Any()
        var consumed = 0
        try {
            collect { value ->
                // 注意: この take は collectWhile を使わずに書いている。意図的な選択。
                // 先に条件を調べ、そのあと emit か emitAbort への末尾呼び出しをする。
                // こうすると、通常の処理は状態機械を必要とせず、終わるときだけ emitAbort を使う。
                // 異なる方式の比較は "TakeBenchmark" を参照。
                if (++consumed < count) {
                    return@collect emit(value)
                } else {
                    return@collect emitAbort(value, ownershipMarker)
                }
            }
        } catch (e: AbortFlowException) {
            e.checkOwnership(owner = ownershipMarker)
        }
    }
}
```

```kotlin:line-numbers=47 [原文]
public fun <T> Flow<T>.take(count: Int): Flow<T> {
    require(count > 0) { "Requested element count $count should be positive" }
    return flow {
        val ownershipMarker = Any()
        var consumed = 0
        try {
            collect { value ->
                // Note: this for take is not written via collectWhile on purpose.
                // It checks condition first and then makes a tail-call to either emit or emitAbort.
                // This way normal execution does not require a state machine, only a termination (emitAbort).
                // See "TakeBenchmark" for comparision of different approaches.
                if (++consumed < count) {
                    return@collect emit(value)
                } else {
                    return@collect emitAbort(value, ownershipMarker)
                }
            }
        } catch (e: AbortFlowException) {
            e.checkOwnership(owner = ownershipMarker)
        }
    }
}
```

:::

## 前提知識

- **Flow と `collect`**: `collect` は、上流の値を 1 つずつ受け取る処理です。ここでは、受け取った値を下流へ流すかどうかを決めます。
- **`require`**: 条件が満たされないときに例外で止める関数です。`count` が 0 以下なら、最初に止まります。
- **`AbortFlowException`**: 上流の処理を強制的に打ち切るための例外です。コルーチンライブラリの内部で使われる特別な例外です。
- **`ownershipMarker`**: この `take` だけが作る目印です。別の `take` が投げた例外と区別するために使われます。
- **`return@collect`**: `collect` のラムダから、その回だけ抜けるための書き方です。

## 何をしているか

### 1. 数えながら流す

```kotlin:line-numbers=58
                if (++consumed < count) {
                    return@collect emit(value)
```

値が来るたびに、数を 1 増やします。まだ上限に達していなければ、そのまま下流へ流します。

### 2. 最後の 1 個は流してから打ち切る

```kotlin:line-numbers=60
                } else {
                    return@collect emitAbort(value, ownershipMarker)
```

上限に達したら `emitAbort` を呼びます。

```kotlin:line-numbers=70
private suspend fun <T> FlowCollector<T>.emitAbort(value: T, ownershipMarker: Any) {
    emit(value)
    throw AbortFlowException(ownershipMarker)
}
```

`emitAbort` は、最後の値を流してから、例外を投げます。例外で上流の `collect` が止まるので、それ以上の値は流れません。

### 3. 自分の例外だけを受け止める

```kotlin:line-numbers=64
        } catch (e: AbortFlowException) {
            e.checkOwnership(owner = ownershipMarker)
```

打ち切りの例外を受け止めます。`checkOwnership` で、この `take` が投げた例外かを確かめます。別の `take` が投げた例外なら、ここで止まらずに外へ伝わります。

## ここがすごい

- **通常の流れに余計な仕掛けがない**: 途中の値は、数えて流すだけです。打ち切りの仕組みは、最後の 1 回だけ使われます。
- **所有者の目印で誤爆を防ぐ**: 入れ子になった Flow が、互いの打ち切りを取り違えないように、`ownershipMarker` で持ち主を確かめています。
- **条件を先に調べる**: 上限かどうかを先に判定して、そのあと `emit` か `emitAbort` を末尾で呼ぶので、分岐の形が単純です。
- **意図の注記**: `collectWhile` を使わない理由が、コメントで残されています。性能を測って選んだ結果だと分かる書き方です。

## まとめ

- `take` は、先頭から指定の個数だけ流し、最後の値を流したあとで上流を例外で止める。
- 途中の値は状態機械を使わずに流し、終わるときだけ `emitAbort` を使う。
- 所有者の目印で、自分が投げた打ち切りだけを受け止める。
