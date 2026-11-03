---
title: 円形バッファの使用中の要素数を、先頭と末尾の位置から求める
description: Ghostty の CircBuf.len。先頭と末尾の差を使い、末尾が先頭より前にあるときは一周分を足して、使われている要素の数を返す。満杯の判定も含む。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [203, 207]
function: CircBuf.len
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, アルゴリズム]
---

## ひとことで

`len` は、円形バッファ（リングバッファ）の中に、今いくつの要素が入っているかを返す関数です。円形バッファは、配列の端と端がつながったものとして扱うデータ構造です。Ghostty では、直近の出力などを一定の大きさに保つために使われます。

## コード

```zig:line-numbers=203
        pub fn len(self: Self) usize {
            if (self.full) return self.storage.len;
            if (self.head >= self.tail) return self.head - self.tail;
            return self.storage.len - (self.tail - self.head);
        }
```

## 前提知識

- **円形バッファ（リングバッファ）**: 固定の大きさの配列を、端がつながっているとみなして使うデータ構造です。古いデータを上書きしながら、新しいデータを入れられます。
- **head と tail**: 書き込みの位置と、読み出しの位置を表す添字です。ここでは、先頭（`tail`）と書き込み位置（`head`）の意味で使われています。
- **`full` フラグ**: バッファが満杯かどうかを表す真偽値です。`head` と `tail` が同じ位置でも、空か満杯かを区別するために必要です。
- **`storage.len`**: 配列の全体の大きさです。
- **`self.head - self.tail`**: `head` が `tail` より後ろにあるときの差です。

## 何をしているか

### 1. 満杯なら全体の大きさ

```zig:line-numbers=204
            if (self.full) return self.storage.len;
```

`full` が真なら、バッファは満杯です。使用中の要素の数は、配列の大きさそのものになります。

### 2. 先頭が後ろにあるなら差を取る

```zig:line-numbers=205
            if (self.head >= self.tail) return self.head - self.tail;
```

`head` が `tail` 以上なら、配列の中で連続して使われています。その差が要素の数です。

### 3. 端をまたぐなら一周分を補う

```zig:line-numbers=206
            return self.storage.len - (self.tail - self.head);
```

`head` が `tail` より前にあるときは、データが配列の末尾から先頭へまたがっています。配列の大きさから、空いている部分（`tail - head`）を引いて数えます。

## ここがすごい

- **満杯を先に判定**: `full` を最初に見るので、`head == tail` の曖昧な場合を、きちんと区別しています。
- **一周の計算を 1 行で**: 端をまたぐ場合も、配列の大きさから空きを引くだけで求まります。
- **状態を持つ変数が少ない**: 要素の数を別の変数に持たず、位置から毎回計算します。更新の手間が減り、ずれが起きにくくなります。
- **`empty` と対になる**: 同じファイルの `empty` は、`len` と同じ情報を使って、空かどうかを判定します。

## まとめ

- `len` は、先頭と末尾の位置と満杯の印から、要素の数を求めます。
- 満杯のときは配列の大きさ、そうでなければ位置の差で数えます。
- 端をまたぐ場合は、一周分を補って正しい数を返します。
