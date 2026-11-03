---
title: 値以上の最小の 2 のべき指数を、log2_int を 1 つずらして求める
description: Zig 標準ライブラリの math.log2_int_ceil。x - 1 の整数の 2 を底とする対数に 1 を足して、x 以上の最小の 2 のべきの指数を返す。符号なしの整数だけを受け付ける。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1306, 1313]
function: log2_int_ceil
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 防御的プログラミング]
---

## ひとことで

`log2_int_ceil` は、値を切り上げた 2 のべき乗の指数（何乗か）を返す関数です。たとえば 5 なら 3 を返します。2 の 3 乗が 8 で、5 以上の最小の 2 のべきだからです。

## コード

```zig:line-numbers=1306
pub fn log2_int_ceil(comptime T: type, x: T) Log2IntCeil(T) {
    if (@typeInfo(T) != .int or @typeInfo(T).int.signedness != .unsigned)
        @compileError("log2_int_ceil requires an unsigned integer, found " ++ @typeName(T));
    assert(x != 0);
    if (x == 1) return 0;
    const log2_val: Log2IntCeil(T) = log2_int(T, x - 1);
    return log2_val + 1;
}
```

## 前提知識

- **2 を底とする対数**: 2 のべき乗の指数です。たとえば 8 は 2 の 3 乗なので、対数は 3 です。
- **`log2_int`**: 同じファイルにある関数で、切り下げた対数（整数部分）を返します。
- **`Log2IntCeil(T)`**: 切り上げの対数を表す型です。
- **`compileError`**: 符号なしの整数以外が渡されたときに、コンパイル時にエラーを出します。
- **`x - 1` の使い方**: 切り上げの対数は、`x - 1` の切り下げの対数に 1 を足すと求まります。

## 何をしているか

### 1. 型と入力を確かめる

```zig:line-numbers=1307
    if (@typeInfo(T) != .int or @typeInfo(T).int.signedness != .unsigned)
        @compileError("log2_int_ceil requires an unsigned integer, found " ++ @typeName(T));
    assert(x != 0);
```

符号なしの整数でなければ、`compileError` で止めます。値が 0 なら `assert` で止めます。

### 2. 1 の特別扱い

```zig:line-numbers=1310
    if (x == 1) return 0;
```

`x` が 1 なら、2 の 0 乗なので、指数は 0 です。

### 3. x - 1 の対数に 1 を足す

```zig:line-numbers=1311
    const log2_val: Log2IntCeil(T) = log2_int(T, x - 1);
    return log2_val + 1;
```

`log2_int(T, x - 1)` で、`x - 1` の切り下げの対数を求め、そこに 1 を足します。これが、`x` 以上の最小の 2 のべきの指数になります。

## ここがすごい

- **`x - 1` の工夫**: `x` がちょうど 2 のべきの場合でも、正しい指数が出ます。たとえば 8 は、7 の切り下げの対数 2 に 1 を足して 3 になります。
- **既存の関数を再利用**: 切り下げの対数の計算を `log2_int` に任せ、この関数は 1 を足すだけです。
- **型の制約を明示**: 符号付きの整数を渡すと、コンパイル時に止まります。
- **テストが境界を示す**: ファイルの `test` は、1、2、3 などの小さい値で、切り上げの動きを確かめています。

## まとめ

- `log2_int_ceil` は、`x - 1` の切り下げの対数に 1 を足して、切り上げの指数を求めます。
- `x` が 1 のときは 0 を返します。
- 符号なしの整数だけを受け付けます。
