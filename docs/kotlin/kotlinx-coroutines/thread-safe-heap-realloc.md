---
title: "必要になるまで配列を作らないヒープの拡張と入れ替え"
description: "ヒープの内部配列を最初の追加まで作らず、足りなくなったら倍に広げる realloc と、要素に自分の位置を書き戻しながら入れ替える swap。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/ThreadSafeHeap.kt
lines: [139, 157]
function: "ThreadSafeHeap.realloc / swap"
difficulty: 2
tags: [データ構造, メモリ管理, 最適化]
format: 2
---

## ひとことで

`realloc` は、ヒープの中身を入れる配列を **必要になったときに初めて作り、足りなくなったら 2 倍に広げる** 関数です。
`swap` は、配列の 2 つの要素を入れ替えるついでに、**それぞれの要素に「自分はいま何番目にいるか」を書き込む** 関数です。

どちらも短いですが、メモリの節約と、削除を速くするための仕掛けが詰まっています。

## コード

```kotlin:line-numbers=139
    @Suppress("UNCHECKED_CAST")
    private fun realloc(): Array<T?> {
        val a = this.a
        return when {
            a == null -> (arrayOfNulls<ThreadSafeHeapNode>(4) as Array<T?>).also { this.a = it }
            size >= a.size -> a.copyOf(size * 2).also { this.a = it }
            else -> a
        }
    }

    private fun swap(i: Int, j: Int) {
        val a = a!!
        val ni = a[j]!!
        val nj = a[i]!!
        a[i] = ni
        a[j] = nj
        ni.index = i
        nj.index = j
    }
```

## 前提知識

- **`Array<T?>`**: 要素の型が `T`、ただし `null` も入れられる配列です。配列は作るときに長さが決まり、あとから伸ばせません。伸ばしたいときは新しい配列を作ってコピーします。
- **`arrayOfNulls<X>(4)`**: すべて `null` で埋まった長さ 4 の配列を作る標準関数です。
- **`as Array<T?>`**: 型を変換（キャスト）します。ジェネリクスの `T` は実行時には型の情報が消えてしまう（型消去）ため、`T` の配列を直接作れません。そこで親の型 `ThreadSafeHeapNode` の配列を作り、`T` の配列だとみなしています。`@Suppress("UNCHECKED_CAST")` は「この変換は安全だと分かっているので警告を出さないで」という指定です。
- **`copyOf(n)`**: 配列を長さ `n` の新しい配列にコピーします。長くした分は `null` で埋まります。
- **`.also { ... }`**: 値をそのまま返しつつ、ついでに処理をするスコープ関数です。ブロックの中では値を `it` で参照できます。ここでは「新しい配列を返しつつ、`this.a` にも保存する」を 1 行で書いています。
- **`when { ... }`**: 条件を上から順に調べ、最初に当てはまった分岐の値を返す式です。

## 何をしているか

### realloc

```kotlin:line-numbers=141
        val a = this.a
        return when {
            a == null -> (arrayOfNulls<ThreadSafeHeapNode>(4) as Array<T?>).also { this.a = it }
            size >= a.size -> a.copyOf(size * 2).also { this.a = it }
            else -> a
        }
```

1. まだ配列がなければ（`a == null`）、長さ 4 の配列を作って保存し、それを返します。
2. 要素数が配列の長さに達していたら（`size >= a.size`）、長さを `size * 2` にした新しい配列を作り、保存して返します。
3. 余裕があれば（`else -> a`）、今の配列をそのまま返します。

要素を 1 個ずつ足していくと、配列の長さは 4 → 8 → 16 → 32 … と増えます。

### swap

```kotlin:line-numbers=149
    private fun swap(i: Int, j: Int) {
        val a = a!!
        val ni = a[j]!!
        val nj = a[i]!!
        a[i] = ni
        a[j] = nj
        ni.index = i
        nj.index = j
    }
```

位置 `i` と `j` の要素を入れ替えます。ポイントは `ni.index = i` と `nj.index = j` の 2 行で、入れ替えた要素それぞれの `index` を新しい位置に書き換えています。

例: `a = [A(0), B(1)]` で `swap(0, 1)` すると、`a = [B, A]` になり、`B.index = 0`、`A.index = 1` に更新されます。

## ここがすごい

- **使われないヒープはメモリを使わない**: コルーチンの仕組みでは、遅延実行の予定を 1 度も登録しないイベントループもたくさんあります。配列を最初から作らないことで、そうした場合のメモリを節約しています。
- **2 倍に広げる理由**: 1 つずつ広げると、追加のたびに全体をコピーすることになり、n 個入れるのに O(n²) かかります。2 倍ずつ広げれば、コピーの合計は O(n) に収まり、1 回の追加は平均 O(1) になります（償却計算量）。
- **`also` で「作って保存して返す」を 1 式に**: 一時変数を使わずに、`when` の各分岐を 1 行で書けています。
- **位置を書き戻す swap**: ヒープの中で要素が動くたびに位置を更新しておくので、「この要素を消して」と頼まれたとき配列全体を探す必要がありません。ヒープの操作はすべて `swap` を通るため、更新漏れも起きません。

## まとめ

- めったに使わない入れ物は、必要になるまで作らない（遅延確保）。
- 配列を伸ばすときは倍々にすると、平均のコストが一定になる。
- 要素の移動を 1 つの関数に集めると、付随する更新（位置の記録など）を漏れなく行える。
