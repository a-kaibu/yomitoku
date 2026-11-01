---
title: "ハッシュ値の符号ビットを「予約席」として空けておく"
description: "ConcurrentHashMap がハッシュ値を混ぜる関数。HashMap と同じ XOR に加えて、最上位ビットを 0 にする。負のハッシュ値を特別な印として使うための下準備。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ConcurrentHashMap.java
lines: [710, 712]
function: "ConcurrentHashMap.spread"
difficulty: 3
format: 2
tags: [ハッシュ, 並行処理, データ構造]
---

## ひとことで

`ConcurrentHashMap` は、複数のスレッドから同時に安全に使える HashMap です。`spread(h)` は、キーのハッシュ値を使う前に整える関数です。

前半の `h ^ (h >>> 16)` は HashMap と同じ「上位ビットを下位に混ぜる」処理です。違うのは後半の `& HASH_BITS` で、**最上位ビット（符号ビット）を必ず 0 にします**。こうしてふつうのキーのハッシュ値を常に 0 以上にしておき、**負の値を「特別なノード」の印として使える** ようにしています。

## コード

```java:line-numbers=710
    static final int spread(int h) {
        return (h ^ (h >>> 16)) & HASH_BITS;
    }
```

`HASH_BITS` などの定数は、同じファイルで次のように定義されています。

```java:line-numbers=596
    static final int MOVED     = -1; // hash for forwarding nodes
    static final int TREEBIN   = -2; // hash for roots of trees
    static final int RESERVED  = -3; // hash for transient reservations
    static final int HASH_BITS = 0x7fffffff; // usable bits of normal node hash
```

## 前提知識

- **スレッドと並行処理**: 複数の処理が同時に動くことです。同じデータを同時に書き換えると壊れることがあるので、特別な工夫が必要です。
- **ハッシュ表のノード**: ConcurrentHashMap は配列の各箱に「ノード」（キー・値・ハッシュ値を持つ小さなオブジェクト）を入れます。
- **`0x7fffffff`**: 2 進数で `0111…1`、最上位ビットだけが 0 の値です。これと `&` を取ると、最上位ビットが消え、結果は必ず 0 以上になります。
- **`^` と `>>>`**: XOR と、左に 0 を入れる右シフトです。
- **`static final`**: クラスに 1 つだけの、変更されない値（定数）や関数です。

## 何をしているか

### 1. 上位を下位に混ぜて、符号ビットを消す

```java:line-numbers=711
        return (h ^ (h >>> 16)) & HASH_BITS;
```

ハッシュ表の位置は下位ビットで決まるので、`h ^ (h >>> 16)` で上位 16 ビットの情報も位置に反映させます（HashMap の `hash` と同じ考え方です）。

### 2. 具体的な値で追う

`h = 0x8000_1234`（負の数）なら、

- `h ^ (h >>> 16)` = `0x8000_1234 ^ 0x0000_8000` = `0x8000_9234`
- `& 0x7fffffff` = `0x0000_9234`（正の数）

となります。どんなキーのハッシュ値も、ノードに保存される時点で 0 以上です。

### 3. 負の値は特別な意味に

ConcurrentHashMap の中には、ふつうのキーと値を持たない特別なノードがあります。

- **`MOVED`（-1）**: 表を大きくしている最中に「この箱の中身は新しい表に移した」と知らせる目印（フォワーディングノード）
- **`TREEBIN`（-2）**: この箱の中身が木構造になっていることを表す根
- **`RESERVED`（-3）**: 値を計算している間の一時的な予約

ほかのスレッドは、箱の先頭ノードのハッシュ値を見て、**負ならふつうのノードではない** とすぐに判断し、「新しい表を見に行く」「木として探す」など処理を切り替えます。

## ここがすごい

- **1 つの数値に 2 つの役割**: ハッシュ値のフィールドが「ふつうのハッシュ値」と「ノードの種類」の両方を表しています。種類を表す別のフィールドを追加せずに済むので、ノードが小さくなり、メモリも節約できます。
- **判定が速い**: ノードの種類は `hash < 0` の 1 回の比較でわかります。並行処理では、ロックを取らずにノードを読んで判断する場面が多いので、この判定の速さが全体の性能に効きます。
- **失うのは 1 ビットだけ**: ハッシュ値は 31 ビットになりますが、表の位置を決めるのは下位ビットなので、表が 2^31 個の箱を持たないかぎり影響はありません。
- **HashMap との比較**: HashMap は同時アクセスを考えないので、符号ビットを残しています。ConcurrentHashMap は、同時に表を広げる処理などのために特別なノードが必要で、そのための「予約席」として符号ビットを使っています。同じ「混ぜる」処理でも、使われ方に合わせて少し変えているのです。

## まとめ

- 値の範囲の一部（ここでは負の数）を「特別な印」に予約すると、別のフィールドなしで種類を表せる。
- `& 0x7fffffff` は「必ず 0 以上にする」ための定番のマスク。
- 並行処理のデータ構造では、ロックなしで素早く判断できる表現が重要になる。
