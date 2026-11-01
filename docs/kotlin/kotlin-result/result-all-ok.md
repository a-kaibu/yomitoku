---
title: "全部が成功かを一行で調べる allOk"
description: "Result の列のすべてが成功かを調べる allOk。関数参照 Result::isOk を all に渡すだけで書ける短い関数。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [6, 8]
function: "Iterable<Result<V, E>>.allOk"
difficulty: 1
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`allOk()` は、`Result` の列の **すべてが成功しているか** を調べる関数です。全部成功なら `true`、1 つでも失敗があれば `false` を返します。

値は取り出さず、真偽だけを返すので、「すべて問題なかったか」を確認するだけの場面に向いています。

## コード

```kotlin:line-numbers=6
public fun <V, E> Iterable<Result<V, E>>.allOk(): Boolean {
    return all(Result<V, E>::isOk)
}
```

## 前提知識

- **`all`**: 列のすべての要素が条件を満たすかを調べる標準の関数です。1 つでも満たさなければ、そこで `false` を返します。
- **関数参照 `::`**: 関数やプロパティを、値として渡すための書き方です。`Result<V, E>::isOk` は、「`Result` の `isOk` プロパティ」を指しています。
- **`isOk`**: その `Result` が成功かどうかを返すプロパティです。
- **`Iterable<Result<V, E>>` の拡張関数**: `Result` が並んだ任意の集まりに対して、`.allOk()` と呼べるようにしています。

## 何をしているか

### 分岐の中身

```kotlin:line-numbers=7
    return all(Result<V, E>::isOk)
```

この 1 行が関数の本体です。`all` に「要素が成功かどうか」を調べる関数を渡しています。

`all` は、要素を 1 つずつ `isOk` にかけます。`false` が出た時点で、残りを見ずに `false` を返します。全部が `true` なら、最後まで見て `true` を返します。

たとえば、3 つの処理の結果が `[Ok, Ok, Err]` なら、3 番目で `false` が決まります。`[Ok, Ok, Ok]` なら、3 つすべてを見て `true` になります。

## ここがすごい

- **本体が 1 行で済む**: `for` ループと `if` を書かずに、「全部成功か」という意味をそのまま書けています。読んですぐ意図が分かります。
- **関数参照を渡す**: `{ it.isOk }` と書く代わりに `Result<V, E>::isOk` を渡しています。どの型のプロパティを使うかが、型引数でも明示されていて、読み違いが起きにくくなっています。
- **途中で止まる**: 失敗が見つかった時点で調べるのを止めるので、大きなリストでも無駄がありません。
- **`allErr` と対になる**: 同じファイルには `allErr()` もあり、全部が失敗かどうかを同じ形で調べられます。

## まとめ

- `allOk()` は、すべての `Result` が成功かを真偽で返す。
- `all` と関数参照を組み合わせると、ループを書かずに全体の判定が 1 行になる。
- 途中で失敗が見つかれば、残りを調べずに `false` が決まる。
