---
title: 整数のビットを右へ回転させる
description: Zig 標準ライブラリの math.rotr。ビットが端から溢れず反対側へ戻るように右へ回す。2 の冪のビット数とそれ以外で書き方を分け、ベクトルにも対応する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [690, 713]
function: rotr
difficulty: 3
format: 2
tags: [ビット演算, 型システム]
---

## ひとことで

`rotr` は、符号なし整数のビットを右へ回す関数です。右端から溢れたビットが、左端から戻ってきます。

## コード

```zig:line-numbers=690
pub fn rotr(comptime T: type, x: T, r: anytype) T {
    if (@typeInfo(T) == .vector) {
        const C = @typeInfo(T).vector.child;
        if (C == u0) return @splat(0);

        if (@typeInfo(C).int.signedness == .signed) {
            @compileError("cannot rotate signed integers");
        }
        const ar: Log2Int(C) = @intCast(@mod(r, @typeInfo(C).int.bits));
        return (x >> @splat(ar)) | (x << @splat(1 + ~ar));
    } else if (@typeInfo(T).int.signedness == .signed) {
        @compileError("cannot rotate signed integer");
    } else {
        if (T == u0) return 0;

        if (comptime isPowerOfTwo(@typeInfo(T).int.bits)) {
            const ar: Log2Int(T) = @intCast(@mod(r, @typeInfo(T).int.bits));
            return x >> ar | x << (1 +% ~ar);
        } else {
            const ar = @mod(r, @typeInfo(T).int.bits);
            return shr(T, x, ar) | shl(T, x, @typeInfo(T).int.bits - ar);
        }
    }
}
```

## 前提知識

- **ローテート**: ビットを捨てずに、端から反対側へ回す操作です。
- **`>>` と `<<`**: 右と左へのビットシフトです。
- **`Log2Int(T)`**: 型のビット数を表すのに必要な、シフト量の整数型です。
- **`isPowerOfTwo`**: ビット数が 2 の冪かを調べる関数です。
- **`@mod`**: 負の値も正しく扱う剰余の関数です。

## 何をしているか

### 1. ベクトルの場合は要素ごとに回す

```zig:line-numbers=691
    if (@typeInfo(T) == .vector) {
        const C = @typeInfo(T).vector.child;
        if (C == u0) return @splat(0);

        if (@typeInfo(C).int.signedness == .signed) {
            @compileError("cannot rotate signed integers");
        }
        const ar: Log2Int(C) = @intCast(@mod(r, @typeInfo(C).int.bits));
        return (x >> @splat(ar)) | (x << @splat(1 + ~ar));
```

ベクトルの要素型を調べ、要素ごとに同じ回転を行います。符号付きの要素は、回転の意味が決まらないので、コンパイル時にエラーにします。

### 2. 符号付きの整数は受け付けない

```zig:line-numbers=700
    } else if (@typeInfo(T).int.signedness == .signed) {
        @compileError("cannot rotate signed integer");
```

符号付きの整数を渡すと、コンパイルエラーになります。回転は符号なしの値に対して行うためです。

### 3. ビット数が 2 の冪なら一式で回す

```zig:line-numbers=705
        if (comptime isPowerOfTwo(@typeInfo(T).int.bits)) {
            const ar: Log2Int(T) = @intCast(@mod(r, @typeInfo(T).int.bits));
            return x >> ar | x << (1 +% ~ar);
```

ビット数が 2 の冪のときは、回転量を `@mod` でビット数の範囲に収めます。そして右へのシフトと左へのシフトを `|` でつなぎます。左へのシフト量は `1 +% ~ar` で求めます。

### 4. それ以外のビット数は分けて組み立てる

```zig:line-numbers=709
            const ar = @mod(r, @typeInfo(T).int.bits);
            return shr(T, x, ar) | shl(T, x, @typeInfo(T).int.bits - ar);
```

ビット数が 2 の冪でないときは、回転量を `@mod` で求めたあと、`shr` と `shl` を別々に呼んで組み合わせます。どちらも、ビット数を超えるシフトを安全に扱います。

## ここがすごい

- **溢れたビットを戻す**: 右へ回したビットを、左端へ戻すので、情報を失いません。
- **ビット数で書き分ける**: 2 の冪のときだけ、速い書き方を使います。
- **負の回転量も扱える**: `@mod` で回転量を範囲に収めるので、負の値も期待どおりに動きます。

## まとめ

- `rotr` は、符号なし整数のビットを右へ回します。
- 2 の冪のビット数は一式で、それ以外は `shr` と `shl` の組み合わせで回します。
