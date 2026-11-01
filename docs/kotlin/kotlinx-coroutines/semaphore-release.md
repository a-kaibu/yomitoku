---
title: "数を 1 増やすだけで「誰かを起こすべきか」が分かる release"
description: "セマフォに許可を返す release。負の数で待ち人数を表す工夫により、getAndIncrement 1 回の結果だけで、待っている人を起こすかどうかを判断できる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Semaphore.kt
lines: [242, 262]
function: "SemaphoreAndMutexImpl.release"
difficulty: 3
tags: [並行処理, ロック不要, データ構造]
format: 2
---

## ひとことで

`release()` は、セマフォに **許可を 1 つ返す** 関数です。待っているコルーチンがいれば、そのうち先頭の 1 つを起こします。

このセマフォは、許可の数を表すカウンタを **「正なら残りの許可、負なら待っている人数」** として使っています。そのおかげで、カウンタを 1 増やす操作の **結果を見るだけで**、誰かを起こす必要があるかが分かります。

## コード


::: code-group

```kotlin:line-numbers=242 [日本語訳]
    fun release() {
        while (true) {
            // 利用できる許可の数を 1 増やす
            val p = _availablePermits.getAndIncrement()
            // この release の呼び出しは正しいか？
            // 許可の最大数を超えていないか？
            if (p >= permits) {
                // 許可の数を正しい値に戻し、
                // エラーにする
                coerceAvailablePermitsAtMaximum()
                error("The number of released permits cannot be greater than $permits")
            }
            // 起こすべき待ち人がいるか？
            if (p >= 0) return
            // 待ち行列の先頭の待ち人を起こそうとする。
            // 先頭の待ち人が取り消されていたり、
            // 同期的な再開の仕組みが使われたりした場合は、
            // 操作をやり直す。
            if (tryResumeNextFromQueue()) return
        }
    }
```

```kotlin:line-numbers=242 [原文]
    fun release() {
        while (true) {
            // Increment the number of available permits.
            val p = _availablePermits.getAndIncrement()
            // Is this `release` call correct and does not
            // exceed the maximal number of permits?
            if (p >= permits) {
                // Revert the number of available permits
                // back to the correct one and fail with error.
                coerceAvailablePermitsAtMaximum()
                error("The number of released permits cannot be greater than $permits")
            }
            // Is there a waiter that should be resumed?
            if (p >= 0) return
            // Try to resume the first waiter, and
            // restart the operation if either this
            // first waiter is cancelled or
            // due to `SYNC` resumption mode.
            if (tryResumeNextFromQueue()) return
        }
    }
```

:::

## 前提知識

- **セマフォ**: 同時に入れる数を許可で管理する仕組みです。上限は `permits` 個です。
- **`_availablePermits` の意味**: 正の値なら残りの許可数、0 なら「許可なし、待ちなし」、負の値なら「待っている人数」です。たとえば `-2` は 2 人待ちです。待つ側（`acquire`）は、許可がなくても数を 1 減らしてから待ち行列に並びます。
- **`getAndIncrement()`**: 原子変数を 1 増やし、**増やす前の値** を返す不可分な操作です。
- **`tryResumeNextFromQueue()`**: 同じクラスにある関数で、待ち行列の先頭のコルーチンに許可を渡して起こそうとします。相手がすでに取り消されていたなどで失敗すると `false` を返します。
- **`error(メッセージ)`**: `IllegalStateException` を投げる標準関数です。

## 何をしているか

### 1. 数を 1 増やし、前の値を見る

```kotlin:line-numbers=245
            val p = _availablePermits.getAndIncrement()
```

### 2. 上限を超えたら誤り

```kotlin:line-numbers=248
            if (p >= permits) {
                // 許可の数を正しい値に戻し、
                // エラーにする
                coerceAvailablePermitsAtMaximum()
                error("The number of released permits cannot be greater than $permits")
            }
```

前の値が上限以上だった（つまり誰にも貸していないのに返された）なら、数を上限に戻してから例外にします。

### 3. 誰も待っていなければ終わり

```kotlin:line-numbers=255
            if (p >= 0) return
```

前の値が 0 以上なら、待っている人はいません。数が増えただけで終わりです。

### 4. 待っている人がいれば起こす

```kotlin:line-numbers=260
            if (tryResumeNextFromQueue()) return
```

前の値が負なら、待っている人がいます。先頭を起こし、成功すれば終わりです。失敗したら（相手が取り消されていたなど）ループの先頭に戻り、もう一度数を増やして次の人を試します。

許可 1 のセマフォで、A が持っていて、B と C が待っている場合:

| 操作 | カウンタ | 意味 |
| --- | --- | --- |
| A が取得 | 1 → 0 | 許可なし |
| B が待つ | 0 → -1 | 1 人待ち |
| C が待つ | -1 → -2 | 2 人待ち |
| A が release | -2 → -1（前の値 -2 < 0） | B を起こす |
| B が release | -1 → 0（前の値 -1 < 0） | C を起こす |
| C が release | 0 → 1（前の値 0） | 誰も起こさず終わり |

## ここがすごい

- **原子操作 1 回で判断できる**: 「数を増やす」と「待ち人がいるか調べる」を別々にすると、その間に状況が変わる競合が起きます。1 つのカウンタに両方の意味を持たせたので、`getAndIncrement` の戻り値だけで正確に判断できます。
- **起こせなかったらやり直す**: 待ち行列の先頭がすでに取り消されていた場合、許可を受け取る人がいません。そのときはループで再度数を増やし、次の人を探します。取り消された人の分の「待ち」もこれで帳消しになります。
- **誤用はすぐ例外に**: 借りていない許可を返すのはバグです。数を直してから例外にするので、セマフォが壊れた状態のまま残りません。
- **速い道がとても短い**: 誰も待っていない普通の場合、処理は `getAndIncrement` 1 回と比較 2 回だけです。

## まとめ

- カウンタの符号に意味を持たせると、1 回の原子操作で複数の情報が手に入る。
- 起こす相手がいなくなっていたら、やり直して次の相手を探す。
- よくある場合（誰も待っていない）の処理を最短にしておくと、全体が速くなる。
