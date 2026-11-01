---
title: "文字列を 0 以上の Int に安全に直す toNonNegativeInt"
description: "ヘッダーなどから読んだ数の文字列を、0 以上の Int に直す toNonNegativeInt。null や解析できない文字列は既定値にし、大きすぎる値は Int の最大、負の値は 0 に収める。"
language: kotlin
project: "OkHttp"
repo: https://github.com/square/okhttp
license: Apache-2.0
copyright: "Copyright (C) 2021 Square, Inc."
commit: "16fb6aef3aee1c4645fc8d24af01f8a4dc128ebf"
file: okhttp/src/commonJvmAndroid/kotlin/okhttp3/internal/-UtilCommon.kt
lines: [268, 279]
function: "String?.toNonNegativeInt"
difficulty: 2
tags: [防御的プログラミング, 文字列処理, ネットワーク]
format: 2
---

## ひとことで

`toNonNegativeInt()` は、文字列で書かれた数を **0 以上の `Int`** に直す関数です。たとえば、HTTP の `Cache-Control` に書かれた `max-age` のような秒数を、安全に整数として使うために使われています。

読めない文字列や `null` のときは、呼び出し側が指定した既定値を返します。大きすぎる値や負の値は、範囲の端に収めます。

## コード

```kotlin:line-numbers=268
internal fun String?.toNonNegativeInt(defaultValue: Int): Int {
  try {
    val value = this?.toLong() ?: return defaultValue
    return when {
      value > Int.MAX_VALUE -> Int.MAX_VALUE
      value < 0 -> 0
      else -> value.toInt()
    }
  } catch (_: NumberFormatException) {
    return defaultValue
  }
}
```

## 前提知識

- **`String?`**: `null` かもしれない文字列です。`this?.toLong()` のように、安全に呼べます。
- **`toLong()`**: 文字列を 64 ビットの整数に変える関数です。数字でない文字や、範囲を超える数の文字列では、`NumberFormatException` を投げます。
- **`Int.MAX_VALUE`**: `Int` で表せる最大の値です。
- **`?: return`**: 左側が `null` なら、関数を `return` で終える書き方です。
- **`try` と `catch`**: 例外が起きるかもしれない処理を囲み、起きたときの代わりの動きを書く仕組みです。

## 何をしているか

### 1. 読めなければ既定値

```kotlin:line-numbers=270
    val value = this?.toLong() ?: return defaultValue
```

文字列が `null` なら、すぐに既定値を返します。値があれば、`Long` として読みます。

```kotlin:line-numbers=276
  } catch (_: NumberFormatException) {
```

数字として読めないときは、例外になります。その場合も、既定値を返します。

### 2. 範囲を Int に収める

```kotlin:line-numbers=272
      value > Int.MAX_VALUE -> Int.MAX_VALUE
```

`Int` の最大を超える値は、最大値に切り詰めます。

```kotlin:line-numbers=273
      value < 0 -> 0
```

負の値は、0 にします。「0 以上の数」という名前のとおりの結果になります。

```kotlin:line-numbers=274
      else -> value.toInt()
```

それ以外は、そのまま `Int` に直します。

## ここがすごい

- **3 つの失敗を 1 か所で扱う**: `null`、解析できない文字、範囲外の値を、同じ関数の中で片付けています。呼び出し側は、特別な場合を気にせず使えます。
- **例外を使いつつ外に漏らさない**: 数字の解析では例外を使いますが、それを外に投げることはありません。既定値に置き換えて、普通の戻り値として返します。
- **大きすぎる値を切り詰める**: 「数が大きすぎる」を、エラーにせず最大値として扱います。ヘッダーの値が極端でも、処理は続けられます。
- **`Long` を経由する**: 直接 `toInt()` すると、大きな値は溢れて、思わぬ数になります。いったん `Long` で読むことで、範囲の判定が正しく行えます。

## まとめ

- `toNonNegativeInt` は、文字列を 0 以上の `Int` に直し、読めなければ既定値を返す。
- 大きすぎる値は `Int.MAX_VALUE`、負の値は 0 に収める。
- いったん `Long` で読み、範囲を判定してから `Int` に直すので、溢れを避けられる。
