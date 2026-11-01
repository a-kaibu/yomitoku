---
title: "多すぎる許可を自分で直すセマフォの tryAcquire"
description: "セマフォの許可を待たずに 1 つ取る tryAcquire。CAS ループで数を減らしつつ、誤った release で上限を超えた数も見つけて元に戻している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Semaphore.kt
lines: [151, 168]
function: "SemaphoreAndMutexImpl.tryAcquire"
difficulty: 2
tags: [並行処理, ロック不要, 防御的プログラミング]
---

## ひとことで

`tryAcquire()` は、セマフォ（同時に入れる数を許可で管理する仕組み）から、**待たずに許可を 1 つ取ろうとする** 関数です。取れれば `true`、残りがなければ `false` を返します。

許可の数を CAS（compareAndSet）で減らす定番のループですが、**許可の数が上限を超えていたら、まず上限に戻してからやり直す** という、誤用への備えが入っています。

## コード

```kotlin:line-numbers=151
    fun tryAcquire(): Boolean {
        while (true) {
            // Get the current number of available permits.
            val p = _availablePermits.value
            // Is the number of available permits greater
            // than the maximal one because of an incorrect
            // `release()` call without a preceding `acquire()`?
            // Change it to `permits` and start from the beginning.
            if (p > permits) {
                coerceAvailablePermitsAtMaximum()
                continue
            }
            // Try to decrement the number of available
            // permits if it is greater than zero.
            if (p <= 0) return false
            if (_availablePermits.compareAndSet(p, p - 1)) return true
        }
    }
```

## 前提知識

- **セマフォの許可**: 最大 `permits` 個の許可があり、入るときに 1 つ取り、出るときに 1 つ返します。許可がなくなったら、次の人は待つことになります。
- **`_availablePermits`**: 残りの許可の数を持つ原子変数です。このライブラリでは、**負の値は「待っている人の数」** を表します（146 行目のコメント）。たとえば `-2` は「許可 0、待ち 2 人」です。
- **`compareAndSet(p, p - 1)`**: 今の値がまだ `p` のときだけ `p - 1` に書き換える不可分な操作です。他のスレッドが先に変えていたら失敗します。
- **`coerceAvailablePermitsAtMaximum()`**: 同じクラスの 269〜275 行目にある関数で、許可の数が上限を超えていたら CAS で上限に戻します。
- **`while (true)` と `continue`**: 無限ループと、ループの先頭に戻る命令です。

## 何をしているか

### 1. 今の残りを読む（154 行目）

### 2. 上限を超えていたら直してやり直す（159〜162 行目）

`acquire` していないのに `release` を呼ぶ誤りがあると、一時的に許可の数が上限を超えることがあります。そのときは上限に戻してから、最初からやり直します。

### 3. 残りがなければ失敗（165 行目）

0 以下（許可なし、または待っている人がいる）なら、待たずに `false` を返します。

### 4. CAS で 1 つ減らす（166 行目）

許可 3 のセマフォで、2 つのスレッドが同時に `tryAcquire` した場合:

1. A も B も `p = 3` を読む
2. A の `compareAndSet(3, 2)` が成功 → A は許可を得る
3. B の `compareAndSet(3, 2)` は失敗（今は 2）→ ループの先頭へ
4. B は `p = 2` を読み、`compareAndSet(2, 1)` に成功

## ここがすごい

- **待ち人数と残り許可を 1 つの数で**: 正なら残りの許可、負なら待っている人数。1 つの原子変数で両方を表すので、`acquire`（数を 1 減らす）と `release`（1 増やす）がそれぞれ 1 回の原子操作で済みます。`tryAcquire` が 0 以下で失敗するのも、この表現なら自然です。
- **`getAndDecrement` ではなく CAS を使う理由**: 待つつもりのない `tryAcquire` で数を減らしてしまうと、「待ち人」として数えられてしまいます。CAS なら「正のときだけ減らす」が確実にできます。一方、待つつもりの `acquire` は、同じクラスの `decPermits`（229〜240 行目）で `getAndDecrement` を使い、無条件に減らしています。目的に応じた使い分けです。
- **誤用から自力で回復する**: 上限を超える `release` は本来エラーですが、そのタイミングと競合した `tryAcquire` が誤って許可を余分に取らないよう、ここでも数を直しています。
- **ロックを使わない**: どの操作も CAS で行うので、スレッドが待たされることはありません。

## まとめ

- 「正なら残り、負なら待ち人数」のように 1 つの数に 2 つの意味を持たせると、原子操作 1 回で状態を更新できる。
- 条件付きで減らしたいときは CAS ループ、無条件なら `getAndDecrement`、と使い分ける。
- 誤用で状態が壊れても、読んだ側で直してから進むと被害が広がらない。
