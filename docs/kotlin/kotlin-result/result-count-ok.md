---
title: "成功の数を数える countOk"
description: "Result の列の中に成功がいくつあるかを数える countOk。1 行の count に関数参照を渡すだけで、全体の成功数が分かる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [34, 36]
function: "Iterable<Result<V, E>>.countOk"
difficulty: 1
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`countOk()` は、`Result` が並んだ列の中に **成功がいくつあるか** を数えて、その個数を `Int` で返す関数です。値は取り出さず、数だけを返します。

検査の結果を集計して、「100 件中 97 件が成功した」のような数字を出す場面に向いています。

## コード

```kotlin:line-numbers=34
public fun <V, E> Iterable<Result<V, E>>.countOk(): Int {
    return count(Result<V, E>::isOk)
}
```

## 前提知識

- **`count`**: 列の中で、条件を満たす要素の個数を数える標準の関数です。条件を関数で渡すと、その条件に合うものだけを数えます。
- **関数参照 `Result<V, E>::isOk`**: `Result` の `isOk` プロパティを、1 つの関数として渡すための書き方です。値を受け取って真偽を返す関数として扱えます。
- **`isOk`**: その `Result` が成功かどうかを表すプロパティです。
- **拡張関数**: `Iterable<Result<V, E>>` に対して `.countOk()` と呼べるように、既存の型へ関数を足しています。

## 何をしているか

### 分岐の中身

### 本体は 1 行だけ

```kotlin:line-numbers=35
    return count(Result<V, E>::isOk)
```

`count` に「成功かどうかを返す関数」を渡しています。`count` は列の要素を 1 つずつその関数にかけ、`true` になったものの数を数えます。

たとえば、`[Ok, Err, Ok, Ok]` という列では、`isOk` が `true` になるのは 3 個です。そのため `countOk()` は `3` を返します。

## ここがすごい

- **本体が 1 行で済む**: 数えるための変数や `for` ループを書かず、「成功の数」という意味をそのまま表しています。
- **`allOk` や `anyOk` と同じ形**: 同じファイルには `allOk`、`anyOk`、`countErr` などがあり、どれも `isOk` や `isErr` の関数参照を渡す形でそろえられています。覚えるのは 1 つの書き方だけで済みます。
- **値を取り出さない**: 中の値を読み出さないので、大きな値を持つ `Result` でも、数えるだけなら余計なコピーが起きません。
- **空の列は 0 になる**: 要素が 1 つもなければ、数えるものがないので `0` を返します。特別な扱いは要りません。

## まとめ

- `countOk()` は、成功の `Result` が列に何個あるかを `Int` で返す。
- 標準の `count` に `isOk` の関数参照を渡すだけで、1 行で実装されている。
- 同じ形の `countErr()` と組み合わせると、成功と失敗の内訳が分かる。
