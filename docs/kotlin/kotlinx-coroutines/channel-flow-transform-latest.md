---
title: "新しい値が来たら前の処理を取り消す transformLatest"
description: "mapLatest や flatMapLatest の土台。値が来るたびに前の処理のコルーチンを取り消して終わるのを待ち、新しい処理を UNDISPATCHED で即座に始める。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Merge.kt
lines: [19, 34]
function: "ChannelFlowTransformLatest.flowCollect"
difficulty: 3
tags: [非同期, 並行処理, 設計パターン]
---

## ひとことで

`transformLatest` は、Flow に新しい値が来たら、**前の値の処理がまだ途中でも取り消して**、新しい値の処理を始める演算子です。
検索ボックスで文字を打つたびに検索を始め、次の文字が打たれたら前の検索は捨てる、といった用途にぴったりです。`mapLatest` や `flatMapLatest` もこの上に作られています。

`flowCollect` はその本体で、たった十数行ですが、「取り消して、終わるのを待ってから、次を始める」という順番がよく考えられています。

## コード

```kotlin:line-numbers=19
    override suspend fun flowCollect(collector: FlowCollector<R>) {
        assert { collector is SendingCollector } // So cancellation behaviour is not leaking into the downstream
        coroutineScope {
            var previousFlow: Job? = null
            flow.collect { value ->
                previousFlow?.apply {
                    cancel(ChildCancelledException())
                    join()
                }
                // Do not pay for dispatch here, it's never necessary
                previousFlow = launch(start = CoroutineStart.UNDISPATCHED) {
                    collector.transform(value)
                }
            }
        }
    }
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`collector.transform(value)` で、利用者が書いた変換処理を実行します（中で `emit` すれば下流へ流れる）。
- **`coroutineScope { ... }`**: 子コルーチンを起動できる範囲を作り、子が全部終わるまで待ちます。
- **`launch { ... }`**: 子コルーチンを起動し、その `Job`（取り消しや完了待ちに使うオブジェクト）を返します。
- **`CoroutineStart.UNDISPATCHED`**: 起動したコルーチンを、スレッドの切り替えを待たずに **その場ですぐ** 動かし始める指定です。最初の中断までは呼び出し元のスレッドで動きます。
- **`cancel(...)` と `join()`**: `cancel` は取り消しを依頼するだけで、すぐには止まりません。`join()` で、本当に終わるまで待ちます。
- **`previousFlow?.apply { ... }`**: `?.` は「`null` でなければ」、`apply` は「その値を `this` にしてブロックを実行する」です。前の処理があれば、それを取り消して待ちます。
- **`SendingCollector`**: 値をチャネルに送るだけの collector です。

## 何をしているか

### 1. 値が来るたびに、前の処理を取り消して待つ（23〜27 行目）

`previousFlow` は、前の値の処理をしている子コルーチンです。あれば取り消し、終わるまで `join()` で待ちます。

### 2. 新しい処理をすぐ始める（29〜31 行目）

新しい子コルーチンを `UNDISPATCHED` で起動し、`previousFlow` に覚えておきます。

`"a"`、`"ab"`、`"abc"` が素早く来て、それぞれ 1 秒かかる検索をする場合:

1. `"a"` → 検索開始（コルーチン 1）
2. `"ab"` → コルーチン 1 を取り消し、終わるのを待つ → 検索開始（コルーチン 2）
3. `"abc"` → コルーチン 2 を取り消して待つ → 検索開始（コルーチン 3）
4. 上流が終わる → `coroutineScope` がコルーチン 3 の完了を待つ → `"abc"` の結果だけが流れる

## ここがすごい

- **取り消してから「待つ」**: `cancel` だけで次を始めると、前の処理がまだ後始末中で、古い結果を `emit` してしまうかもしれません。`join()` で完全に終わるのを待つので、下流に届く値の順番が崩れません。
- **UNDISPATCHED で無駄な待ちを省く**: 28 行目のコメントの通り、ここでスレッドの切り替えは必要ありません。普通に `launch` すると、新しいコルーチンが動き出すまでに一度順番待ちが入ります。その場で動かし始めることで、すぐに処理が進みます。
- **最後の値は必ず処理される**: 上流が終わっても、`coroutineScope` が最後の子の完了を待つので、最後の値の処理が途中で捨てられることはありません。
- **取り消しを下流に漏らさない**: 20 行目の `assert` は、下流がチャネル経由の `SendingCollector` であることを確かめています。子コルーチンの取り消しが、下流の collector に直接影響しないようにするためです。

## まとめ

- 「新しい値が来たら前の処理を捨てる」は、前の Job を取り消して `join()` してから次を起動する形で書ける。
- 取り消しは依頼にすぎないので、順番を守りたいなら完了を待つ。
- すぐ動かしたい子コルーチンは `UNDISPATCHED` で起動すると、順番待ちを省ける。
