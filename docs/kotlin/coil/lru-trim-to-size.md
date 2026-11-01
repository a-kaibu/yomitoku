---
title: "キャッシュを上限以下になるまで古い項目から捨てる"
description: "キャッシュの合計サイズが上限を超えている間、先頭の項目から取り除く trimToSize。空なのにサイズが残っていれば、サイズの計算が矛盾していると例外で知らせる。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/commonMain/kotlin/coil3/util/LruCache.kt
lines: [63, 77]
function: "LruCache.trimToSize"
difficulty: 2
tags: [データ構造, 防御的プログラミング, 最適化]
format: 2
---

## ひとことで

`trimToSize()` は、キャッシュ（一度使ったものを保存しておく入れ物）の **合計サイズを、上限以下に収める** 関数です。サイズが上限を超えている間、先頭の項目から順に取り除いていきます。

Coil のメモリキャッシュ（StrongMemoryCache）の土台として使われています。

## コード

```kotlin:line-numbers=63
    fun trimToSize(size: Long) {
        while (this.size > size) {
            if (map.isEmpty()) {
                if (this.size != 0L) {
                    error("sizeOf() is returning inconsistent values")
                }
                break
            }

            val (key, value) = map.entries.first()
            map.remove(key)
            this.size -= safeSizeOf(key, value)
            entryRemoved(key, value, null)
        }
    }
```

## 前提知識

- **LRU（Least Recently Used）**: 最も長く使われていないものから捨てる、キャッシュの方式です。この関数では、先頭にある項目から取り除きます。
- **`map.entries.first()`**: 地図（マップ）の中の、先頭の項目を取り出します。どの順番になっているかは、マップを管理する仕組みに依存します。
- **`sizeOf`**: 項目 1 つのサイズを返す関数です。画像なら、ピクセルの量などを表します。
- **`error(...)`**: 矛盾が起きたときに、例外を投げる関数です。プログラムの前提が崩れたことを知らせます。
- **`break`**: ループを途中で抜けます。

## 何をしているか

### 1. 上限を超えている間だけ繰り返す

```kotlin:line-numbers=64
        while (this.size > size) {
```

キャッシュの合計サイズが、上限より大きい間だけ、項目を取り除きます。上限以下になれば、そこで終わります。

### 2. 項目がないのにサイズが残っていないか

```kotlin:line-numbers=65
            if (map.isEmpty()) {
                if (this.size != 0L) {
                    error("sizeOf() is returning inconsistent values")
                }
                break
            }
```

項目が 1 つもないのに、合計サイズが 0 でなければ、サイズの計算が矛盾しています。その場合は例外で知らせます。0 なら正しい状態なので、ループを抜けます。

### 3. 先頭の項目を取り除く

```kotlin:line-numbers=72
            val (key, value) = map.entries.first()
            map.remove(key)
```

先頭の項目を取り出して、地図から取り除きます。

```kotlin:line-numbers=74
            this.size -= safeSizeOf(key, value)
            entryRemoved(key, value, null)
```

取り除いた項目のサイズを、合計から引きます。そして、取り除かれたことを `entryRemoved` で知らせます。

## ここがすごい

- **上限を守る単純なループ**: 「超えている間、捨てる」という条件だけで、合計サイズを上限以下に保てます。
- **矛盾を見つけて止める**: サイズの計算がおかしいと、この関数は黙って進まず、例外で止まります。キャッシュの状態が壊れたまま使われることを防ぎます。
- **取り除きの通知**: `entryRemoved` を呼ぶことで、取り除いたことを外側の仕組みに伝えられます。たとえば、解放の処理をそこで行えます。
- **`clear` と同じ仕組み**: `clear()` は、上限を -1 にして `trimToSize` を呼ぶだけです。サイズが 0 の項目も含めてすべて取り除かれる点まで、この 1 つの関数で扱えます。

## まとめ

- `trimToSize` は、合計サイズが上限を超えている間、先頭の項目から取り除く。
- 項目がないのにサイズが残っていれば、矛盾として例外で止める。
- 取り除くたびに、サイズの合計を直し、取り除いたことを `entryRemoved` で伝える。
