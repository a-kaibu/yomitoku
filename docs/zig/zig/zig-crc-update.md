---
title: 表を引いて、1 バイトずつ CRC を更新する
description: Zig の CRC 計算 update。256 個の値の表を使い、1 バイトごとに CRC を 1 回の表の参照と XOR で更新する。入力の向き（反射の有無）で式が変わる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/hash/crc/impl.zig
lines: [66, 83]
function: Crc.update
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 最適化]
---

## ひとことで

`update` は、CRC（データの誤りを見つける検査値）を、新しく来たバイト列の分だけ更新する関数です。
CRC の計算は、1 バイトごとに「今の CRC を変える」操作の繰り返しです。この関数は、その 1 回分の操作を、あらかじめ作った表の参照で速く行います。

ビットの並ぶ向き（反射するかどうか）によって、式が 2 通りに分かれています。

## コード

```zig:line-numbers=66
        pub fn update(self: *Self, bytes: []const u8) void {
            var i: usize = 0;
            if (@bitSizeOf(I) <= 8) {
                while (i < bytes.len) : (i += 1) {
                    self.crc = tableEntry(self.crc ^ bytes[i]);
                }
            } else if (algorithm.reflect_input) {
                while (i < bytes.len) : (i += 1) {
                    const table_index = self.crc ^ bytes[i];
                    self.crc = tableEntry(table_index) ^ (self.crc >> 8);
                }
            } else {
                while (i < bytes.len) : (i += 1) {
                    const table_index = (self.crc >> (@bitSizeOf(I) - 8)) ^ bytes[i];
                    self.crc = tableEntry(table_index) ^ (self.crc << 8);
                }
            }
        }
```
## 前提知識

- **CRC（巡回冗長検査）**: データから作る検査値です。データが 1 ビットでも変わると、値が変わるように作られています。
- **多項式**: CRC の計算の基になる数です。方式によって決まっていて、同じ方式なら同じ値になります。
- **表（lookup table）**: 256 個の値を、あらかじめ計算して並べたものです。`tableEntry(index)` で、添字に対応する値を取り出します。
- **`index & 0xFF`**: 下位 8 ビットだけを取り出す計算です。
- **`reflect_input`**: 入力のビットを、反対向きに読むかどうかの設定です。これで、下位のビットから処理するか、上位から処理するかが決まります。
- **`^`（XOR）と `>>`、`<<`**: XOR は違うビットだけ 1 にする演算、シフトはビットをずらす演算です。

## 何をしているか

### 1. 8 ビット以下の CRC は、1 バイトずつ表を引く

```zig:line-numbers=68
            if (@bitSizeOf(I) <= 8) {
                while (i < bytes.len) : (i += 1) {
                    self.crc = tableEntry(self.crc ^ bytes[i]);
                }
```

CRC が 8 ビット以下なら、今の CRC と入力のバイトを XOR して、その値で表を引きます。結果がそのまま新しい CRC になります。ずらす操作が要らない、いちばん簡単な形です。

### 2. 入力を反射する方式では、下位のビットを使う

```zig:line-numbers=72
            } else if (algorithm.reflect_input) {
                while (i < bytes.len) : (i += 1) {
                    const table_index = self.crc ^ bytes[i];
                    self.crc = tableEntry(table_index) ^ (self.crc >> 8);
                }
```

反射する方式では、CRC の下位 8 ビットと入力のバイトを XOR して、表の添字にします。表の値と、今の CRC を 8 ビット右にずらした値を XOR して、新しい CRC にします。

CRC の下位から、1 バイトずつ消費していくイメージです。

### 3. 反射しない方式では、上位のビットを使う

```zig:line-numbers=77
            } else {
                while (i < bytes.len) : (i += 1) {
                    const table_index = (self.crc >> (@bitSizeOf(I) - 8)) ^ bytes[i];
                    self.crc = tableEntry(table_index) ^ (self.crc << 8);
                }
            }
```

反射しない方式では、CRC の上位 8 ビットを取り出し、入力のバイトと XOR して添字にします。新しい CRC は、今の CRC を 8 ビット左にずらした値と、表の値の XOR です。

2 つの式は、ビットの向きが逆になっているだけで、同じ考え方です。

## ここがすごい

- **1 バイトごとに表 1 回で済む**: 1 ビットずつ多項式で割る方法は、ビットの数だけ計算が必要です。表を使うと、1 バイトあたり表の参照とシフト、XOR だけになります。
- **表の計算は前もって**: 表は、`lookup_table` としてコンパイル時に計算されます。実行時の計算は、表を引くことだけです。
- **向きの違いを式で分ける**: 反射する・しないの違いを、`if` で 2 つの式に分けています。ループの形は同じなので、読むときも比べやすくなっています。
- **型の大きさで分岐を省く**: 8 ビット以下の CRC は、シフトの式が不要になるので、特別な分岐にしています。型の大きさをコンパイル時に見て、必要な式だけを残します。

## まとめ

- CRC は、1 バイトごとに、表の値を使って更新していけます。
- 反射する方式では下位のビット、反射しない方式では上位のビットを使って、表の添字を作ります。
- 表を前もって作っておくと、実行時は表の参照と XOR だけで済みます。
- 8 ビット以下の CRC は、最も簡単な形で処理できます。
