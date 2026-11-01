---
title: "期待と違うイベントが来たとき、分かりやすいエラーを投げる"
description: "テストで期待していたイベントと実際のイベントが違ったとき、何を期待して何が来たかを 1 つのメッセージにして例外を投げる unexpectedEvent。"
language: kotlin
project: "Turbine"
repo: https://github.com/cashapp/turbine
license: Apache-2.0
copyright: "Copyright (C) 2022 Square, Inc."
commit: "8c4e8c9b391d75ac9d7a168cca34b1bf99ed2cb0"
file: src/commonMain/kotlin/app/cash/turbine/channel.kt
lines: [248, 255]
function: "unexpectedEvent"
difficulty: 2
tags: [防御的プログラミング, エラー処理, 文字列処理]
format: 2
---

## ひとことで

`unexpectedEvent` は、テストで **期待していたイベントと、実際に来たイベントが違ったとき** に呼ばれて、分かりやすい例外を投げる関数です。戻り値の型が `Nothing` なので、この関数を呼んだ時点で処理は必ず止まります。

Turbine のテストで「次は値が来るはず」と書いたのに、別のものが来ると、このエラーが出ます。「何を期待していて、何が来たか」が 1 行のメッセージに入るので、テストが失敗した理由をすぐ読み取れます。

## コード

```kotlin:line-numbers=248
private fun unexpectedEvent(name: String?, event: Event<*>?, expected: String): Nothing {
  val cause = (event as? Event.Error)?.throwable
  val eventAsString = event?.toString() ?: "no items"
  throw TurbineAssertionError(
    "Expected ${expected.qualifiedBy(name)} but found $eventAsString",
    cause,
  )
}
```

## 前提知識

- **`Nothing` 型**: 値を返さずに必ず終わる関数の戻り値の型です。例外を投げる関数は、この型にすると「ここから先は実行されない」と、コンパイラにも伝わります。
- **`as?` による安全なキャスト**: 型が合えば変換し、合わなければ `null` にします。ここでは、イベントがエラーかどうかを調べるために使います。
- **`?.` と `?:`**: `?.` は `null` なら止めて `null` を返し、`?:` は左側が `null` なら右側の値を使います。
- **`TurbineAssertionError`**: Turbine の失敗を表す例外です。テストのフレームワークが、この例外を失敗として表示します。
- **文字列テンプレート**: `"$変数"` や `"${式}"` の形で、文字列の中に値を埋め込む書き方です。

## 何をしているか

### 1. 原因のエラーを取り出す

```kotlin:line-numbers=249
  val cause = (event as? Event.Error)?.throwable
```

実際に来たイベントがエラーだった場合は、その中の例外（`throwable`）を取り出します。エラー以外なら、`cause` は `null` になります。取り出した例外は、後で新しい例外の原因として付け直します。

### 2. イベントを文字列にする

```kotlin:line-numbers=250
  val eventAsString = event?.toString() ?: "no items"
```

イベントがあれば、その文字列表現を使います。イベントが `null` だった場合は、「値は何もなかった」という意味で `"no items"` にします。

### 3. 例外を投げる

```kotlin:line-numbers=251
  throw TurbineAssertionError(
    "Expected ${expected.qualifiedBy(name)} but found $eventAsString",
    cause,
  )
```

「期待していたもの（名前付き）」と「実際に見つかったもの」を 1 つの文にまとめて、テストの失敗として投げます。`cause` を 2 つ目の引数に渡すので、元のエラーもスタックトレースに残ります。

## ここがすごい

- **メッセージが読むだけで分かる**: 「Expected 次の値 for ... but found ...」の形なので、テストの失敗ログを見れば、何がずれたのかが一目で分かります。
- **元のエラーを失わない**: 実際のイベントがエラーだった場合、その例外を原因として付けるので、本当の失敗の理由を取りこぼしません。
- **`Nothing` で後続を止める**: 呼び出し側は、この関数の後に続くコードを書く必要がありません。型が「戻らない」ことを保証しているので、読むときも安心です。
- **小さな関数に分ける**: 期待の名前を付ける処理は `qualifiedBy` に、イベントの文字列化はここに、と役割を分けています。それぞれが短いので、テストの失敗の仕組みを追いやすくなります。

## まとめ

- 期待と違う結果は、何を期待して何が来たかを 1 つの文にして例外にすると、失敗の原因が分かりやすい。
- 元の例外は、新しい例外の原因として付け直すと、情報を失わない。
- 戻り値を `Nothing` にすると、「ここで必ず止まる」を型で伝えられる。
