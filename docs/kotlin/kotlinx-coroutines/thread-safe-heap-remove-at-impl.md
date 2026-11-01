---
title: "ヒープの「途中」から要素を抜く方法"
description: "遅延実行タイマーを管理するヒープから、任意の位置の要素を取り除く関数。末尾と入れ替えたあと上か下のどちらへ動かすかを 1 回の比較で決めている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/ThreadSafeHeap.kt
lines: [86, 107]
function: "ThreadSafeHeap.removeAtImpl"
difficulty: 3
tags: [データ構造, アルゴリズム, 並行処理]
---

## ひとことで

`ThreadSafeHeap` は、kotlinx.coroutines が `delay(1000)` のような「あとで実行する予定」を時刻順に並べておくための **二分ヒープ** です。
`removeAtImpl(index)` は、そのヒープの **好きな位置にある要素を取り除く** 関数です。予定がキャンセルされたとき、先頭以外の要素を抜く必要があるので使われます。

末尾の要素を空いた場所に持ってきて、それを **上に動かすか下に動かすかを 1 回の比較で決める** のがポイントです。

## コード

```kotlin:line-numbers=86
    @PublishedApi
    internal fun removeAtImpl(index: Int): T {
        assert { size > 0 }
        val a = this.a!!
        size--
        if (index < size) {
            swap(index, size)
            val j = (index - 1) / 2
            if (index > 0 && a[index]!! < a[j]!!) {
                swap(index, j)
                siftUpFrom(j)
            } else {
                siftDownFrom(index)
            }
        }
        val result = a[size]!!
        assert { result.heap === this }
        result.heap = null
        result.index = -1
        a[size] = null
        return result
    }
```

## 前提知識

- **二分ヒープ**: いちばん小さい値をすぐ取り出せるデータ構造です。配列で木を表し、位置 `i` の要素の子は `2i+1` と `2i+2`、親は `(i-1)/2` にいます。「親は子以下」という決まりを常に守ります。
- **siftUp / siftDown（ふるい上げ・ふるい落とし）**: 決まりが崩れた要素を、親と入れ替えながら上へ（または小さい方の子と入れ替えながら下へ）動かして直す操作です。
- **`!!`**: 「この値は `null` ではない」と断言する演算子です。もし `null` なら例外になります。配列の型が `Array<T?>`（`null` 入りかもしれない配列）なので、取り出すたびに使っています。
- **`<` で要素を比べる**: `T` は `Comparable<T>` を実装しているので、Kotlin では `a < b` と書くと `a.compareTo(b) < 0` に変換されます。
- **`assert { ... }`**: ライブラリ内部の確認用です。デバッグ時だけ条件をチェックします。
- **`@PublishedApi internal`**: 内部用だけれど、`inline` 関数から呼べるように公開しておく、という指定です（`removeFirstIf` などの inline 関数がこれを呼びます）。

## 何をしているか

### 1. 末尾を空いた穴へ移す（89〜92 行目）

まず `size--` で要素数を 1 減らします。いま `size` は「最後の要素の位置」を指しています。
消したい位置 `index` が最後でなければ、`swap(index, size)` で **消したい要素と最後の要素を入れ替え** ます。これで消したい要素は配列の末尾に移り、あとで簡単に切り離せます。

### 2. 持ってきた要素を正しい場所へ（93〜99 行目）

末尾から来た要素は、新しい場所で決まりを破っているかもしれません。

- 親 `a[j]` より小さければ（94 行目）、上へ動かす必要があります。親と入れ替えてから `siftUpFrom(j)` で上へ進めます。
- そうでなければ、下へ動かす必要があるかもしれないので `siftDownFrom(index)` を呼びます。

例: `[1, 5, 2, 6, 7, 3]` から位置 3（値 6）を消すと、末尾の 3 が位置 3 に来ます。親（位置 1）の 5 より小さいので入れ替えて `[1, 3, 2, 5, 7]`。さらに上の 1 とは入れ替えずに終わります。

### 3. 末尾を切り離して後片付け（101〜106 行目）

取り除いた要素の `heap` を `null`、`index` を `-1` にし、配列の末尾を `null` にして返します。

## ここがすごい

- **要素が自分の位置を覚えている**: `ThreadSafeHeapNode` は `index` を持ち、`swap` のたびに更新されます（同じファイルの 149〜157 行目）。だから「この予定を消して」と言われたとき、配列を探さずに **O(1) で位置がわかり**、全体として O(log n) で消せます。
- **上か下かを 1 回の比較で決める**: 途中から抜くときは、移ってきた要素が上にも下にも動く可能性があります。親と 1 回比べて、小さければ上、そうでなければ下、と分けることで、両方を試す無駄がありません。
- **参照を必ず切る**: 106 行目の `a[size] = null` は、取り除いた要素を配列が握り続けてメモリが解放されなくなるのを防ぎます。`heap = null` にしておくことで、二重に削除されても 73 行目のチェックで安全に弾けます。

## まとめ

- ヒープの途中から消すには「末尾と入れ替え → 上か下へ直す」。
- 要素に自分の位置を持たせると、削除や更新が速くなる。
- 配列から取り除いた要素の参照は `null` で消しておく。
