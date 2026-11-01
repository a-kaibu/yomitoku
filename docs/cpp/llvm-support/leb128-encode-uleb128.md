---
title: 小さい数ほど短くなる可変長整数 ULEB128 を 7 ビットずつ書き出す
description: DWARF や WebAssembly で使われる可変長整数 ULEB128 のエンコーダ。1 バイトに 7 ビットずつ詰め、最上位ビットを「続きがある」印に使う。固定長へのパディングにも対応する。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/LEB128.h
lines: [77, 99]
function: llvm::encodeULEB128
difficulty: 1
tags: [ビット演算, 入出力, データ構造]
format: 2
---

## ひとことで

`encodeULEB128` は、符号なし整数を **ULEB128**（Unsigned Little Endian Base 128）という可変長の形式で書き出します。

ULEB128 では、1 バイトのうち下位 7 ビットに値を入れ、最上位ビットを「**次のバイトに続きがある**」という印にします。
`5` なら `05` の 1 バイト、`300` なら `AC 02` の 2 バイトです。小さい数ほど短く書けるので、デバッグ情報（DWARF）や WebAssembly のバイナリなど、整数が大量に並ぶ形式で使われています。

## コード

::: code-group

```cpp:line-numbers=77 [日本語訳]
/// ULEB128 の値を出力ストリームにエンコードするユーティリティ関数。
/// エンコードした値のバイト数を返す。
inline unsigned encodeULEB128(uint64_t Value, raw_ostream &OS,
                              unsigned PadTo = 0) {
  unsigned Count = 0;
  do {
    uint8_t Byte = Value & 0x7f;
    Value >>= 7;
    Count++;
    if (Value != 0 || Count < PadTo)
      Byte |= 0x80; // 後ろにまだバイトが続くことを示す印を付ける。
    OS << char(Byte);
  } while (Value != 0);

  // 0x80 で埋め、最後に 0 のバイトを出力する。
  if (Count < PadTo) {
    for (; Count < PadTo - 1; ++Count)
      OS << '\x80';
    OS << '\x00';
    Count++;
  }
  return Count;
}
```

```cpp:line-numbers=77 [原文]
/// Utility function to encode a ULEB128 value to an output stream. Returns
/// the length in bytes of the encoded value.
inline unsigned encodeULEB128(uint64_t Value, raw_ostream &OS,
                              unsigned PadTo = 0) {
  unsigned Count = 0;
  do {
    uint8_t Byte = Value & 0x7f;
    Value >>= 7;
    Count++;
    if (Value != 0 || Count < PadTo)
      Byte |= 0x80; // Mark this byte to show that more bytes will follow.
    OS << char(Byte);
  } while (Value != 0);

  // Pad with 0x80 and emit a null byte at the end.
  if (Count < PadTo) {
    for (; Count < PadTo - 1; ++Count)
      OS << '\x80';
    OS << '\x00';
    Count++;
  }
  return Count;
}
```

:::

## 前提知識

- **`uint64_t` と `uint8_t`**: 符号なしの 64 ビット整数と 8 ビット整数（1 バイト）です。
- **`raw_ostream &OS`**: LLVM の出力ストリーム（書き込み先）です。`&` は参照で、呼び出し元のストリームそのものを受け取ります。`OS << char(Byte)` で 1 バイト書き出します。
- **既定引数 `unsigned PadTo = 0`**: 呼び出し側が省略すると `0` になる引数です。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行してから条件を調べるループです。値が 0 でも最低 1 バイトは書き出したいので、この形を使っています。
- **`0x7f` と `0x80`**: 16 進数で、2 進数ではそれぞれ `0111 1111`（下位 7 ビット）と `1000 0000`（最上位ビット）です。
- **`'\x80'`**: 値が 0x80 の文字（バイト）を表す書き方です。

## 何をしているか

### 1. 下位 7 ビットずつ切り出す

```cpp:line-numbers=82
  do {
    uint8_t Byte = Value & 0x7f;
    Value >>= 7;
    Count++;
    if (Value != 0 || Count < PadTo)
      Byte |= 0x80; // 後ろにまだバイトが続くことを示す印を付ける。
    OS << char(Byte);
  } while (Value != 0);
```

`Value = 300` で追います。300 は 2 進数で `1 0010 1100` です。

```
1 周目: Byte  = 300 & 0x7f = 010 1100 (0x2C)
        Value = 300 >> 7   = 2
        Value != 0 なので Byte |= 0x80 → 0xAC を出力
2 周目: Byte  = 2 & 0x7f   = 0x02
        Value = 0
        続きは無いので 0x02 をそのまま出力
```

結果は `AC 02` です。**下位の 7 ビットから順に**並ぶので「リトルエンディアン」と呼ばれます。読む側は、最上位ビットが 0 のバイトに出会ったら終わりだとわかります。

### 2. 指定の長さまで埋める

```cpp:line-numbers=91
  // 0x80 で埋め、最後に 0 のバイトを出力する。
  if (Count < PadTo) {
    for (; Count < PadTo - 1; ++Count)
      OS << '\x80';
    OS << '\x00';
    Count++;
  }
```

`PadTo` を指定すると、値が短くても**その長さぴったり**のバイト数で書き出します。`300` を `PadTo = 4` で書くと次のようになります。

```
AC 82 80 00
```

ループ内の条件 `Count < PadTo` によって、2 バイト目にも「続きあり」の印が付きます（`0x02 | 0x80 = 0x82`）。そのあとの `for` で値 0・続きありの `0x80` を足し、最後に値 0・終わりの `0x00` で締めます。

```cpp:line-numbers=86
    if (Value != 0 || Count < PadTo)
      Byte |= 0x80; // 後ろにまだバイトが続くことを示す印を付ける。
```

読む側から見ると、上位に 0 が並んでいるだけなので、値は 300 のままです。

### 3. 書いたバイト数を返す

```cpp:line-numbers=98
  return Count;
```

`Count` は書き出したバイト数です。呼び出し側はこれで出力のサイズを知ることができます。

## ここがすごい

- **データに合わせて長さが変わる**: 64 ビット整数を固定長で書くと常に 8 バイトですが、実際のデータは小さな数が多いものです。ULEB128 なら 0〜127 は 1 バイト、16383 までは 2 バイトで済みます。
- **終わりの印がデータの中にある**: 長さを別に記録しなくても、最上位ビットだけで区切りがわかります。
- **パディングでも意味が変わらない**: 「値 0・続きあり」のバイトを挟めば、同じ値を好きな長さで表せます。後から値を書き換えたい場所を、あらかじめ固定長で確保しておくような用途に使えます。この性質を 2 行のループで実現しています。
- **同じロジックの 2 つの版**: すぐ下には、ストリームではなくメモリ上のバッファに書く版があります。出力先によって使い分けられるようになっています。

## まとめ

- 可変長整数は、1 バイトに 7 ビットずつ値を入れ、残り 1 ビットを「続きあり」の印にする。
- 下位から順に並べると、エンコードもデコードもシフトだけで書ける。
- 値 0 の「続きあり」バイトを挟むと、意味を変えずに長さをそろえられる。
- 最低 1 バイトは出したいループには `do-while` が向いている。
