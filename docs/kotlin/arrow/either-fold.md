---
title: "左と右を同じ型に揃える Either.fold"
description: "Either の左か右のどちらか一方だけを、それぞれの関数で変換し、同じ型の値にまとめる fold。contract で、どちらの関数がどの場合に呼ばれるかをコンパイラに伝えている。"
language: kotlin
project: "Arrow"
repo: https://github.com/arrow-kt/arrow
license: Apache-2.0
copyright: "Copyright (C) 2017 The Arrow Authors"
commit: "e7732869702053fa103ffcb173a3b35d99b62530"
file: arrow-libs/core/arrow-core/src/commonMain/kotlin/arrow/core/Either.kt
lines: [596, 606]
function: "Either.fold"
difficulty: 1
tags: [関数型, エラー処理, ジェネリクス]
format: 2
---

## ひとことで

Arrow の `Either<A, B>` は、**左（`Left`、ふつうは失敗）か右（`Right`、ふつうは成功）のどちらか** を表す型です。`fold` は、2 つの関数を受け取り、今入っているほうだけを変換して、**同じ型 `C` の値** にまとめます。

たとえば `either.fold({ "失敗: $it" }, { "成功: $it" })` は、どちらの場合も文字列を返します。あとで文字列として表示する処理を、1 か所で書けます。

## コード

```kotlin:line-numbers=596
  public inline fun <C> fold(ifLeft: (left: A) -> C, ifRight: (right: B) -> C): C {
    contract {
      callsInPlace(ifLeft, InvocationKind.AT_MOST_ONCE)
      callsInPlace(ifRight, InvocationKind.AT_MOST_ONCE)
      (this@Either is Left) holdsIn ifLeft
      (this@Either is Right) holdsIn ifRight
    }
    return when (this) {
      is Right -> ifRight(value)
      is Left -> ifLeft(value)
    }
```

## 前提知識

- **`Either`**: 2 種類の値のどちらか一方を持つ型です。`Left` と `Right` の 2 つの場合があり、どちらか片方だけが入ります。
- **`sealed` なクラス**: 型の種類が決まっていて、`when` で全部の場合を書くと、コンパイラが抜けを確かめてくれる仕組みです。
- **`inline fun`**: 呼び出し箇所に展開される関数です。引数の関数も展開されます。
- **`contract`**: 関数の振る舞いをコンパイラに伝える宣言です。`holdsIn` は、「ある関数の中では、この値が特定の型である」と伝えます。
- **`when (this)`**: 今の値の種類によって、分岐する書き方です。

## 何をしているか

### 1. 呼び出しの回数と、型の情報を伝える

```kotlin:line-numbers=598
      callsInPlace(ifLeft, InvocationKind.AT_MOST_ONCE)
      callsInPlace(ifRight, InvocationKind.AT_MOST_ONCE)
```

それぞれの関数は、最大 1 回だけ呼ばれると伝えます。

```kotlin:line-numbers=600
      (this@Either is Left) holdsIn ifLeft
      (this@Either is Right) holdsIn ifRight
```

さらに、`ifLeft` の中では今の値が `Left` である、`ifRight` の中では `Right` である、と伝えています。だから、呼び出し側は中で型を調べなくても、そのまま値を使えます。

### 2. 今の値の種類で、分かれる

```kotlin:line-numbers=603
    return when (this) {
      is Right -> ifRight(value)
      is Left -> ifLeft(value)
    }
```

`Right` なら `ifRight` に、`Left` なら `ifLeft` に、値を渡して結果を返します。`when` に書かれた 2 つの場合で全部なので、どちらか一方だけが呼ばれます。

## ここがすごい

- **1 つの型に畳む**: 2 つの場合の結果を、同じ型 `C` にそろえるので、後の処理は 1 つの形で済みます。たとえば、失敗も成功も表示用の文字列にしてから、画面に出せます。
- **型を調べる手間を省く**: `contract` によって、関数の中で値の型が確定すると分かるので、呼び出し側は `is` で確かめる必要がありません。
- **抜けがない**: `Either` が `sealed` なので、`when` に 2 つの場合を書けば、コンパイラが抜けを見つけてくれます。新しい場合が増えたときも、気づけます。
- **変換は 1 つだけ呼ばれる**: どちらか片方の関数だけが呼ばれるので、副作用のある処理を書いても、2 回実行される心配がありません。

## まとめ

- 2 つの場合を 1 つの型に畳むには、`fold` で両方の関数を渡す。
- `contract` で型の情報を伝えると、中で型を調べずに済む。
- `sealed` な型で `when` を書くと、場合の抜けをコンパイラが見つけてくれる。
