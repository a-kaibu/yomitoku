---
title: リトルエンディアンの整数を、この機械の並び順に変える
description: Zig 標準ライブラリの mem.littleToNative。バイトの並び順がリトルエンディアンの値を、実行中の機械の並び順に直す。機械がリトルなら何もせず、ビッグなら byteSwap する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4191, 4196]
function: littleToNative
difficulty: 2
format: 2
tags: [低レイヤ, 型システム, 標準ライブラリ]
---

## ひとことで

`littleToNative` は、バイトの並び順が「リトルエンディアン」の整数を、この機械が使っている並び順に直す関数です。ファイルやネットワークから読んだデータを、正しい値として扱うために使います。

## コード

```zig:line-numbers=4191
pub fn littleToNative(comptime T: type, x: T) T {
    return switch (native_endian) {
        .little => x,
        .big => @byteSwap(x),
    };
}
```

## 前提知識

- **エンディアン**: 複数バイトの整数を、メモリに並べる順番です。リトルエンディアンは下位バイトを先に、ビッグエンディアンは上位バイトを先に並べます。
- **ネイティブ（native）の並び順**: 実行している機械が使う並び順です。`native_endian` という定数で表されます。
- **`@byteSwap`**: 整数のバイトの並びを逆にする組み込み関数です。ビッグとリトルの変換に使えます。
- **`switch`**: 機械の並び順ごとに、どの処理を行うかを決めています。
- **`comptime T`**: 整数の型を、コンパイル時に指定します。

## 何をしているか

### 1. 機械がリトルなら何もしない

```zig:line-numbers=4192
    return switch (native_endian) {
        .little => x,
        .big => @byteSwap(x),
    };
```

機械の並び順がリトルなら、入力はすでに正しい並びなので、そのまま返します。`@byteSwap` は呼ばれません。

### 2. 機械がビッグなら並べ替える

```zig:line-numbers=4194
        .big => @byteSwap(x),
```

機械がビッグなら、バイトの並びを反転させます。リトルの値を、ビッグの機械で正しい数に直すためです。

## ここがすごい

- **変換は必要なときだけ**: 機械の並び順が一致していれば、何もしないで済みます。
- **コンパイル時に決まる**: `native_endian` は定数なので、分岐はコンパイルの時点で一方だけが残ります。実行時の判定はありません。
- **1 関数で完結**: 呼び出し側は、機械の並び順を気にせず、リトルの値を渡せます。
- **兄弟の関数がある**: `bigToNative` や `toNative` と、対になって使えます。

## まとめ

- `littleToNative` は、リトルエンディアンの値を、機械の並び順に直します。
- 機械がリトルなら何もせず、ビッグなら `@byteSwap` で並べ替えます。
- 判定はコンパイル時に行われるので、実行時のコストがありません。
