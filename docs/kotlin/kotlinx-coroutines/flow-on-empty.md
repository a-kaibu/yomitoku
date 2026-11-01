---
title: "1 個も流れなかったときだけ動く onEmpty"
description: "Flow が値を 1 つも流さずに終わったときだけ処理を実行する onEmpty。フラグ 1 つで判定し、代わりの値を安全に流せる collector を用意している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Emitters.kt
lines: [173, 189]
function: "Flow.onEmpty"
difficulty: 2
tags: [非同期, イディオム, 標準ライブラリ]
format: 2
---

## ひとことで

`onEmpty { ... }` は、Flow が **値を 1 つも流さずに終わったときだけ** ブロックを実行する演算子です。
ブロックの中で `emit` すれば、空のときの代わりの値を流せます。たとえば `searchResults.onEmpty { emit("見つかりませんでした") }` のように使います。

実装は「1 個でも流れたか」を覚えるフラグ 1 つですが、代わりの値を流すときに **安全チェック付きの collector** を使い分けている点が学びどころです。

## コード

```kotlin:line-numbers=173
public fun <T> Flow<T>.onEmpty(
    action: suspend FlowCollector<T>.() -> Unit
): Flow<T> = unsafeFlow {
    var isEmpty = true
    collect {
        isEmpty = false
        emit(it)
    }
    if (isEmpty) {
        val collector = SafeCollector(this, currentCoroutineContext())
        try {
            collector.action()
        } finally {
            collector.releaseIntercepted()
        }
    }
}
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`collect { }` で上流の値を受け取り、`emit(値)` で下流へ渡します。
- **`unsafeFlow { ... }`**: Flow を作る内部用のビルダーです。公開版の `flow { }` は「別のコルーチンから `emit` していないか」などを検査しますが、こちらは検査を省いた軽量版です。ライブラリ内部で、自分の実装が正しいと分かっている場合に使います。
- **`SafeCollector`**: その検査を行う collector です。利用者が書いたブロック（ここでは `action`）が `emit` するときは、検査を有効にしておかないと、間違った使い方を見逃してしまいます。
- **`suspend FlowCollector<T>.() -> Unit`**: 「`FlowCollector` を `this` として実行する、一時停止できる関数」の型です。ブロックの中で `emit(...)` と書けるのは、`this` が collector だからです（レシーバ付きラムダ）。
- **`try { } finally { }`**: 例外が起きても起きなくても、`finally` の中を必ず実行する構文です。

## 何をしているか

### 1. フラグを立てておく

```kotlin:line-numbers=176
    var isEmpty = true
```

最初は「空」と仮定します。

### 2. 上流をそのまま流し、1 個でも来たらフラグを倒す

```kotlin:line-numbers=177
    collect {
        isEmpty = false
        emit(it)
    }
```

値が来るたびに `isEmpty = false` にして、そのまま下流へ流します。

### 3. 空だったら、安全な collector で action を実行する

```kotlin:line-numbers=181
    if (isEmpty) {
        val collector = SafeCollector(this, currentCoroutineContext())
        try {
            collector.action()
        } finally {
            collector.releaseIntercepted()
        }
    }
```

`flowOf<String>().onEmpty { emit("なし") }` なら、上流は何も流さないので `isEmpty` は `true` のまま。`SafeCollector` を作って `action` を実行し、`"なし"` が下流へ流れます。
最後に `releaseIntercepted()` で collector が使ったリソースを片付けます。

`flowOf("a").onEmpty { ... }` なら、`"a"` が流れた時点でフラグが倒れ、`action` は呼ばれません。

## ここがすごい

- **普段の道は軽く、ユーザーの道は安全に**: 上流の値を中継する部分はライブラリ自身のコードなので、検査なしの `unsafeFlow` で速く動かします。一方、ユーザーが書いた `action` を動かすときだけ `SafeCollector` を使います。`onStart` にも同じ考え方が使われています。
- **フラグ 1 つで足りる**: 値を数える必要はなく、「1 個でも来たか」だけ分かればいいので `Boolean` 1 つです。
- **後片付けを `finally` で保証**: `action` が例外を投げても、`releaseIntercepted()` は必ず呼ばれます。
- **値を書き換えずに素通し**: 値が来た場合は何も変えずに流すので、`onEmpty` を挟んでも普段の動きにはまったく影響しません。

## まとめ

- 「1 つもなかったら」の判定は、フラグ 1 つで書ける。
- 自分のコードは軽い道で、利用者のコードは検査付きの道で動かすと、速さと安全を両立できる。
- 利用者のコードを呼ぶときは、`finally` で後片付けを保証する。
