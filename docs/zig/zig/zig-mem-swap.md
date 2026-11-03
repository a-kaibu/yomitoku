---
title: 二つの値の中身を入れ替える
description: Zig 標準ライブラリの mem.swap。コンパイル時は値をそのまま入れ替え、実行時は両方のバイトを一つずつ入れ替える。一時変数を必要としない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3826, 3843]
function: swap
difficulty: 3
format: 2
tags: [メモリ管理, 低レイヤ]
---

## ひとことで

`swap` は、二つの値の中身を入れ替える関数です。実行時には、値のバイトを先頭から一つずつ入れ替えます。

## コード

::: code-group

```zig:line-numbers=3826 [日本語訳]
pub fn swap(comptime T: type, noalias a: *T, noalias b: *T) void {
    if (@inComptime()) {
        // コンパイル時は、レイアウトが決まっていない値のバイトにアクセスするとコンパイルエラーになる。
        const tmp = a.*;
        a.* = b.*;
        b.* = tmp;
    } else {
        // 全体を一度に入れ替えず、先頭から終わりへ順に入れ替えることで、
        // 最適化しやすく、スタックの使用量も減らせる。
        const a_bytes: []align(@alignOf(T)) u8 = @ptrCast(a);
        const b_bytes: []align(@alignOf(T)) u8 = @ptrCast(b);
        for (a_bytes, b_bytes) |*ab, *bb| {
            const tmp = ab.*;
            ab.* = bb.*;
            bb.* = tmp;
        }
    }
}
```

```zig:line-numbers=3826 [原文]
pub fn swap(comptime T: type, noalias a: *T, noalias b: *T) void {
    if (@inComptime()) {
        // In comptime, accessing bytes of values with no defined layout is a compile error.
        const tmp = a.*;
        a.* = b.*;
        b.* = tmp;
    } else {
        // Swapping in streaming nature from start to end instead of swapping
        // everything in one step allows easier optimizations and less stack usage.
        const a_bytes: []align(@alignOf(T)) u8 = @ptrCast(a);
        const b_bytes: []align(@alignOf(T)) u8 = @ptrCast(b);
        for (a_bytes, b_bytes) |*ab, *bb| {
            const tmp = ab.*;
            ab.* = bb.*;
            bb.* = tmp;
        }
    }
}
```

:::

## 前提知識

- **ポインタ**: 別の値の場所を指す値です。`*T` と書きます。
- **`noalias`**: 2 つのポインタが同じ場所を指さないことを、コンパイラに伝える指定です。
- **`@inComptime`**: 今がコンパイル時かを調べる組み込み関数です。
- **`@ptrCast`**: ポインタの型を別の型として読み替える組み込み関数です。
- **レイアウト**: 値がメモリ上でどう並ぶかの決まりです。

## 何をしているか

### 1. コンパイル時は値をそのまま入れ替える

::: code-group

```zig:line-numbers=3827 [日本語訳]
    if (@inComptime()) {
        // コンパイル時は、レイアウトが決まっていない値のバイトにアクセスするとコンパイルエラーになる。
        const tmp = a.*;
        a.* = b.*;
        b.* = tmp;
```

```zig:line-numbers=3827 [原文]
    if (@inComptime()) {
        // In comptime, accessing bytes of values with no defined layout is a compile error.
        const tmp = a.*;
        a.* = b.*;
        b.* = tmp;
```

:::

コンパイル時には、一時変数を使って値をそのまま入れ替えます。バイトを直接読むと、レイアウトが決まっていない値でエラーになるためです。

### 2. 実行時はバイトを一つずつ入れ替える

::: code-group

```zig:line-numbers=3833 [日本語訳]
        // 全体を一度に入れ替えず、先頭から終わりへ順に入れ替えることで、
        // 最適化しやすく、スタックの使用量も減らせる。
        const a_bytes: []align(@alignOf(T)) u8 = @ptrCast(a);
        const b_bytes: []align(@alignOf(T)) u8 = @ptrCast(b);
        for (a_bytes, b_bytes) |*ab, *bb| {
            const tmp = ab.*;
            ab.* = bb.*;
            bb.* = tmp;
        }
```

```zig:line-numbers=3833 [原文]
        // Swapping in streaming nature from start to end instead of swapping
        // everything in one step allows easier optimizations and less stack usage.
        const a_bytes: []align(@alignOf(T)) u8 = @ptrCast(a);
        const b_bytes: []align(@alignOf(T)) u8 = @ptrCast(b);
        for (a_bytes, b_bytes) |*ab, *bb| {
            const tmp = ab.*;
            ab.* = bb.*;
            bb.* = tmp;
        }
```

:::

値を、バイトの配列として見直します。両方のバイトを先頭から組にして、それぞれ入れ替えます。

### 3. 一つのバイトを入れ替える

```zig:line-numbers=3837
        for (a_bytes, b_bytes) |*ab, *bb| {
            const tmp = ab.*;
            ab.* = bb.*;
            bb.* = tmp;
```

一時変数に片方のバイトを退避し、もう片方を入れ、退避した値を戻します。

## ここがすごい

- **一時変数は 1 バイト分**: 値全体のコピーを作らないので、大きな値でもスタックを圧迫しません。
- **コンパイル時と実行時で分ける**: 実行時の速い方法と、コンパイル時に使える安全な方法を両立させています。
- **`noalias` で最適化を助ける**: 2 つの場所が重ならないと伝えるので、コンパイラが並べ替えを行いやすくなります。

## まとめ

- `swap` は、二つの値の中身を入れ替えます。
- 実行時はバイトを一つずつ入れ替え、コンパイル時は値をそのまま入れ替えます。
