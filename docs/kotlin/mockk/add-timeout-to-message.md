---
title: "待ち時間つきの検証が失敗したとき、メッセージに待った時間を足す"
description: "mockk の待ち時間つき検証の結果に、失敗したときだけ「timeout = ○ ms」を付け足す addTimeoutToMessage。成功の結果はそのまま作り直す。"
language: kotlin
project: "MockK"
repo: https://github.com/mockk/mockk
license: Apache-2.0
copyright: "Copyright 2017 Oleksiy Pylypenko and MockK contributors"
commit: "c2fb66f841973e725b367650e69c4bac9babba20"
file: modules/mockk/src/commonMain/kotlin/io/mockk/impl/verify/TimeoutVerifier.kt
lines: [61, 65]
function: "VerificationResult.addTimeoutToMessage"
difficulty: 1
tags: [防御的プログラミング, 型システム, 文字列処理]
format: 2
---

## ひとことで

`addTimeoutToMessage` は、mockk の **待ち時間つき検証（`verify(timeout = ...)`）** の結果を作り直す関数です。検証が失敗したときは、メッセージの後ろに「(timeout = 1000 ms)」のような待ち時間を付けます。成功したときは、内容を変えずに同じ意味の結果を返します。

mockk は、テストの中で「このメソッドが呼ばれたか」を確かめるライブラリです。非同期の処理では、少し待ってから確かめたいことがあり、そのときに使う結果がこの関数で作られます。

## コード

```kotlin:line-numbers=61
private fun VerificationResult.addTimeoutToMessage(timeout: Long) =
    when (this) {
        is VerificationResult.OK -> VerificationResult.OK(verifiedCalls)
        is VerificationResult.Failure -> VerificationResult.Failure("$message (timeout = $timeout ms)")
    }
```

## 前提知識

- **`sealed` クラス**: 取りうる種類を、決まった少数のクラスだけに限定する書き方です。ここでは `VerificationResult` の中に、`OK` と `Failure` の 2 種類があります。
- **`when (this)` と `is`**: 値の型を調べて、その型ごとに処理を分ける書き方です。`is` は、型が一致するかを調べます。
- **文字列テンプレート**: `"$message (timeout = $timeout ms)"` のように、変数の値を文字列に埋め込めます。
- **拡張関数**: `VerificationResult` という既存の型に、関数を追加する書き方です。`this` が、呼び出した結果そのものを指します。
- **`timeout`**: 検証を待つ最大の時間（ミリ秒）です。この関数は、その値をメッセージに添えるためだけに使います。

## 何をしているか

### 1. 成功のときは内容をそのまま作り直す

```kotlin:line-numbers=63
        is VerificationResult.OK -> VerificationResult.OK(verifiedCalls)
```

検証が成功していれば、確認できた呼び出し（`verifiedCalls`）を持つ、同じ成功の結果を作ります。メッセージを付ける対象がないので、そのまま返すのと同じ意味です。

### 2. 失敗のときはメッセージを付け足す

```kotlin:line-numbers=64
        is VerificationResult.Failure -> VerificationResult.Failure("$message (timeout = $timeout ms)")
```

失敗していれば、元のメッセージの後ろに待ち時間を付けて、新しい失敗の結果を作ります。たとえば「Verification failed」は「Verification failed (timeout = 1000 ms)」になります。

## ここがすごい

- **変えるものと変えないものを分ける**: 成功と失敗を `when` で分けて、失敗のときだけ文字を足します。成功の結果を勝手に変えないので、安心して使えます。
- **`when` の網羅性**: `sealed` クラスなので、`OK` と `Failure` の 2 つを書けば、ほかの場合を気にせずに済みます。新しい種類が増えたら、コンパイラが書き忘れを教えてくれます。
- **待ち時間を表示に残す**: 失敗したとき、なぜ待っても見つからなかったのか、どのくらい待ったのかが分かります。テストの失敗の原因を読みやすくする、細かい工夫です。
- **短い関数に役割を絞る**: 検証の仕組みそのものは別の場所にあり、ここは結果の見た目だけを担当しています。

## まとめ

- 結果の種類ごとに `when` で分けると、成功と失敗の扱いを明確に書ける。
- `sealed` クラスなら、すべての種類を書いたかをコンパイラが確かめてくれる。
- 失敗の情報に、待ち時間などの文脈を足すと、原因を読み取りやすくなる。
