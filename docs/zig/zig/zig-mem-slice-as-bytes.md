---
title: スライスを中身のバイト列として見る
description: Zig 標準ライブラリの mem.sliceAsBytes。要素の並びを、要素の大きさ分のバイト列のスライスとして読み替える。サイズがゼロや空の場合の扱いも含む。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [4587, 4600]
function: sliceAsBytes
difficulty: 3
format: 2
tags: [メモリ管理, 低レイヤ]
---

## ひとことで

`sliceAsBytes` は、要素の並びを、その中身のバイト列として読み替える関数です。新しい配列は作らず、同じメモリを別の型として見ます。

## コード

::: code-group

```zig:line-numbers=4587 [日本語訳]
pub fn sliceAsBytes(slice: anytype) SliceAsBytesReturnType(@TypeOf(slice)) {
    const Slice = @TypeOf(slice);

    // サイズがゼロの値の並びは、常にゼロバイトを占める。
    if (@sizeOf(std.meta.Elem(Slice)) == 0) return &[0]u8{};

    // @ptrCast に未定義のポインタを渡さないようにする。
    // ゼロと等しくなり、null の検査に失敗するかもしれない。
    if (slice.len == 0 and std.meta.sentinel(Slice) == null) return &[0]u8{};

    const cast_target = CopyPtrAttrs(Slice, .many, u8);

    return @as(cast_target, @ptrCast(slice))[0 .. slice.len * @sizeOf(std.meta.Elem(Slice))];
}
```

```zig:line-numbers=4587 [原文]
pub fn sliceAsBytes(slice: anytype) SliceAsBytesReturnType(@TypeOf(slice)) {
    const Slice = @TypeOf(slice);

    // a slice of zero-bit values always occupies zero bytes
    if (@sizeOf(std.meta.Elem(Slice)) == 0) return &[0]u8{};

    // let's not give an undefined pointer to @ptrCast
    // it may be equal to zero and fail a null check
    if (slice.len == 0 and std.meta.sentinel(Slice) == null) return &[0]u8{};

    const cast_target = CopyPtrAttrs(Slice, .many, u8);

    return @as(cast_target, @ptrCast(slice))[0 .. slice.len * @sizeOf(std.meta.Elem(Slice))];
}
```

:::

## 前提知識

- **スライス**: 配列の一部を指す、長さつきの参照です。
- **`@sizeOf`**: 型の大きさをバイトで返す組み込み関数です。
- **`@ptrCast`**: ポインタの型を別の型として読み替える組み込み関数です。
- **センチネル**: 配列の終わりに置く特別な値です。終わりを示す値があるかを、`std.meta.sentinel` で調べられます。

## 何をしているか

### 1. サイズがゼロの要素は空の配列を返す

::: code-group

```zig:line-numbers=4590 [日本語訳]
    // サイズがゼロの値の並びは、常にゼロバイトを占める。
    if (@sizeOf(std.meta.Elem(Slice)) == 0) return &[0]u8{};
```

```zig:line-numbers=4590 [原文]
    // a slice of zero-bit values always occupies zero bytes
    if (@sizeOf(std.meta.Elem(Slice)) == 0) return &[0]u8{};
```

:::

要素の大きさがゼロなら、バイト列も空になります。空の配列を返します。

### 2. 空の並びで不正なポインタを避ける

::: code-group

```zig:line-numbers=4593 [日本語訳]
    // @ptrCast に未定義のポインタを渡さないようにする。
    // ゼロと等しくなり、null の検査に失敗するかもしれない。
    if (slice.len == 0 and std.meta.sentinel(Slice) == null) return &[0]u8{};
```

```zig:line-numbers=4593 [原文]
    // let's not give an undefined pointer to @ptrCast
    // it may be equal to zero and fail a null check
    if (slice.len == 0 and std.meta.sentinel(Slice) == null) return &[0]u8{};
```

:::

長さがゼロで、終わりを示す値もない並びは、ポインタが不正なことがあります。そのときは、空の配列を直接返します。

### 3. バイトのスライスとして読み替える

```zig:line-numbers=4597
    const cast_target = CopyPtrAttrs(Slice, .many, u8);

    return @as(cast_target, @ptrCast(slice))[0 .. slice.len * @sizeOf(std.meta.Elem(Slice))];
```

ポインタの型を `u8` の多要素ポインタに変え、`@ptrCast` で読み替えます。長さは、要素数に要素の大きさを掛けた値です。

## ここがすごい

- **コピーをしない**: 同じメモリを別の型で見るだけなので、大きな配列でも速く扱えます。
- **空の場合を先に処理する**: 不正なポインタを `@ptrCast` に渡さないように、特別扱いしています。
- **型から長さを決める**: 要素の大きさは `@sizeOf` で求めるので、型ごとに書き分けがいりません。

## まとめ

- `sliceAsBytes` は、要素の並びを、中身のバイト列として読み替えます。
- サイズがゼロや空の並びは、特別に扱って安全に返します。
