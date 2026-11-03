---
title: ChaCha20 の 1 ブロックを、4 つの数の組の混ぜ合わせを繰り返して作る
description: Zig 標準ライブラリの ChaCha20 のコア関数（非ベクトル版）。16 個の 32 ビット値に、4 つずつの組の加算・XOR・回転を 8 回ずつ並べて、20 ラウンドを作る。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/crypto/chacha20.zig
lines: [368, 395]
function: ChaChaNonVecImpl.chacha20Core
difficulty: 3
format: 2
tags: [暗号, 最適化, ビット演算]
---

## ひとことで

`chacha20Core` は、ChaCha20 という暗号の、1 ブロック分の状態を混ぜ合わせる関数です。16 個の 32 ビットの値を、「加算、XOR、回転」の組を繰り返して、攪拌（かくはん）します。その結果から、暗号の鍵の流れが作られます。

## コード

```zig:line-numbers=368
        fn chacha20Core(x: *BlockVec, input: BlockVec) void {
            x.* = input;

            const rounds = comptime [_]QuarterRound{
                Rp(0, 4, 8, 12),
                Rp(1, 5, 9, 13),
                Rp(2, 6, 10, 14),
                Rp(3, 7, 11, 15),
                Rp(0, 5, 10, 15),
                Rp(1, 6, 11, 12),
                Rp(2, 7, 8, 13),
                Rp(3, 4, 9, 14),
            };

            comptime var j: usize = 0;
            inline while (j < rounds_nb) : (j += 2) {
                inline for (rounds) |r| {
                    x[r.a] +%= x[r.b];
                    x[r.d] = math.rotl(u32, x[r.d] ^ x[r.a], @as(u32, 16));
                    x[r.c] +%= x[r.d];
                    x[r.b] = math.rotl(u32, x[r.b] ^ x[r.c], @as(u32, 12));
                    x[r.a] +%= x[r.b];
                    x[r.d] = math.rotl(u32, x[r.d] ^ x[r.a], @as(u32, 8));
                    x[r.c] +%= x[r.d];
                    x[r.b] = math.rotl(u32, x[r.b] ^ x[r.c], @as(u32, 7));
                }
            }
        }
```

## 前提知識

- **ChaCha20**: 鍵と番号（ノンス）から、予測しにくい鍵の流れを作る、ストリーム暗号の 1 つです。
- **状態（BlockVec）**: 16 個の 32 ビットの値の配列です。鍵、番号、定数が入っています。
- **クォーターラウンド**: 4 つの値の組に対して、加算、XOR、回転を 4 回ずつ行う操作です。`Rp(a, b, c, d)` が、4 つの添字を表します。
- **回転（rotl）**: ビットを左にずらし、あふれたビットを右端へ戻す操作です。16、12、8、7 ビットずつ回します。
- **ラウンド数**: 1 周の中で、列の組と行の組を 1 回ずつ処理します。`rounds_nb` は 20 なので、ループは 10 回です。

## 何をしているか

### 1. 状態を入力からコピーし、組の並びを用意する

```zig:line-numbers=369
            x.* = input;

            const rounds = comptime [_]QuarterRound{
                Rp(0, 4, 8, 12),
                Rp(1, 5, 9, 13),
                Rp(2, 6, 10, 14),
                Rp(3, 7, 11, 15),
                Rp(0, 5, 10, 15),
                Rp(1, 6, 11, 12),
                Rp(2, 7, 8, 13),
                Rp(3, 4, 9, 14),
            };
```

まず、状態に入力をコピーします。そして、4 つの値の組を 8 通り、コンパイル時に並べておきます。最初の 4 組は列、残りの 4 組は斜めの組です。

### 2. 組ごとに加算、XOR、回転を行う

```zig:line-numbers=382
            comptime var j: usize = 0;
            inline while (j < rounds_nb) : (j += 2) {
                inline for (rounds) |r| {
                    x[r.a] +%= x[r.b];
                    x[r.d] = math.rotl(u32, x[r.d] ^ x[r.a], @as(u32, 16));
                    x[r.c] +%= x[r.d];
                    x[r.b] = math.rotl(u32, x[r.b] ^ x[r.c], @as(u32, 12));
                    x[r.a] +%= x[r.b];
                    x[r.d] = math.rotl(u32, x[r.d] ^ x[r.a], @as(u32, 8));
                    x[r.c] +%= x[r.d];
                    x[r.b] = math.rotl(u32, x[r.b] ^ x[r.c], @as(u32, 7));
                }
```

`inline while` で、2 ラウンドずつ処理します。内側の `inline for` で、8 通りの組に同じ手順を当てます。各組では、`+%=` で足し、`^` で混ぜて `math.rotl` で回す、という操作を、回転の量 16、12、8、7 ビットで 4 回繰り返します。

## ここがすごい

- **ループが展開される**: `inline` のおかげで、組の並びと回数が機械語に展開されます。実行時の分岐がありません。
- **加算と回転の組合せ**: 加算はビットを上へ広げ、XOR と回転はその広がりを下へ戻します。この組合せが、攪拌の強さを生みます。
- **ラップする加算**: `+%=` は溢れても折り返すので、暗号の計算として必要な性質を満たします。
- **対称な構造**: 列の組と斜めの組を交互に処理するので、ビット全体がすぐに混ざります。

## まとめ

- `chacha20Core` は、16 個の 32 ビット値を、加算、XOR、回転で攪拌します。
- 20 ラウンドを、組の並びを展開したループで行います。
- 結果が、暗号の鍵の流れの元になります。
