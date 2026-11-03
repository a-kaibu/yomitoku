---
title: 引き算の溢れを検出して、符号なしの負の結果をエラーにする
description: Zig 標準ライブラリの math.sub。@subWithOverflow で差と溢れの印を求める。符号なしの型で 0 より小さくなる場合も、溢れとして error.Overflow を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [570, 575]
function: sub
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`sub` は、2 つの整数の差を求めて、溢れたらエラーにする関数です。符号なしの型では、0 より小さくなる引き算も溢れとして扱われます。たとえば `u8` で 3 から 5 を引くと、エラーになります。

## コード

```zig:line-numbers=570
pub fn sub(comptime T: type, a: T, b: T) (error{Overflow}!T) {
    if (T == comptime_int) return a - b;
    const ov = @subWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
    return ov[0];
}
```

## 前提知識

- **符号なしの溢れ**: 符号なしの型は、0 より小さい値を表せません。0 より小さくなると、折り返して大きな値になります。
- **`@subWithOverflow`**: 差と溢れの印を、タプルで返す組み込み関数です。
- **`comptime_int`**: コンパイル時の任意精度の整数です。負の値も溢れずに扱えます。
- **`(error{Overflow}!T)`**: 結果か `Overflow` のエラーを返す戻り値の型です。
- **`ov[1]`**: 溢れの印です。0 でなければ溢れています。

## 何をしているか

### 1. コンパイル時の整数はそのまま引く

```zig:line-numbers=571
    if (T == comptime_int) return a - b;
```

`comptime_int` なら、負の値になっても溢れずに、そのまま `a - b` を返します。

### 2. 溢れの印を確かめる

```zig:line-numbers=572
    const ov = @subWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
```

`@subWithOverflow(a, b)` で、差と溢れの印を求めます。印が立っていれば `error.Overflow` を返します。

### 3. 差を返す

```zig:line-numbers=574
    return ov[0];
```

溢れがなければ、差を返します。

## ここがすごい

- **符号なしの落とし穴を防ぐ**: `u` 型の引き算で、0 より小さくなる場合を、確実にエラーにできます。
- **範囲の確認を型に任せる**: 呼び出し側が、事前に大小を比べる必要がありません。
- **エラーの型で強制**: 溢れた場合の扱いを、呼び出し側が書かなければなりません。
- **`add` や `mul` と同じ形**: 同じファイルの関数と揃った作りです。

## まとめ

- `sub` は、`@subWithOverflow` で溢れを検出し、エラーとして返します。
- 符号なしの型で、0 より小さくなる結果もエラーになります。
- 任意精度の整数は、溢れずにそのまま引けます。
