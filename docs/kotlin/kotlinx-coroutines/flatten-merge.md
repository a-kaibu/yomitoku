---
title: "並行数 1 なら順番に流すだけに切り替える flattenMerge"
description: "Flow の Flow を並行に集めて 1 本にする flattenMerge。並行数が 1 なら同じ結果になる簡単な flattenConcat に切り替え、余計なチャネルとコルーチンを省く。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Merge.kt
lines: [134, 138]
function: "Flow.flattenMerge"
difficulty: 1
tags: [非同期, 最適化, API設計]
format: 2
---

## ひとことで

`flattenMerge(concurrency)` は、「Flow を流す Flow」（`Flow<Flow<T>>`）を受け取り、**中の Flow を最大 `concurrency` 本まで同時に集めて**、値を 1 本の Flow にまとめる関数です。

本体の仕組み（`ChannelFlowMerge`）はチャネルやセマフォを使う重いものですが、**並行数が 1 なら、ただ順番に 1 本ずつ流すのと同じ** です。そこで、その場合だけ軽い `flattenConcat` に切り替えています。

## コード

```kotlin:line-numbers=134
@ExperimentalCoroutinesApi
public fun <T> Flow<Flow<T>>.flattenMerge(concurrency: Int = DEFAULT_CONCURRENCY): Flow<T> {
    require(concurrency > 0) { "Expected positive concurrency level, but had $concurrency" }
    return if (concurrency == 1) flattenConcat() else ChannelFlowMerge(this, concurrency)
}
```

`flattenConcat` は同じファイルにあり、次の 3 行だけです。

```kotlin:line-numbers=78
public fun <T> Flow<Flow<T>>.flattenConcat(): Flow<T> = flow {
    collect { value -> emitAll(value) }
}
```

## 前提知識

- **`Flow<Flow<T>>`**: 「Flow を値として流す Flow」です。たとえば、検索語ごとに検索結果の Flow を作ると、こういう形になります。
- **flatten（平らにする）**: 入れ子になったものを 1 段にすることです。`[[1, 2], [3]]` を `[1, 2, 3]` にするイメージです。
- **`emitAll(flow)`**: 引数の Flow の値を、すべて下流へ流します。終わるまで次に進みません。
- **`ChannelFlowMerge`**: 内部のクラスで、中の Flow ごとにコルーチンを起動し、チャネルに値を集めます。同時に動く数はセマフォで `concurrency` 本までに制限します。
- **`require(条件) { メッセージ }`**: 条件が偽なら引数エラーの例外を投げます。
- **`@ExperimentalCoroutinesApi`**: まだ実験的な API であるという印です。
- **`if` は式**: `return if (A) B else C` で、条件によって返す値を選べます。

## 何をしているか

### 1. 並行数をチェックする

```kotlin:line-numbers=136
    require(concurrency > 0) { "Expected positive concurrency level, but had $concurrency" }
```

0 以下は意味がないのでエラーにします。

### 2. 1 なら順番に、2 以上なら並行に

```kotlin:line-numbers=137
    return if (concurrency == 1) flattenConcat() else ChannelFlowMerge(this, concurrency)
```

| 並行数 | 使う実装 | 動き |
| --- | --- | --- |
| 1 | `flattenConcat` | 1 本目を最後まで流し、それから 2 本目… |
| 2 以上 | `ChannelFlowMerge` | 最大 n 本を同時に集め、来た順に流す |

`flowOf(flowOf(1, 2), flowOf(3, 4)).flattenMerge(1)` は、必ず `1, 2, 3, 4` の順で流れます。並行数 2 なら、`1, 3, 2, 4` のように混ざることもあります。

## ここがすごい

- **意味が同じなら軽い実装へ**: 並行数 1 のマージは、順番に流すのと結果がまったく同じです。それなのにチャネル・セマフォ・中の Flow ごとのコルーチンを用意するのは無駄です。分岐 1 つで、それらのコストをすべて省いています。
- **`flatMapMerge` にも効く**: `flatMapMerge` は `map(transform).flattenMerge(concurrency)` と書かれているので、この最適化はそのまま受け継がれます。
- **API を 1 つにまとめたまま**: 利用者は「並行数」という 1 つの引数で振る舞いを選ぶだけで、内部でどちらの実装が使われるかを気にする必要はありません。
- **短い関数で大きな効果**: たった 2 行の本体ですが、「入力によって最適な実装を選ぶ」という考え方がよく表れています。

## まとめ

- ある引数の値で結果が単純な処理と同じになるなら、その場合だけ軽い実装に切り替える。
- 高レベルな関数が低レベルな関数の組み合わせで書かれていれば、最適化は自動的に受け継がれる。
- 利用者には 1 つの API を見せ、内部の実装の選択は隠す。
