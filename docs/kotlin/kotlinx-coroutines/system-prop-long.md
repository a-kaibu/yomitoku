---
title: "設定値の読み取りを「既定値・数値変換・範囲チェック」の 3 行で"
description: "JVM のシステムプロパティから数値の設定を読む内部関数。未設定なら既定値、数字でなければ例外、範囲外でも例外、という手順をエルビス演算子で短く書いている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/SystemProps.common.kt
lines: [40, 53]
function: "systemProp (Long)"
difficulty: 1
tags: [イディオム, エラー処理, 防御的プログラミング]
---

## ひとことで

`systemProp(名前, 既定値, 最小値, 最大値)` は、プログラムの外から与えられる **設定値（システムプロパティ）を数値として読む** 関数です。
kotlinx.coroutines は、スレッド数などの調整用の設定を、この関数で読んでいます。

設定がなければ既定値、数字として読めなければエラー、範囲外でもエラー。この 3 つの手順を、Kotlin の `?:` を使って **ほぼ 1 行ずつ** で書いているのが読みどころです。

## コード

```kotlin:line-numbers=40
internal fun systemProp(
    propertyName: String,
    defaultValue: Long,
    minValue: Long = 1,
    maxValue: Long = Long.MAX_VALUE
): Long {
    val value = systemProp(propertyName) ?: return defaultValue
    val parsed = value.toLongOrNull()
        ?: error("System property '$propertyName' has unrecognized value '$value'")
    if (parsed !in minValue..maxValue) {
        error("System property '$propertyName' should be in range $minValue..$maxValue, but is '$parsed'")
    }
    return parsed
}
```

## 前提知識

- **システムプロパティ**: JVM（Java の実行環境）を起動するときに `-Dkotlinx.coroutines.scheduler.max.pool.size=4` のように渡す設定です。プログラムからは名前で文字列として読み出せます。
- **`systemProp(propertyName): String?`**: 同じファイルの 72 行目で宣言されている関数で、設定があれば文字列、なければ `null` を返します。`expect` は「実装はプラットフォームごとに別に書く」という印です（JVM、JS、ネイティブで別実装）。
- **オーバーロード**: 同じ名前で引数の型が違う関数を複数定義できます。このファイルには `Boolean`、`Int`、`Long`、`String` 版の `systemProp` が並んでいます。
- **`?:`（エルビス演算子）**: `a ?: b` は「`a` が `null` なら `b`」です。右側に `return` や `error(...)` を書くと、「`null` なら抜ける／例外を投げる」になります。
- **`toLongOrNull()`**: 文字列を `Long` に変換し、数字として読めなければ `null` を返します。
- **`error(メッセージ)`**: `IllegalStateException` を投げます。戻り値の型は `Nothing` なので、`?:` の右側に置けます。
- **`!in minValue..maxValue`**: 範囲に含まれないかを調べます。
- **デフォルト引数**: `minValue: Long = 1` のように書くと、呼び出し側で省略したときにその値が使われます。

## 何をしているか

### 1. 設定がなければ既定値（46 行目）

`systemProp(propertyName)` が `null` なら、`return defaultValue` で抜けます。

### 2. 数字に変換、できなければ例外（47〜48 行目）

`"abc"` のような値なら、どの設定が何の値でおかしいのかをメッセージに入れて例外を投げます。

### 3. 範囲チェック（49〜51 行目）

たとえば `minValue = 1` で `"0"` が設定されていたら、範囲外として例外にします。

### 4. 返す（52 行目）

| 設定値 | 結果 |
| --- | --- |
| なし | 既定値 |
| `"8"` | `8` |
| `"abc"` | 例外（認識できない値） |
| `"0"`（最小 1） | 例外（範囲外） |

## ここがすごい

- **`?:` で「早めに抜ける」を並べる**: `if (x == null) return ...` を何度も書く代わりに、`?: return` と `?: error(...)` で、異常な場合を行の右端に追い出しています。その結果、行の左側を読むだけで「正常な流れ」が分かります。
- **`Nothing` 型のおかげで型がきれい**: `error(...)` は決して戻らない `Nothing` 型なので、`value.toLongOrNull() ?: error(...)` の型は `Long`（`null` なし）になります。以降のコードで `null` チェックが要りません。
- **黙って既定値にしない**: 設定値が数字でないとき、既定値に戻して黙って続けることもできます。しかしそれでは「設定したのに効いていない」ことに気づけません。エラーにして、メッセージに名前と値を入れるのが親切です。
- **`Int` 版は `Long` 版に任せる**: 31 行目の `Int` 版は、引数を `Long` に変換してこの関数を呼び、結果を `Int` に戻すだけです。チェックのロジックは 1 か所にまとまっています。

## まとめ

- `?: return` と `?: error()` を使うと、異常な場合を行の右側に追い出して、正常な流れを読みやすくできる。
- 設定値が不正なら、黙って既定値にせず、名前と値を含めたエラーにする。
- 似た関数は、いちばん汎用的な版に処理を集め、他はそれを呼ぶだけにする。
