---
title: "入力が落ち着くまで待つ debounce を select で組む"
description: "一定時間新しい値が来なかったときだけ最後の値を流す debounce の本体。チャネルとタイムアウトを select で同時に待ち、null と終了を番兵で区別している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Delay.kt
lines: [200, 242]
function: "Flow.debounceInternal"
difficulty: 3
tags: [非同期, 並行処理, 状態機械]
---

## ひとことで

`debounce` は、値が立て続けに来ている間は何も流さず、**一定時間新しい値が来なかったときに、最後の値だけを流す** 操作です。
検索ボックスで「入力が 300 ミリ秒止まったら検索する」といった用途の定番です。

`debounceInternal` はその本体で、**「次の値を待つ」と「時間切れを待つ」を `select` で同時に待つ** ことで実現しています。

## コード

```kotlin:line-numbers=200
private fun <T> Flow<T>.debounceInternal(timeoutMillisSelector: (T) -> Long): Flow<T> =
    scopedFlow { downstream ->
        // Produce the values using the default (rendezvous) channel
        val values = produce {
            collect { value -> send(value ?: NULL) }
        }
        // Now consume the values
        var lastValue: Any? = null
        while (lastValue !== DONE) {
            var timeoutMillis = 0L // will be always computed when lastValue != null
            // Compute timeout for this value
            if (lastValue != null) {
                timeoutMillis = timeoutMillisSelector(NULL.unbox(lastValue))
                require(timeoutMillis >= 0L) { "Debounce timeout should not be negative" }
                if (timeoutMillis == 0L) {
                    downstream.emit(NULL.unbox(lastValue))
                    lastValue = null // Consume the value
                }
            }
            // assert invariant: lastValue != null implies timeoutMillis > 0
            assert { lastValue == null || timeoutMillis > 0 }
            // wait for the next value with timeout
            select<Unit> {
                // Set timeout when lastValue exists and is not consumed yet
                if (lastValue != null) {
                    onTimeout(timeoutMillis) {
                        downstream.emit(NULL.unbox(lastValue))
                        lastValue = null // Consume the value
                    }
                }
                values.onReceiveCatching { value ->
                    value
                        .onSuccess { lastValue = it }
                        .onFailure {
                            it?.let { throw it }
                            // If closed normally, emit the latest value
                            if (lastValue != null) downstream.emit(NULL.unbox(lastValue))
                            lastValue = DONE
                        }
                }
            }
        }
    }
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`downstream.emit(値)` で下流へ値を渡します。
- **チャネル（Channel）と `produce`**: チャネルはコルーチン（軽量な並行処理）同士で値を受け渡す管のようなものです。`produce { ... }` は、別のコルーチンで値を作ってチャネルに `send` し、そのチャネルを返します。既定の「ランデブー」チャネルは容量 0 で、受け取り手が来るまで `send` が待ちます。
- **`scopedFlow`**: 内部でコルーチンを起動できる範囲（スコープ）付きの Flow を作る内部関数です。Flow の収集が終われば中のコルーチンも片付きます。
- **`select { ... }`**: 複数の「待ち」を並べ、**最初に起きたもの 1 つだけ** を実行する仕組みです。`onTimeout(ms)` は時間切れ、`onReceiveCatching` はチャネルからの受信（または閉じられたこと）を待ちます。
- **`NULL` と `DONE`**: どちらもライブラリ内部の番兵オブジェクトです。`NULL` は「値としての `null`」を包むため、`DONE` は「もう終わり」を表すために使います。`NULL.unbox(x)` は `NULL` なら `null` に戻します。
- **`onSuccess` / `onFailure`**: 受信結果が「値を受け取れた」か「チャネルが閉じた（エラー付きかも）」かで処理を分けます。

## 何をしているか

### 1. 上流を別コルーチンでチャネルに流す（203〜205 行目）

上流の値を `send` します。`null` はチャネル上で「値なし」と混ざらないように `NULL` に置き換えます。

### 2. 「保留中の値」を 1 つ持つ（207〜208 行目）

`lastValue` が「まだ流していない最新の値」です。`null` なら保留なし、`DONE` なら終了です。

### 3. 待ち時間を計算する（209〜220 行目）

保留中の値があれば、その値に応じた待ち時間を求めます（値ごとに時間を変えられる版があるため）。0 ミリ秒ならすぐ流して保留を消します。

### 4. 次の値か時間切れか、早いほうを処理する（222〜240 行目）

300 ミリ秒の debounce で、`a`（0ms）、`b`（100ms）、`c`（500ms）が来る場合:

- 0ms: `a` を受信 → 保留 `a`
- 100ms: 300ms 経つ前に `b` を受信 → 保留が `b` に置き換わる（`a` は流れない）
- 400ms: `b` の受信から 300ms、時間切れ → `b` を流す
- 500ms: `c` を受信 → 保留 `c`
- 上流が終了 → 233〜237 行目で保留の `c` を流して `DONE`

## ここがすごい

- **`select` で「どちらか早いほう」を素直に書ける**: タイマーを別に動かしてキャンセルし直す、といった複雑な管理をしなくても、ループのたびに「受信」と「時間切れ」を並べて待つだけで済みます。新しい値が来れば前の時間切れは自然に無効になります。
- **時間切れの待ちは保留があるときだけ**: 224 行目の `if` で、保留がないときは `onTimeout` を登録しません。何も来ていないのにタイマーが動き続ける無駄がありません。
- **番兵で 3 種類の状態を区別**: `lastValue` 1 つで「保留なし（`null`）」「保留あり（値か `NULL`）」「終了（`DONE`）」を表しています。利用者の値が `null` でも正しく保留できます。
- **終了時の取りこぼしがない**: 上流が終わった瞬間に保留中の値があれば、待たずに流します（236 行目）。上流がエラーで終わったときは、それを投げ直します（234 行目）。

## まとめ

- 「次の値」と「時間切れ」のような複数の待ちは、`select` で並べると簡単に書ける。
- 「最新の 1 個だけ保留する」状態を変数 1 つと番兵で表せる。
- 終了時に保留中の値を流すか、エラーを伝えるかを忘れずに処理する。
