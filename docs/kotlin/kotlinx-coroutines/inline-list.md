---
title: "要素が 1 個ならただの値で持つ InlineList"
description: "要素の数が少ないことが多い場面のための、インラインのリスト。要素が 1 個ならそのまま値として持ち、2 個目が来たときだけ ArrayList に切り替える。"
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
tags: [最適化, メモリ管理, 型システム]
format: 2
---

## ひとことで

`InlineList<E>` は、**要素を少ししか持たないことが多い場面のための、軽いリスト** です。要素がないときは `null`、1 個のときは **その要素そのもの** を入れておき、2 個目が来たときだけ `ArrayList` を作ります。

リストを 1 個の値の箱として包む `@JvmInline value class` なので、箱そのものの追加のコストは、ほとんどかかりません。

## コード


::: code-group

```kotlin:line-numbers=13 [日本語訳]
@JvmInline
internal value class InlineList<E>(private val holder: Any? = null) {
    operator fun plus(element: E): InlineList<E>  {
        assert { element !is List<*> } // リストは禁止
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

```kotlin:line-numbers=13 [原文]
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

:::

## 前提知識

- **`@JvmInline value class`**: 1 つの値を包む型です。実行時には包まれた値そのものとして扱われるため、包むことによる余分なオブジェクトが作られにくくなります。
- **`holder: Any?`**: 中身を入れておく変数です。`null`、1 個の要素、`ArrayList` のどれかが入ります。
- **`operator fun plus`**: `list + element` の形で書ける演算子関数です。
- **`is`**: 型を調べる式です。`is ArrayList<*>` は「`ArrayList` かどうか」です。
- **`inline fun`**: 呼び出し元にコードを展開する関数です。`action` のラムダも一緒に展開されます。
- **`assert { ... }`**: 開発時にだけ確かめる条件です。

## 何をしているか

### 1. 要素を追加する: 状態で分岐する

`plus` は、今の `holder` の状態によって、3 通りに分かれます。

```kotlin:line-numbers=17
        return when (holder) {
            null -> InlineList(element)
```

- `null`（空）: 要素をそのまま `holder` に入れる。
- `ArrayList`（すでに 2 個以上）: 同じリストに追加する。
- それ以外（1 個）: 新しい `ArrayList` を作り、古い要素と新しい要素を入れる。

### 2. 逆順に取り出す: 状態に合わせて処理する

`forEachReversed` は、`holder` の状態に応じて、要素を後ろから順に `action` に渡します。

```kotlin:line-numbers=33
        when (holder) {
            null -> return
            !is ArrayList<*> -> action(holder as E)
```

空なら何もせず、1 個ならその要素を 1 回だけ渡し、リストなら後ろから順に渡します。

## ここがすごい

- **1 個のときは余分な箱を作らない**: 要素が 1 個だけの場合、`ArrayList` を作らずに、要素そのものを入れておきます。多くの場合は要素が少ないので、この処理が全体の割り当て回数を大きく減らします。
- **型で中身を判別する**: `holder` には `null`、要素、`ArrayList` のどれかが入るので、`is` の判定だけで状態が分かります。
- **値クラスで包む**: 外から見ると、ただの `InlineList<E>` です。中身の形式を隠しながら、箱のコストを抑えています。
- **`inline` で関数呼び出しを省く**: `forEachReversed` は `inline` なので、ラムダの呼び出しが展開されて余分な処理を省けます。
- **リストの入れ子を禁止**: `assert` で、要素がリストでないことを確かめています。要素とリストを区別できなくなるのを防ぐためです。

## まとめ

- 要素が少ないことが多いなら、1 個のときは要素そのものを持ち、2 個目から `ArrayList` に切り替えると割り当てを減らせる。
- 状態を型で判別すると、分岐がはっきりする。
- 値クラスで包むと、中身の形式を隠しつつ、箱のコストを抑えられる。
