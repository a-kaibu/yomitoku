---
title: "整数を 16 進数にして先頭の 0 を消す"
description: "整数を 4 バイトに分けて 16 進数の文字列にし、先頭の 0 を取り除く toHexString。値が 0 のときだけ \"0\" を返す。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "Copyright 2017-2021 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license."
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: core/commonMain/src/kotlinx/serialization/internal/Platform.common.kt
lines: [48, 54]
function: "toHexString(n: Int)"
difficulty: 2
tags: [数値計算, 文字列処理, 低レイヤ]
format: 2
---

## ひとことで

`toHexString(n: Int)` は、整数を **16 進数の文字列** にする関数です。たとえば `255` は `ff`、`0` は `0` になります。ふつうに 16 進数にすると、先頭に 0 が付いて 8 桁になるので、その 0 を取り除いています。

kotlinx.serialization（データを JSON などの形式に変えるライブラリ）の内部で、数値を文字列にする部分に使われています。

## コード

```kotlin:line-numbers=48
    fun toHexString(n: Int): String {
        val arr = ByteArray(4)
        for (i in 0 until 4) {
            arr[i] = (n shr (24 - i * 8)).toByte()
        }
        return printHexBinary(arr, true).trimStart('0').takeIf { it.isNotEmpty() } ?: "0"
    }
```

## 前提知識

- **16 進数**: 0 から 9 と a から f の 16 種類の数字で表す形です。1 バイトは 2 桁で表せます。
- **4 バイト**: `Int` は 32 ビットなので、8 ビットずつ 4 つのバイトに分けられます。
- **`shr`**: ビットを右にずらす操作です。`n shr 24` は、上位 8 ビットを取り出すことに当たります。
- **`toByte()`**: 整数を 1 バイトに変換します。上位のビットは捨てられます。
- **`trimStart('0')`**: 文字列の先頭から、指定の文字が続くだけ取り除く関数です。
- **`takeIf`**: 条件を満たせば値を返し、満たさなければ `null` を返す関数です。`?:` と組み合わせて、空のときの代わりの値を決めています。

## 何をしているか

### 1. 4 バイトに分ける

```kotlin:line-numbers=51
            arr[i] = (n shr (24 - i * 8)).toByte()
```

上位のバイトから順に、8 ビットずつ取り出して配列に入れます。`i` が 0 のときは 24 ビット右にずらし、上位 8 ビットを取り出します。

### 2. 16 進数にして先頭の 0 を消す

```kotlin:line-numbers=53
        return printHexBinary(arr, true).trimStart('0').takeIf { it.isNotEmpty() } ?: "0"
```

4 バイトを 16 進数の文字列にします。`true` は、小文字で書くという意味です。先頭の 0 をすべて取り除き、文字が残れば、その文字列を返します。全部が 0 だったときは、文字が残らないので `"0"` を返します。

## ここがすごい

- **先頭の 0 を後から消す**: 4 バイトをそのまま表すと、`0` は `00000000` になります。最後に先頭の 0 だけを消すと、人が読みやすい形になります。
- **空のときの代わりを 1 か所で決める**: `takeIf` と `?:` を使い、0 の場合に `"0"` を返す条件を、式の中で一度に書いています。
- **ビットずらしで区切る**: 配列を作るときに、`24 - i * 8` で各バイトの位置を計算しています。ループの 4 回で、すべてのバイトが決まります。
- **`toByte()` の切り捨て**: 上位のビットを捨てることで、8 ビットだけを取り出しています。切り捨てが仕様として意図されている場面です。

## まとめ

- `toHexString` は、整数を 4 バイトに分けて 16 進数の文字列にし、先頭の 0 を消す。
- 値が 0 のときだけ、空にならないように `"0"` を返す。
- ビットずらしと `toByte()` で、各バイトを取り出す。
