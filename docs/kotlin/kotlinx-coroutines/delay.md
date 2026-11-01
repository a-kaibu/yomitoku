---
title: "スレッドを止めずに待つ delay と「永遠」の特別扱い"
description: "コルーチンを指定時間だけ一時停止する delay。スレッドを眠らせず、ディスパッチャに再開の予約をして中断する。Long.MAX_VALUE は予約せず永遠に待つ。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/Delay.kt
lines: [121, 129]
function: "delay"
difficulty: 2
tags: [非同期, 並行処理, 標準ライブラリ]
format: 2
---

## ひとことで

`delay(1000)` は、コルーチンを **1 秒間だけ一時停止する** 関数です。
Java の `Thread.sleep(1000)` と違い、**スレッドは眠りません**。コルーチンが止まっている間、同じスレッドで別のコルーチンが動けます。

中身は数行で、「何ミリ秒後に再開してね」とディスパッチャに予約して中断するだけです。0 以下と `Long.MAX_VALUE` の特別扱いも学びどころです。

## コード


::: code-group

```kotlin:line-numbers=121 [日本語訳]
public suspend fun delay(timeMillis: Long) {
    if (timeMillis <= 0) return // 待たない
    return suspendCancellableCoroutine sc@ { cont: CancellableContinuation<Unit> ->
        // timeMillis == Long.MAX_VALUE なら、awaitCancellation と同じように永遠に待つ。予約はしない。
        if (timeMillis < Long.MAX_VALUE) {
            cont.context.delay.scheduleResumeAfterDelay(timeMillis, cont)
        }
    }
}
```

```kotlin:line-numbers=121 [原文]
public suspend fun delay(timeMillis: Long) {
    if (timeMillis <= 0) return // don't delay
    return suspendCancellableCoroutine sc@ { cont: CancellableContinuation<Unit> ->
        // if timeMillis == Long.MAX_VALUE then just wait forever like awaitCancellation, don't schedule.
        if (timeMillis < Long.MAX_VALUE) {
            cont.context.delay.scheduleResumeAfterDelay(timeMillis, cont)
        }
    }
}
```

:::

## 前提知識

- **コルーチンとスレッド**: コルーチンは軽量な処理の単位で、たくさんのコルーチンが少ないスレッドを共有して動きます。コルーチンが中断すると、そのスレッドは別のコルーチンを動かせます。
- **`suspendCancellableCoroutine { cont -> ... }`**: 今のコルーチンを中断し、「再開の仕方」を表す継続 `cont` をブロックに渡す関数です。誰かが `cont.resume(...)` を呼ぶまでコルーチンは止まったままです。名前に Cancellable とある通り、中断中に取り消されると例外で再開されます。
- **`cont.context.delay`**: 継続のコンテキスト（コルーチンの設定）から、時間待ちを担当するオブジェクトを取り出します。ディスパッチャが `Delay` を実装していればそれを、なければ既定の `DefaultDelay` を使います。
- **`scheduleResumeAfterDelay(ms, cont)`**: 「`ms` ミリ秒後に `cont` を再開する」予約をする関数です。
- **`Long.MAX_VALUE`**: `Long`（64 ビット整数）の最大値です。約 2.9 億年に相当します。
- **`sc@`**: ラムダに付けたラベルです。

## 何をしているか

### 1. 0 以下なら待たない

```kotlin:line-numbers=122
    if (timeMillis <= 0) return // 待たない
```

`delay(0)` や `delay(-5)` は、中断せずにすぐ戻ります。

### 2. 中断して予約する

```kotlin:line-numbers=123
    return suspendCancellableCoroutine sc@ { cont: CancellableContinuation<Unit> ->
```

```kotlin:line-numbers=126
            cont.context.delay.scheduleResumeAfterDelay(timeMillis, cont)
```

`delay(1000)` の場合:

1. コルーチンを中断し、継続 `cont` を受け取る
2. ディスパッチャ（または既定の Delay）に「1000 ミリ秒後に `cont` を再開して」と予約する
3. ブロックを抜ける。コルーチンは止まったまま、スレッドは解放される
4. 1 秒後、予約した側が `cont.resume(Unit)` を呼び、コルーチンが続きから動き出す

### 3. Long.MAX_VALUE なら予約しない

```kotlin:line-numbers=125
        if (timeMillis < Long.MAX_VALUE) {
```

`delay(Long.MAX_VALUE)` は、事実上「永遠に待つ」です。そんな先の予約をタイマーに入れても意味がないので、予約せずに中断だけします。再開するのは取り消されたときだけです。同じライブラリの `awaitCancellation()` が何も予約しない中断で書かれているのと同じ考え方です。

## ここがすごい

- **スレッドを占有しない**: `Thread.sleep` だと、待っている間スレッドが何もできません。`delay` は予約して中断するだけなので、1 万個のコルーチンが同時に `delay` しても、スレッドは数本で足ります。
- **時間の管理をディスパッチャに任せる**: どうやって時間を測るかは、コンテキストから取り出した `Delay` に任せています。テスト用のディスパッチャでは、ここが「仮想時間」に差し替わり、`delay(1時間)` が一瞬で終わるテストが書けます。
- **取り消しにすぐ反応する**: `suspendCancellableCoroutine` を使っているので、待っている途中で取り消されると、時間を待たずに例外で戻ります。
- **境界値をきちんと扱う**: 0 以下はすぐ戻る、最大値は予約しない。どちらも 1 行の `if` で、無駄なタイマー登録を避けています。

## まとめ

- `delay` は「再開の予約をして中断する」だけで、スレッドは眠らない。
- 時間の測り方をコンテキストから取り出す設計にすると、テストで仮想時間に差し替えられる。
- 0 や最大値のような境界は、最初に特別扱いしておくと無駄な処理を避けられる。
