---
title: "失敗のときだけ計算する getOrElse"
description: "成功なら値を、失敗ならエラーを受け取って予備の値を作る getOrElse。予備の計算は失敗したときだけ走り、contract で一度だけ呼ばれると宣言している。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Get.kt
lines: [73, 82]
function: "Result.getOrElse"
difficulty: 2
tags: [エラー処理, 関数型, ジェネリクス]
format: 2
---

## ひとことで

`getOrElse` は、結果（Result）が成功なら中の値を、失敗なら **エラーを材料にして作った予備の値** を返す関数です。`getOr` と似ていますが、予備の値を先に用意せず、必要になったときだけ計算します。

## コード

```kotlin:line-numbers=73
public inline infix fun <V, E> Result<V, E>.getOrElse(transform: (E) -> V): V {
    contract {
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk -> value
        else -> transform(error)
    }
}
```

## 前提知識

- **`getOr` との違い**: `getOr(default)` は、予備の値を呼び出し前に用意して渡します。`getOrElse { ... }` は、関数（ラムダ）を渡しておき、失敗したときだけそれを実行します。
- **ラムダを引数に取る関数**: `transform: (E) -> V` は、エラー `E` を受け取って値 `V` を返す関数です。呼び出し側が `{ error -> ... }` と書けます。
- **`inline`**: この関数は呼び出し箇所にコードが展開されます。ラムダも展開されるので、ラムダを包むための余分なオブジェクトが作られません。
- **`contract`**: コンパイラに「この関数の中で、引数の関数をどう呼ぶか」を伝える宣言です。実行時の動作は変えず、型推論や変数の扱いを賢くするためのヒントです。
- **`callsInPlace(transform, InvocationKind.AT_MOST_ONCE)`**: 「`transform` は、呼ばれるとしても最大 1 回だけ、その場で呼ばれる」という約束です。

## 何をしているか

### 分岐の中身

```kotlin:line-numbers=79
        isOk -> value
```

成功なら、中の値をそのまま返します。ラムダは一切実行されません。

```kotlin:line-numbers=80
        else -> transform(error)
```

失敗なら、中のエラーを `transform` に渡して、その結果を返します。エラーの内容を見て予備の値を決めたい場面で役立ちます。たとえば、エラーの種類によって既定値を変える、といったことができます。

### contract の意味

```kotlin:line-numbers=75
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
```

この宣言のおかげで、コンパイラは `transform` が 1 回以下しか呼ばれないと知ります。そのため、ラムダの中で外側の `val` を代入して初期化する、といった書き方も安全に扱われます。実行の動きはこの 1 行で変わりません。

## ここがすごい

- **予備の計算を遅らせられる**: 予備の値を作るのが重い処理でも、失敗したときにしか走りません。成功が続く限り、無駄な計算はゼロです。
- **エラーの情報を使える**: `getOr` は失敗の内容を捨てましたが、`getOrElse` は `transform` に `error` を渡すので、その情報をもとに予備の値を決められます。
- **`inline` と `contract` の組み合わせ**: ラムダを展開するので実行時のコストが小さく、`contract` によって呼び出し回数もコンパイラに伝わります。性能と型の両方を意識した作りです。
- **`infix` で読みやすい**: `result getOrElse { ... }` と書けるので、「失敗したらこうする」という文章に近い形になります。

## まとめ

- `getOrElse` は、失敗のときだけエラーを使って予備の値を作る。
- 予備の計算は必要になったときだけ実行されるので、重い処理でも無駄がない。
- `inline` と `contract` により、実行時のコストを増やさずに呼び出しの意味をコンパイラに伝えている。
