---
title: "コピー済みの部分を倍々に複製して文字列を繰り返す"
description: "String.repeat の中で使われる関数。すでに書いた部分を丸ごとコピーして長さを 2 倍、4 倍…と増やし、少ない回数のコピーで繰り返し文字列を作る。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/String.java
lines: [5153, 5161]
function: "String.repeatCopyRest"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, アルゴリズム]
---

## ひとことで

`"ab".repeat(5)` は `"ababababab"` を返します。`repeatCopyRest` は、その内部で **バッファを繰り返しの文字で埋める** 関数です。

素直に書くと「`"ab"` を 5 回コピー」ですが、この関数は **すでに書き込んだ部分そのものを丸ごとコピーして、長さを倍々に増やします**。1000 回の繰り返しでも、コピーは 10 回ほどで済みます。

## コード

::: code-group

```java:line-numbers=5153 [日本語訳]
    static void repeatCopyRest(byte[] buffer, int offset, int limit, int copied) {
        // 最初の 1 回分はすでにバッファに入っている。
        for (; copied < limit - copied; copied <<= 1) {
            // 2 のべき乗ずつ複製する。
            System.arraycopy(buffer, offset, buffer, offset + copied, copied);
        }
        // 残りを複製する。
        System.arraycopy(buffer, offset, buffer, offset + copied, limit - copied);
    }
```

```java:line-numbers=5153 [原文]
    static void repeatCopyRest(byte[] buffer, int offset, int limit, int copied) {
        // Initial copy is in the buffer.
        for (; copied < limit - copied; copied <<= 1) {
            // Power of two duplicate.
            System.arraycopy(buffer, offset, buffer, offset + copied, copied);
        }
        // Duplicate remainder.
        System.arraycopy(buffer, offset, buffer, offset + copied, limit - copied);
    }
```

:::

## 前提知識

- **`byte[] buffer`**: バイトの配列です。Java の `String` は内部で文字を `byte[]` に入れて持っています（英数字だけなら 1 文字 1 バイト）。
- **`System.arraycopy(元, 元の開始, 先, 先の開始, 長さ)`**: 配列の一部を別の場所へまとめてコピーする関数です。JVM が高速なメモリコピーに置き換えるので、1 要素ずつループするより速いです。同じ配列の中でもコピーできます。
- **`for (; 条件; 更新)`**: 初期化を省略した `for` です。`copied` は引数として受け取った値をそのまま使います。
- **`copied <<= 1`**: `copied = copied << 1`、つまり 2 倍にする操作です。
- **呼び出し元**: `String.repeat` は、最初の 1 回分（`"ab"`）を `buffer` の先頭にコピーしてから、この関数を `copied = 元の長さ` で呼びます。

## 何をしているか

`"ab".repeat(5)` で、`limit = 10`（全体の長さ）、`copied = 2`（コピー済みの長さ）として追います。

### 1. 倍々にコピー

```java:line-numbers=1155

    //------------------------------ utf8 ------------------------------------

    /**
```
ループの条件 `copied < limit - copied` は「コピー済みの部分をもう 1 つ丸ごと置いても、まだはみ出さないか」です。

- `copied = 2`: `2 < 8` なので、先頭 2 バイト（`ab`）を位置 2 へ → `abab` （`copied = 4`）
- `copied = 4`: `4 < 6` なので、先頭 4 バイト（`abab`）を位置 4 へ → `abababab` （`copied = 8`）
- `copied = 8`: `8 < 2` ではないので終了

### 2. 残りを 1 回で

```java:line-numbers=1160
     * char array. Used via JavaLangAccess from UTF_8 and other charset
```
残りの長さは `limit - copied = 2` です。先頭から 2 バイトを位置 8 へコピーして、`ababababab` の完成です。

先頭からコピーするのが大事な点です。先頭はいつも「繰り返しの始まり」なので、どの長さで切り取っても、正しい続きになります。

### コピーの回数

繰り返しが `n` 回なら、倍々のコピーは約 log₂(n) 回、それに残りの 1 回です。`repeat(1000)` でも 10 回ほどの `arraycopy` で済みます。

## ここがすごい

- **自分自身をコピー元にする**: 「元の文字列を何回もコピーする」のではなく、「でき上がった部分をコピーする」ので、1 回のコピー量が倍々に増え、回数が対数になります。紙を折って重ねて切ると、一度にたくさん切れるのと似た発想です。
- **`arraycopy` を最大限に活かす**: `arraycopy` は 1 回あたりの呼び出しコストがありますが、一度に大きな塊を運ぶのが得意です。回数を減らし、1 回の量を増やすこの方法は、その特性にぴったり合っています。
- **重なりのないコピーだけを使う**: コピー元（先頭 `copied` バイト）とコピー先（その直後）は重なりません。重なるコピーは注意が必要ですが、ループ条件がそれを保証しています。
- **呼び出し元との分担**: `String.repeat` は、長さ 1 の文字列なら `Arrays.fill` で埋めるなど、ケースごとに最適な方法を選んだうえで、一般の場合をこの関数に任せています。

## まとめ

- 繰り返しのデータは、作った部分を倍々にコピーすると少ない回数で作れる。
- 大きな塊をまとめてコピーする関数は、呼ぶ回数を減らすほど効率がよい。
- 先頭は常に「繰り返しの始まり」なので、どこで切っても正しい続きとして使える。
