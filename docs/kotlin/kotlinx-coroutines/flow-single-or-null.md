---
title: "2 個目が来た瞬間に「なかったこと」にする singleOrNull"
description: "Flow の要素がちょうど 1 個ならそれを、0 個か 2 個以上なら null を返す関数。2 個目を見た時点で結果を番兵に戻して打ち切る、短くて賢い実装。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/terminal/Reduce.kt
lines: [66, 80]
function: "Flow.singleOrNull"
difficulty: 2
tags: [非同期, イディオム, 標準ライブラリ]
---

## ひとことで

`singleOrNull()` は、Flow（値を順番に流すもの）が **ちょうど 1 個だけ** 値を流したらその値を返し、0 個または 2 個以上なら `null` を返す関数です。
`flowOf(7).singleOrNull()` は `7`、`flowOf(1, 2, 3).singleOrNull()` は `null` です。

2 個目の値を見た瞬間に「結果をリセットして収集をやめる」という一手で、残りの値を作らせずに答えを出しています。

## コード

```kotlin:line-numbers=66
public suspend fun <T> Flow<T>.singleOrNull(): T? {
    var result: Any? = NULL
    collectWhile {
        // No values yet, update result
        if (result === NULL) {
            result = it
            true
        } else {
            // Second value, reset result and bail out
            result = NULL
            false
        }
    }
    return if (result === NULL) null else result as T
}
```

## 前提知識

- **Flow**: 値を 1 個ずつ流す仕組みで、受け取る側が収集を始めたときに初めて値が作られます。
- **`suspend fun`**: 途中で一時停止できる関数です。Flow から値を待つ間に止まることがあるので付いています。
- **`collectWhile { ... }`**: このライブラリの内部関数で、ブロックが `true` を返す間は値を受け取り続け、`false` を返したらそこで収集を打ち切ります。
- **ラムダの `it`**: 引数が 1 つのラムダでは、引数に名前を付けなくても `it` で参照できます。
- **ラムダの最後の式が戻り値**: `if` の各分岐の最後に書いた `true` / `false` が、そのままラムダの戻り値になります。
- **`NULL` と `===`**: `NULL` はライブラリ内部の特別なオブジェクトで、「まだ値がない」ことを表す番兵です。`===` は同じオブジェクトかどうかを調べます。値そのものが `null` の場合と区別するために使います。
- **`as T`**: 型の変換（キャスト）です。`result` は `Any?`（何でも入る型）なので、返す前に `T` だとみなします。

## 何をしているか

### 1. 番兵で初期化（67 行目）

`result` を `NULL` にしておきます。これで「まだ何も来ていない」状態です。

### 2. 1 個目なら覚えて続ける（70〜72 行目）

最初の値が来たら `result` に入れ、`true` を返して収集を続けます。続けるのは、**2 個目が来るかどうかを確かめるため** です。

### 3. 2 個目が来たらリセットして打ち切る（73〜77 行目）

2 個目が来た時点で、答えが `null` になることは確定します。そこで `result = NULL` に戻し、`false` で収集を止めます。3 個目以降は作られません。

### 4. 番兵のままなら null（79 行目）

最後に `result` が `NULL` なら `null`、そうでなければ値を返します。

3 つの場合を並べると次の通りです。

| 流れてきた値 | 終わったときの `result` | 戻り値 |
| --- | --- | --- |
| なし | `NULL` | `null` |
| `7` | `7` | `7` |
| `1, 2, 3` | `NULL`（2 個目でリセット） | `null` |

## ここがすごい

- **「0 個」と「2 個以上」を同じ状態にまとめる**: どちらも答えは `null` なので、2 個目を見たら結果を「何もない」に戻せば、最後の判定は 1 行で済みます。フラグ変数を増やさずに 3 つのケースを扱えています。
- **必要最小限しか読まない**: 2 個目で打ち切るので、上流が 100 万個流す Flow でも 2 個しか作らせません。上流がネットワーク通信なら、その分の通信も発生しません。
- **`null` の値も正しく扱える**: 番兵 `NULL` を使っているので、Flow がたった 1 個の `null` を流した場合も「1 個あった」と正しく数えられます（戻り値はどちらにしても `null` ですが、2 個目の判定を誤りません）。
- **兄弟関数との対比**: 同じファイルの `single()`（51〜60 行目）は 2 個目で例外を投げるために `collect` を使っています。目的に合わせて「全部読む」と「打ち切る」を使い分けています。

## まとめ

- 結論が確定した時点で収集を打ち切ると、無駄な処理を作らせない。
- 答えが同じになる場合は、状態を 1 つにまとめると判定が簡単になる。
- 「値がない」を表すには `null` ではなく専用の番兵を使うと、`null` を値として扱える。
