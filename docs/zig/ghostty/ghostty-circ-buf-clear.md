---
title: 円形バッファを空に戻して、先頭と末尾と満杯の印を初期化する
description: Ghostty の CircBuf.clear。先頭と末尾の位置を 0 に戻し、満杯の印を配列の大きさが 0 かどうかで決める。中身を消さずに、要素の数だけをリセットする。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [109, 113]
function: CircBuf.clear
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング]
---

## ひとことで

`clear` は、円形バッファを空の状態に戻す関数です。中身の値は消しません。位置と満杯の印を初期値に戻すことで、バッファの中身が使われていない状態にします。

## コード

```zig:line-numbers=109
        pub fn clear(self: *Self) void {
            self.head = 0;
            self.tail = 0;
            self.full = self.storage.len == 0;
        }
```

## 前提知識

- **head と tail**: 書き込みの位置と、読み出しの位置を表す添字です。両方を 0 に戻すと、先頭に戻ります。
- **`full` フラグ**: 満杯かどうかを表す印です。空のときに、満杯と誤解されないように初期化が必要です。
- **`storage`**: 円形バッファの値を入れておく配列です。`clear` ではこの配列には触れません。
- **`storage.len == 0`**: 配列の大きさが 0 の場合は、満杯とみなすという判定です。
- **中身を消さない**: 値そのものを上書きしないので、速く終わります。

## 何をしているか

### 1. 位置を先頭に戻す

```zig:line-numbers=110
            self.head = 0;
            self.tail = 0;
```

`head` と `tail` を 0 に戻します。これで、読み出しと書き込みの位置が先頭で一致します。

### 2. 満杯の印を決める

```zig:line-numbers=112
            self.full = self.storage.len == 0;
```

満杯の印は、配列の大きさが 0 のときだけ真にします。大きさが 1 以上なら、空の状態なので偽です。

## ここがすごい

- **中身を消さずに済む**: 位置と印だけを変えるので、大きな配列でも一瞬で終わります。
- **印の決め方が堅実**: 大きさ 0 のバッファは、書き込める場所がないので満杯と扱います。空の判定の曖昧さを、この印で解決しています。
- **読み手にやさしい**: 3 行の代入で、状態が初期値に戻ることが読めます。
- **`empty` と整合**: 同じファイルの `empty` は、`full` と位置の一致を見ます。`clear` の後で、`empty` が真になります。

## まとめ

- `clear` は、先頭と末尾の位置を 0 に戻し、満杯の印を初期化します。
- 中身の値は消さず、位置と印だけを変えます。
- 空のバッファとして使い直せます。
