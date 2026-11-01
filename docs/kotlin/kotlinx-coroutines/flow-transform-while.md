---
title: "「流す」と「続ける」を 1 つのブロックで決める transformWhile"
description: "値ごとに好きなだけ emit しつつ、戻り値で続けるかを決める transformWhile。利用者が collector を触るので、内部用の軽い Flow ではなく検査付きの flow を選んでいる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Limit.kt
lines: [112, 120]
function: "Flow.transformWhile"
difficulty: 2
tags: [非同期, API設計, 標準ライブラリ]
---

## ひとことで

`transformWhile { value -> ... }` は、Flow の値ごとにブロックを呼び、ブロックの中で **好きな数だけ `emit`** でき、さらにブロックの **戻り値で「まだ続けるか」を決める** 演算子です。
`takeWhile` と違い、「条件を満たさなかった最初の値」も流してから止める、といったことができます。

```kotlin
flow.transformWhile { progress ->
    emit(progress)          // 進捗を流す
    !progress.isDone        // 完了したら止める（完了の値も流れる）
}
```

## コード

```kotlin:line-numbers=112
public fun <T, R> Flow<T>.transformWhile(
    transform: suspend FlowCollector<R>.(value: T) -> Boolean
): Flow<R> =
    safeFlow { // Note: safe flow is used here, because collector is exposed to transform on each operation
        // This return is needed to work around a bug in JS BE: KT-39227
        return@safeFlow collectWhile { value ->
            transform(value)
        }
    }
```

`safeFlow` は、このファイルの 10 行目で `flow` を別名で読み込んだもの、`collectWhile` は 123〜140 行目の内部関数です。

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`emit(値)` で下流へ流します。
- **`suspend FlowCollector<R>.(value: T) -> Boolean`**: 「collector を `this` にして、値を受け取り、真偽値を返す、一時停止できる関数」の型です。`this` が collector なので、ブロックの中で `emit` が書けます。
- **`collectWhile { ... }`**: ブロックが `true` を返す間は値を受け取り続け、`false` を返したら収集を打ち切る内部関数です。
- **別名インポート（`import ... as ...`）**: このファイルは、10 行目で検査付きの `flow` を `safeFlow` として、11 行目で検査なしの `unsafeFlow` を `flow` として読み込んでいます。つまり、このファイルで単に `flow { }` と書くと検査なし版になります。
- **`return@safeFlow`**: ラベル付きの return です。

## 何をしているか

### 1. 検査付きの Flow を作る（115 行目）

コメントの通り、ブロックの中で利用者が collector（`emit`）を直接使うので、検査付きの `safeFlow` を使っています。

### 2. collectWhile にブロックをそのまま渡す（117〜119 行目）

`collectWhile` は「続けるなら `true`」という約束なので、利用者のブロックの戻り値をそのまま返すだけです。ブロックの中の `this` は、`safeFlow` の collector です。

進捗 `10%`, `50%`, `100%（完了）`, `（その後の値）` が来る場合:

- `10%` → 流す、`true`（続ける）
- `50%` → 流す、`true`
- `100%` → 流す、`false`（止める）
- その後の値は作られない

### 3. JS のバグ回避（116 行目）

`return@safeFlow` は本来なくてよいものですが、JavaScript 向けのコンパイラのバグ（KT-39227）を避けるために付けられています。

## ここがすごい

- **2 つの判断を 1 つのブロックに**: 「何を流すか」と「続けるか」を同じブロックで決められるので、「最後の 1 個を含めて止める」「止める前に別の値を流す」など、`takeWhile` では書けない処理が書けます。
- **既存の部品をそのまま使う**: 打ち切りの仕組みは `collectWhile` に任せ、自分はブロックを渡すだけです。新しいロジックをほとんど書かずに、強力な演算子を作っています。
- **安全な Flow を意図して選ぶ**: このファイルでは軽い `unsafeFlow` が既定ですが、利用者が `emit` するときだけ、あえて検査付きを選んでいます。115 行目のコメントが、その判断の理由を残しています。
- **回避策にも理由を書く**: 不自然な `return@safeFlow` に、バグ番号付きのコメントがあります。将来バグが直ったときに消せるよう、理由を残しておくのは大切な習慣です。

## まとめ

- 「流す内容」と「続けるか」を同じブロックで決めさせると、柔軟な演算子になる。
- 利用者のコードが collector に触れる場所では、検査付きの Flow を使う。
- 不自然なコードには、理由（バグ番号など）をコメントで残す。
