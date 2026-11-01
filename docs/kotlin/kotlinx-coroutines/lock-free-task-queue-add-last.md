---
title: "満杯になったら「凍らせて」次の配列へ乗り換えるキュー"
description: "ロックを使わない待ち行列の外側のクラス。中身の配列が満杯や凍結になったら、次の大きな配列へ参照を進めるだけで、追加や取り出しをやり直す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/LockFreeTaskQueue.kt
lines: [26, 66]
function: "LockFreeTaskQueue"
difficulty: 3
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`LockFreeTaskQueue` は、kotlinx.coroutines が実行待ちのタスクを溜めておくための **ロックを使わない待ち行列** です。
中身は固定長の配列（`LockFreeTaskQueueCore`）で、満杯になると **今の配列を「凍結」して、2 倍の大きさの新しい配列にコピー** します。

このクラスはその外側の包みで、「今使っている配列」を指す参照 `_cur` を持ち、配列が凍結されていたら **参照を次の配列に進めてやり直す** という役目だけを担っています。

## コード

```kotlin:line-numbers=26
internal open class LockFreeTaskQueue<E : Any>(
    singleConsumer: Boolean // true when there is only a single consumer (slightly faster & lock-free)
) {
    private val _cur = atomic(Core<E>(Core.INITIAL_CAPACITY, singleConsumer))

    // Note: it is not atomic w.r.t. remove operation (remove can transiently fail when isEmpty is false)
    val isEmpty: Boolean get() = _cur.value.isEmpty
    val size: Int get() = _cur.value.size

    fun close() {
        _cur.loop { cur ->
            if (cur.close()) return // closed this copy
            _cur.compareAndSet(cur, cur.next()) // move to next
        }
    }

    fun addLast(element: E): Boolean {
        _cur.loop { cur ->
            when (cur.addLast(element)) {
                Core.ADD_SUCCESS -> return true
                Core.ADD_CLOSED -> return false
                Core.ADD_FROZEN -> _cur.compareAndSet(cur, cur.next()) // move to next
            }
        }
    }

    @Suppress("UNCHECKED_CAST")
    fun removeFirstOrNull(): E? {
        _cur.loop { cur ->
            val result = cur.removeFirstOrNull()
            if (result !== Core.REMOVE_FROZEN) return result as E?
            _cur.compareAndSet(cur, cur.next())
        }
    }

    // Used for validation in tests only
    fun <R> map(transform: (E) -> R): List<R> = _cur.value.map(transform)

    // Used for validation in tests only
    fun isClosed(): Boolean = _cur.value.isClosed()
}
```

## 前提知識

- **ロックフリー（lock-free）**: ロックを使わず、CAS（compareAndSet: 期待どおりなら書き換える不可分な操作）だけで複数スレッドから安全に使えるようにする手法です。誰かが途中で止まっても、他のスレッドは進めます。
- **`Core<E>`**: 7 行目の `typealias`（型の別名）で、`LockFreeTaskQueueCore<E>` のことです。固定長の配列を持つ本体で、満杯になると「凍結（frozen）」され、それ以上変更できなくなります。`next()` で次の（2 倍の）配列を取得できます。
- **`atomic(...)` と `_cur.loop { cur -> ... }`**: atomicfu ライブラリの原子変数と、その値を読んでブロックを繰り返し実行する関数です。ブロックの中で `return` するまで繰り返します。
- **`singleConsumer`**: 取り出す側が 1 スレッドだけと分かっているかどうかです。分かっていれば少し速い処理を選べます。
- **`ADD_SUCCESS` / `ADD_FROZEN` / `ADD_CLOSED`**: Core の `addLast` が返す結果の定数です。

## 何をしているか

### 1. 追加する（42〜50 行目）

今の配列に `addLast` を頼みます。

- 成功 → `true`
- 閉じられている（もう使わない）→ `false`
- 凍結されている（満杯でコピー中など）→ `_cur` を次の配列に CAS で進めて、もう一度

### 2. 取り出す（53〜59 行目）

今の配列から取り出しを頼み、凍結されていれば次の配列に進めてやり直します。

### 3. 閉じる（35〜40 行目）

今の配列を閉じます。凍結されていて閉じられなければ、次の配列に進めてやり直します。

### 乗り換えの例

容量 8 の配列がいっぱいのとき、スレッド A が追加しようとすると:

1. A の `addLast` が `ADD_FROZEN` を返す（Core が凍結され、容量 16 のコピーが作られる）
2. A は `_cur` を容量 16 の配列に CAS で進める
3. 次のループで、新しい配列に追加して成功

同時にスレッド B も追加しようとしていた場合、B も凍結に気づいて `_cur` を進めようとしますが、CAS は 1 つしか成功しません。どちらが成功しても、`_cur` は同じ新しい配列を指すので問題ありません。

## ここがすごい

- **役割の分担**: 難しい「凍結とコピー」は Core に任せ、外側は「凍結されていたら次へ進む」だけです。どの操作も同じ形のループになっていて、読みやすく、間違いにくくなっています。
- **CAS が失敗しても気にしない**: 47 行目と 57 行目の `compareAndSet` は、結果を見ていません。失敗したのは、他のスレッドがすでに進めてくれたからです。どちらにしても次のループで最新の `_cur` を読み直すので、正しく動きます。
- **配列は伸ばさず、乗り換える**: ロックなしで配列を伸ばすのは非常に難しいので、「古い配列を凍らせて読み取り専用にし、新しい配列にコピーする」という方法にしています。凍結された配列は誰も変更しないので、安全にコピーできます。
- **正直なコメント**: 31 行目のコメントは「`isEmpty` は取り出しと不可分ではない」と、この設計の弱点を明記しています。ロックフリーのデータ構造では、どの操作がどこまで保証されるかを書いておくことが大切です。

## まとめ

- ロックなしでサイズを変えるには、古い入れ物を凍らせて、新しい入れ物へ乗り換える。
- 「状態が古ければ参照を進めてやり直す」ループは、どの操作にも同じ形で使える。
- 他のスレッドが先に進めてくれた CAS の失敗は、無視してよい場合がある。
