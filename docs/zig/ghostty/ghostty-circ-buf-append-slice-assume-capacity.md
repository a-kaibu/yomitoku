---
title: 円形バッファの末尾へ、スライスを 2 つの区間に分けて一度にコピーする
description: Ghostty の CircBuf.appendSliceAssumeCapacity。バッファの末尾の空きを getPtrSlice で 2 つの区間に分け、スライスをその順にコピーする。折り返しをまたぐ場合も扱える。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [96, 106]
function: CircBuf.appendSliceAssumeCapacity
difficulty: 3
format: 2
tags: [データ構造, 最適化, メモリ管理]
---

## ひとことで

`appendSliceAssumeCapacity` は、円形バッファの末尾に、スライスをまとめて追加する関数です。空きの領域が配列の末尾で切れていても、2 つの区間に分けて、順にコピーします。

## コード

```zig:line-numbers=96
        pub fn appendSliceAssumeCapacity(
            self: *Self,
            slice: []const T,
        ) void {
            const storage = self.getPtrSlice(
                self.len(),
                slice.len,
            );
            fastmem.copy(T, storage[0], slice[0..storage[0].len]);
            fastmem.copy(T, storage[1], slice[storage[0].len..]);
        }
```

## 前提知識

- **円形バッファの折り返し**: 配列の末尾を越えると、先頭に戻るので、空きの領域は 1 つにつながらないことがあります。
- **`getPtrSlice`**: 同じファイルの関数で、指定した位置から長さの分の領域を、最大 2 つの区間に分けて返します。
- **`fastmem.copy`**: 重ならないコピーの関数です。libc があれば、速い版を使います。
- **`self.len()`**: 今使われている要素の数です。ここが、追加の位置になります。
- **`slice[0..storage[0].len]`**: 最初の区間の長さの分だけ、スライスを切り出す書き方です。

## 何をしているか

### 1. 追加する領域を 2 つの区間で取る

```zig:line-numbers=100
            const storage = self.getPtrSlice(
                self.len(),
                slice.len,
            );
```

`getPtrSlice(self.len(), slice.len)` で、今の要素の後ろから、スライスの長さの分の領域を取ります。結果は 2 つの区間で、後ろの区間は、配列の末尾をまたいだ場合の続きです。

### 2. 最初の区間にコピーする

```zig:line-numbers=104
            fastmem.copy(T, storage[0], slice[0..storage[0].len]);
```

スライスの先頭から、最初の区間の長さの分をコピーします。

### 3. 残りを次の区間にコピーする

```zig:line-numbers=105
            fastmem.copy(T, storage[1], slice[storage[0].len..]);
```

残りのスライスを、2 つ目の区間にコピーします。2 つ目の区間が空なら、コピーは行われません。

## ここがすごい

- **折り返しを意識しない呼び出し**: 呼び出し側は、バッファがどこで折り返すかを気にしません。2 つの区間に分ける処理は、この関数の中にあります。
- **コピーを 2 回に分けるだけ**: 1 つずつ書くのではなく、区間ごとにまとめてコピーするので速いです。
- **位置の計算を取り出す**: 空きの位置の計算を `getPtrSlice` に任せ、この関数はコピーに集中しています。
- **容量の確認は呼び出し側**: 名前の `AssumeCapacity` が示すとおり、空きが十分かは呼び出し側が確かめます。

## まとめ

- `appendSliceAssumeCapacity` は、空きを 2 つの区間に分けて、スライスを順にコピーします。
- 折り返しをまたぐ場合も、同じ処理で扱えます。
- 容量が足りることは、呼び出し側が前提にします。
