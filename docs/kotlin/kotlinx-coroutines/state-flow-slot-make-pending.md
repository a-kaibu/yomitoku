---
title: "4 つの状態を 1 つの変数で切り替える StateFlow のスロット"
description: "StateFlow の購読者に新しい値を知らせる makePending。空き・待機なし・通知待ち・中断中の 4 状態を 1 つの原子変数に詰め、CAS で安全に遷移させる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [278, 296]
function: "StateFlowSlot.makePending"
difficulty: 3
tags: [並行処理, ロック不要, 状態機械]
format: 2
---

## ひとことで

`makePending` は、StateFlow の購読者 1 人ぶんの「スロット」に、**「新しい値が来たよ」と知らせる** 関数です。
購読者が眠って待っていれば起こし、起きていれば「あとで確認してね」という印を付けます。

スロットの状態は 4 種類あり、それを **1 つの原子変数 `_state` に、値の種類で詰め込んで** います。状態の切り替えは CAS（compareAndSet）で行うので、ロックが要りません。

## コード


::: code-group

```kotlin:line-numbers=278 [日本語訳]
    @Suppress("UNCHECKED_CAST")
    fun makePending() {
        _state.loop { state ->
            when {
                state == null -> return // このスロットは空いている。飛ばす
                state === PENDING -> return // すでに保留中。何もしない
                state === NONE -> { // 保留中の印を付ける
                    if (_state.compareAndSet(state, PENDING)) return
                }
                else -> { // 中断中の継続が入っている
                    // 継続はいつでもキャンセルされてスロットを手放すかもしれないので、ここでも CAS を使う
                    if (_state.compareAndSet(state, NONE)) {
                        (state as CancellableContinuationImpl<Unit>).resume(Unit)
                        return
                    }
                }
            }
        }
    }
```

```kotlin:line-numbers=278 [原文]
    @Suppress("UNCHECKED_CAST")
    fun makePending() {
        _state.loop { state ->
            when {
                state == null -> return // this slot is free - skip it
                state === PENDING -> return // already pending, nothing to do
                state === NONE -> { // mark as pending
                    if (_state.compareAndSet(state, PENDING)) return
                }
                else -> { // must be a suspend continuation state
                    // we must still use CAS here since continuation may get cancelled and free the slot at any time
                    if (_state.compareAndSet(state, NONE)) {
                        (state as CancellableContinuationImpl<Unit>).resume(Unit)
                        return
                    }
                }
            }
        }
    }
```

:::

スロットの状態は、同じクラスのコメントで次のように説明されています。

| `_state` の値 | 意味 |
| --- | --- |
| `null` | 空き。誰も使っていない |
| `NONE` | 購読者がいるが、眠ってもいないし通知も来ていない |
| `PENDING` | 新しい値の通知が来ている |
| 継続オブジェクト | 購読者が眠って新しい値を待っている |

## 前提知識

- **コルーチンの中断と継続（Continuation）**: コルーチンが一時停止すると、「どこから再開するか」の情報が継続オブジェクトにまとまります。それを `resume(Unit)` すると再開します。`CancellableContinuationImpl` はその実装クラスです。
- **原子変数と CAS**: `_state.compareAndSet(古い値, 新しい値)` は「今の値が古い値と同じなら書き換え、成功したら `true`」を不可分に行います。
- **`_state.loop { state -> ... }`**: atomicfu というライブラリの関数で、「今の値を読んでブロックを実行する」を `return` するまで繰り返します。CAS に失敗したらもう一度最新の値で試す、という CAS ループを短く書けます。
- **`Symbol`**: `NONE` や `PENDING` は、名前付きのただのオブジェクト（番兵）です。`===` で同一性を比べます。
- **`when { ... }`**: 条件を上から調べて、最初に当てはまった分岐を実行します。

## 何をしているか

状態ごとに分岐します。

### 空き（`null`）と保留中（`PENDING`）

```kotlin:line-numbers=282
                state == null -> return // このスロットは空いている。飛ばす
                state === PENDING -> return // すでに保留中。何もしない
```

購読者がいないスロットは何もしません。すでに `PENDING` なら印が付いているので何もしません。通知が何回来ても、印は 1 つにまとまります。

### 待機なし（`NONE`）

```kotlin:line-numbers=285
                    if (_state.compareAndSet(state, PENDING)) return
```

`PENDING` に変えて終わります。購読者は起きているので、次に確認したときに気づきます。

### 眠っている購読者（継続）

```kotlin:line-numbers=289
                    if (_state.compareAndSet(state, NONE)) {
                        (state as CancellableContinuationImpl<Unit>).resume(Unit)
                        return
                    }
```

`NONE` に戻してから、その継続を `resume` して起こします。

CAS が失敗したとき（他のスレッドが同時に状態を変えたとき）は、`loop` が最新の状態でもう一度判定します。

## ここがすごい

- **型の違いを状態の違いに使う**: 「空き」「待機なし」「通知あり」「眠っている」を別々のフラグで持つと、それらの組み合わせを同時に正しく更新するのが大変です。1 つの変数に入れる「もの」を変えるだけで状態を表せば、CAS 1 回で状態が切り替わります。しかも「眠っている」状態では、起こす相手（継続）そのものを持っています。
- **通知を自然にまとめる**: すでに `PENDING` なら何もしないので、購読者が忙しい間に 100 回更新があっても、印は 1 つだけです。購読者は起きたときに最新の値を読めばよいので、これで十分です。
- **キャンセルとの競合にも安全**: 眠っている購読者はいつキャンセルされてスロットを手放すか分かりません。だから継続を起こす前にも CAS で状態を確認しています。
- **`null` を「空き」にする理由**: スロットの新規確保と `makePending` が競合しても、既定の `null` なら「空き」として安全にスキップできます。

## まとめ

- 複数のフラグを 1 つの原子変数にまとめ、入れる値の種類で状態を表すと、CAS 1 回で状態を切り替えられる。
- 「通知あり」の印は 1 つで十分。何度通知されても 1 回にまとまる。
- 眠っている相手を起こす前にも、状態が変わっていないかを CAS で確かめる。
