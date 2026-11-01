---
title: "凍結した待ち行列を 2 倍の配列へ移すコピー処理"
description: "ロックなしの待ち行列が満杯になったときの乗り換え処理。凍結フラグを立て、次の配列を一度だけ作り、書き込み途中の場所には位置付きの Placeholder を置く。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/LockFreeTaskQueue.kt
lines: [210, 238]
function: "LockFreeTaskQueueCore.next / allocateNextCopy"
difficulty: 3
tags: [並行処理, ロック不要, データ構造, メモリ管理]
---

## ひとことで

ロックを使わない待ち行列 `LockFreeTaskQueueCore` は、満杯になると **自分を凍結して、2 倍の大きさの新しい配列に中身をコピー** します。
`next()` はその入り口で、

1. 凍結フラグを立てる（`markFrozen`）
2. 次の配列がまだなければ作る（`allocateOrGetNextCopy`）
3. 中身をコピーする（`allocateNextCopy`）

を行います。複数のスレッドが同時に `next()` を呼んでも、**新しい配列は 1 つだけ** 採用されます。

## コード

```kotlin:line-numbers=210
    fun next(): LockFreeTaskQueueCore<E> = allocateOrGetNextCopy(markFrozen())

    private fun markFrozen(): Long =
        _state.updateAndGet { state ->
            if (state and FROZEN_MASK != 0L) return state // already marked
            state or FROZEN_MASK
        }

    private fun allocateOrGetNextCopy(state: Long): Core<E> {
        _next.loop { next ->
            if (next != null) return next // already allocated & copied
            _next.compareAndSet(null, allocateNextCopy(state))
        }
    }

    private fun allocateNextCopy(state: Long): Core<E> {
        val next = LockFreeTaskQueueCore<E>(capacity * 2, singleConsumer)
        state.withState { head, tail ->
            var index = head
            while (index and mask != tail and mask) {
                // replace nulls with placeholders on copy
                val value = array[index and mask].value ?: Placeholder(index)
                next.array[index and next.mask].value = value
                index++
            }
            next._state.value = state wo FROZEN_MASK
        }
        return next
    }
```

## 前提知識

- **`_state`**: キューの先頭・末尾の位置と、凍結フラグなどを詰め込んだ 64 ビット整数です。`FROZEN_MASK` はその中の凍結フラグのビットです。
- **`updateAndGet { ... }`**: 原子変数の値をブロックで計算した値に書き換え、新しい値を返します。内部で CAS ループを回します。ブロック内の `return state` は、書き換えずに関数ごと抜けます。
- **`_next`**: 次の配列を指す原子変数です。最初は `null` です。
- **`_next.loop { next -> ... }`**: 今の値を読んでブロックを実行することを、`return` するまで繰り返します。
- **`state wo FROZEN_MASK`**: `wo` は同じクラスで定義された中置関数（290 行目）で、`this and other.inv()`、つまり「指定したビットを 0 にする」です。名前は without（〜なし）の略です。
- **Placeholder**: 「この位置は追加途中で、値はまだ」という印のクラスです。本当の位置（`index`）を持っています。
- **`?:`**: 左が `null` なら右を使う演算子です。

## 何をしているか

### 1. 凍結フラグを立てる（212〜216 行目）

すでに立っていればそのまま、なければ立てます。これ以降、この配列への追加・取り出しは失敗し、みんな次の配列へ向かいます。

### 2. 次の配列を一度だけ作る（218〜223 行目）

`_next` がすでにあればそれを返します。なければ新しい配列を作って `null` からの CAS で設定を試み、ループで読み直します。2 つのスレッドが同時に作っても、CAS に勝った 1 つだけが採用され、負けた側が作ったものは捨てられます。

### 3. 中身をコピーする（225〜238 行目）

容量を 2 倍にした新しい配列に、head から tail までの要素を移します。

- 位置は `index and next.mask` で新しい配列の中の場所に変換します。
- 値が `null`（追加の途中で、まだ書かれていない）なら、代わりに `Placeholder(index)` を置きます（231 行目）。追加した側は後でこの印を見つけ、自分の値で埋めます。
- 最後に、凍結フラグを外した状態を新しい配列に設定します。

例: 容量 4（mask 3）で head=2、tail=6 のとき、位置 2,3,4,5 は旧配列の 2,3,0,1 番目にあります。新しい配列（容量 8、mask 7）では 2,3,4,5 番目に入るので、環状の折り返しが解消されます。

## ここがすごい

- **凍結してからコピーする**: コピー中に中身が変わると、正しくコピーできません。先にフラグを立てて誰も変更できないようにしてから、ゆっくりコピーします。凍結された配列は「読み取り専用」なので、複数のスレッドが同時にコピーしても同じ結果になります。
- **位置を変えずにコピーする**: head と tail の値（マスクする前の通し番号）はそのまま使い、新しい配列ではマスクだけを変えます。だから `_state` の head/tail をそのまま引き継げます。
- **Placeholder に本当の位置を持たせる**: 環状配列は何周もするので、同じ場所に別の周回の印が残っているかもしれません。印に通し番号を持たせておけば、「自分が置いてもらった印か」を確かめられます（262 行目のコメント）。
- **作るのは誰でもよい、採用は 1 つ**: 誰が作ってもよく、CAS で 1 つに決まる。待ち合わせをしないので、どのスレッドも止まりません。

## まとめ

- ロックなしでコピーするには、先に凍結して変更を止めてから行う。
- 新しいものを作る競争は、`null` からの CAS で勝者を 1 つに決める。
- 途中の状態には、あとで持ち主が見分けられる情報（ここでは通し番号）を付けた印を置く。
