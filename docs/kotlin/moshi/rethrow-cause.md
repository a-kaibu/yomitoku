---
title: "リフレクションが投げた本当の例外を、取り出して投げ直す"
description: "リフレクションの呼び出しで包まれた例外を取り出し、実行時例外や Error はそのまま、それ以外は実行時例外に包んで投げ直す rethrowCause。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/internal/Util.kt
lines: [159, 164]
function: "InvocationTargetException.rethrowCause"
difficulty: 2
tags: [エラー処理, 型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`rethrowCause` は、Java のリフレクション（プログラムの実行中にクラスやメソッドを呼び出す仕組み）で起きた例外を、**中身の本当の例外に取り替えて投げ直す** 関数です。

リフレクションでメソッドを呼ぶと、その中で起きた例外は `InvocationTargetException` という箱に包まれます。そのままでは、利用者は「箱の中で何が起きたか」を見つけにくくなります。この関数は箱を外して、本当の例外を投げ直します。

## コード

```kotlin:line-numbers=159
internal fun InvocationTargetException.rethrowCause(): RuntimeException {
  val cause = targetException
  if (cause is RuntimeException) throw cause
  if (cause is Error) throw cause
  throw RuntimeException(cause)
}
```

## 前提知識

- **リフレクション**: プログラムの実行中に、クラスやメソッドを名前から探して呼び出す仕組みです。Moshi は、クラスの情報をもとに JSON を組み立てるときに、これを使います。
- **`InvocationTargetException`**: リフレクションで呼び出したメソッドの中で例外が起きたとき、その例外を包んで投げられる例外です。`targetException` で中身を取り出せます。
- **RuntimeException と Error**: どちらも、いちいち `try` で囲まなくてもよい種類の例外です。`RuntimeException` はプログラムのミス、`Error` は JVM の深刻な問題などを表します。
- **チェック例外**: `IOException` などのように、呼び出し側で必ず処理することを求められる例外です。Kotlin では、この区別を強制しません。
- **`throw` は式ではなく文として使う**: `throw` は値を返さず、そこで処理を止めます。`if (...) throw x` の形で、条件つきの投げ直しができます。

## 何をしているか

### 1. 包まれた中身を取り出す

```kotlin:line-numbers=160
  val cause = targetException
```

`InvocationTargetException` の中に入っている、本当の例外を取り出します。

### 2. 実行時例外と Error は、そのまま投げ直す

```kotlin:line-numbers=161
  if (cause is RuntimeException) throw cause
  if (cause is Error) throw cause
```

中身が `RuntimeException` か `Error` なら、箱を外した状態で、そのまま投げ直します。どちらも、呼び出し側が本来受け取るべき種類の例外なので、型を変えずに伝えます。

### 3. それ以外は、実行時例外に包んで投げる

```kotlin:line-numbers=163
  throw RuntimeException(cause)
```

中身がチェック例外などの場合は、`RuntimeException` に包んで投げます。この関数の戻り値の型は `RuntimeException` ですが、実際には必ず `throw` で終わるので、値が返ることはありません。

## ここがすごい

- **箱を外して、本当の原因を見せる**: 利用者は、リフレクションの内部の例外ではなく、実際に起きた問題を直接見ることができます。エラーの読み取りやすさが大きく改善します。
- **種類によって扱いを分ける**: 実行時例外と Error は、型を保ったまま渡し、それ以外だけを包みます。例外の種類を無理に変えないので、呼び出し側の `catch` が意図どおりに働きます。
- **原因を失わない**: 包むときも、元の例外を `RuntimeException` の原因として渡しています。どの場合でも、元の例外の情報が残ります。
- **1 か所で扱う**: 同じ処理が Moshi のいくつかの場所で繰り返されるので、関数にまとめておくと、扱いを揃えられます。

## まとめ

- リフレクションの例外は、箱の中身を取り出して投げ直すと、本当の原因が分かりやすい。
- 例外の種類によって、そのまま投げるか包むかを分けると、呼び出し側の `catch` が正しく働く。
- 包むときは元の例外を原因として渡すと、情報を失わない。
