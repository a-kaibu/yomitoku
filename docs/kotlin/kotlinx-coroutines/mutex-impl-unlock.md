---
title: "持ち主を先に消してから許可を返す Mutex の解放"
description: "コルーチン用 Mutex の unlock。持ち主の記録を CAS で消してからセマフォの許可を返す順番と、持ち主が書き込まれるまでの短いスピン待ちが見どころ。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Mutex.kt
lines: [206, 221]
function: "MutexImpl.unlock"
difficulty: 3
tags: [並行処理, ロック不要, 防御的プログラミング]
---

## ひとことで

`MutexImpl.unlock(owner)` は、コルーチン用のロック `Mutex` を **解放する** 関数です。
kotlinx.coroutines の Mutex は「許可が 1 つだけのセマフォ」として実装されていて、それに **「誰が持っているか」（owner）の記録** を足したものです。解放するときは、

1. 持ち主の記録を消す
2. セマフォの許可を返す

という順番を、ロックを使わずに CAS で安全に行います。

## コード

```kotlin:line-numbers=206
    override fun unlock(owner: Any?) {
        while (true) {
            // Is this mutex locked?
            check(isLocked) { "This mutex is not locked" }
            // Read the owner, waiting until it is set in a spin-loop if required.
            val curOwner = this.owner.value
            if (curOwner === NO_OWNER) continue // <-- ATTENTION, BLOCKING PART HERE
            // Check the owner.
            check(curOwner === owner || owner == null) { "This mutex is locked by $curOwner, but $owner is expected" }
            // Try to clean the owner first. We need to use CAS here to synchronize with concurrent `unlock(..)`-s.
            if (!this.owner.compareAndSet(curOwner, NO_OWNER)) continue
            // Release the semaphore permit at the end.
            release()
            return
        }
    }
```

## 前提知識

- **セマフォ**: 「同時に入れる数」を許可の数で管理する仕組みです。許可が 1 つなら、同時に 1 人しか入れないロックになります。`release()` で許可を返すと、待っている人がいれば起こされます。
- **`owner`**: 誰がロックを持っているかを示すオブジェクトです。`lock(owner)` で記録し、`unlock(owner)` で一致を確かめます。`null` は「持ち主を指定しない」意味です。
- **`NO_OWNER`**: 「持ち主なし」を表す番兵オブジェクトです。`null` は「持ち主を指定しないロック」に使われるので、別の印が必要です。
- **`check(条件) { メッセージ }`**: 条件が偽なら `IllegalStateException` を投げます。使い方の誤りを知らせるために使います。
- **`compareAndSet(期待値, 新しい値)`**: 今の値が期待値と同じなら書き換え、成功したら `true` を返す不可分な操作です。
- **スピン待ち**: ループで値を見続けて、変わるのを待つことです。待ち時間がごく短いと分かっている場合にだけ使います。

## 何をしているか

### 1. ロックされているか確認（209 行目）

ロックされていないのに `unlock` するのは使い方の誤りなので、例外にします。

### 2. 持ち主の記録を読む。まだ書かれていなければ待つ（211〜212 行目）

ロックを取る側（`tryLockImpl`、183〜204 行目）は、まずセマフォの許可を取り、**そのあとで** 持ち主を書き込みます。その間のごく短い時間は「ロックされているのに持ち主が `NO_OWNER`」の状態になります。そこで、持ち主が書き込まれるまでループして待ちます。212 行目のコメントは「ここはブロックする部分」と注意を促しています。

### 3. 持ち主が合っているか確認（214 行目）

`mutex.lock(a)` したのに `mutex.unlock(b)` するのは誤りなので例外にします。`owner == null` で呼んだ場合は確認しません。

### 4. 持ち主の記録を CAS で消す（216 行目）

2 つのコルーチンが同時に `unlock` しても、CAS に成功するのは 1 つだけです。失敗した側はループの最初からやり直し、209 行目か 214 行目で誤りが検出されます。

### 5. 許可を返す（218 行目）

待っているコルーチンがいれば、ここで起こされます。

## ここがすごい

- **順番がすべて**: 「持ち主を消す → 許可を返す」の順番が大事です。逆にすると、許可を返した瞬間に別のコルーチンがロックを取って持ち主を書き込み、それをこちらが `NO_OWNER` で上書きしてしまうかもしれません。取るときは「許可 → 持ち主」、返すときは「持ち主 → 許可」と、ちょうど逆順になっています。
- **既存のセマフォを再利用**: Mutex を一から作らず、許可 1 のセマフォに持ち主の記録を足すだけで実装しています。待ち行列や取り消しの複雑な処理はセマフォ側にまとまっています。
- **誤用を早めに知らせる**: 二重解放や、別の持ち主による解放を `check` で検出します。並行処理のバグは再現しにくいので、その場で例外にするのは大きな助けになります。
- **スピン待ちを限定的に使う**: 持ち主が書き込まれるまでの時間は、ロックを取った側が次の 1 行を実行するまでの一瞬です。だからこそ、ここでは中断ではなくスピン待ちが妥当です。危険な箇所であることをコメントで明示しているのもよい習慣です。

## まとめ

- 2 つの状態（許可と持ち主）を順番に変えるときは、取得と解放で順番を逆にする。
- 既存の仕組み（セマフォ）に少しの状態を足して、新しい仕組み（Mutex）を作れる。
- スピン待ちは、待ち時間がごく短いと分かっている場所にだけ使い、コメントで目立たせる。
