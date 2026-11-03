---
title: 満杯なら書き込みを断る、固定サイズのリングバッファへの追加
description: Ghostty の CircBuf.append。配列の末尾に達したら先頭へ戻り、head と tail がぶつかったら満杯とみなす、リングバッファの基本の動き。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [78, 84]
function: CircBuf.append
difficulty: 2
format: 2
tags: [データ構造, メモリ管理]
---

## ひとことで

`append` は、リングバッファ（円形のバッファ）の末尾に 1 つの値を追加する関数です。リングバッファは、固定の大きさの配列を輪のように使う仕組みで、Ghostty では端末の出力を一時的にためておくのに使われています。

満杯のときは、新しい値を入れずに `OutOfMemory` のエラーを返します。配列を大きくはしません。

## コード

```zig:line-numbers=78
        pub fn append(self: *Self, v: T) Allocator.Error!void {
            if (self.full) return error.OutOfMemory;
            self.storage[self.head] = v;
            self.head += 1;
            if (self.head >= self.storage.len) self.head = 0;
            self.full = self.head == self.tail;
        }
```
## 前提知識

- **リングバッファ（円形バッファ）**: 配列の終わりまで来たら、先頭へ戻って使い続けるデータ構造です。古いデータを捨てずに追い出す仕組みを、配列 1 つで実現できます。
- **`head` と `tail`**: `head` は次に書き込む位置、`tail` は一番古いデータのある位置です。読み出し側が `tail` を進めて、データを取り出します。
- **`full`**: 満杯かどうかを表す真偽値です。`head` と `tail` が同じ位置にあるだけでは、空なのか満杯なのか区別できないので、別に持っています。
- **`storage: []T`**: 値を入れる配列（スライス）です。
- **`Allocator.Error!void`**: 失敗したら `error.OutOfMemory` を返す関数の型です。`!void` は、成功なら値を返さず、失敗ならエラーを返すという意味です。
- **`if (...) return error.OutOfMemory;`**: 条件が真ならエラーを返して、すぐ関数を終わらせる書き方です。

## 何をしているか

### 1. 満杯なら何もせずエラーを返す

```zig:line-numbers=79
            if (self.full) return error.OutOfMemory;
```

`full` が真なら、バッファに空きがありません。値を入れず、エラーを返します。入れ替えや拡張は、この関数の仕事ではありません。

### 2. 今の head の位置に書き込み、head を進める

```zig:line-numbers=80
            self.storage[self.head] = v;
            self.head += 1;
            if (self.head >= self.storage.len) self.head = 0;
```

値を `head` の位置に書き、`head` を 1 つ進めます。末尾の外に出たら、`head` を 0 に戻します。これが「輪」の部分です。

たとえば大きさ 4 のバッファで `head` が 3 のとき、次の追加は位置 3 に書き、`head` は 4 になります。4 は配列の外なので、0 に戻ります。

### 3. head と tail が一致したら満杯

```zig:line-numbers=83
            self.full = self.head == self.tail;
```

書き込みのあと、`head` と `tail` が同じ位置なら、バッファは満杯です。空のときも `head == tail` ですが、空のときは追加の直後にここへ来ることはありません。空の状態から追加すると、必ず `head` が 1 つ進むので、ここで `full` が真になるのは満杯のときだけです。

## ここがすごい

- **配列 1 つで循環させる**: 値を押し出すたびに配列を詰め直すと、コストが大きくなります。`head` を循環させると、配列を動かさずに済みます。
- **満杯の判定を専用の変数に**: `full` を別に持つことで、「空」と「満杯」を区別できます。そのため、読み書きの判定が単純になります。
- **メモリを増やさない**: 満杯のときに自動で大きくしないので、確保するメモリの量が一定です。ターミナルのように、バッファの大きさを前もって決めておく場面に向いています。
- **エラーを隠さない**: 満杯で書けないことを、呼び出し側へエラーで伝えます。書けなかったのに成功したように見えることはありません。

## まとめ

- リングバッファは、配列の末尾から先頭へ戻ることで、固定の大きさで繰り返し使えます。
- 書き込み位置の `head` を進め、端では 0 に戻すのが基本です。
- `head` と `tail` が一致したら満杯とみなし、`full` で記録します。
- 満杯のときはエラーを返して、勝手にメモリを増やさない設計です。
