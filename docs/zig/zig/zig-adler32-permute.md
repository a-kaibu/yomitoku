---
title: 割り算を後回しにして、Adler-32 の検査値をまとめて計算する
description: 圧縮データの破損を見つける Adler-32 の計算 permute。足し算を 5552 バイトまで溜めてから一度だけ余りを取り、速さを出している。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/hash/Adler32.zig
lines: [10, 75]
function: permute
difficulty: 3
format: 2
tags: [ハッシュ, 最適化, 防御的プログラミング]
---

## ひとことで

`permute` は、データの検査値（チェックサム）を **Adler-32** という方式で計算する関数です。
2 つの合計 `s1`、`s2` を、入力のバイトを 1 つずつ足して作ります。最後に 2 つを組み合わせた 32 ビットの値が、そのデータの検査値になります。

zlib などの圧縮フォーマットで使われる方式です。この関数は、割り算（余りを取る処理）をできるだけ後回しにして、速さを出しています。

## コード

::: code-group

```zig:line-numbers=10 [日本語訳]
pub fn permute(state: u32, input: []const u8) u32 {
    const base = 65521;
    const nmax = 5552;

    var s1 = state & 0xffff;
    var s2 = (state >> 16) & 0xffff;

    if (input.len == 1) {
        s1 +%= input[0];
        if (s1 >= base) {
            s1 -= base;
        }
        s2 +%= s1;
        if (s2 >= base) {
            s2 -= base;
        }
    } else if (input.len < 16) {
        for (input) |b| {
            s1 +%= b;
            s2 +%= s1;
        }
        if (s1 >= base) {
            s1 -= base;
        }

        s2 %= base;
    } else {
        const n = nmax / 16; // メモ: 16 は nmax の約数

        var i: usize = 0;

        while (i + nmax <= input.len) {
            var rounds: usize = 0;
            while (rounds < n) : (rounds += 1) {
                comptime var j: usize = 0;
                inline while (j < 16) : (j += 1) {
                    s1 +%= input[i + j];
                    s2 +%= s1;
                }
                i += 16;
            }

            s1 %= base;
            s2 %= base;
        }

        if (i < input.len) {
            while (i + 16 <= input.len) : (i += 16) {
                comptime var j: usize = 0;
                inline while (j < 16) : (j += 1) {
                    s1 +%= input[i + j];
                    s2 +%= s1;
                }
            }
            while (i < input.len) : (i += 1) {
                s1 +%= input[i];
                s2 +%= s1;
            }

            s1 %= base;
            s2 %= base;
        }
    }

    return s1 | (s2 << 16);
}
```

```zig:line-numbers=10 [原文]
pub fn permute(state: u32, input: []const u8) u32 {
    const base = 65521;
    const nmax = 5552;

    var s1 = state & 0xffff;
    var s2 = (state >> 16) & 0xffff;

    if (input.len == 1) {
        s1 +%= input[0];
        if (s1 >= base) {
            s1 -= base;
        }
        s2 +%= s1;
        if (s2 >= base) {
            s2 -= base;
        }
    } else if (input.len < 16) {
        for (input) |b| {
            s1 +%= b;
            s2 +%= s1;
        }
        if (s1 >= base) {
            s1 -= base;
        }

        s2 %= base;
    } else {
        const n = nmax / 16; // note: 16 | nmax

        var i: usize = 0;

        while (i + nmax <= input.len) {
            var rounds: usize = 0;
            while (rounds < n) : (rounds += 1) {
                comptime var j: usize = 0;
                inline while (j < 16) : (j += 1) {
                    s1 +%= input[i + j];
                    s2 +%= s1;
                }
                i += 16;
            }

            s1 %= base;
            s2 %= base;
        }

        if (i < input.len) {
            while (i + 16 <= input.len) : (i += 16) {
                comptime var j: usize = 0;
                inline while (j < 16) : (j += 1) {
                    s1 +%= input[i + j];
                    s2 +%= s1;
                }
            }
            while (i < input.len) : (i += 1) {
                s1 +%= input[i];
                s2 +%= s1;
            }

            s1 %= base;
            s2 %= base;
        }
    }

    return s1 | (s2 << 16);
}
```

:::
## 前提知識

- **チェックサム（検査値）**: データが途中で壊れていないかを確かめるための数値です。元のデータが少しでも変わると、値が変わるように作られています。
- **Adler-32**: 2 つの合計を組み合わせて検査値を作る方式です。`s1` はバイトの合計、`s2` は `s1` の合計です。
- **`base = 65521`**: 16 ビットに収まる最大の素数です。合計をこの数で割った余りに保つことで、値を小さく保ちます。
- **`nmax = 5552`**: 合計をまだ余りで割らずに足しておける、最大のバイト数です。この数を超えると、32 ビットの範囲で溢れる恐れがあります。
- **`+%=`**: 溢れたら折り返す足し算です。
- **`comptime var` と `inline while`**: ループをコンパイル時に展開する書き方です。16 回の足し算が、命令として並んで生成されます。

## 何をしているか

### 1. 状態を 2 つに分ける

```zig:line-numbers=14
    var s1 = state & 0xffff;
    var s2 = (state >> 16) & 0xffff;
```

前の状態 `state` の下位 16 ビットが `s1`、上位 16 ビットが `s2` です。こうすると、途中の結果を 1 つの `u32` に保存して、次の入力に続けられます。

### 2. 1 バイトだけなら、その場で余りを取る

```zig:line-numbers=17
    if (input.len == 1) {
        s1 +%= input[0];
        if (s1 >= base) {
            s1 -= base;
        }
```

入力が 1 バイトのときは、足したあとに `base` を引くだけで余りを取れます。`s1` は必ず `base` 未満なので、1 回の引き算で十分です。

### 3. 16 バイト未満は、1 バイトずつ足す

```zig:line-numbers=26
    } else if (input.len < 16) {
        for (input) |b| {
            s1 +%= b;
            s2 +%= s1;
        }
```

短い入力では、1 バイトずつ `s1` に足し、その `s1` を `s2` に足します。`s2` は、今までの `s1` の合計です。

### 4. 大きい入力は、nmax バイトごとに余りを取る

```zig:line-numbers=36
    } else {
        const n = nmax / 16; // note: 16 | nmax

        var i: usize = 0;

        while (i + nmax <= input.len) {
            var rounds: usize = 0;
            while (rounds < n) : (rounds += 1) {
                comptime var j: usize = 0;
                inline while (j < 16) : (j += 1) {
                    s1 +%= input[i + j];
                    s2 +%= s1;
                }
                i += 16;
            }

            s1 %= base;
            s2 %= base;
        }
```

大きい入力では、16 バイトずつ、`inline while` で 16 回の足し算を展開します。`nmax` バイト分（5552 バイト）を足したあとでだけ、`%` で余りを取ります。割り算は重い命令なので、回数を減らすほど速くなります。

`n` は `nmax / 16` で、1 回の大きな塊の中に何回 16 バイトの処理が入るかを表します。

### 5. 余りの部分と最後の仕上げ

```zig:line-numbers=74
    return s1 | (s2 << 16);
```

最後に、`s1` を下位 16 ビット、`s2` を上位 16 ビットに詰めて、1 つの `u32` として返します。

## ここがすごい

- **割り算を大幅に減らす**: 1 バイトごとに余りを取ると、割り算が毎回必要になります。`nmax` 分まとめて取ることで、割り算の回数が数千分の 1 に減ります。
- **nmax の値に根拠がある**: 5552 は、zlib の作者が計算した、32 ビットに収まる最大のバイト数です。溢れを起こさずに余りを後回しにできる、ぎりぎりの値です。
- **コンパイル時の展開**: `inline while` で 16 回の処理を並べて生成するので、ループの管理のための命令が減ります。
- **入力の長さで処理を分ける**: 1 バイト、16 バイト未満、大きい入力の 3 つに分けて、それぞれ一番速い方法を使っています。

## まとめ

- Adler-32 は、2 つの合計 `s1` と `s2` からなる検査値です。
- 合計は 16 ビットの余りで保ちますが、割り算は重いので、まとめて後回しにします。
- 5552 バイトまでは溢れないので、その範囲で余りを取らずに足せます。
- 入力の長さに応じて、3 通りの処理に分けると、短い入力も大きい入力も速く扱えます。
