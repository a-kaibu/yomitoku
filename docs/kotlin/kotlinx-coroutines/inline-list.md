---
title: "0 個・1 個のときはリストを作らない InlineList"
description: "要素が 0 個なら null、1 個ならその要素そのもの、2 個以上で初めて ArrayList を使う小さなリスト。value class で包むので、包み自体のコストもない。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/InlineList.kt
lines: [13, 44]
function: "InlineList"
difficulty: 2
tags: [データ構造, メモリ管理, 最適化, 型システム]
---

## ひとことで

`InlineList` は、kotlinx.coroutines の内部で使われる **とても小さな「リストのようなもの」** です。
中身は `holder` という変数 1 つだけで、

- 要素 0 個 → `null`
- 要素 1 個 → その要素そのもの
- 要素 2 個以上 → `ArrayList`

と、**数に応じて持ち方を変えます**。ほとんどの場合 0 個か 1 個しか入らない場面で、リストのオブジェクトを作らずに済ませるための工夫です。

## コード

```kotlin:line-numbers=13
@JvmInline
internal value class InlineList<E>(private val holder: Any? = null) {
    operator fun plus(element: E): InlineList<E>  {
        assert { element !is List<*> } // Lists are prohibited
        return when (holder) {
            null -> InlineList(element)
            is ArrayList<*> -> {
                (holder as ArrayList<E>).add(element)
                InlineList(holder)
            }
            else -> {
                val list = ArrayList<E>(4)
                list.add(holder as E)
                list.add(element)
                InlineList(list)
            }
        }
    }

    inline fun forEachReversed(action: (E) -> Unit) {
        when (holder) {
            null -> return
            !is ArrayList<*> -> action(holder as E)
            else -> {
                val list = holder as ArrayList<E>
                for (i in (list.size - 1) downTo 0) {
                    action(list[i])
                }
            }
        }
    }
}
```

## 前提知識

- **`value class`（値クラス）と `@JvmInline`**: 1 つの値を包む型を作るための仕組みです。コンパイル後は、包みのオブジェクトは作られず、中身の値がそのまま使われます。型としては区別されるのに、実行時のコストはゼロです。
- **`Any?`**: 何でも入り、`null` も入る型です。`holder` は「要素」か「リスト」か「`null`」のどれかを入れます。
- **`operator fun plus`**: `+` 演算子の意味を定義する書き方です。`list + element` と書くと `plus` が呼ばれます。
- **`when (holder) { null -> ...; is ArrayList<*> -> ...; else -> ... }`**: 値や型で分岐します。`is` は型チェック、`!is` はその否定です。
- **`as E`**: 型のキャストです。ファイル先頭で「未検査のキャスト」の警告を抑えています。
- **`downTo`**: `(list.size - 1) downTo 0` は、大きい数から 0 まで 1 ずつ減らす範囲です。

## 何をしているか

### 1. 要素を足す（15〜30 行目）

`InlineList<String>()` に `"a"`、`"b"`、`"c"` を順に足すと:

| 足す前の `holder` | 足す要素 | 足した後の `holder` |
| --- | --- | --- |
| `null` | `"a"` | `"a"`（要素そのもの） |
| `"a"` | `"b"` | `["a", "b"]`（ここで初めてリストを作る） |
| `["a", "b"]` | `"c"` | `["a", "b", "c"]`（同じリストに追加） |

16 行目の `assert` は、要素自体が `List` だと「要素 1 個」と「リスト」の区別がつかなくなるため、それを禁止しています。

### 2. 逆順に回す（32〜43 行目）

`null` なら何もしない、要素 1 個ならそれだけ、リストなら後ろから順に `action` を呼びます。`inline` なので、`action` のラムダは呼び出し元に展開されます。

## ここがすごい

- **よくある場合に何も確保しない**: たとえば「取り消されたときに呼ぶ処理」の一覧は、ほとんど 0 個か 1 個です。毎回 `ArrayList` を作ると、空のリストや要素 1 個のリストのためにメモリと時間を使います。この型なら、2 個目が来るまでリストは作られません。
- **value class で「包み」のコストも消す**: 普通のクラスで包むと、包み自体のオブジェクトが増えて本末転倒です。`value class` なら、実行時には `holder` の値がそのまま渡されるので、包みは存在しません。それでいて型は `InlineList<E>` なので、普通の `Any?` と取り違えることもありません。
- **使う側には区別を見せない**: 利用者は `+` と `forEachReversed` だけを使い、中身が 1 個なのかリストなのかを意識しません。持ち方の切り替えは、この小さなクラスの中に閉じ込められています。
- **制約をコメントと assert で守る**: 「要素にリストを入れてはいけない」という、この表現の弱点を `assert` で明示しています。

## まとめ

- 「ほとんどの場合 0 個か 1 個」なら、数に応じて持ち方を変えると、オブジェクトの確保を減らせる。
- `value class` を使うと、型の安全さを保ったまま、包みのコストをなくせる。
- 表現上の弱点（ここでは「要素がリストだと区別できない」）は、`assert` で使い方を制限して守る。
