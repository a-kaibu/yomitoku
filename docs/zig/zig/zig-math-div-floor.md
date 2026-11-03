---
title: 負の方向へ切り捨てる割り算を、ゼロ除算と溢れを確かめてから行う
description: Zig 標準ライブラリの math.divFloor。0 で割る場合と、符号付きの最小値を -1 で割る溢れを、エラーとして返してから @divFloor を使う。割った値を負の無限大側へ丸める。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [892, 897]
function: divFloor
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`divFloor` は、割り算の商を負の無限大の方向へ切り捨てて求める関数です。負の数を割るとき、0 に向かって切り捨てる `divTrunc` と結果が変わります。ゼロ除算と溢れは、エラーとして返します。

## コード

```zig:line-numbers=892
pub fn divFloor(comptime T: type, numerator: T, denominator: T) !T {
    @setRuntimeSafety(false);
    if (denominator == 0) return error.DivisionByZero;
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
    return @divFloor(numerator, denominator);
}
```

## 前提知識

- **床関数（floor）**: 実数以下で最大の整数を返す関数です。負の方向へ切り捨てます。たとえば `-7 ÷ 2` は、-3.5 の床で -4 になります。
- **`divTrunc` との違い**: 0 に向かって切り捨てる版です。`-7 ÷ 2` は -3 になります。
- **ゼロ除算**: 0 で割る場合は、エラーとして返します。
- **符号付きの溢れ**: 最小値を -1 で割ると、結果が型に収まりません。
- **`@setRuntimeSafety(false)`**: 実行時の安全チェックを切る指定です。ここでは、前提を先に確かめています。

## 何をしているか

### 1. ゼロ除算をエラーにする

```zig:line-numbers=894
    if (denominator == 0) return error.DivisionByZero;
```

除数が 0 なら、`error.DivisionByZero` を返します。

### 2. 符号付きの溢れをエラーにする

```zig:line-numbers=895
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
```

符号付きの最小値を -1 で割る場合は、`error.Overflow` を返します。

### 3. 床の割り算を行う

```zig:line-numbers=896
    return @divFloor(numerator, denominator);
```

2 つの確認を通ったら、`@divFloor` で割り算をします。結果は負の方向へ丸められます。

## ここがすごい

- **丸めの方向が明確**: 名前の `Floor` が、切り捨ての向きを示しています。`divTrunc` と使い分けられます。
- **負の数で整合する**: 剰余の計算と組み合わせるとき、床の割り算は、剰余と一貫した結果になります。
- **エラーで安全**: ゼロ除算と溢れを、戻り値のエラーとして扱えます。
- **`divTrunc` と同じ形**: 同じファイルの関数と揃って書かれているので、違いは丸めの方向だけだと分かります。

## まとめ

- `divFloor` は、商を負の方向へ切り捨てて求めます。
- ゼロ除算と符号付きの溢れを、エラーとして返します。
- 0 に向かって切り捨てる `divTrunc` と使い分けます。
