---
title: 正の除数で、割った余りの符号を被除数に合わせて求める
description: Zig 標準ライブラリの math.rem。0 で割る場合と負の除数をエラーにし、それ以外は @rem で余りを求める。余りの符号は被除数の符号に従う。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1025, 1030]
function: rem
difficulty: 1
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`rem` は、割った余りを求める関数です。余りの符号は、割られる数（被除数）の符号に従います。除数は正でなければならず、0 や負の除数は、エラーとして返します。

## コード

```zig:line-numbers=1025
pub fn rem(comptime T: type, numerator: T, denominator: T) !T {
    @setRuntimeSafety(false);
    if (denominator == 0) return error.DivisionByZero;
    if (denominator < 0) return error.NegativeDenominator;
    return @rem(numerator, denominator);
}
```

## 前提知識

- **余り（remainder）**: 割り算で割り切れなかった部分です。`a = q × n + r` の `r` にあたります。
- **`mod` との違い**: `mod` は結果が常に 0 以上です。`rem` は被除数の符号に従うので、負の値では結果が負になることがあります。
- **除数が負の場合**: この関数は、除数が負だとエラーにします。余りの定義があいまいになるのを避けるためです。
- **`@rem`**: 組み込みの余りの関数で、この関数の本体で使われています。
- **`!T`**: 結果か、エラーのどちらかを返す戻り値の型です。

## 何をしているか

### 1. ゼロ除算をエラーにする

```zig:line-numbers=1027
    if (denominator == 0) return error.DivisionByZero;
```

除数が 0 なら、`error.DivisionByZero` を返します。

### 2. 負の除数をエラーにする

```zig:line-numbers=1028
    if (denominator < 0) return error.NegativeDenominator;
```

除数が負なら、`error.NegativeDenominator` を返します。

### 3. 余りを求める

```zig:line-numbers=1029
    return @rem(numerator, denominator);
```

2 つの確認を通ったら、`@rem` で余りを求めます。

## ここがすごい

- **整数の割り算と整合**: `a = q × n + r` の関係が、`divTrunc` と同じ向きで保たれます。
- **エラーの名前が原因を示す**: `DivisionByZero` と `NegativeDenominator` で、何が問題かが分かります。
- **`mod` と対**: 同じファイルの `mod` は、負にならない余りを求めます。使い分けが明確です。
- **前提を先に確かめる**: 実行時の安全チェックを切る前に、条件を確かめています。

## まとめ

- `rem` は、被除数の符号に従う余りを求めます。
- ゼロ除算と負の除数は、エラーとして返します。
- 結果が常に 0 以上の余りが必要なら、`mod` を使います。
