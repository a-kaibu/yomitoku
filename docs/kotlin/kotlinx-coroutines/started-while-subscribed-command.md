---
title: "購読者の数から「開始・停止」命令を作る WhileSubscribed"
description: "共有 Flow を購読者がいる間だけ動かす WhileSubscribed の本体。購読者数の変化を transformLatest で命令に変え、少し待ってから止める猶予まで数行で表している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/SharingStarted.kt
lines: [172, 186]
function: "StartedWhileSubscribed.command"
difficulty: 3
tags: [非同期, 設計パターン, 状態機械]
---

## ひとことで

`SharingStarted.WhileSubscribed(5000)` は、`shareIn` / `stateIn` で共有した Flow を **購読者がいる間だけ動かし、いなくなったら 5 秒待ってから止める** という方針です。Android で画面回転のときに一瞬購読者がいなくなっても、処理を止めずに済む定番の設定です。

`command` 関数はその本体で、**購読者数の変化（`StateFlow<Int>`）を、開始・停止の命令の Flow に変換** します。タイマー管理を一切書かずに、Flow の演算子だけで猶予時間を表しているのが見どころです。

## コード

```kotlin:line-numbers=172
    override fun command(subscriptionCount: StateFlow<Int>): Flow<SharingCommand> = subscriptionCount
        .transformLatest { count ->
            if (count > 0) {
                emit(SharingCommand.START)
            } else {
                delay(stopTimeout)
                if (replayExpiration > 0) {
                    emit(SharingCommand.STOP)
                    delay(replayExpiration)
                }
                emit(SharingCommand.STOP_AND_RESET_REPLAY_CACHE)
            }
        }
        .dropWhile { it != SharingCommand.START } // don't emit any STOP/RESET_BUFFER to start with, only START
        .distinctUntilChanged() // just in case somebody forgets it, don't leak our multiple sending of START
```

## 前提知識

- **`shareIn` / `stateIn`**: 1 つの Flow を複数の購読者で共有する仕組みです。上流をいつ動かし、いつ止めるかを `SharingStarted` で指定します。
- **`subscriptionCount: StateFlow<Int>`**: いまの購読者数を持ち、変わるたびに通知する Flow です。
- **`SharingCommand`**: 共有の仕組みへの命令です。`START`（上流を動かす）、`STOP`（止める）、`STOP_AND_RESET_REPLAY_CACHE`（止めて、保存していた最新値も捨てる）があります。
- **`transformLatest { ... }`**: 新しい値が来たら、**前の値の処理が途中でもキャンセルして**、新しい値の処理を始める演算子です。ブロックの中で `emit` すると下流に値が流れます。
- **`delay(ms)`**: 指定時間だけ一時停止します。キャンセルされると途中で止まります。
- **`dropWhile { 条件 }`**: 条件が真の間、先頭の値を捨てます。一度でも偽になったら、あとは全部流します。
- **`distinctUntilChanged()`**: 直前と同じ値を流さない演算子です。

## 何をしているか

### 1. 購読者数ごとに命令を作る（173〜184 行目）

- 購読者が 1 人以上なら、すぐ `START`。
- 0 人になったら、`stopTimeout` だけ待ってから `STOP`。さらに `replayExpiration` 待ってから、キャッシュも捨てる `STOP_AND_RESET_REPLAY_CACHE`。

`WhileSubscribed(5000)` で、購読者数が `1 → 0 → 1` と 2 秒で戻った場合:

- `1` → `START`
- `0` → 5 秒待ち始める
- 2 秒後に `1` → `transformLatest` が待ちをキャンセルして、`START` を流す
- 待ちが取り消されたので `STOP` は一度も流れない

### 2. 最初の STOP を捨てる（185 行目）

最初は購読者数 0 から始まるので、そのままだと「始まってもいないのに `STOP`」が流れます。`START` が来るまでの値はすべて捨てます。

### 3. 重複した START を消す（186 行目）

上の例では `START` が 2 回流れますが、`distinctUntilChanged` で 1 回にまとめます。

## ここがすごい

- **キャンセルをタイマーのリセットに使う**: 「5 秒以内に戻ってきたら止めない」を普通に書くと、タイマーを作って、戻ってきたら取り消して…という管理が必要です。`transformLatest` は新しい値が来ると前の処理を自動でキャンセルするので、`delay` の途中で購読者が戻れば、それだけで停止が取り消されます。
- **段階的な停止を上から順に書ける**: 「待つ → 止める → さらに待つ → キャッシュも捨てる」が、時間の流れどおりに 4 行で並んでいます。`replayExpiration` が 0 なら途中の `STOP` を飛ばして、すぐ全部捨てます。
- **ガードを後段にまとめる**: 「最初は START から」「START を重複させない」という約束を、`dropWhile` と `distinctUntilChanged` で後から保証しています。186 行目のコメントは「誰かが付け忘れても大丈夫なように」と、防御的な意図を明記しています。
- **命令を Flow で表すので差し替えやすい**: `SharingStarted` は「購読者数の Flow → 命令の Flow」という関数 1 つのインターフェースです。`Eagerly` は `flowOf(START)` だけ、`Lazily` は最初の購読で 1 回 `START` するだけ（同じファイル 143〜161 行目）と、方針ごとに短く書けます。

## まとめ

- 「一定時間後に何かする、ただし途中で状況が変わったら取り消す」は、`transformLatest` + `delay` で書ける。
- 余計な最初の値や重複は、後段の演算子でまとめて取り除ける。
- 振る舞いを「入力の Flow から出力の Flow への変換」として定義すると、方針の差し替えが簡単になる。
