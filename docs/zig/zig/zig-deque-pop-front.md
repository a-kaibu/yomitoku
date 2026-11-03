---
title: 円形の両端キューから、先頭の要素を取り出す
description: Zig の std.Deque の popFront。先頭の位置を次へ進め、取り出した要素を返す。空のときは null を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/deque.zig
lines: [199, 206]
function: Deque.popFront
difficulty: 2
format: 2
tags: [データ構造, メモリ管理]
---

## ひとことで

`popFront` は、両端キューの先頭から要素を 1 つ取り出し、その値を返す関数です。取り出した分だけ、先頭の位置を次へずらします。
キューが空なら、`null` を返します。

配列の中身を前へ詰め直すことはしません。先頭の位置を進めるだけなので、速く動きます。

## コード

::: code-group

```zig:line-numbers=199 [日本語訳]
        /// 先頭の要素を取り出して返す。空なら null を返す。
        pub fn popFront(deque: *Self) ?T {
            if (deque.len == 0) return null;
            const pop_index = deque.head;
            deque.head = deque.bufferIndex(1);
            deque.len -= 1;
            return deque.buffer[pop_index];
        }
```

```zig:line-numbers=199 [原文]
        /// Remove and return the first item in the deque or null if empty.
        pub fn popFront(deque: *Self) ?T {
            if (deque.len == 0) return null;
            const pop_index = deque.head;
            deque.head = deque.bufferIndex(1);
            deque.len -= 1;
            return deque.buffer[pop_index];
        }
```

:::
## 前提知識

- **両端キュー（Deque）**: 先頭と末尾から出し入れできるデータ構造です。キュー（先入れ先出し）としても、スタックとしても使えます。
- **`head`**: 先頭の要素が、配列の中のどこにあるかを表す位置です。
- **`len`**: 今入っている要素の数です。
- **`?T`（オプショナル型）**: 値があるか、`null` かを表す型です。空のときに `null` を返すために使います。
- **`bufferIndex`**: 先頭からの番号を、配列の中の位置に直す関数です（前の記事で説明しています）。
- **`pop_index`**: 取り出す要素の位置を一時的に覚えておく変数です。

## 何をしているか

### 1. 空なら null を返す

```zig:line-numbers=201
            if (deque.len == 0) return null;
```

要素が 1 つもないときは、取り出すものがありません。`null` を返して終わります。

### 2. 取り出す位置を覚えて、先頭を進める

```zig:line-numbers=202
            const pop_index = deque.head;
            deque.head = deque.bufferIndex(1);
```

今の先頭の位置 `head` を `pop_index` に保存します。そして、新しい先頭を、`bufferIndex(1)` で求めます。これは「先頭から 1 つ後ろの要素」の実際の位置で、新しい先頭になります。

配列の末尾を越えたときは、`bufferIndex` が自動で先頭側へ回り込んだ位置を返すので、この計算だけで正しく進みます。

### 3. 要素数を減らして、取り出した値を返す

```zig:line-numbers=204
            deque.len -= 1;
            return deque.buffer[pop_index];
```

要素の数を 1 減らします。そして、保存しておいた位置の値を返します。値を移動させていないので、もとの配列の位置はそのままです。次に入れる要素が、その位置を再び使います。

## ここがすごい

- **配列の移動がない**: 先頭から要素を取り出すとき、残りを 1 つずつ前へ詰めると、要素数に比例する時間がかかります。この関数は、先頭の位置を 1 つ進めるだけなので、一定の時間で終わります。
- **取り出しの値を先に保存**: 先頭の位置を変えてから値を読むと、違う位置を読んでしまいます。`pop_index` に先に保存することで、この誤りを防いでいます。
- **空の判定を最初に**: `len == 0` を最初に調べるので、空のときに配列の範囲外を読むことがありません。
- **`bufferIndex` の再利用**: 新しい先頭の位置の計算を、番号から位置を求める共通の関数に任せています。回り込みの処理を、ここで書き直す必要がありません。

## まとめ

- 両端キューの先頭を取り出すには、先頭の位置を覚えてから、次の位置へ進めます。
- 配列の中身を移動させないので、取り出しは一定の時間で終わります。
- 空のときは `null` を返して、範囲外の読み取りを防ぎます。
- 取り出す値は、進める前の位置から読むのがポイントです。
