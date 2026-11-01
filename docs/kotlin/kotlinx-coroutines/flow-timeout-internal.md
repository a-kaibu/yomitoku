---
title: "値と値の間隔に時間制限をかける timeout"
description: "次の値が一定時間来なければ例外で止める Flow の timeout。whileSelect で受信とタイムアウトを並べ、値が来るたびに待ち時間がリセットされる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Delay.kt
lines: [387, 406]
function: "Flow.timeoutInternal"
difficulty: 3
tags: [非同期, エラー処理, 並行処理]
---

## ひとことで

Flow の `timeout(5.seconds)` は、**次の値が 5 秒以内に来なかったら** `TimeoutCancellationException` を投げて収集を止める操作です。
全体の時間ではなく、**値と値の間隔** に制限をかけます。値が 4 秒おきに来続ければ、何分続いても止まりません。

`timeoutInternal` はその本体で、`whileSelect` を使って「値を受信する」と「時間切れ」を毎回並べて待っています。

## コード

```kotlin:line-numbers=387
private fun <T> Flow<T>.timeoutInternal(
    timeout: Duration
): Flow<T> = scopedFlow { downStream ->
    if (timeout <= Duration.ZERO) throw TimeoutCancellationException("Timed out immediately")
    val values = buffer(Channel.RENDEZVOUS).produceIn(this)
    whileSelect {
        values.onReceiveCatching { value ->
            value.onSuccess {
                downStream.emit(it)
            }.onClosed {
                it?.let { throw it }
                return@onReceiveCatching false
            }
            return@onReceiveCatching true
        }
        onTimeout(timeout) {
            throw TimeoutCancellationException("Timed out waiting for $timeout")
        }
    }
}
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`downStream.emit(値)` で下流へ値を渡します。
- **`Duration`**: Kotlin 標準の「時間の長さ」を表す型です。`5.seconds` のように書けます。`Duration.ZERO` は 0 秒です。
- **`scopedFlow`**: 中でコルーチンを起動できる Flow を作る内部関数です。
- **`buffer(Channel.RENDEZVOUS).produceIn(this)`**: 上流の Flow を別のコルーチンで収集して、チャネル（コルーチン間で値を渡す管）に流し込みます。RENDEZVOUS は容量 0 で、受け取り手が来るまで送り手が待ちます。
- **`whileSelect { ... }`**: 中の `select` を、ブロックが `true` を返す限り繰り返す関数です。`false` を返すとループを抜けます。
- **`onReceiveCatching`**: チャネルから値を受け取るか、チャネルが閉じたことを知らせます。`onSuccess` は値があったとき、`onClosed` は閉じたときの処理です。
- **`onTimeout(timeout)`**: 指定時間内にほかの候補が起きなければ実行されます。

## 何をしているか

### 1. 0 秒以下なら即座に失敗（390 行目）

制限が 0 秒以下なら、待つまでもなく時間切れです。

### 2. 上流をチャネルに流す（391 行目）

上流は別コルーチンで動き、値をチャネルへ送ります。こちらはチャネルから受け取るだけです。

### 3. 受信か時間切れか（392〜405 行目）

制限 2 秒で、値が 0 秒・1 秒・4 秒に来る場合:

- 0 秒: 値を受信 → 下流へ流す → `true` で次のループ（ここで待ち時間がリセット）
- 1 秒: 値を受信 → 流す → 次のループ
- 3 秒: 前の値から 2 秒経過、受信より先に `onTimeout` が起きる → 例外

上流が正常に終われば `onClosed` で `false` を返してループを抜けます。上流がエラーで終われば、そのエラーを投げ直します（397 行目）。

## ここがすごい

- **ループのたびに待ちを並べ直すだけで「間隔」の制限になる**: `whileSelect` は毎回新しい `select` を作るので、`onTimeout` も毎回新しく始まります。値が来ればその回の `select` は終わり、次の回でまた 2 秒の待ちが始まります。タイマーをリセットするコードを書く必要がありません。
- **上流と下流を切り離す**: 上流をチャネル越しに別コルーチンで動かしているので、上流が止まっていても、こちら側は時間を数え続けられます。上流が `collect` の中で固まっても、タイムアウトを検出できます。
- **0 秒を特別扱い**: 0 秒の `onTimeout` は「すぐ発火する」と「受信が先」のどちらになるか曖昧になりがちです。最初に例外を投げることで、挙動をはっきりさせています。
- **終了とエラーを区別**: `onClosed` に渡ってくる値が `null` なら正常終了、例外ならエラーです。`it?.let { throw it }` の 1 行で両方を扱っています。

## まとめ

- 「値と値の間隔」の制限は、受信とタイムアウトを毎回並べて待つだけで作れる。
- 上流を別コルーチンとチャネルに分けると、上流が止まっても時間を測れる。
- 境界値（0 秒など）は最初に特別扱いしておくと、挙動が明確になる。
