---
title: "名前付きの番兵オブジェクト Symbol と unbox"
description: "ライブラリ全体で「値がない」「終わり」などの特別な印として使われる Symbol。名前を持たせてデバッグしやすくし、unbox で番兵を null に戻す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/Symbol.kt
lines: [10, 15]
function: "Symbol.unbox"
difficulty: 1
tags: [イディオム, 設計パターン, 可読性]
format: 2
---

## ひとことで

`Symbol` は、kotlinx.coroutines の内部で使われる **「番兵（せんぺい）」オブジェクト** を作るためのクラスです。
番兵とは、`NULL`（値としての `null`）、`DONE`（終わり）、`PENDING`（保留中）のように、**普通の値とは絶対にぶつからない特別な印** のことです。

クラス自体は 5 行ほどですが、ライブラリのあちこちで使われる大事な部品です。

## コード

```kotlin:line-numbers=10
internal class Symbol(@JvmField val symbol: String) {
    override fun toString(): String = "<$symbol>"

    @Suppress("UNCHECKED_CAST", "NOTHING_TO_INLINE")
    inline fun <T> unbox(value: Any?): T = if (value === this) null as T else value as T
}
```

同じライブラリの `NullSurrogate.kt` では、この `Symbol` を使って `NULL` と `DONE` という番兵が作られています。

## 前提知識

- **番兵（sentinel）**: 特別な状態を表すための、ほかと区別できる値です。「まだ値がない」を `null` で表すと、値として `null` を扱いたいときに困ります。そこで、専用のオブジェクトを 1 つ作り、それと **同じオブジェクトかどうか**（`===`）で判定します。
- **`@JvmField`**: JVM 上で getter を作らず、フィールドとして直接公開する指定です。
- **`override fun toString()`**: オブジェクトを文字列にしたときの表示を決めます。デバッガやログで `<NULL>` のように表示されます。
- **`inline fun <T> unbox(value: Any?): T`**: 型パラメータ `T` を持つ関数です。`inline` なので、呼び出し元に展開されます。`@Suppress("NOTHING_TO_INLINE")` は「ラムダ引数がないのに inline にしている」という警告を抑えています。
- **`null as T`**: `null` を型 `T` とみなすキャストです。

## 何をしているか

### 1. 名前を持つ

```kotlin:line-numbers=10
internal class Symbol(@JvmField val symbol: String) {
    override fun toString(): String = "<$symbol>"
```

`Symbol("NULL")` のように名前を付けて作り、`toString()` で `<NULL>` と表示します。

### 2. 番兵を null に戻す

```kotlin:line-numbers=14
    inline fun <T> unbox(value: Any?): T = if (value === this) null as T else value as T
```

`unbox(value)` は、`value` が自分自身（番兵）なら `null` を、そうでなければ `value` をそのまま返します。

たとえばチャネルで `null` を送りたいとき、内部では `NULL` に置き換えて送り、受け取った側で `NULL.unbox(x)` すると元の `null` に戻ります。

| 内部の値 | `NULL.unbox(値)` |
| --- | --- |
| `NULL` | `null` |
| `"abc"` | `"abc"` |
| `42` | `42` |

## ここがすごい

- **名前があるのでデバッグしやすい**: ただの `Any()` を番兵にすると、デバッガでは `java.lang.Object@1a2b3c` のようにしか見えません。`Symbol` なら `<DONE>` のように表示され、何の印なのかすぐ分かります。
- **`===` で比べるので確実**: 利用者がどんな `equals` を実装していても、番兵との比較は「同じオブジェクトか」だけで決まります。利用者の値と番兵が混ざることはありません。
- **`unbox` を番兵自身に持たせる**: 「`null` を番兵に包む」「番兵を `null` に戻す」という対の操作を、番兵のメソッドにすることで、`NULL.unbox(x)` と読みやすく書けます。
- **`inline` で呼び出しコストなし**: `unbox` は 1 行の比較なので、展開して関数呼び出しを省いています。何度も呼ばれる場所で効いてきます。

## まとめ

- 特別な状態は、`null` やフラグではなく専用の番兵オブジェクトで表すと、普通の値とぶつからない。
- 番兵に名前を付けると、デバッグがぐっと楽になる。
- 番兵に関する操作（ここでは `unbox`）を番兵自身に持たせると、読みやすいコードになる。
