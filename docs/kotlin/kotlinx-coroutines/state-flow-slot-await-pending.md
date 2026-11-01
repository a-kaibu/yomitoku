---
title: "眠る前にもう一度確かめる StateFlow の待ち方"
description: "StateFlow の購読者が新しい値を待つ 2 つの関数。まず眠らずに印を確かめ、眠るときも CAS で通知との行き違いを防いでいる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [298, 309]
function: "StateFlowSlot.takePending / awaitPending"
difficulty: 3
tags: [並行処理, ロック不要, 非同期]
format: 2
---

## ひとことで

StateFlow の購読者は、新しい値が来るまで眠って待ちます。`takePending` と `awaitPending` はそのための関数で、

- `takePending()`: 眠らずに「通知の印（`PENDING`）が来ていたか」を確かめて、印を消す
- `awaitPending()`: 印がなければ、眠って通知を待つ

という役割です。眠る直前に通知が来てしまう **「行き違い」** を、CAS 1 回で防いでいるのが見どころです。

## コード


::: code-group

```kotlin:line-numbers=298 [日本語訳]
    fun takePending(): Boolean = _state.getAndSet(NONE)!!.let { state ->
        assert { state !is CancellableContinuationImpl<*> }
        return state === PENDING
    }

    suspend fun awaitPending(): Unit = suspendCancellableCoroutine sc@ { cont ->
        assert { _state.value !is CancellableContinuationImpl<*> } // NONE か PENDING のどちらかのはず
        if (_state.compareAndSet(NONE, cont)) return@sc // 継続を設置し、通知を待つ
        // CAS に失敗した理由は、その間に通知が来て PENDING になったことだけ
        assert { _state.value === PENDING }
        cont.resume(Unit)
    }
```

```kotlin:line-numbers=298 [原文]
    fun takePending(): Boolean = _state.getAndSet(NONE)!!.let { state ->
        assert { state !is CancellableContinuationImpl<*> }
        return state === PENDING
    }

    suspend fun awaitPending(): Unit = suspendCancellableCoroutine sc@ { cont ->
        assert { _state.value !is CancellableContinuationImpl<*> } // can be NONE or PENDING
        if (_state.compareAndSet(NONE, cont)) return@sc // installed continuation, waiting for pending
        // CAS failed -- the only possible reason is that it is already in pending state now
        assert { _state.value === PENDING }
        cont.resume(Unit)
    }
```

:::

`_state` は、`null`（空き）、`NONE`（通知なし）、`PENDING`（通知あり）、継続オブジェクト（眠っている）のどれかを持つ原子変数です。

## 前提知識

- **コルーチンの中断**: `suspend` 関数の中でコルーチンは一時停止でき、そのとき「再開の仕方」が継続（`cont`）にまとまります。`cont.resume(Unit)` で再開します。
- **`suspendCancellableCoroutine { cont -> ... }`**: 現在のコルーチンを中断して、その継続をブロックに渡す関数です。ブロックが終わっても、誰かが `resume` するまでコルーチンは止まったままです。ブロックの中ですぐ `resume` すれば、止まらずに続行します。
- **`getAndSet(新しい値)`**: 原子変数の値を新しい値に置き換え、**置き換える前の値** を返す不可分な操作です。
- **`compareAndSet(期待値, 新しい値)`**: 期待どおりのときだけ書き換える不可分な操作です。
- **`!!`**: `null` ではないと断言する演算子です。
- **`.let { state -> ... }`**: 値に名前を付けてブロックを実行するスコープ関数です。
- **`return@sc`**: `sc@` というラベルのラムダから抜ける書き方です。

## 何をしているか

### takePending: 印を消して、前の状態を見る

```kotlin:line-numbers=298
    fun takePending(): Boolean = _state.getAndSet(NONE)!!.let { state ->
        assert { state !is CancellableContinuationImpl<*> }
        return state === PENDING
    }
```

状態を `NONE` にしつつ、前の状態を受け取ります。前が `PENDING` なら「通知があった」ので `true` を返します。
購読ループは、まずこれを呼んで、`true` なら眠らずにすぐ最新の値を読みに行きます。

### awaitPending: 印がなければ眠る

```kotlin:line-numbers=303
    suspend fun awaitPending(): Unit = suspendCancellableCoroutine sc@ { cont ->
        assert { _state.value !is CancellableContinuationImpl<*> } // NONE か PENDING のどちらかのはず
        if (_state.compareAndSet(NONE, cont)) return@sc // 継続を設置し、通知を待つ
```

1. 中断して継続 `cont` を受け取る。
2. 状態が `NONE` のままなら、`cont` に置き換える（`compareAndSet(NONE, cont)`）。これで「眠っている」状態になり、あとで `makePending` が起こしてくれます。
3. CAS が失敗した場合、理由は「その間に通知が来て `PENDING` になった」しかありません。だから眠らずに、その場で `cont.resume(Unit)` して続行します。

### 行き違いの例

1. 購読者が `takePending()` → 印なし（`NONE`）
2. この瞬間、別スレッドが値を更新し、`makePending()` で `NONE` → `PENDING`
3. 購読者が `awaitPending()` → `compareAndSet(NONE, cont)` は失敗（今は `PENDING`）
4. 購読者はすぐ再開して、新しい値を読む

もし CAS ではなく単純に `_state.value = cont` と書いていたら、2 の通知が上書きされて消え、購読者は永遠に眠ったままになります。

## ここがすごい

- **まず眠らずに確かめる（ファストパス）**: 値が頻繁に変わるときは、ほとんどの場合 `takePending` が `true` を返し、中断のコストを払わずに済みます。眠るのは本当に何もないときだけです。
- **「確かめる」と「眠る」の隙間を CAS で埋める**: 並行処理でよくあるバグが、確認と待機の間に通知が来て取りこぼすことです。CAS の失敗を「通知が来た合図」として扱うことで、隙間がなくなっています。
- **失敗の理由が 1 つしかない設計**: 状態遷移が限られているので、CAS が失敗したら `PENDING` しかありえません。`assert { _state.value === PENDING }` でそれを確認しています。状態の種類を絞ると、こうした推論ができるようになります。

## まとめ

- 待つ前に、まず待たずに済むか確認すると速い。
- 「確認してから眠る」の間に通知が来る行き違いは、CAS で眠る状態に入ることで防げる。
- 状態遷移を限定しておくと、CAS が失敗した理由を 1 つに絞り込める。
