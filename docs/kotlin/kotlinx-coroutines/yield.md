---
title: "他のコルーチンに順番を譲る yield と Unconfined の見抜き方"
description: "実行中のコルーチンを一度止めて、同じスレッドの他のコルーチンに順番を回す yield。ディスパッチャの種類を試しに投げて確かめるテクニックが使われている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/Yield.kt
lines: [145, 166]
function: "yield"
difficulty: 3
tags: [非同期, 並行処理, 低レイヤ]
---

## ひとことで

`yield()` は、今動いているコルーチンが **いったん実行を譲り、同じスレッドで待っている他のコルーチンに順番を回す** 関数です。
1 本のスレッドで重い計算をするコルーチンが、ときどき `yield()` を呼ぶことで、他のコルーチンも動けるようになります。また、取り消されていれば例外を投げるので、取り消しの確認ポイントにもなります。

内部では、コルーチンを動かしているディスパッチャ（どのスレッドで動かすかを決める係）の種類によって処理を変えています。特に **Unconfined という特殊なディスパッチャを、試しに処理を投げて見抜く** 部分がおもしろい関数です。

## コード

```kotlin:line-numbers=145
public suspend fun yield(): Unit = suspendCoroutineUninterceptedOrReturn sc@ { uCont ->
    val context = uCont.context
    context.ensureActive()
    val cont = uCont.intercepted() as? DispatchedContinuation<Unit> ?: return@sc Unit
    if (cont.dispatcher.safeIsDispatchNeeded(context)) {
        // this is a regular dispatcher -- do simple dispatchYield
        cont.dispatchYield(context, Unit)
    } else {
        // This is either an "immediate" dispatcher or the Unconfined dispatcher
        // This code detects the Unconfined dispatcher even if it was wrapped into another dispatcher
        val yieldContext = YieldContext()
        cont.dispatchYield(context + yieldContext, Unit)
        // Special case for the unconfined dispatcher that can yield only in existing unconfined loop
        if (yieldContext.dispatcherWasUnconfined) {
            // Means that the Unconfined dispatcher got the call, but did not do anything.
            // See also code of "Unconfined.dispatch" function.
            return@sc if (cont.yieldUndispatched()) COROUTINE_SUSPENDED else Unit
        }
        // Otherwise, it was some other dispatcher that successfully dispatched the coroutine
    }
    COROUTINE_SUSPENDED
}
```

## 前提知識

- **ディスパッチャ（Dispatcher）**: コルーチンをどのスレッドで動かすかを決める係です。`Dispatchers.Default`（計算用スレッドの集まり）や `Dispatchers.Main`（画面のスレッド）があります。`Dispatchers.Unconfined` は特殊で、「今いるスレッドでそのまま動かす」ディスパッチャです。
- **継続（Continuation）**: 一時停止したコルーチンの「続き」を表すオブジェクトです。`uCont` はまだディスパッチャが付いていない素の継続、`intercepted()` はディスパッチャ付きの継続です。
- **`suspendCoroutineUninterceptedOrReturn`**: 低レベルの中断の仕組みです。ブロックが `COROUTINE_SUSPENDED` を返すと本当に中断し、普通の値を返すと中断せずにそのまま続行します。
- **`as?`**: 安全なキャストです。型が違えば例外ではなく `null` になります。`?: return@sc Unit` と組み合わせて、「違う型ならすぐ終了」を表しています。
- **`context + yieldContext`**: コルーチンのコンテキスト（設定の集まり）に要素を足して、新しいコンテキストを作ります。

## 何をしているか

### 1. 取り消されていないか確認（146〜147 行目）

取り消されていれば、ここで例外になります。

### 2. ディスパッチャが付いていなければ何もしない（148 行目）

ディスパッチャ付きの継続でなければ、譲る相手がいないので、中断せずに `Unit` を返して続行します。

### 3. 普通のディスパッチャなら、後ろに並び直す（149〜151 行目）

「ディスパッチが必要」と答えるディスパッチャ（`Default` など）なら、`dispatchYield` で自分を待ち行列の最後に入れ直します。これで他のコルーチンが先に動きます。

### 4. 必要ないと言うディスパッチャなら、試しに投げてみる（152〜164 行目）

`Unconfined` や「すぐ実行」系のディスパッチャは「ディスパッチ不要」と答えます。どちらなのかを見分けるため、目印の `YieldContext` をコンテキストに入れて `dispatchYield` してみます。

- `Unconfined` は、目印を見つけると `dispatcherWasUnconfined = true` にするだけで何もしません（`Unconfined.dispatch` がそう実装されています）。この場合は、Unconfined 専用のイベントループの中でだけ譲れるので、`yieldUndispatched()` に任せます。
- それ以外のディスパッチャは普通にディスパッチしてくれるので、そのまま中断します。

### 5. 中断する（165 行目）

## ここがすごい

- **「聞いても分からないことは、試して確かめる」**: Unconfined は他のディスパッチャに包まれていることがあり、型を調べても見分けられません（154 行目のコメント）。そこで目印付きで処理を投げてみて、Unconfined だけが目印に反応する、という仕掛けにしています。
- **余計な中断をしない**: 譲る相手がいない場合（148 行目）は中断せずに続行するので、`yield()` を呼んでもほぼコストがかかりません。
- **取り消しの確認を兼ねる**: どのディスパッチャでも、最初に `ensureActive()` で取り消しを確かめます。長いループの中で `yield()` を呼ぶと、取り消しに素早く反応できるようになります。
- **低レベルの API で無駄を省く**: 普通の `suspendCoroutine` を使うと、中断しない場合にも余計な処理が入ります。`OrReturn` 版を使うことで、「中断するかしないか」をその場で選べます。

## まとめ

- `yield()` は、同じスレッドの他のコルーチンに順番を譲り、取り消しも確認する。
- 型で見分けられない相手は、目印付きで実際に処理を投げて反応を見ると見分けられる。
- 中断が不要な場合は中断しない、という分岐を入れると、軽い関数になる。
