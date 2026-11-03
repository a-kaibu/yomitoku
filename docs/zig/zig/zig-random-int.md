---
title: 任意のビット数の整数を、必要なバイト数の乱数から作る
description: Zig 標準ライブラリの Random.int。ビット数を 8 の倍数に切り上げたバイト数の乱数を読み、上位の余分なビットを捨てて、指定の整数型として返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [111, 126]
function: Random.int
difficulty: 2
format: 2
tags: [乱数, 低レイヤ, 型システム]
---

## ひとことで

`int` は、指定した整数型の全範囲の乱数を作る関数です。乱数生成器からバイトの列を受け取り、そこから整数を組み立てます。ビット数が 8 の倍数でなくても、必要な分だけを使います。

## コード

::: code-group

```zig:line-numbers=111 [日本語訳]
pub fn int(r: Random, comptime T: type) T {
    const bits = @typeInfo(T).int.bits;
    const UnsignedT = std.meta.Int(.unsigned, bits);
    const ceil_bytes = comptime std.math.divCeil(u16, bits, 8) catch unreachable;
    const ByteAlignedT = std.meta.Int(.unsigned, ceil_bytes * 8);

    var rand_bytes: [ceil_bytes]u8 = undefined;
    r.bytes(&rand_bytes);

    // ネイティブではなくリトルエンディアンを使う方が、移植しやすいかもしれない。
    // TODO: 基の乱数生成器が移植可能でなければ、エンディアンの移植性には意味がない。
    // TODO: このライブラリのエンディアンの移植性を文書にする。
    const byte_aligned_result = mem.readInt(ByteAlignedT, &rand_bytes, .little);
    const unsigned_result: UnsignedT = @truncate(byte_aligned_result);
    return @bitCast(unsigned_result);
}
```

```zig:line-numbers=111 [原文]
pub fn int(r: Random, comptime T: type) T {
    const bits = @typeInfo(T).int.bits;
    const UnsignedT = std.meta.Int(.unsigned, bits);
    const ceil_bytes = comptime std.math.divCeil(u16, bits, 8) catch unreachable;
    const ByteAlignedT = std.meta.Int(.unsigned, ceil_bytes * 8);

    var rand_bytes: [ceil_bytes]u8 = undefined;
    r.bytes(&rand_bytes);

    // use LE instead of native endian for better portability maybe?
    // TODO: endian portability is pointless if the underlying prng isn't endian portable.
    // TODO: document the endian portability of this library.
    const byte_aligned_result = mem.readInt(ByteAlignedT, &rand_bytes, .little);
    const unsigned_result: UnsignedT = @truncate(byte_aligned_result);
    return @bitCast(unsigned_result);
}
```

:::

## 前提知識

- **乱数生成器（PRNG）**: バイトの列を作る生成器です。`Random` 型は、その出力を整数や小数に変えます。
- **バイト単位**: 生成器はバイト単位で乱数を渡します。ビット数が 8 の倍数でない型は、余分なビットを捨てる必要があります。
- **`ceil_bytes`**: ビット数を 8 で割って切り上げた、バイト数です。`std.math.divCeil` で求めます。
- **`mem.readInt`**: バイトの列を、指定した並び順の整数として読む関数です。
- **`@truncate`**: 整数の下位のビットを取り出して、小さい型にする組み込み関数です。

## 何をしているか

### 1. 必要なバイト数の乱数を読む

```zig:line-numbers=112
    const bits = @typeInfo(T).int.bits;
    const UnsignedT = std.meta.Int(.unsigned, bits);
    const ceil_bytes = comptime std.math.divCeil(u16, bits, 8) catch unreachable;
    const ByteAlignedT = std.meta.Int(.unsigned, ceil_bytes * 8);

    var rand_bytes: [ceil_bytes]u8 = undefined;
    r.bytes(&rand_bytes);
```

型のビット数から、必要なバイト数 `ceil_bytes` を求め、その分の乱数を `r.bytes` で読みます。

### 2. リトルエンディアンで整数を組み立てる

```zig:line-numbers=123
    const byte_aligned_result = mem.readInt(ByteAlignedT, &rand_bytes, .little);
    const unsigned_result: UnsignedT = @truncate(byte_aligned_result);
    return @bitCast(unsigned_result);
```

バイトの列を、リトルエンディアンでバイト単位の整数として読みます。そのあと `@truncate` で、必要なビット数の分だけを取り出し、`@bitCast` で元の符号付きの型に読み替えます。

## ここがすごい

- **必要な分だけ使う**: 8 の倍数でない型でも、余分なビットを捨てるだけで正しい範囲の値になります。
- **型の情報から決まる**: バイト数とビット数は、型から計算されます。型ごとの書き分けがありません。
- **符号付きも同じ形**: `@bitCast` で読み替えるので、符号付きの型も扱えます。
- **注釈が課題を残す**: 移植性についての TODO が、この関数の今後の課題を示しています。

## まとめ

- `int` は、型のビット数に必要なバイト数の乱数を読み、整数として組み立てます。
- 余分なビットは `@truncate` で捨て、符号付きは `@bitCast` で読み替えます。
- 他の整数の関数は、この `int` を土台に作られています。
