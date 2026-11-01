---
title: "tailrec で書くヒープのふるい上げ・ふるい落とし"
description: "二分ヒープの並びを直す 2 つの関数を、再帰の見た目のままループに変換される tailrec で書いた例。読みやすさと速さを両立している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/ThreadSafeHeap.kt
lines: [120, 137]
function: "ThreadSafeHeap.siftUpFrom / siftDownFrom"
difficulty: 2
tags: [データ構造, アルゴリズム, 再帰, 最適化]
format: 2
---

## ひとことで

`siftUpFrom` と `siftDownFrom` は、二分ヒープ（いちばん小さい値を先頭に保つ木構造）の並びを直す関数です。
新しい要素を末尾に足したら上へ、先頭を抜いて末尾を持ってきたら下へ、それぞれ正しい場所まで移動させます。

どちらも **`tailrec`** という Kotlin のキーワードを付けた再帰関数として書かれており、見た目は再帰なのに、実際には **ループに変換されて** 動きます。

## コード

```kotlin:line-numbers=120
    private tailrec fun siftUpFrom(i: Int) {
        if (i <= 0) return
        val a = a!!
        val j = (i - 1) / 2
        if (a[j]!! <= a[i]!!) return
        swap(i, j)
        siftUpFrom(j)
    }

    private tailrec fun siftDownFrom(i: Int) {
        var j = 2 * i + 1
        if (j >= size) return
        val a = a!!
        if (j + 1 < size && a[j + 1]!! < a[j]!!) j++
        if (a[i]!! <= a[j]!!) return
        swap(i, j)
        siftDownFrom(j)
    }
```

## 前提知識

- **二分ヒープの配列表現**: 位置 `i` の子は `2i+1`（左）と `2i+2`（右）、親は `(i-1)/2` です。整数の割り算は小数点以下を切り捨てます。「親は子以下」がヒープの決まりです。
- **`tailrec`**: 関数の **最後の処理が自分自身の呼び出し** である再帰（末尾再帰）に付けると、コンパイラがそれをループに書き換えてくれます。呼び出しが積み重ならないので、深い再帰でもスタックがあふれません。末尾再帰になっていない関数に付けると警告が出ます。
- **`val a = a!!`**: クラスのプロパティ `a`（`null` かもしれない配列）を、`null` でないと断言してローカル変数 `a` にコピーしています。同じ名前でも、ローカル変数のほうが優先されます（シャドーイング）。以降は `null` チェックが要りません。
- **`<=` と `<`**: 要素の型 `T` は `Comparable` なので、比較演算子で大小を比べられます。
- **`j++`**: `j` を 1 増やします。

## 何をしているか

### siftUpFrom: 上へ動かす

```kotlin:line-numbers=120
    private tailrec fun siftUpFrom(i: Int) {
        if (i <= 0) return
        val a = a!!
        val j = (i - 1) / 2
        if (a[j]!! <= a[i]!!) return
        swap(i, j)
        siftUpFrom(j)
    }
```

1. 位置が 0（根）なら、もう上はないので終わり（`if (i <= 0) return`）。
2. 親の位置 `j = (i - 1) / 2` を求めます。
3. 親が自分以下なら、決まりは守られているので終わり（`if (a[j]!! <= a[i]!!) return`）。
4. そうでなければ親と入れ替え、親の位置からもう一度同じことをします（`swap(i, j)` と `siftUpFrom(j)`）。

例: `[1, 4, 3, 7]` の末尾に `2` を足すと位置 4。親は位置 1 の `4`。`4 > 2` なので入れ替えて位置 1 へ。親は位置 0 の `1`。`1 <= 2` なので終わり。結果 `[1, 2, 3, 7, 4]`。

### siftDownFrom: 下へ動かす

```kotlin:line-numbers=129
    private tailrec fun siftDownFrom(i: Int) {
        var j = 2 * i + 1
        if (j >= size) return
        val a = a!!
        if (j + 1 < size && a[j + 1]!! < a[j]!!) j++
        if (a[i]!! <= a[j]!!) return
        swap(i, j)
        siftDownFrom(j)
    }
```

1. 左の子 `j = 2i + 1` が範囲外なら、子がいないので終わり（`if (j >= size) return`）。
2. 右の子があり、そちらが小さければ `j` を右の子にします（`if (j + 1 < size && a[j + 1]!! < a[j]!!) j++`）。こうして **小さい方の子** を選びます。
3. 自分がその子以下なら終わり（`if (a[i]!! <= a[j]!!) return`）。
4. そうでなければ入れ替えて、子の位置から続けます。

## ここがすごい

- **再帰の読みやすさ、ループの速さ**: 「親と比べて、だめなら入れ替えて、親の位置で同じことをする」という定義をそのまま再帰で書けるので、読み手が理解しやすくなります。`tailrec` のおかげで実行時はただの `while` ループになり、関数呼び出しのコストもスタックの消費もありません。
- **終了条件を先頭にまとめる**: どちらの関数も「もう動かさなくていい条件」を先に `return` で抜けています。最後に残るのは「入れ替えて再帰」だけなので、末尾再帰の形が自然に保たれます。
- **小さい方の子と比べる理由**: 下へ動かすとき、大きい方の子と入れ替えると、その子が小さい方の子の親になって決まりが崩れます。`a[j + 1]!! < a[j]!!` の 1 行がそれを防いでいます。
- **`!!` を 1 回で済ませる**: 配列 `a` は `null` かもしれない型ですが、関数の先頭でローカル変数に取り出しておくことで、ループの中ではチェックが要りません。

## まとめ

- 末尾再帰の関数は `tailrec` を付けるだけでループになる。読みやすさを犠牲にせずに済む。
- ヒープを直す処理は「親（または小さい方の子）と比べて入れ替える」の繰り返し。
- `null` かもしれないプロパティは、先にローカル変数へ取り出してから使うと楽になる。
