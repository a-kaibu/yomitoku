---
title: 任意の長さのバイト列を整数として読む
description: Zig 標準ライブラリの mem.readVarInt。バイト列の長さに関係なく、指定の並び順で整数に組み立て、戻り値の型のビット数に切り詰める。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1815, 1835]
function: readVarInt
difficulty: 3
format: 2
tags: [ビット演算, 型システム]
---

## ひとことで

`readVarInt` は、長さが決まったバイト列を、指定した並び順で整数として読む関数です。バイトの数が型のサイズより少なくても使えます。

## コード

```zig:line-numbers=1815
pub fn readVarInt(comptime ReturnType: type, bytes: []const u8, endian: Endian) ReturnType {
    assert(@typeInfo(ReturnType).int.bits >= bytes.len * 8);
    const bits = @typeInfo(ReturnType).int.bits;
    const signedness = @typeInfo(ReturnType).int.signedness;
    const WorkType = std.meta.Int(signedness, @max(16, bits));
    var result: WorkType = 0;
    switch (endian) {
        .big => {
            for (bytes) |b| {
                result = (result << 8) | b;
            }
        },
        .little => {
            const ShiftType = math.Log2Int(WorkType);
            for (bytes, 0..) |b, index| {
                result = result | (@as(WorkType, b) << @as(ShiftType, @intCast(index * 8)));
            }
        },
    }
    return @truncate(result);
}
```

## 前提知識

- **エンディアン**: 複数バイトの整数で、どちらのバイトを先に置くかの決まりです。ビッグエンディアンは上位バイトが先、リトルエンディアンは下位バイトが先です。
- **`std.meta.Int`**: 符号の有無とビット数を指定して、整数型を作る関数です。
- **`@truncate`**: 整数の下位のビットだけを取り出す組み込み関数です。
- **`Log2Int`**: シフト量を表す整数型です。

## 何をしているか

### 1. 戻り値の型からビット数と符号を取り出す

```zig:line-numbers=1817
    const bits = @typeInfo(ReturnType).int.bits;
    const signedness = @typeInfo(ReturnType).int.signedness;
```

戻り値の型のビット数と符号を、あとで使うために取り出します。

### 2. 余裕のある作業用の整数を用意する

```zig:line-numbers=1819
    const WorkType = std.meta.Int(signedness, @max(16, bits));
    var result: WorkType = 0;
```

16 ビット以上の作業用の整数を用意します。バイトを足し込むときに、溢れないようにするためです。

### 3. ビッグエンディアンは上位から順に詰める

```zig:line-numbers=1822
        .big => {
            for (bytes) |b| {
                result = (result << 8) | b;
            }
        },
```

バイトを先頭から一つずつ読み、結果を 8 ビット左にずらしてから `|` で足します。先に読んだバイトほど上位に残ります。

### 4. リトルエンディアンは下位から順に詰める

```zig:line-numbers=1827
        .little => {
            const ShiftType = math.Log2Int(WorkType);
            for (bytes, 0..) |b, index| {
                result = result | (@as(WorkType, b) << @as(ShiftType, @intCast(index * 8)));
            }
        },
```

各バイトを、その位置に 8 倍したビット数だけ左にずらして足します。先に読んだバイトほど下位に残ります。

### 5. 必要なビット数に切り詰めて返す

```zig:line-numbers=1834
    return @truncate(result);
```

作業用の整数から、戻り値の型のビット数の分だけを `@truncate` で取り出して返します。

## ここがすごい

- **長さを型から決めない**: バイト列の長さは引数で受け取るので、同じ関数で何バイトでも読めます。
- **並び順を選べる**: エンディアンを指定するだけで、ネットワークやファイルの形式に合わせて読めます。
- **溢れを防ぐ作業領域**: 16 ビット以上の作業用の整数を使うので、途中で値が壊れません。

## まとめ

- `readVarInt` は、長さが違うバイト列を、指定の並び順で整数に組み立てます。
- 作業用の整数で組み立てたあと、`@truncate` で戻り値の型に合わせます。
