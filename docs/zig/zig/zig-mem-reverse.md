---
title: スライスの要素の並びを逆にする
description: Zig 標準ライブラリの mem.reverse。両端から中央へ向かって要素を入れ替える。条件が合えば SIMD のベクトル単位でまとめて入れ替える。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [3865, 3893]
function: reverse
difficulty: 3
format: 2
tags: [メモリ管理, 最適化]
---

## ひとことで

`reverse` は、スライスの要素の並びを逆にする関数です。両端から中央へ向かって、要素の組を入れ替えていきます。

## コード

```zig:line-numbers=3865
pub fn reverse(comptime T: type, items: []T) void {
    var i: usize = 0;
    const end = items.len / 2;
    if (use_vectors and
        !@inComptime() and
        @bitSizeOf(T) > 0 and
        std.math.isPowerOfTwo(@bitSizeOf(T)))
    {
        if (std.simd.suggestVectorLength(T)) |simd_size| {
            if (simd_size <= end) {
                const simd_end = end - (simd_size - 1);
                while (i < simd_end) : (i += simd_size) {
                    const left_slice = items[i .. i + simd_size];
                    const right_slice = items[items.len - i - simd_size .. items.len - i];

                    const left_shuffled: [simd_size]T = reverseVector(simd_size, T, left_slice);
                    const right_shuffled: [simd_size]T = reverseVector(simd_size, T, right_slice);

                    @memcpy(right_slice, &left_shuffled);
                    @memcpy(left_slice, &right_shuffled);
                }
            }
        }
    }

    while (i < end) : (i += 1) {
        swap(T, &items[i], &items[items.len - i - 1]);
    }
}
```

## 前提知識

- **スライス**: 配列の一部を指す、長さつきの参照です。
- **SIMD ベクトル**: 複数の値を 1 命令でまとめて扱う、CPU の機能です。
- **`swap`**: 2 つの値を入れ替える関数です。この関数の中でも使われます。
- **`suggestVectorLength`**: その型で一度に扱えるベクトルの長さを、コンパイル時に求める関数です。

## 何をしているか

### 1. 中央までの回数を求める

```zig:line-numbers=3866
    var i: usize = 0;
    const end = items.len / 2;
```

入れ替えは、要素数の半分までです。そのため、中央までの回数を `end` に入れておきます。

### 2. ベクトルで扱えるかを調べる

```zig:line-numbers=3868
    if (use_vectors and
        !@inComptime() and
        @bitSizeOf(T) > 0 and
        std.math.isPowerOfTwo(@bitSizeOf(T)))
    {
        if (std.simd.suggestVectorLength(T)) |simd_size| {
            if (simd_size <= end) {
```

型のビット数が 2 の冪で、コンパイル時に実行できるときだけ、ベクトルの長さを求めます。長さが中央までの回数に収まるなら、ベクトルでまとめて入れ替えます。

### 3. ベクトル単位で左右の塊を入れ替える

```zig:line-numbers=3875
                const simd_end = end - (simd_size - 1);
                while (i < simd_end) : (i += simd_size) {
                    const left_slice = items[i .. i + simd_size];
                    const right_slice = items[items.len - i - simd_size .. items.len - i];

                    const left_shuffled: [simd_size]T = reverseVector(simd_size, T, left_slice);
                    const right_shuffled: [simd_size]T = reverseVector(simd_size, T, right_slice);

                    @memcpy(right_slice, &left_shuffled);
                    @memcpy(left_slice, &right_shuffled);
                }
```

左の塊と右の塊を、ベクトルの長さの分だけ取り出して、それぞれ逆順にします。そのあと、左と右を互いに書き戻します。

### 4. 残りを一つずつ入れ替える

```zig:line-numbers=3890
    while (i < end) : (i += 1) {
        swap(T, &items[i], &items[items.len - i - 1]);
    }
```

ベクトルで扱いきれなかった残りは、要素を一つずつ `swap` で入れ替えます。

## ここがすごい

- **場所を増やさない**: 新しい配列を作らず、同じスライスの中で入れ替えます。
- **ベクトルで速くする**: 条件が合うときは、複数の要素をまとめて扱います。
- **条件で安全に切り替える**: ベクトルが使えないときは、普通の入れ替えだけで動きます。

## まとめ

- `reverse` は、両端から中央へ向かって要素を入れ替えます。
- 条件が合えば SIMD でまとめて入れ替え、残りは一つずつ入れ替えます。
