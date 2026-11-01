---
title: "失敗メッセージに、どの流れの話かを付け足す"
description: "テストの失敗メッセージの後ろに「for 名前」を付けるかどうかを決める qualifiedBy。名前がない場合は元の文字列をそのまま使う。"
language: kotlin
project: "Turbine"
repo: https://github.com/cashapp/turbine
license: Apache-2.0
copyright: "Copyright (C) 2022 Square, Inc."
commit: "8c4e8c9b391d75ac9d7a168cca34b1bf99ed2cb0"
file: src/commonMain/kotlin/app/cash/turbine/channel.kt
lines: [257, 263]
function: "String.qualifiedBy"
difficulty: 1
tags: [文字列処理, 防御的プログラミング, 可読性]
format: 2
---

## ひとことで

`qualifiedBy` は、文字列の後ろに **「for 名前」という説明を付けるかどうか** を決める、小さな拡張関数です。名前が `null` なら何も付けず、名前があれば `"... for 名前"` の形にします。

Turbine では、同じテストの中に複数のチャネルや Flow を並べることがあります。そのとき、失敗したメッセージだけを見ても、どの流れの話か分からないことがあります。この関数は、名前を付けるための小さな部品です。

## コード

```kotlin:line-numbers=257
internal fun String.qualifiedBy(name: String?) =
  if (name == null) {
    this
  } else {
    "$this for $name"
  }

```

## 前提知識

- **拡張関数**: 既存の型に、新しい関数を追加する書き方です。`String.qualifiedBy(...)` と書くと、どの文字列に対しても呼べます。`this` が、呼び出した文字列を指します。
- **式として使う `if`**: `if` は値を返す式です。ここでは、関数の本体全体が `if` の結果になっています。
- **`null` 許容型**: `name: String?` は、文字列か `null` のどちらかを受け取れることを表します。
- **文字列テンプレート**: `"$this for $name"` のように、変数の値を文字列の中に埋め込めます。
- **`this`**: 拡張関数の中で、呼び出された文字列そのものを指します。

## 何をしているか

### 1. 名前がなければ、そのまま返す

```kotlin:line-numbers=258
  if (name == null) {
    this
```

名前が指定されていなければ、元の文字列（`this`）をそのまま返します。説明を足さないので、単独のテストでは、メッセージが余計に長くなりません。

### 2. 名前があれば、後ろに付ける

```kotlin:line-numbers=261
    "$this for $name"
```

名前があれば、`"元の文字列 for 名前"` の形にします。`name` は、`null` ではないことがこの分岐で保証されているので、そのまま文字列に埋め込めます。

## ここがすごい

- **何もないときは何もしない**: 名前がなければ元の文字列をそのまま返すので、呼び出し側は名前の有無を気にせず、いつも同じ関数を呼べます。
- **拡張関数で読みやすく**: `expected.qualifiedBy(name)` のように書けるので、「期待するものに名前を付ける」という意味がそのまま読めます。
- **式として書かれている**: `return` を書かず、`if` の結果が関数の値になっています。短い関数に向いた書き方です。
- **単純だから安心して使える**: 分岐は 1 つだけで、外部の状態を一切見ていません。同じ入力には必ず同じ出力を返します。

## まとめ

- 文字列に説明を付けるかどうかは、拡張関数に分けると呼び出し側が簡潔に書ける。
- `null` 許容型の値は、分岐の中で `null` でないことを確かめると、そのまま使える。
- 小さな関数は、読むだけで意味が決まるように、役割を 1 つに絞る。
