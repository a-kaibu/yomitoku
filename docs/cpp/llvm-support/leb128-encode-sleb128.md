---
title: 負の数の可変長整数 SLEB128 は「残りが符号だけか」で止める
description: 符号付き整数を可変長形式 SLEB128 で書き出す encodeSLEB128。算術右シフトで残った値が、最後のバイトの符号ビットから復元できるかを見て終わりを決める。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/LEB128.h
lines: [22, 48]
function: llvm::encodeSLEB128
difficulty: 2
tags: [ビット演算, 入出力, 移植性]
format: 2
---

## ひとことで

`encodeSLEB128` は、**符号付き**整数を SLEB128（Signed LEB128）という可変長の形式で書き出します。

符号なし版の ULEB128 と同じく、1 バイトに 7 ビットずつ値を入れ、最上位ビットを「続きあり」の印にします。違いは、**最後のバイトの 7 ビット目（`0x40`）が符号を表す**ことです。

- `-2` → `7E`（1 バイト）
- `63` → `3F`（1 バイト）
- `64` → `C0 00`（2 バイト）

64 が 2 バイトになるのが面白いところです。理由を順に見ていきます。

## コード

::: code-group

```cpp:line-numbers=22 [日本語訳]
/// SLEB128 の値を出力ストリームにエンコードするユーティリティ関数。
/// エンコードした値のバイト数を返す。
inline unsigned encodeSLEB128(int64_t Value, raw_ostream &OS,
                              unsigned PadTo = 0) {
  bool More;
  unsigned Count = 0;
  do {
    uint8_t Byte = Value & 0x7f;
    // 注意: この符号付きシフトが算術右シフトであることを前提にしている。
    Value >>= 7;
    More = Value != ((Byte & 0x40) ? -1 : 0);
    Count++;
    if (More || Count < PadTo)
      Byte |= 0x80; // 後ろにまだバイトが続くことを示す印を付ける。
    OS << char(Byte);
  } while (More);

  // 0x80 で埋め、最後に終端のバイトを出力する。
  if (Count < PadTo) {
    uint8_t PadValue = Value < 0 ? 0x7f : 0x00;
    for (; Count < PadTo - 1; ++Count)
      OS << char(PadValue | 0x80);
    OS << char(PadValue);
    Count++;
  }
  return Count;
}
```

```cpp:line-numbers=22 [原文]
/// Utility function to encode a SLEB128 value to an output stream. Returns
/// the length in bytes of the encoded value.
inline unsigned encodeSLEB128(int64_t Value, raw_ostream &OS,
                              unsigned PadTo = 0) {
  bool More;
  unsigned Count = 0;
  do {
    uint8_t Byte = Value & 0x7f;
    // NOTE: this assumes that this signed shift is an arithmetic right shift.
    Value >>= 7;
    More = Value != ((Byte & 0x40) ? -1 : 0);
    Count++;
    if (More || Count < PadTo)
      Byte |= 0x80; // Mark this byte to show that more bytes will follow.
    OS << char(Byte);
  } while (More);

  // Pad with 0x80 and emit a terminating byte at the end.
  if (Count < PadTo) {
    uint8_t PadValue = Value < 0 ? 0x7f : 0x00;
    for (; Count < PadTo - 1; ++Count)
      OS << char(PadValue | 0x80);
    OS << char(PadValue);
    Count++;
  }
  return Count;
}
```

:::

## 前提知識

- **`int64_t`**: 符号付きの 64 ビット整数です。負の数は 2 の補数で表されます。
- **算術右シフト**: 符号付き整数を `>>` すると、左から**符号ビットと同じ値**が入ります。負の数を右シフトし続けると最後は `-1`（全ビット 1）に、正の数なら `0` になります。コード中の `NOTE` コメントは「この右シフトが算術シフトであることを前提にしている」と断っています（C++20 からは規格で保証されています）。
- **`raw_ostream &OS`**: LLVM の出力ストリームへの参照です。`OS << char(Byte)` で 1 バイト書き出します。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` です。
- **`0x7f`、`0x40`、`0x80`**: 2 進数でそれぞれ `0111 1111`、`0100 0000`、`1000 0000` です。

## 何をしているか

### 1. 7 ビット切り出して、残りを算術シフト

```cpp:line-numbers=29
    uint8_t Byte = Value & 0x7f;
    // 注意: この符号付きシフトが算術右シフトであることを前提にしている。
    Value >>= 7;
```

`Value = -2` で追います。-2 は 2 進数で `...1111 1110` です。

```
Byte  = -2 & 0x7f = 111 1110 (0x7E)
Value = -2 >> 7   = -1   （左から 1 が入るので全ビット 1）
```

### 2. 「残りは符号だけか」を調べる

```cpp:line-numbers=32
    More = Value != ((Byte & 0x40) ? -1 : 0);
```

読む側は、最後のバイトの `0x40` のビットを見て「上位を全部 1 で埋めるか、0 で埋めるか」を決めます。
だから、**残った `Value` が、今のバイトの `0x40` から復元できる値（-1 か 0）と一致すれば**、ここで終わってよいのです。

`Byte = 0x7E` は `0x40` が立っているので、期待値は `-1`。残りも `-1` なので `More = false`。出力は `7E` の 1 バイトです。

`Value = 64` では:

```
1 周目: Byte = 64 & 0x7f = 100 0000 (0x40)、Value = 0
        0x40 が立っているので期待値は -1。でも残りは 0 → More = true
        0x40 | 0x80 = 0xC0 を出力
2 周目: Byte = 0、Value = 0
        0x40 は立っていないので期待値は 0。一致 → More = false
        0x00 を出力
```

64 は 7 ビットに収まりますが、そのままだと符号ビット（`0x40`）が立っていて**負の数と読まれてしまいます**。そこで、正であることを示す `00` をもう 1 バイト足しているのです。

### 3. パディング

```cpp:line-numbers=39
  // 0x80 で埋め、最後に終端のバイトを出力する。
  if (Count < PadTo) {
    uint8_t PadValue = Value < 0 ? 0x7f : 0x00;
    for (; Count < PadTo - 1; ++Count)
      OS << char(PadValue | 0x80);
    OS << char(PadValue);
    Count++;
  }
```

`PadTo` が指定されていれば、その長さまで埋めます。埋める値は、負なら `0x7f`（全部 1）、正なら `0x00` です。

```cpp:line-numbers=41
    uint8_t PadValue = Value < 0 ? 0x7f : 0x00;
```

符号拡張と同じ考え方で、上位に符号と同じビットを並べても値は変わりません。

## ここがすごい

素直に考えると、「負なら全部 1、正なら全部 0 になるまで続ける」だけで良さそうです。しかしそれだと 64 のような**符号ビットとぶつかる値**を誤ってしまいます。

この関数は判定を「**残りの値が、今のバイトの符号ビットから読み手が復元する値と一致するか**」という 1 つの比較にまとめています。読み手がどう解釈するかを書き手の終了条件にそのまま使っているので、正負どちらの場合も、境界の値も、同じ 1 行で正しく扱えます。

算術右シフトという CPU の性質に頼る点は、コメントで明示されています。前提をコードの横に書いておくのは、移植性に気を配るライブラリらしい書き方です。

## まとめ

- SLEB128 は最後のバイトの `0x40` ビットを符号として使う。
- 終了条件は「残りが、そのバイトの符号から復元される値（-1 か 0）と一致するか」。
- 7 ビットに収まっても符号ビットとぶつかる値は、1 バイト余分に要る。
- 負の数のパディングは全部 1、正の数は全部 0。符号拡張と同じ考え方。
