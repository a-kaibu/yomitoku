---
title: 0 に向かって切り捨てる割り算を、ゼロ除算と溢れのエラーつきで行う
description: Zig 標準ライブラリの math.divTrunc。0 で割る場合と、符号付きの最小値を -1 で割る溢れの場合を、エラーとして返してから @divTrunc で割り算をする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [868, 873]
function: divTrunc
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`divTrunc` は、0 に向かって切り捨てる割り算を、安全に行う関数です。ゼロで割る場合や、溢れる場合をエラーとして返します。割り算の結果をそのまま使うと、起きるかもしれない問題を、呼び出し側が確実に扱えるようにしています。

## コード

```zig:line-numbers=868
pub fn divTrunc(comptime T: type, numerator: T, denominator: T) !T {
    @setRuntimeSafety(false);
    if (denominator == 0) return error.DivisionByZero;
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
    return @divTrunc(numerator, denominator);
}
```

## 前提知識

- **0 に向かって切り捨てる**: 割り算の商を、0 に近い方向の整数にする規則です。たとえば -7 ÷ 2 は -3 になります。
- **ゼロ除算**: 0 で割ることは、数学的に定義されていません。Zig では、この場合にエラーを返すことで扱えます。
- **溢れの例**: 符号付きの最小値（`i8` の -128）を -1 で割ると、結果の 128 は `i8` に収まりません。
- **`!T`**: エラーか値のどちらかを返す型です。呼び出し側は、エラーを必ず扱う必要があります。
- **`@setRuntimeSafety(false)`**: この関数の中では、実行時の安全チェックを切る指定です。ここでは、先に条件を手で確かめています。

## 何をしているか

### 1. 0 で割る場合をエラーにする

```zig:line-numbers=870
    if (denominator == 0) return error.DivisionByZero;
```

除数が 0 なら、`error.DivisionByZero` を返します。割り算を実行する前に止めます。

### 2. 符号付きの溢れをエラーにする

```zig:line-numbers=871
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
```

符号付きの整数で、分子が最小値、除数が -1 の場合は、結果が型に収まりません。`error.Overflow` を返します。

### 3. 割り算を行う

```zig:line-numbers=872
    return @divTrunc(numerator, denominator);
```

2 つの確認を通ったら、組み込みの `@divTrunc` で割り算をします。

## ここがすごい

- **エラーで知らせる**: 問題を黙って処理せず、エラーの型で呼び出し側に伝えます。
- **溢れの 1 例を見逃さない**: 符号付きの最小値を -1 で割る場合は、よく見落とされる溢れです。この関数では、明示的に扱っています。
- **安全の確認を先に**: 実行時の安全チェックを切っても、前提を先に確かめるので、安全に動きます。
- **対になる関数**: 同じファイルの `divFloor` や `divCeil` は、切り捨ての方向が違う割り算を同じ形で扱っています。

## まとめ

- `divTrunc` は、0 に向かって切り捨てる割り算を、エラーつきで行います。
- ゼロ除算と、符号付きの溢れの 2 つを確かめてから割ります。
- 結果は `!T` の形で返り、呼び出し側がエラーを扱えます。
