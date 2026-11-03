---
title: 割り切れる割り算だけを結果として返す
description: Zig 標準ライブラリの math.divExact。0 で割る場合と余りが出る場合をエラーとして返し、割り切れたときだけ商を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [971, 978]
function: divExact
difficulty: 2
format: 2
tags: [数値計算, エラー処理]
---

## ひとことで

`divExact` は、割り算の余りが 0 のときだけ商を返す関数です。0 で割ったときや、余りが出るときは、エラーを返します。

## コード

```zig:line-numbers=971
pub fn divExact(comptime T: type, numerator: T, denominator: T) !T {
    @setRuntimeSafety(false);
    if (denominator == 0) return error.DivisionByZero;
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
    const result = @divTrunc(numerator, denominator);
    if (result * denominator != numerator) return error.UnexpectedRemainder;
    return result;
}
```

## 前提知識

- **エラーユニオン（`!T`）**: 値の `T` か、エラーのどちらかを返す Zig の型です。
- **`@divTrunc`**: 0 の方向へ切り捨てて割る組み込み関数です。
- **`minInt`**: 整数型が表せる最小値を返す関数です。
- **`@setRuntimeSafety(false)`**: この関数の中だけ、実行時の安全検査を止める指定です。

## 何をしているか

### 1. 0 で割ることを防ぐ

```zig:line-numbers=973
    if (denominator == 0) return error.DivisionByZero;
```

分母が 0 のときは、`error.DivisionByZero` を返します。

### 2. 符号付きの最小値を -1 で割ることを防ぐ

```zig:line-numbers=974
    if (@typeInfo(T) == .int and @typeInfo(T).int.signedness == .signed and numerator == minInt(T) and denominator == -1) return error.Overflow;
```

符号付きの最小値を -1 で割ると、結果が型に入らないので、`error.Overflow` を返します。

### 3. 割り切れるかを、掛け算で確かめる

```zig:line-numbers=975
    const result = @divTrunc(numerator, denominator);
    if (result * denominator != numerator) return error.UnexpectedRemainder;
```

まず `@divTrunc` で商を求めます。そのあと商に分母を掛けて、元の分子に戻るかを調べます。戻らなければ、余りが出ていたことになります。

### 4. 割り切れた商を返す

```zig:line-numbers=977
    return result;
```

## ここがすごい

- **余りを見逃さない**: 割り算のあとに掛け算で確かめるので、整数の割り算で切り捨てられた余りを検出できます。
- **エラーで知らせる**: 余りや 0 除算を、値の代わりにエラーとして返すので、呼び出し側で扱い分けられます。
- **型の端を考える**: 符号付きの最小値と -1 の組み合わせも、オーバーフローとして拾っています。

## まとめ

- `divExact` は、割り切れる割り算だけ商を返します。
- 0 除算、オーバーフロー、余りが出る場合は、それぞれ別のエラーを返します。
