---
title: 足し算の溢れを、組み込みの溢れ検出で確かめてエラーにする
description: Zig 標準ライブラリの math.add。@addWithOverflow で和と溢れの印を求め、溢れていれば error.Overflow を返す。コンパイル時の整数は溢れないので、そのまま足す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [562, 567]
function: add
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`add` は、2 つの整数を足して、溢れたらエラーにする関数です。足し算の結果が型の範囲を超えたときに、黙って値が折り返されるのを防ぎます。

## コード

```zig:line-numbers=562
pub fn add(comptime T: type, a: T, b: T) (error{Overflow}!T) {
    if (T == comptime_int) return a + b;
    const ov = @addWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
    return ov[0];
}
```

## 前提知識

- **溢れ**: 足した結果が型の最大値を超えることです。`u8` で 200 と 100 を足すと、300 は収まらず溢れます。
- **`@addWithOverflow`**: 和と溢れの印を、タプルで返す組み込み関数です。
- **`comptime_int`**: コンパイル時の任意精度の整数です。足しても溢れません。
- **`(error{Overflow}!T)`**: 結果か `Overflow` のエラーを返す戻り値の型です。
- **`ov[0]` と `ov[1]`**: タプルの第 1 要素が和、第 2 要素が溢れの印です。

## 何をしているか

### 1. コンパイル時の整数はそのまま足す

```zig:line-numbers=563
    if (T == comptime_int) return a + b;
```

`comptime_int` なら、任意精度で足せるので、そのまま `a + b` を返します。

### 2. 溢れの印を確かめる

```zig:line-numbers=564
    const ov = @addWithOverflow(a, b);
    if (ov[1] != 0) return error.Overflow;
```

`@addWithOverflow` で、和と溢れの印を求めます。印が立っていれば、`error.Overflow` を返します。

### 3. 和を返す

```zig:line-numbers=566
    return ov[0];
```

溢れがなければ、和を返します。

## ここがすごい

- **折り返しを見逃さない**: 通常の足し算は、溢れると小さい値に折り返すので、気づきにくいです。この関数では、その事態をエラーで知らせます。
- **検出のコストが小さい**: 組み込みの命令が、溢れの印を同時に出すので、追加の比較が少なくて済みます。
- **呼び出し側が処理を書く**: エラーの型になるので、溢れた場合の対応を、必ず書くことになります。
- **乗算版と対**: 同じファイルの `mul` や `sub` と、同じ形で書かれています。

## まとめ

- `add` は、`@addWithOverflow` で溢れを検出し、エラーとして返します。
- 任意精度の整数は、溢れないのでそのまま足します。
- 溢れの扱いを、型で呼び出し側に強制しています。
