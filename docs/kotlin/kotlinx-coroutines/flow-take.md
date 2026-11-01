---
title: "例外で流れを止める take と「持ち主の印」"
description: "Flow の先頭 n 個だけを取り出す take。最後の 1 個を流した直後に専用の例外を投げて上流を止め、その例外が自分のものかを目印オブジェクトで確かめている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Limit.kt
lines: [47, 73]
function: "Flow.take"
difficulty: 3
tags: [非同期, エラー処理, 最適化, 標準ライブラリ]
---

## ひとことで

`take(n)` は、次々と値を流してくる **Flow（フロー）** から、先頭の `n` 個だけを受け取って、残りはもう要らないと上流に伝える関数です。
たとえば `flowOf(1, 2, 3, 4, 5).take(2)` は `1, 2` だけを流して終わります。

おもしろいのは「もう要らない」の伝え方です。Flow には「止まって」と頼む専用の仕組みがないので、**例外を投げて上流の処理を強制的に抜けさせ**、その例外が本当に自分の投げたものかを **目印のオブジェクト** で確かめています。

## コード

```kotlin:line-numbers=47
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

private suspend fun <T> FlowCollector<T>.emitAbort(value: T, ownershipMarker: Any) {
    emit(value)
    throw AbortFlowException(ownershipMarker)
}
```

## 前提知識

- **Flow**: kotlinx.coroutines の「時間をかけて値を 1 つずつ流すもの」です。`collect { ... }` を呼ぶと、流れてきた値ごとにブロックが実行されます。リストと違って、値は受け取る側が `collect` したときに初めて作られます。
- **`suspend` 関数**: 途中で一時停止（中断）できる関数です。ネットワーク待ちなどの間スレッドを手放せます。Kotlin のコンパイラは `suspend` 関数を「どこまで進んだか」を覚える **状態機械**（状態を番号で管理するクラス）に変換します。
- **拡張関数 `fun <T> Flow<T>.take(...)`**: 既存の型 `Flow` に、外からメソッドを生やす書き方です。中では `this` が元の Flow を指し、`collect` はその Flow の `collect` です。`<T>` は「中身の型は何でもよい」というジェネリクスです。
- **`require(条件) { メッセージ }`**: 条件が偽なら `IllegalArgumentException` を投げる標準関数です。引数チェックに使います。
- **`flow { ... }`**: Flow を作るビルダーです。ブロックの中で `emit(値)` を呼ぶと、その値が下流へ流れます。このファイルでは 11 行目で `unsafeFlow as flow` と別名インポートしており、安全チェックを省いた軽量版が使われています。
- **`return@collect`**: ラムダ（無名関数）の中から「そのラムダだけ」を抜ける書き方です。`@collect` はどのラムダから戻るかを示すラベルです。
- **`Any()`**: 何の機能もない、ただのオブジェクトを 1 個作ります。ここでは **世界に 1 つしかない目印** として使われます。

## 何をしているか

### 1. 引数チェック（48 行目）

`take(0)` や負の数はエラーにします。0 個を取る Flow は意味がないので、最初に弾いています。

### 2. 目印とカウンタを用意する（50〜51 行目）

`ownershipMarker` は、この `take` 呼び出し専用の目印です。`consumed` は何個受け取ったかを数えます。

### 3. 1 個受け取るたびに数える（53〜63 行目）

`take(2)` で `1, 2, 3, ...` が来る場合を追ってみます。

- `1` が来る: `++consumed` で `consumed = 1`。`1 < 2` なので普通に `emit(1)` して下流へ流します。
- `2` が来る: `consumed = 2`。`2 < 2` は偽なので `emitAbort(2, ownershipMarker)` を呼びます。

### 4. 最後の 1 個を流して例外で止める（70〜73 行目）

`emitAbort` は、まず `emit(2)` で最後の値を下流に渡し、そのあと `AbortFlowException(ownershipMarker)` を投げます。
この例外は上流の `collect` を突き抜けて、上流が `3` を作ろうとする前に処理を終わらせます。上流が `try/finally` を持っていれば、後始末もきちんと走ります。

### 5. 自分の例外かを確かめて握りつぶす（64〜66 行目）

`catch` で例外を受け止め、`checkOwnership(owner = ownershipMarker)` で **目印が自分のものか** を確認します。
自分のものなら正常終了として扱い、違えば（たとえば下流の別の `take` が投げたものなら）もう一度投げ直します。

## ここがすごい

- **例外を「制御の流れ」として使う**: Flow の `collect` はただの関数呼び出しの入れ子なので、外から途中で止める手段がありません。例外は呼び出しの入れ子をまとめて抜けられる唯一の仕組みで、それを「打ち切り」の合図に流用しています。
- **目印で入れ子を区別する**: `flow.take(5).map { ... }.take(2)` のように `take` が重なると、例外がどちらの `take` 宛てか分からなくなります。呼び出しごとに `Any()` を作り、例外に持たせることで、**自分が投げたものだけを止め、他人のものは通す** ようにしています。
- **状態機械を作らせない工夫**: 54〜57 行目のコメントにある通り、この `take` はあえて共通部品の `collectWhile` を使っていません。`if` で判定してから `emit` か `emitAbort` のどちらかを **最後に呼ぶだけ**（末尾呼び出し）にすると、コンパイラは `suspend` の状態機械を作らずに済み、普段の 1 個ずつの処理が軽くなります。重い処理（例外）は最後の 1 回にだけ寄せています。
- **最後の 1 個を取りこぼさない**: 「n 個目を受け取ったら止める」を素直に書くと、n 個目を流す前に止めてしまったり、n+1 個目を作らせてしまったりしがちです。`emitAbort` で「流してから止める」を 1 つの関数にまとめ、順番を間違えようがない形にしています。

## まとめ

- 外から止められない処理の入れ子を抜けるには、例外を合図に使う手がある。
- 例外に「持ち主の印」を持たせると、入れ子になった同じ仕組みどうしを区別できる。
- `suspend` 関数は末尾で別の関数を呼ぶだけにすると、余計な状態機械を作らずに済む。
- 速さが必要なところは共通部品をあえて使わず、コメントで理由を残しておくとよい。
