---
title: 負の値でも扱えるビットの左シフト
description: Zig 標準ライブラリの math.shl。シフト量が負なら右シフトに変え、ビット数を超える量は 0 か符号で埋める。ベクトルにも対応する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [592, 617]
function: shl
difficulty: 3
format: 2
tags: [ビット演算, 型システム]
---

## ひとことで

`shl` は、整数を左へシフトする関数です。シフト量が負のときは右へシフトし、ビット数を超えるシフトも安全に扱います。

## コード

```zig:line-numbers=592
pub fn shl(comptime T: type, a: T, shift_amt: anytype) T {
    const is_shl = shift_amt >= 0;
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
- **`Log2Int(T)`**: シフト量を表すのに必要な整数型です。
- **符号付きの右シフト**: 符号付きの値を右へずらすと、符号ビットで埋められます。
- **`@abs`**: 絶対値を返す組み込み関数です。

## 何をしているか

### 1. 符号でシフトの向きを決める

```zig:line-numbers=593
    const is_shl = shift_amt >= 0;
    const abs_shift_amt = @abs(shift_amt);
```

シフト量が 0 以上なら左向きです。シフト量の絶対値を、あとで使えるように取り出します。

### 2. ビット数を超えるシフトを処理する

```zig:line-numbers=597
            if (abs_shift_amt < info.bits) break :casted_shift_amt @as(
                Log2Int(T),
                @intCast(abs_shift_amt),
            );
            if (info.signedness == .unsigned or is_shl) return 0;
            return a >> (info.bits - 1);
```

シフト量がビット数より小さければ、そのまま使えます。超えるときは、符号なしか左向きなら 0 を返します。符号付きの右向きなら、符号ビットで埋めた値を返します。

### 3. ベクトルの要素も同じ考え方で扱う

```zig:line-numbers=607
            if (abs_shift_amt < child_info.bits) break :casted_shift_amt @as(
                @Vector(info.len, Log2Int(Child)),
                @splat(@as(Log2Int(Child), @intCast(abs_shift_amt))),
            );
            if (child_info.signedness == .unsigned or is_shl) return @splat(0);
            return a >> @splat(child_info.bits - 1);
```

ベクトルでは、要素型のビット数を使って、同じ判断を要素ごとに行います。

### 4. 向きに合わせてシフトする

```zig:line-numbers=616
    return if (is_shl) a << casted_shift_amt else a >> casted_shift_amt;
```

最後に、向きに合わせて `<<` か `>>` を使い、結果を返します。

## ここがすごい

- **負のシフトも扱える**: シフト量の正負で向きを変えるので、呼び出し側は向きを気にせず書けます。
- **範囲外で落ちない**: ビット数を超えるシフトは、0 か符号で埋めた値になり、未定義の動作になりません。
- **ベクトルも同じ形**: 配列の要素ごとに、同じルールで処理できます。

## まとめ

- `shl` は、シフト量が正なら左、負なら右へシフトします。
- ビット数を超えるシフトは、0 か符号で埋めた値を返します。
