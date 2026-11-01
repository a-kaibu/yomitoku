---
title: "ある処理の間だけ、使う方言を切り替える"
description: "処理の間だけ、スレッドごとの方言を指定する withDialect。ThreadLocal に入れてから、finally で必ず空に戻す。入れ子にすると外側の設定が消える点に注意。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/vendors/DatabaseDialect.kt
lines: [184, 191]
function: "withDialect"
difficulty: 3
tags: [並行処理, 防御的プログラミング, 型システム]
format: 2
---

## ひとことで

`withDialect` は、与えられた処理（`body`）を実行している間だけ、**使う SQL の方言（`DatabaseDialect`）を指定した値に切り替える** 関数です。処理が終われば、必ず元に近い状態に戻します。

Exposed は、データベースごとに SQL の書き方が違うので、「どの方言として SQL を作るか」を、状況に応じて決める必要があります。その指定を一時的に行う道具が、この関数です。

## コード

```kotlin:line-numbers=184
internal fun <T> withDialect(dialect: DatabaseDialect, body: () -> T): T {
    return try {
        explicitDialect.set(dialect)
        body()
    } finally {
        explicitDialect.set(null)
    }
}
```

## 前提知識

- **`ThreadLocal`**: スレッドごとに別々の値を持てる入れ物です。同じ変数名でも、スレッドが違えば中身は独立しています。
- **`finally`**: `try` の処理が正常に終わっても、例外で終わっても、必ず実行される部分です。後片付けに使います。
- **`body: () -> T`**: 引数として渡される、値を返す処理です。`withDialect` は、その結果をそのまま返します。
- **方言（dialect）**: データベースごとの SQL の書き方の違いを表す型です。`DatabaseDialect` がその基底です。
- **`currentDialect`**: 今の処理で使う方言を取り出す値です。このファイルの後ろで定義されていて、`explicitDialect` の値が優先されます。

## 何をしているか

### 1. スレッドの方言を変数に持つ

```kotlin:line-numbers=182
private val explicitDialect = ThreadLocal<DatabaseDialect?>()
```

方言の指定を、スレッドごとに保存する入れ物です。最初は `null`（指定なし）です。

### 2. 指定してから処理を実行する

```kotlin:line-numbers=186
        explicitDialect.set(dialect)
        body()
```

指定された方言を `explicitDialect` に入れてから、処理を実行します。`body()` の結果が、そのまま関数の結果になります。

### 3. 必ず指定を空に戻す

```kotlin:line-numbers=189
        explicitDialect.set(null)
```

`finally` の中で、指定を `null` に戻します。処理の中で例外が起きても、この行は必ず実行されるので、指定が残ったままになりません。

## ここがすごい

- **後片付けが必ず行われる**: `try` と `finally` の組み合わせで、途中で例外が起きても、方言の指定が漏れません。次の処理が、古い指定を引きずることを防ぎます。
- **スレッドごとに独立している**: `ThreadLocal` のおかげで、別のスレッドが同時に別の方言で動いていても、互いに影響しません。
- **処理の結果を素直に返す**: 高階関数として `body` を受け取るので、どんな処理でも、戻り値の型を保ったまま使えます。
- **呼び出しが読みやすい**: `withDialect(方言) { ... }` の形で、「この中だけは、この方言で」と範囲が一目で分かります。

### 注意点: 入れ子にすると、外側の指定が消える

`finally` では、直前の値に戻すのではなく、必ず `null` に戻しています。そのため、`withDialect` を入れ子にすると、内側の処理が終わったときに、外側で指定した方言が消えてしまいます。入れ子で使うときは、この点に注意が必要です。

## まとめ

- スレッドごとの一時的な設定は、`ThreadLocal` に入れて `try` と `finally` で挟むと、確実に後片付けできる。
- 戻す値を「直前の値」ではなく「空」にすると、単純だが、入れ子では外側の設定が消える。
- 高階関数で処理を受け取ると、範囲を明確にしたまま、戻り値の型も保てる。
