---
title: 3 バイトを 4 文字に変える Base64 を、16 バイトずつ一気に処理する
description: Zig 標準ライブラリの Base64 の encode。12 バイトずつ 16 文字に変える速い道、3 バイトずつの道、残りの端数の道を分けて、最後に詰め物（パディング）を付ける。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/base64.zig
lines: [121, 164]
function: Base64Encoder.encode
difficulty: 3
format: 2
tags: [文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`encode` は、バイトの列を Base64 という形式の文字列に変換する関数です。Base64 は、バイナリのデータを、英字、数字、記号 2 つだけの文字に置き換える方式で、メールや画像の埋め込みなどで使われています。
3 バイト（24 ビット）を 4 文字（6 ビットずつ）に変えるのが基本です。

この関数は、長い入力を大きな単位でまとめて処理し、余った部分だけ小さな単位で扱います。

## コード

```zig:line-numbers=121
    pub fn encode(encoder: *const Base64Encoder, dest: []u8, source: []const u8) []const u8 {
        const out_len = encoder.calcSize(source.len);
        assert(dest.len >= out_len);

        var idx: usize = 0;
        var out_idx: usize = 0;
        while (idx + 15 < source.len) : (idx += 12) {
            const bits = std.mem.readInt(u128, source[idx..][0..16], .big);
            inline for (0..16) |i| {
                dest[out_idx + i] = encoder.alphabet_chars[@truncate((bits >> (122 - i * 6)) & 0x3f)];
            }
            out_idx += 16;
        }
        while (idx + 3 < source.len) : (idx += 3) {
            const bits = std.mem.readInt(u32, source[idx..][0..4], .big);
            dest[out_idx] = encoder.alphabet_chars[(bits >> 26) & 0x3f];
            dest[out_idx + 1] = encoder.alphabet_chars[(bits >> 20) & 0x3f];
            dest[out_idx + 2] = encoder.alphabet_chars[(bits >> 14) & 0x3f];
            dest[out_idx + 3] = encoder.alphabet_chars[(bits >> 8) & 0x3f];
            out_idx += 4;
        }
        if (idx + 2 < source.len) {
            dest[out_idx] = encoder.alphabet_chars[source[idx] >> 2];
            dest[out_idx + 1] = encoder.alphabet_chars[((source[idx] & 0x3) << 4) | (source[idx + 1] >> 4)];
            dest[out_idx + 2] = encoder.alphabet_chars[(source[idx + 1] & 0xf) << 2 | (source[idx + 2] >> 6)];
            dest[out_idx + 3] = encoder.alphabet_chars[source[idx + 2] & 0x3f];
            out_idx += 4;
        } else if (idx + 1 < source.len) {
            dest[out_idx] = encoder.alphabet_chars[source[idx] >> 2];
            dest[out_idx + 1] = encoder.alphabet_chars[((source[idx] & 0x3) << 4) | (source[idx + 1] >> 4)];
            dest[out_idx + 2] = encoder.alphabet_chars[(source[idx + 1] & 0xf) << 2];
            out_idx += 3;
        } else if (idx < source.len) {
            dest[out_idx] = encoder.alphabet_chars[source[idx] >> 2];
            dest[out_idx + 1] = encoder.alphabet_chars[(source[idx] & 0x3) << 4];
            out_idx += 2;
        }
        if (encoder.pad_char) |pad_char| {
            for (dest[out_idx..out_len]) |*pad| {
                pad.* = pad_char;
            }
        }
        return dest[0..out_len];
    }
```
## 前提知識

- **Base64**: 8 ビットのバイトを、6 ビットずつの値（0 から 63）に分けて、対応する文字に変える方式です。1 文字が 6 ビットを表すので、データは約 4/3 倍の長さになります。
- **アルファベット**: 0 から 63 の値と文字の対応表です。`alphabet_chars` に入っています。
- **パディング（詰め物）**: 入力の長さが 3 の倍数でないとき、出力の長さを 4 の倍数にするための `=` です。`pad_char` で決まります。
- **`std.mem.readInt(u128, ..., .big)`**: バイト列を、大きい位が先頭になる順で整数として読みます。
- **`inline for`**: 繰り返しを、コンパイル時に展開する書き方です。16 文字の処理が、16 個の命令として並びます。
- **`@truncate`**: 大きな整数の下位のビットを取り出して、小さい型に変換します。

## 何をしているか

### 1. 16 文字を 12 バイトから作る（一番速い道）

```zig:line-numbers=127
        while (idx + 15 < source.len) : (idx += 12) {
            const bits = std.mem.readInt(u128, source[idx..][0..16], .big);
            inline for (0..16) |i| {
                dest[out_idx + i] = encoder.alphabet_chars[@truncate((bits >> (122 - i * 6)) & 0x3f)];
            }
            out_idx += 16;
        }
```

16 バイトを 128 ビットの値として読みます。そのうち 96 ビット（12 バイト分）から、6 ビットずつ 16 文字を取り出します。読んだ位置は 12 バイトずつ進むので、16 バイト読んでも、次の塊と重なる部分だけ読み直すことになります。

`(bits >> (122 - i * 6)) & 0x3f` で、上から 6 ビットずつ取り出します。最後の 2 ビットは、128 ビットの上位にある余りなので、ここでは使いません。

### 2. 3 バイトずつ 4 文字にする

```zig:line-numbers=134
        while (idx + 3 < source.len) : (idx += 3) {
            const bits = std.mem.readInt(u32, source[idx..][0..4], .big);
            dest[out_idx] = encoder.alphabet_chars[(bits >> 26) & 0x3f];
```

残りの部分は、4 バイトを `u32` として読み、3 バイトぶん（24 ビット）を 6 ビットずつ 4 文字に分けます。`bits >> 26` が最初の文字、`bits >> 20` が次の文字です。

### 3. 端数の 2 バイトと 1 バイトを処理する

```zig:line-numbers=142
        if (idx + 2 < source.len) {
            dest[out_idx] = encoder.alphabet_chars[source[idx] >> 2];
```

入力の残りが 3 バイトに満たないときは、1 バイトずつ `>>` と `&` で 6 ビットに分けます。2 バイト残った場合（`else if`）は 3 文字を出し、1 バイト残った場合は 2 文字を出します。

### 4. 出力の長さを揃える

```zig:line-numbers=158
        if (encoder.pad_char) |pad_char| {
            for (dest[out_idx..out_len]) |*pad| {
                pad.* = pad_char;
            }
        }
        return dest[0..out_len];
```

パディングの文字があれば、出力の残りを `=` で埋めます。最後に、書いた部分だけを切り出して返します。

## ここがすごい

- **大きな塊で速く**: 1 バイトずつ変換すると、ループと添字計算が多くなります。16 文字をまとめて作る道は、計算の回数が減り、とても速くなります。
- **コンパイル時に展開**: `inline for` で 16 文字分の処理を展開するので、ループの管理に時間を使いません。
- **端数の道を分ける**: 3 バイトに満たない部分だけ別の処理にしているので、通常の道の計算は単純なままです。
- **パディングを任意に**: `pad_char` が `null` なら、詰め物を付けません。パディングのない Base64 の方式も、同じ関数で扱えます。
- **出力の長さを先に計算**: `calcSize` で長さを前もって求め、`assert` で出力の領域が足りるかを確かめてから書きます。

## まとめ

- Base64 は、6 ビットずつの値を文字に変える方式で、3 バイトが 4 文字になります。
- 長い入力は、12 バイトずつ 16 文字の大きな塊で処理すると速くなります。
- 残りは 3 バイトずつ、最後の端数は 1 バイトずつ扱います。
- 詰め物は、出力の長さを 4 の倍数に揃えるために使います。
