---
title: "並べた結果から成功の値だけ集める valuesOf"
description: "任意の個数の Result を並べて渡し、成功の値だけをリストにして返す valuesOf。中身は既存の filterOk に委ねている。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [308, 310]
function: "valuesOf"
difficulty: 1
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`valuesOf()` と `errorsOf()` は、いくつでも並べて渡せる `Result` の引数から、**成功の値だけ** または **失敗のエラーだけ** を取り出して、リストにして返す関数です。

リストを先に作らなくても、`valuesOf(a, b, c)` のように直接並べて書けるのが特徴です。

## コード

```kotlin:line-numbers=308
public fun <V, E, R : Result<V, E>> valuesOf(vararg results: R): List<V> {
    return results.asIterable().filterOk()
}
```

## 前提知識

- **可変長引数 `vararg`**: 引数を好きな個数、カンマで並べて渡せる指定です。関数の中では配列のように扱えます。
- **`results.asIterable()`**: 可変長引数を、列（Iterable）として扱えるように変換する関数です。
- **`filterOk()` と `filterErr()`**: 列の中から成功の値だけ、または失敗のエラーだけを、リストとして取り出す関数です。
- **`R : Result<V, E>`**: 引数の型 `R` が `Result<V, E>` の仲間であることを表す制約です。成功と失敗の型を、引数側から決められます。

## 何をしているか

### 成功の値だけを集める

```kotlin:line-numbers=309
    return results.asIterable().filterOk()
```

並べて渡された `Result` を列にして、成功のものの値だけをリストにします。元の並び順は保たれます。

### 失敗版との対応

失敗のエラーだけを集める `errorsOf` も同じ形で、中身は `filterErr()` を呼ぶだけです。この記事では成功の側を詳しく見ました。

## ここがすごい

- **書き方が自然になる**: 「この 3 つのうち、成功したものだけ欲しい」を、`valuesOf(a, b, c)` と 1 行で書けます。リストを作ってから渡す手間がありません。
- **中身の処理を再利用する**: 本体は、既存の `filterOk()` と `filterErr()` を呼ぶだけです。同じ処理を二重に書かず、修正も 1 か所で済みます。
- **順番が保たれる**: 結果のリストは、引数の並び順のままです。どの呼び出しが成功したかを、順番に追えます。
- **Haskell の `lefts` と `rights` が元**: 同じ考え方を、Result の成功と失敗で表しています。関数型の言語で慣れ親しまれた関数の名前が、そのまま使われています。

## まとめ

- `valuesOf` は、引数の中の成功の値を、リストで返す。
- `errorsOf` は、引数の中の失敗のエラーを、リストで返す。
- どちらも既存の `filterOk` と `filterErr` に任せているので、同じ処理を重複させていない。
