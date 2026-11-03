---
title: 負の値でも扱えるビットの右シフト
description: Zig 標準ライブラリの math.shr。シフト量が負なら左シフトに変え、ビット数を超える量は 0 か符号で埋める。shl と対になる関数。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [641, 666]
function: shr
difficulty: 3
format: 2
tags: [ビット演算, 型システム]
---

## ひとことで

`shr` は、整数を右へシフトする関数です。シフト量が負のときは左へシフトし、ビット数を超えるシフトも安全に扱います。

## コード

```zig:line-numbers=641
pub fn shr(comptime T: type, a: T, shift_amt: anytype) T {
    const is_shl = shift_amt < 0;
    const abs_shift_amt = @abs(shift_amt);
    const casted_shift_amt = casted_shift_amt: switch (@typeInfo(T)) {
        .int => |info| {
            if (abs_shift_amt < info.bits) break :casted_shift_amt @as(
                Log2Int(T),
                @intCast(abs_shift_amt),
            );
            if (info.signedness == .unsigned or is_shl) return 0;
            return a >> (info.bits - 1);
        },
        .vector => |info| {
            const Child = info.child;
            const child_info = @typeInfo(Child).int;
            if (abs_shift_amt < child_info.bits) break :casted_shift_amt @as(
                @Vector(info.len, Log2Int(Child)),
                @splat(@as(Log2Int(Child), @intCast(abs_shift_amt))),
            );
            if (child_info.signedness == .unsigned or is_shl) return @splat(0);
            return a >> @splat(child_info.bits - 1);
        },
        else => comptime unreachable,
    };
    return if (is_shl) a << casted_shift_amt else a >> casted_shift_amt;
}
```

## 前提知識

- **ビットシフト**: 整数のビットを左または右へずらす操作です。
- **`<<` と `>>`**: 左と右へのビットシフトの演算子です。
- **符号付きの右シフト**: 符号付きの値を右へずらすと、符号ビットで埋められます。
- **`shl`**: 向きが反対の、左シフトの関数です。

## 何をしているか

### 1. 符号でシフトの向きを決める

```zig:line-numbers=642
    const is_shl = shift_amt < 0;
    const abs_shift_amt = @abs(shift_amt);
```

`shl` と逆に、シフト量が負のときを左向きとみなします。絶対値は、あとで使うために取り出します。

### 2. ビット数を超えるシフトを処理する

```zig:line-numbers=646
            if (abs_shift_amt < info.bits) break :casted_shift_amt @as(
                Log2Int(T),
                @intCast(abs_shift_amt),
            );
            if (info.signedness == .unsigned or is_shl) return 0;
            return a >> (info.bits - 1);
```

シフト量がビット数より小さければ、そのまま使えます。超えるときは、符号なしか左向きなら 0 を返します。符号付きの右向きなら、符号ビットで埋めた値を返します。

### 3. ベクトルの要素も同じ考え方で扱う

```zig:line-numbers=656
            if (abs_shift_amt < child_info.bits) break :casted_shift_amt @as(
                @Vector(info.len, Log2Int(Child)),
                @splat(@as(Log2Int(Child), @intCast(abs_shift_amt))),
            );
            if (child_info.signedness == .unsigned or is_shl) return @splat(0);
            return a >> @splat(child_info.bits - 1);
```

ベクトルでは、要素型のビット数を使って、要素ごとに同じ判断を行います。

### 4. 向きに合わせてシフトする

```zig:line-numbers=665
    return if (is_shl) a << casted_shift_amt else a >> casted_shift_amt;
```

最後に、向きに合わせて `<<` か `>>` を使い、結果を返します。

## ここがすごい

- **`shl` と対になる**: 同じ構造で向きだけ反対にしているので、読み比べると違いがすぐわかります。
- **範囲外で落ちない**: ビット数を超えるシフトは、0 か符号で埋めた値になります。
- **符号の扱いが明確**: 符号付きと符号なしで、埋める値が違うことを明示しています。

## まとめ

- `shr` は、シフト量が正なら右、負なら左へシフトします。
- ビット数を超えるシフトは、符号なしなら 0、符号付きなら符号で埋めた値を返します。
