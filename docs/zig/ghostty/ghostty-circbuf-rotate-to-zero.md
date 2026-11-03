---
title: リングバッファのずれを、配列の回転でまっすぐに直す
description: Ghostty の CircBuf.rotateToZero。先頭がずれたリングバッファを std.mem.rotate で並べ直し、先頭を配列の 0 番目に戻す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [179, 189]
function: CircBuf.rotateToZero
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, アルゴリズム]
---

## ひとことで

`rotateToZero` は、リングバッファの一番古いデータ（`tail`）を、配列の 0 番目に移す関数です。
リングバッファは、輪のように書き込むので、データが配列の途中から末尾を越えて先頭へ続くことがあります。この関数は、そのずれを配列の中で解消して、データが 0 番目から並ぶ状態にします。

ずれを直すと、一続きのスライスとして、データをまとめて扱えるようになります。

## コード

::: code-group

```zig:line-numbers=179 [日本語訳]
        fn rotateToZero(self: *Self) Allocator.Error!void {
            // すでに 0 の位置にあれば何もしない。
            if (self.tail == 0) return;

            // std.mem.rotate で、storage を別の場所へ移さずに回転させる。
            std.mem.rotate(T, self.storage, self.tail);

            // そのあとで head と tail の値を直す。
            self.head = self.len() % self.storage.len;
            self.tail = 0;
        }
```

```zig:line-numbers=179 [原文]
        fn rotateToZero(self: *Self) Allocator.Error!void {
            // If we're already at zero then do nothing.
            if (self.tail == 0) return;

            // We use std.mem.rotate to rotate our storage in-place.
            std.mem.rotate(T, self.storage, self.tail);

            // Then fix up our head and tail.
            self.head = self.len() % self.storage.len;
            self.tail = 0;
        }
```

:::

## 前提知識

- **`tail` と `head`**: `tail` は一番古いデータの位置、`head` は次に書き込む位置です。`tail` が 0 でないなら、データが配列の途中から始まっています。
- **`std.mem.rotate`**: 配列の要素を、指定の数だけ左へ回転させる標準ライブラリの関数です。配列の外に新しい領域を作らず、中で並べ替えます。
- **`self.len() % self.storage.len`**: データの個数を、配列の大きさで割った余りです。配列の端を越えないための計算です。
- **`Allocator.Error!void`**: 関数の戻り値の型です。この関数は、エラーを返す可能性を型に含めています。
- **`in-place`（その場で）**: 追加の配列を作らず、元の配列の中だけで処理することです。

## 何をしているか

### 1. すでに 0 の位置なら何もしない

```zig:line-numbers=180
            // If we're already at zero then do nothing.
            if (self.tail == 0) return;
```

`tail` が 0 なら、データはすでに配列の先頭から並んでいます。回転は不要なので、すぐ戻ります。

### 2. 配列全体を tail の分だけ回転させる

```zig:line-numbers=183
            // We use std.mem.rotate to rotate our storage in-place.
            std.mem.rotate(T, self.storage, self.tail);
```

`std.mem.rotate` は、配列の先頭から `tail` 個分の要素を、配列の後ろへ回します。たとえば `[C, D, A, B]` の配列で `tail = 2` なら、回転後は `[A, B, C, D]` になります。古いデータ `A` が 0 番目に来ます。

この回転は、配列の中だけで行われます。追加の配列を確保しないので、メモリ不足の心配がありません。

### 3. head と tail を直す

```zig:line-numbers=187
            self.head = self.len() % self.storage.len;
            self.tail = 0;
```

回転したあとは、データが 0 番目から並んでいます。`tail` は 0 にします。`head` は、データの個数（`len()`）を配列の大きさで割った余りです。データが満杯のときは、ちょうど配列の大きさで割り切れるので、`head` は 0 になります。

## ここがすごい

- **ずれの解消を 1 つの関数に**: 回転という 1 つの操作で、データの並びと `head`、`tail` をまとめて直せます。
- **追加のメモリが要らない**: `std.mem.rotate` は、配列の中で入れ替えるので、一時的な配列を作りません。大きなバッファでも、メモリの使用量が増えません。
- **0 番目から並べると扱いやすい**: 並べ直すと、データを 1 つの連続したスライスとして渡せます。この後の処理（書き出しや検索）が簡単になります。
- **すでに整っている場合は仕事をしない**: `tail == 0` の早期リターンで、回転を省けます。

## まとめ

- リングバッファのデータは、配列の途中から末尾を越えて続くことがあります。
- `std.mem.rotate` で配列を回転させると、古いデータを 0 番目に並べ直せます。
- 回転後は `tail` を 0 にし、`head` をデータの個数から求め直します。
- 追加のメモリを使わず、その場で並べ直すのが特徴です。
