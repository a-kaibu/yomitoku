---
title: 揃えるために必要な要素数を求める
description: Zig 標準ライブラリの mem.alignPointerOffset。ポインタを指定のアラインメントに揃えるには、先頭から何要素ずらせばよいかを返す。揃えられなければ null。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4244, 4268]
function: alignPointerOffset
difficulty: 3
format: 2
tags: [メモリ管理, 低レイヤ]
---

## ひとことで

`alignPointerOffset` は、ポインタを指定したアラインメントの境界に揃えるには、先頭から何要素進めればよいかを返す関数です。揃えられないときは `null` を返します。

## コード

::: code-group

```zig:line-numbers=4244 [日本語訳]
pub fn alignPointerOffset(ptr: anytype, align_to: usize) ?usize {
    assert(isValidAlign(align_to));

    const T = @TypeOf(ptr);
    const info = @typeInfo(T);
    if (info != .pointer or info.pointer.size != .many)
        @compileError("expected many item pointer, got " ++ @typeName(T));

    // ポインタがすでに十分に揃っていれば、何もしない。
    if (align_to <= info.pointer.alignment)
        return 0;

    // オーバーフローに注意しながら、揃えた後の基準のアドレスを計算する。
    const addr = @intFromPtr(ptr);
    var ov = @addWithOverflow(addr, align_to - 1);
    if (ov[1] != 0) return null;
    ov[0] &= ~@as(usize, align_to - 1);

    // 差分はバイト単位で出るので、子の型の要素数に変換する。
    // 型の要素数に変換する。
    const delta = ov[0] - addr;
    const pointee_size = @sizeOf(info.pointer.child);
    if (delta % pointee_size != 0) return null;
    return delta / pointee_size;
}
```

```zig:line-numbers=4244 [原文]
pub fn alignPointerOffset(ptr: anytype, align_to: usize) ?usize {
    assert(isValidAlign(align_to));

    const T = @TypeOf(ptr);
    const info = @typeInfo(T);
    if (info != .pointer or info.pointer.size != .many)
        @compileError("expected many item pointer, got " ++ @typeName(T));

    // Do nothing if the pointer is already well-aligned.
    if (align_to <= info.pointer.alignment)
        return 0;

    // Calculate the aligned base address with an eye out for overflow.
    const addr = @intFromPtr(ptr);
    var ov = @addWithOverflow(addr, align_to - 1);
    if (ov[1] != 0) return null;
    ov[0] &= ~@as(usize, align_to - 1);

    // The delta is expressed in terms of bytes, turn it into a number of child
    // type elements.
    const delta = ov[0] - addr;
    const pointee_size = @sizeOf(info.pointer.child);
    if (delta % pointee_size != 0) return null;
    return delta / pointee_size;
}
```

:::

## 前提知識

- **アラインメント**: 値を置いてよいアドレスの単位です。2 の冪で指定し、そのアドレスの倍数に置く決まりです。
- **多要素ポインタ（`[*]T`）**: 要素の並びの先頭を指すポインタです。
- **`@addWithOverflow`**: 足し算をして、溢れたかも同時に返す組み込み関数です。
- **`@intFromPtr`**: ポインタをアドレスの整数に変える組み込み関数です。

## 何をしているか

### 1. すでに揃っていれば 0 を返す

::: code-group

```zig:line-numbers=4252 [日本語訳]
    // ポインタがすでに十分に揃っていれば、何もしない。
    if (align_to <= info.pointer.alignment)
        return 0;
```

```zig:line-numbers=4252 [原文]
    // Do nothing if the pointer is already well-aligned.
    if (align_to <= info.pointer.alignment)
        return 0;
```

:::

要求されたアラインメントが、もともとの型のアラインメント以下なら、ずらす必要はありません。0 を返します。

### 2. 次の境界のアドレスを計算する

::: code-group

```zig:line-numbers=4256 [日本語訳]
    // オーバーフローに注意しながら、揃えた後の基準のアドレスを計算する。
    const addr = @intFromPtr(ptr);
    var ov = @addWithOverflow(addr, align_to - 1);
    if (ov[1] != 0) return null;
    ov[0] &= ~@as(usize, align_to - 1);
```

```zig:line-numbers=4256 [原文]
    // Calculate the aligned base address with an eye out for overflow.
    const addr = @intFromPtr(ptr);
    var ov = @addWithOverflow(addr, align_to - 1);
    if (ov[1] != 0) return null;
    ov[0] &= ~@as(usize, align_to - 1);
```

:::

アドレスに「揃えたい値 - 1」を足し、下位のビットを落とします。足し算が溢れたときは、揃えられないので `null` を返します。

### 3. 差分を要素数に直す

::: code-group

```zig:line-numbers=4262 [日本語訳]
    // 差分はバイト単位で出るので、子の型の要素数に変換する。
    // 型の要素数に変換する。
    const delta = ov[0] - addr;
    const pointee_size = @sizeOf(info.pointer.child);
    if (delta % pointee_size != 0) return null;
    return delta / pointee_size;
```

```zig:line-numbers=4262 [原文]
    // The delta is expressed in terms of bytes, turn it into a number of child
    // type elements.
    const delta = ov[0] - addr;
    const pointee_size = @sizeOf(info.pointer.child);
    if (delta % pointee_size != 0) return null;
    return delta / pointee_size;
```

:::

バイト単位の差分を求めます。それが要素の大きさで割り切れないときは `null`、割り切れれば要素数を返します。

## ここがすごい

- **溢れを検出する**: 境界を求める足し算が溢れたら、誤ったアドレスを返さず `null` にします。
- **要素の境界に限る**: 要素の大きさで割り切れないずれ方は認めないので、要素の途中を指すことがありません。

## まとめ

- `alignPointerOffset` は、揃えるための要素数を返します。
- 溢れや要素の途中に当たる場合は、`null` を返します。
