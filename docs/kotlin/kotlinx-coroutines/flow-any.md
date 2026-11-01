---
title: "見つけた瞬間に打ち切る any"
description: "Flow の中に条件を満たす値が 1 つでもあるかを調べる any。見つかったら collectWhile で即座に収集を止め、残りの値を作らせない。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/terminal/Logic.kt
lines: [34, 42]
function: "Flow.any"
difficulty: 1
tags: [非同期, 標準ライブラリ, 最適化]
format: 2
---

## ひとことで

`any { 条件 }` は、Flow の中に **条件を満たす値が 1 つでもあるか** を `true` / `false` で返す関数です。
`flowOf(1, 3, 4, 5).any { it % 2 == 0 }` は、`4` が偶数なので `true` です。

見つかった時点で答えは決まるので、**残りの値（`5`）は作らせずに収集を止めます**。そのための道具が内部関数 `collectWhile` です。

## コード

```kotlin:line-numbers=34
public suspend fun <T> Flow<T>.any(predicate: suspend (T) -> Boolean): Boolean {
    var found = false
    collectWhile {
        val satisfies = predicate(it)
        if (satisfies) found = true
        !satisfies
    }
    return found
}
```

## 前提知識

- **Flow**: 値を順番に流す仕組みです。値は受け取る側が収集したときに初めて作られます。
- **`suspend fun`**: 途中で一時停止できる関数です。Flow から値を待つ間、スレッドを手放せます。
- **`suspend (T) -> Boolean`**: 「`T` を受け取って真偽値を返す、一時停止できる関数」の型です。条件の中で別の `suspend` 関数（たとえばデータベース問い合わせ）を呼べます。
- **`collectWhile { ... }`**: このライブラリの内部関数です。ブロックが `true` を返す間は値を受け取り続け、`false` を返した時点で収集を打ち切ります。
- **`it`**: 引数が 1 つのラムダで、その引数を指す名前です。
- **`!`**: 真偽値の否定です。

## 何をしているか

### 1. 見つかったかを覚える変数

```kotlin:line-numbers=35
    var found = false
```

`found` を `false` で始めます。

### 2. 値ごとに条件を調べる

```kotlin:line-numbers=36
    collectWhile {
        val satisfies = predicate(it)
        if (satisfies) found = true
        !satisfies
    }
```

`satisfies` に条件の結果を入れ、真なら `found = true` にします。
ブロックの戻り値は `!satisfies`、つまり **「まだ見つかっていなければ続ける」** です。

`1, 3, 4, 5` で偶数を探す場合:

| 値 | `satisfies` | `found` | 続ける？ |
| --- | --- | --- | --- |
| 1 | false | false | はい |
| 3 | false | false | はい |
| 4 | true | true | いいえ（打ち切り） |
| 5 | （作られない） | | |

### 3. 結果を返す

```kotlin:line-numbers=41
    return found
```

最後まで見つからなければ `found` は `false` のままです。

## ここがすごい

- **「続けるか」を条件の否定で表す**: `collectWhile` は「続けるなら `true`」という約束なので、「見つかったら止める」は `!satisfies` の 1 語で書けます。分岐を書かずに済み、意図も明確です。
- **上流の仕事を止める**: Flow は受け取る側が要求したときに値を作る仕組みなので、打ち切れば上流はそれ以上値を作りません。上流が重い計算やネットワーク通信なら、そのぶん丸ごと節約になります。
- **対になる `all` と `none`**: 同じファイルでは、`all` が「反例が見つかったら止める」、`none` が `!any(predicate)` と書かれています。`none` を新しく実装せず `any` の否定にしているので、打ち切りの仕組みもそのまま受け継がれます。
- **打ち切りの複雑さを部品に閉じ込める**: 打ち切りは内部で例外を使った少し複雑な仕組みですが、`collectWhile` にまとめてあるので、`any` 自体は普通のループのように読めます。

## まとめ

- 答えが確定したら収集を打ち切ると、上流の無駄な処理まで止められる。
- 「続けるか」を返すループでは、条件の否定がそのまま継続条件になる。
- 似た関数（`all`、`none`）は、既存の関数の組み合わせで書くと仕組みを共有できる。
