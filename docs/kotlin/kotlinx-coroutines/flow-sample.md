---
title: "一定間隔で最新値だけを拾う sample と CONFLATED チャネル"
description: "決まった周期ごとに、その間に来た最新の値を 1 つだけ流す sample。上書き型のチャネルとティッカーを select で同時に待っている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Delay.kt
lines: [268, 298]
function: "Flow.sample"
difficulty: 3
tags: [非同期, 並行処理, 標準ライブラリ]
---

## ひとことで

`sample(periodMillis)` は、**決まった時間ごとに、その間に来たいちばん新しい値を 1 つだけ流す** 操作です。
センサーの値が 1 秒に 100 回来ても、画面は 200 ミリ秒に 1 回だけ更新すれば十分、といった場面で使います。

上流の値は **上書き型のチャネル（CONFLATED）** に入れ、一定間隔で鳴る **ティッカー** と一緒に `select` で待つ、という組み立てになっています。

## コード

```kotlin:line-numbers=268
@FlowPreview
public fun <T> Flow<T>.sample(periodMillis: Long): Flow<T> {
    require(periodMillis > 0) { "Sample period should be positive" }
    return scopedFlow { downstream ->
        val values = produce(capacity = Channel.CONFLATED) {
            collect { value -> send(value ?: NULL) }
        }
        var lastValue: Any? = null
        val ticker = fixedPeriodTicker(periodMillis)
        while (lastValue !== DONE) {
            select<Unit> {
                values.onReceiveCatching { result ->
                    result
                        .onSuccess { lastValue = it }
                        .onFailure {
                            it?.let { throw it }
                            ticker.cancel(ChildCancelledException())
                            lastValue = DONE
                        }
                }

                // todo: shall be start sampling only when an element arrives or sample aways as here?
                ticker.onReceive {
                    val value = lastValue ?: return@onReceive
                    lastValue = null // Consume the value
                    downstream.emit(NULL.unbox(value))
                }
            }
        }
    }
}
```

`fixedPeriodTicker` は同じファイルの 303〜313 行目にあり、`delay(delayMillis)` してから `Unit` を送る、を無限に繰り返すチャネルです。

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`downstream.emit(値)` で下流へ値を渡します。
- **チャネルと `produce`**: チャネルはコルーチン同士で値を受け渡す管です。`produce(capacity = ...)` は別コルーチンで値を送るチャネルを作ります。
- **`Channel.CONFLATED`**: 容量 1 で、新しい値が来たら古い値を **上書き** するチャネルです。受け取り手が遅くても送り手は待たされず、受け取るときには常に最新の値が手に入ります。
- **`select { ... }`**: 複数の待ちを並べ、最初に準備できた 1 つだけを実行します。`onReceive` はチャネルから受信できたとき、`onReceiveCatching` は受信かチャネルの終了を待ちます。
- **`NULL` と `DONE`**: 内部の番兵オブジェクトです。`NULL` は値としての `null` を包み、`DONE` は「終わり」を表します。
- **`?: return@onReceive`**: 値が `null` ならそのブロックだけを抜ける書き方です。

## 何をしているか

### 1. 上流を上書き型チャネルへ（272〜274 行目）

上流の値をどんどん送ります。CONFLATED なので、こちらが受け取る前に次の値が来れば古いものは捨てられます。

### 2. ティッカーを用意する（275〜276 行目）

`lastValue` は「まだ流していない最新値」です。ティッカーは周期ごとに合図を送ります。

### 3. 値か合図か、来たほうを処理する（277〜296 行目）

周期 100ms で、10ms ごとに `1, 2, 3, ...` が来る場合:

- 値を受信するたびに `lastValue` を更新（281 行目）
- 100ms の合図で、`lastValue`（たとえば `9`）を流して `null` に戻す（290〜294 行目）
- 次の 100ms までに来た最新（たとえば `19`）が次に流れる

合図が来たときに `lastValue` が `null`（前回から新しい値がない）なら、何も流しません（291 行目）。

### 4. 上流が終わったら止める（282〜286 行目）

上流がエラーなら投げ直し、正常終了ならティッカーを止めて `DONE` にし、ループを抜けます。

## ここがすごい

- **2 段階で間引く**: チャネルが CONFLATED なので、受け取る前の古い値はチャネルの中で捨てられます。さらに `lastValue` が上書きされるので、周期の間に何個来ても最後の 1 個だけが残ります。上流が速くても溜まり続けることがありません。
- **同じ値を 2 回流さない**: 流したら `lastValue = null` にして「消費済み」にします。上流が止まっている間は、合図が来ても何も流れません。
- **後始末を忘れない**: 上流が終わったらティッカーを `cancel` します（284 行目）。そうしないとティッカーのコルーチンが動き続けてしまいます。
- **疑問をコメントに残している**: 289 行目には「最初の値が来てから始めるべきか、常に始めるべきか」という設計上の疑問が `todo` として書かれています。完成したコードにも迷いの記録が残っているのは、読み手にとって有益な情報です。

## まとめ

- 「最新の値だけでよい」場合は、上書き型（CONFLATED）のチャネルが便利。
- 周期的な処理は、ティッカーのチャネルと `select` を組み合わせて書ける。
- 流した値は「消費済み」に戻し、使い終わったタイマーは必ず止める。
