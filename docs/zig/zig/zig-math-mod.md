---
title: 割る数が正の整数のときだけ、剰余を求める安全な mod
description: Zig 標準ライブラリの math.mod。0 で割る場合と、負の除数の場合をエラーとして返し、それ以外は @mod で 0 以上の剰余を求める。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [999, 1004]
function: mod
difficulty: 1
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`mod` は、割った余りを求める関数です。結果は必ず 0 以上になり、割る数（除数）は正でなければなりません。ゼロ除算と負の除数は、エラーとして返します。

## コード

```zig:line-numbers=999
pub fn mod(comptime T: type, numerator: T, denominator: T) !T {
    @setRuntimeSafety(false);
    if (denominator == 0) return error.DivisionByZero;
    if (denominator < 0) return error.NegativeDenominator;
    return @mod(numerator, denominator);
}
```

## 前提知識

- **剰余（mod）**: 割り算の余りです。`a mod n` の結果は 0 から n-1 の範囲になります。
- **`%` と `mod` の違い**: 組み込みの `%` や `@rem` は、負の値に対して符号が分かれることがあります。`mod` は、結果が 0 以上になる数学的な定義を使います。
- **負の除数**: 除数が負だと、剰余の範囲の決め方があいまいになります。そのため、この関数では拒否します。
- **`!T`**: エラーか値のどちらかを返す型です。
- **`@mod`**: 組み込みの剰余関数で、この関数の本体で使われています。

## 何をしているか

### 1. 0 で割る場合をエラーにする

```zig:line-numbers=1001
    if (denominator == 0) return error.DivisionByZero;
```

除数が 0 なら、`error.DivisionByZero` を返します。

### 2. 負の除数をエラーにする

```zig:line-numbers=1002
    if (denominator < 0) return error.NegativeDenominator;
```

除数が負なら、`error.NegativeDenominator` を返します。剰余の範囲が定義できないからです。

### 3. 剰余を求める

```zig:line-numbers=1003
    return @mod(numerator, denominator);
```

2 つの確認を通ったら、`@mod` で剰余を求めます。結果は 0 以上で、除数より小さい値になります。

## ここがすごい

- **意味が明確な範囲だけを受け付ける**: 負の除数を拒否することで、結果の範囲が必ず決まります。
- **エラーの名前が原因を語る**: `DivisionByZero` と `NegativeDenominator` で、何が問題だったかが分かります。
- **`%` と分けている**: 負の値の扱いを曖昧にしないよう、`mod` と `rem` を分けて用意しています。
- **テストが両方を確かめる**: ファイルの `test` は、通常の値と、コンパイル時の値の両方で確かめています。

## まとめ

- `mod` は、0 以上の剰余を、エラーつきで求めます。
- 0 と負の除数は、エラーとして返します。
- 負の値の剰余には `rem` を使う、と使い分けます。
