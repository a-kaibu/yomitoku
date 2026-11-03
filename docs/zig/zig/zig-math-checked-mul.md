---
title: 掛け算の溢れを、組み込みの溢れ検出で確かめてエラーにする
description: Zig 標準ライブラリの math.mul。@mulWithOverflow で結果と溢れの印を同時に求め、溢れていれば error.Overflow を返す。comptime_int は溢れないのでそのまま掛ける。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [554, 559]
function: mul
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`mul` は、2 つの整数を掛けて、溢れたらエラーにする関数です。溢れを黙って折り返すのではなく、呼び出し側に知らせます。サイズの計算など、結果が正しくなければ困る場面で使われます。

## コード

```zig:line-numbers=554
pub fn mul(comptime T: type, a: T, b: T) (error{Overflow}!T) {
    if (T == comptime_int) return a * b;
    const ov = @mulWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
    return ov[0];
}
```

## 前提知識

- **溢れ（オーバーフロー）**: 結果が型の範囲を超えることです。通常の掛け算では、Zig の安全チェックで止まるか、折り返されます。
- **`@mulWithOverflow`**: 掛け算の結果と、溢れたかどうかの印を、2 つの値のタプルで返す組み込み関数です。
- **`comptime_int`**: コンパイル時の任意精度の整数です。溢れの心配がありません。
- **`(error{Overflow}!T)`**: 結果か `Overflow` のエラーを返す型です。
- **タプルの添字**: `ov[0]` が結果、`ov[1]` が溢れの印です。

## 何をしているか

### 1. コンパイル時の整数はそのまま掛ける

```zig:line-numbers=555
    if (T == comptime_int) return a * b;
```

型が `comptime_int` なら、任意精度なので溢れません。そのまま `a * b` を返します。

### 2. 溢れの印を確かめる

```zig:line-numbers=556
    const ov = @mulWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
```

`@mulWithOverflow(a, b)` で、結果と溢れの印を同時に求めます。印が 0 でなければ、溢れているので `error.Overflow` を返します。

### 3. 結果を返す

```zig:line-numbers=558
    return ov[0];
```

溢れていなければ、結果の `ov[0]` を返します。

## ここがすごい

- **結果と検出を 1 回で**: 組み込みの関数が、掛け算と溢れの判定を一度に行うので、二重の計算がありません。
- **エラーで扱いを強制**: 戻り値の型がエラーを含むので、呼び出し側は溢れを必ず処理します。
- **任意精度の特別扱い**: `comptime_int` は溢れないので、余計な検査を省いています。
- **`add` と `sub` と同じ形**: 同じファイルの加算と減算も、同じ構成で書かれています。

## まとめ

- `mul` は、`@mulWithOverflow` で溢れを検出し、エラーとして返します。
- 任意精度の整数は、そのまま掛けます。
- 加算、減算の版と同じ形で書かれています。
