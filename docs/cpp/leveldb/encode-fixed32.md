---
title: 1 バイトずつ書いて CPU に依存しないリトルエンディアンを作る
description: LevelDB で 32 ビット整数を 4 バイトに書き出す関数。シフトで 1 バイトずつ取り出して並べるだけで、どの CPU でも同じバイト順になり、最近のコンパイラは 1 命令にまとめる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/coding.h
lines: [54, 62]
function: EncodeFixed32
difficulty: 1
format: 2
tags: [移植性, ビット演算, 入出力]
---

## ひとことで

`EncodeFixed32` は、32 ビットの整数を 4 バイトに分けて、メモリ（ファイルに書くためのバッファ）に並べる関数です。並べ方は **リトルエンディアン**、つまり下位のバイトから先に置く順です。
1 バイトずつシフトで取り出して書くので、どんな CPU で動かしても同じバイト列になります。

## コード

::: code-group

```cpp:line-numbers=54 [日本語訳]
inline void EncodeFixed32(char* dst, uint32_t value) {
  uint8_t* const buffer = reinterpret_cast<uint8_t*>(dst);

  // 最近の clang と gcc は、これを 1 個の mov / str 命令に最適化する。
  buffer[0] = static_cast<uint8_t>(value);
  buffer[1] = static_cast<uint8_t>(value >> 8);
  buffer[2] = static_cast<uint8_t>(value >> 16);
  buffer[3] = static_cast<uint8_t>(value >> 24);
}
```

```cpp:line-numbers=54 [原文]
inline void EncodeFixed32(char* dst, uint32_t value) {
  uint8_t* const buffer = reinterpret_cast<uint8_t*>(dst);

  // Recent clang and gcc optimize this to a single mov / str instruction.
  buffer[0] = static_cast<uint8_t>(value);
  buffer[1] = static_cast<uint8_t>(value >> 8);
  buffer[2] = static_cast<uint8_t>(value >> 16);
  buffer[3] = static_cast<uint8_t>(value >> 24);
}
```

:::

## 前提知識

- **エンディアン**: 複数バイトの数をメモリに並べる順番です。`0x12345678` を `78 56 34 12` と下位から置くのがリトルエンディアン、`12 34 56 78` と上位から置くのがビッグエンディアンです。x86 や多くの ARM はリトルエンディアンです。
- **`inline`**: 関数の中身を呼び出し元に展開してよい、という指定です。ヘッダに関数の本体を書くときに使います。
- **`uint8_t* const buffer`**: `const` がポインタ名の直前にあるので、「ポインタ自体を別の場所に向け直さない」という意味です。指す先の中身は書き換えられます。
- **`static_cast<uint8_t>(x)`**: `x` を 1 バイトの符号なし整数に変換します。下位 8 ビットだけが残ります。
- **`value >> 8`**: 右に 8 ビットずらします。2 番目に下位のバイトが、いちばん下に来ます。

## 何をしているか

`value = 0x12345678` を書くとします。

### 1. 書き込み先を符号なしバイトとして扱う

```cpp:line-numbers=55
  uint8_t* const buffer = reinterpret_cast<uint8_t*>(dst);
```
`char*` を `uint8_t*` に読み替えます。`char` は環境によって符号付きのことがあるので、バイトとして扱うには符号なしのほうが確実です。

### 2. 下位から 1 バイトずつ書く

```cpp:line-numbers=58
  buffer[0] = static_cast<uint8_t>(value);
  buffer[1] = static_cast<uint8_t>(value >> 8);
  buffer[2] = static_cast<uint8_t>(value >> 16);
  buffer[3] = static_cast<uint8_t>(value >> 24);
```
- `buffer[0]` = `0x78`（そのまま下位 8 ビット）
- `buffer[1]` = `0x56`（8 ビットずらした下位 8 ビット）
- `buffer[2]` = `0x34`
- `buffer[3]` = `0x12`

これでメモリは `78 56 34 12` になります。読み出し側の `DecodeFixed32` は、逆に 1 バイトずつ読んで左にずらし、OR で組み立てます。

```cpp:line-numbers=81
inline uint32_t DecodeFixed32(const char* ptr) {
  const uint8_t* const buffer = reinterpret_cast<const uint8_t*>(ptr);

  // 最近の clang と gcc は、これを 1 個の mov / ldr 命令に最適化する。
  return (static_cast<uint32_t>(buffer[0])) |
         (static_cast<uint32_t>(buffer[1]) << 8) |
         (static_cast<uint32_t>(buffer[2]) << 16) |
         (static_cast<uint32_t>(buffer[3]) << 24);
}
```

## ここがすごい

- **CPU のバイト順に左右されない**: 素直に書くと `memcpy(dst, &value, 4)` のように、メモリ上の表現をそのままコピーしたくなります。でもそれだと、ビッグエンディアンの CPU では逆順のファイルができ、他の環境で読めなくなります。シフトで書けば、どこでも同じ結果です。
- **それでも遅くならない**: 関数内のコメントにあるとおり、最近の clang や gcc は、この 4 行のパターンを見抜いて、リトルエンディアンの CPU では **1 回の 4 バイト書き込み命令** にまとめます。読みやすく移植性の高い書き方と、速さが両立します。
- **アライメントの心配がない**: 1 バイトずつの書き込みとして書いているので、`dst` が 4 の倍数の住所でなくても、言語上は問題ありません。`*(uint32_t*)dst = value` のような書き方は、住所がずれていると CPU によっては不正になりますし、C++ の型のルール（strict aliasing）にも反するおそれがあります。

## まとめ

- ファイルやネットワークに書く数は、バイト順を自分で決めて、シフトで 1 バイトずつ書くと移植性が高い。
- 最近のコンパイラは、このパターンを 1 命令にまとめるので速さも損なわない。
- ポインタの型を無理に読み替えた書き込みは、アライメントや型のルールで問題になりうる。
