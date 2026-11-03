---
title: アドレスを 2 のべき乗の境界へ切り上げる、ビット数で指定する版
description: Zig 標準ライブラリの mem.alignForwardLog2。2 のべき乗の指数だけを受け取り、1 を左にずらして境界の大きさを作ってから、アドレスを次の境界へ切り上げる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4701, 4704]
function: alignForwardLog2
difficulty: 2
format: 2
tags: [低レイヤ, ビット演算, メモリ管理]
---

## ひとことで

`alignForwardLog2` は、メモリのアドレスを、指定された境界の倍数へ切り上げる関数です。境界の大きさを、2 のべき乗の指数（何ビット目か）で渡せるのが特徴です。メモリ確保で、データを 16 バイト境界や 64 バイト境界に揃えるときに使われます。

## コード

```zig:line-numbers=4701
pub fn alignForwardLog2(addr: usize, log2_alignment: u8) usize {
    const alignment = @as(usize, 1) << @as(math.Log2Int(usize), @intCast(log2_alignment));
    return alignForward(usize, addr, alignment);
}
```

## 前提知識

- **アライメント（境界揃え）**: データの開始アドレスを、ある大きさの倍数にそろえることです。CPU の高速な読み書きや、命令の要求のために必要になることがあります。
- **切り上げ**: アドレスを、境界の倍数のうち、アドレス以上で最も小さいものにすることです。
- **2 のべき乗の指数**: 境界の大きさが 2 のべき乗のとき、その指数（例: 16 バイトなら指数は 4）です。
- **`@as(T, 1) << n`**: 1 を `n` ビット左にずらす計算です。`2^n` という値になります。
- **`@intCast`**: 値を、より小さいか別の整数型へ変換する組み込み関数です。値が範囲に収まるか、安全チェックで確かめます。

## 何をしているか

### 1. 指数から境界の大きさを作る

```zig:line-numbers=4702
    const alignment = @as(usize, 1) << @as(math.Log2Int(usize), @intCast(log2_alignment));
```

`1` を `log2_alignment` ビット左にずらして、境界の大きさ `alignment` を作ります。指数が 4 なら、`1 << 4` で 16 になります。

### 2. 次の境界へ切り上げる

```zig:line-numbers=4703
    return alignForward(usize, addr, alignment);
```

作った大きさを使って、一般の `alignForward` に任せます。境界の大きさを整数で受ける関数に、指数の代わりの値を渡す形です。

## ここがすごい

- **指数で指定できる**: 境界の大きさが 2 のべき乗なら、指数だけで指定できます。値が正しい 2 のべきになることが、型で保証されます。
- **計算の再利用**: 切り上げの本体は `alignForward` に任せ、この関数は変換だけを担当します。
- **誤りを安全チェックで捕まえる**: `@intCast` は範囲外の値を検査するので、大きすぎる指数はテストやデバッグのときに検出されます。
- **ビットシフトは 1 命令**: `1 << n` は、指数を値に変えるのに最も軽い方法です。

## まとめ

- `alignForwardLog2` は、境界の大きさを 2 のべき乗の指数で受け取ります。
- 1 を指数の分だけ左にずらして、境界の大きさを作ります。
- 切り上げの計算は、一般の `alignForward` に任せています。
