---
title: "完了していれば結果を返し、そうでなければ null にする"
description: "非同期の結果（Deferred）を、完了しているときだけ取り出す getCompletedOrNull。まだ終わっていなければ待たずに、例外を使って null を返す。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/commonMain/kotlin/coil3/util/coroutines.kt
lines: [10, 16]
function: "Deferred.getCompletedOrNull"
difficulty: 2
tags: [並行処理, 防御的プログラミング, エラー処理]
format: 2
---

## ひとことで

`getCompletedOrNull` は、非同期の処理の結果を表す `Deferred` から、**すでに終わっている場合だけ結果を取り出す** 関数です。まだ終わっていなければ、待たずに `null` を返します。

Coil は、画像の読み込みを非同期の処理として行います。Android の `ViewTargetRequestManager` では、読み込みの処理がすでに終わっているかを、待たずに確かめる場面でこの関数を使っています。「もう結果があるなら使う。ないなら待たない」という判断に向いた関数です。

## コード

```kotlin:line-numbers=10
internal fun <T> Deferred<T>.getCompletedOrNull(): T? {
    return try {
        getCompleted()
    } catch (_: Throwable) {
        null
    }
}
```

## 前提知識

- **`Deferred<T>`**: 将来値が決まる非同期の処理の結果を表す型です。`await()` で結果を待ち、`getCompleted()` で完了していれば結果をすぐ取り出せます。
- **`getCompleted()`**: まだ完了していないと、例外を投げる関数です。完了していれば、その結果を返します。
- **`try` 式**: `try` の中の値、または `catch` の中の値が、全体の値になります。
- **`Throwable`**: 例外やエラーを含む、すべての投げられるものの基底の型です。
- **`@OptIn`**: まだ正式でない API を使うことを明示する印です。ここでは `getCompleted` が、その種類の API です。

## 何をしているか

### 1. 完了していれば結果を返す

```kotlin:line-numbers=12
        getCompleted()
```

`getCompleted()` は、処理が終わっていれば、その結果を返します。

### 2. 完了していなければ例外になり、null を返す

```kotlin:line-numbers=13
    } catch (_: Throwable) {
        null
```

まだ終わっていないと、`getCompleted()` は例外を投げます。その例外を `catch` で受け取り、`null` を返します。`_` は、例外の中身を使わないことを示す名前です。

## ここがすごい

- **待たない取り出し方**: `await()` と違い、中断して待つことがありません。画面の描画の途中などで、今の状態だけを見たい場面に向いています。
- **例外を結果の表し方に変える**: 「まだ」という状態を例外で受け取り、`null` という普通の値に変えています。呼び出し側は、例外を意識せずに `null` を調べられます。
- **広い種類を受け取る**: `Throwable` で受けるので、どんな例外でも「完了していない」として扱います。取り出しの失敗を、すべて同じ扱いに揃えています。

### 注意点: 例外の種類を選んでいない

どんな例外も `null` にしてしまうので、本来の失敗（処理の中でのエラー）も、「まだ終わっていない」と区別せずに隠れます。使う場面が「完了しているかだけを知りたい」に限られるときに、この関数は適しています。

## まとめ

- 非同期の結果は、待たずに今の状態だけを取り出せる形にすると、描画などで使いやすい。
- 「まだない」は、例外を `null` に変えて表すと、呼び出し側で扱いやすい。
- 例外を広く受け取ると便利だが、本来の失敗も隠れることを意識しておく。
