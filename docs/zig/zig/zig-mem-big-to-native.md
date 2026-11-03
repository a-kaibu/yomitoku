---
title: ビッグエンディアンの整数を、機械の並び順に変える
description: Zig 標準ライブラリの mem.bigToNative。バイトの並び順がビッグエンディアンの値を、実行中の機械の並び順に直す。機械がリトルなら byteSwap し、ビッグなら何もしない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4199, 4204]
function: bigToNative
difficulty: 2
format: 2
tags: [低レイヤ, 型システム, 標準ライブラリ]
---

## ひとことで

`bigToNative` は、バイトの並び順が「ビッグエンディアン」の整数を、この機械の並び順に直す関数です。ネットワークの通信で使われるデータの多くは、ビッグエンディアンなので、この変換が必要になります。

## コード

```zig:line-numbers=4199
pub fn bigToNative(comptime T: type, x: T) T {
    return switch (native_endian) {
        .little => @byteSwap(x),
        .big => x,
    };
}
```

## 前提知識

- **ビッグエンディアン**: 上位バイトを先に並べる方式です。ネットワークの標準の並び順として使われます。
- **ネイティブの並び順**: 機械が使う並び順で、`native_endian` で表されます。
- **`@byteSwap`**: 整数のバイトの並びを反転させる組み込み関数です。
- **`littleToNative` との対**: 同じファイルの `littleToNative` は、逆の並び順の値を扱います。
- **コンパイル時の分岐**: `switch (native_endian)` は、コンパイル時に決まるので、片方の処理だけが残ります。

## 何をしているか

### 1. 機械がリトルなら並べ替える

```zig:line-numbers=4200
    return switch (native_endian) {
        .little => @byteSwap(x),
        .big => x,
    };
```

機械の並び順がリトルなら、ビッグの値はバイトを反転させる必要があります。`@byteSwap` で反転した値を返します。

### 2. 機械がビッグなら何もしない

```zig:line-numbers=4202
        .big => x,
```

機械もビッグなら、入力はすでに正しい並びなので、そのまま返します。

## ここがすごい

- **通信のデータを直接扱える**: ネットワークから読んだ値を、この関数 1 回で機械の値にできます。
- **無駄な変換がない**: 並び順が一致する機械では、何もせずに返します。
- **対称な作り**: `littleToNative` と全く同じ形で、中の `switch` の対応だけが反対になっています。
- **型を選ばない**: `comptime T` で、どの整数型でも使えます。

## まとめ

- `bigToNative` は、ビッグエンディアンの値を、機械の並び順に直します。
- リトルの機械では `@byteSwap` で反転し、ビッグの機械では何もしません。
- ネットワークのデータを扱うときによく使われます。
