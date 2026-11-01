---
title: 4 バイトずつ混ぜて端数は switch の落下で拾うハッシュ関数
description: LevelDB の内部ハッシュ関数。MurmurHash に似た「足す・掛ける・シフトして XOR」を 4 バイト単位でくり返し、残りの 1〜3 バイトを switch のフォールスルーで処理する。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/hash.cc
lines: [20, 51]
function: Hash
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, イディオム]
---

## ひとことで

`Hash` は、任意の長さのバイト列から 32 ビットのハッシュ値（データを要約した数）を作る関数です。LevelDB のキャッシュやブルームフィルタで使われます。
コメントにあるとおり MurmurHash に似た作りで、**4 バイトずつまとめて混ぜ** 、最後に余った 1〜3 バイトを `switch` の「落下（フォールスルー）」でまとめて処理します。

## コード

::: code-group

```cpp:line-numbers=20 [日本語訳]
uint32_t Hash(const char* data, size_t n, uint32_t seed) {
  // murmur hash に似ている
  const uint32_t m = 0xc6a4a793;
  const uint32_t r = 24;
  const char* limit = data + n;
  uint32_t h = seed ^ (n * m);

  // 4 バイトずつ取り込む
  while (limit - data >= 4) {
    uint32_t w = DecodeFixed32(data);
    data += 4;
    h += w;
    h *= m;
    h ^= (h >> 16);
  }

  // 残りのバイトを取り込む
  switch (limit - data) {
    case 3:
      h += static_cast<uint8_t>(data[2]) << 16;
      FALLTHROUGH_INTENDED;
    case 2:
      h += static_cast<uint8_t>(data[1]) << 8;
      FALLTHROUGH_INTENDED;
    case 1:
      h += static_cast<uint8_t>(data[0]);
      h *= m;
      h ^= (h >> r);
      break;
  }
  return h;
}
```

```cpp:line-numbers=20 [原文]
uint32_t Hash(const char* data, size_t n, uint32_t seed) {
  // Similar to murmur hash
  const uint32_t m = 0xc6a4a793;
  const uint32_t r = 24;
  const char* limit = data + n;
  uint32_t h = seed ^ (n * m);

  // Pick up four bytes at a time
  while (limit - data >= 4) {
    uint32_t w = DecodeFixed32(data);
    data += 4;
    h += w;
    h *= m;
    h ^= (h >> 16);
  }

  // Pick up remaining bytes
  switch (limit - data) {
    case 3:
      h += static_cast<uint8_t>(data[2]) << 16;
      FALLTHROUGH_INTENDED;
    case 2:
      h += static_cast<uint8_t>(data[1]) << 8;
      FALLTHROUGH_INTENDED;
    case 1:
      h += static_cast<uint8_t>(data[0]);
      h *= m;
      h ^= (h >> r);
      break;
  }
  return h;
}
```

:::

`FALLTHROUGH_INTENDED` は同じファイルで次のように定義されています。

```cpp:line-numbers=14
#ifndef FALLTHROUGH_INTENDED
#define FALLTHROUGH_INTENDED [[fallthrough]]
#endif
```

## 前提知識

- **`const char* data, size_t n`**: ハッシュするバイト列の先頭と長さです。
- **`limit - data`**: ポインタ同士の引き算は、間にある要素の数になります。ここでは「残りのバイト数」です。
- **`DecodeFixed32(data)`**: 4 バイトをリトルエンディアン（下位バイトが先）として 32 ビット整数に組み立てる LevelDB の関数です。
- **符号なし整数のあふれ**: `uint32_t` の足し算・掛け算が 2^32 を超えると、上位が捨てられて余りだけが残ります。C++ で決められた動作なので、ハッシュの計算でよく利用されます。
- **`switch` のフォールスルー**: `case` の最後に `break` がないと、次の `case` の処理にそのまま進みます。
- **`[[fallthrough]]`**: 「ここで次の `case` に落ちるのは意図どおり」とコンパイラに伝える属性（C++17）です。付けないと、書き忘れを疑う警告が出ることがあります。
- **マクロ（`#define`）**: コンパイル前に文字列を置き換える仕組みです。`#ifndef` で「まだ定義されていなければ」定義しています。

## 何をしているか

### 1. 初期値を作る

```cpp:line-numbers=22
  const uint32_t m = 0xc6a4a793;
  const uint32_t r = 24;
  const char* limit = data + n;
  uint32_t h = seed ^ (n * m);
```
`m` は混ぜるための大きな奇数、`r` は最後のシフト量です。初期値 `h` は、種 `seed` と「長さ × m」の XOR です。長さを混ぜておくので、`"a"` と `"a\0"` のように中身が似ていて長さが違う入力も区別しやすくなります。

### 2. 4 バイトずつ混ぜる

```cpp:line-numbers=27
  // 4 バイトずつ取り込む
  while (limit - data >= 4) {
    uint32_t w = DecodeFixed32(data);
    data += 4;
    h += w;
    h *= m;
    h ^= (h >> 16);
  }
```
4 バイト以上残っている間、4 バイトを整数 `w` として読み、次の 3 つを行います。

- `h += w`: 入力を取り込む。
- `h *= m`: 掛け算で、下位ビットの変化を上位ビットに広げる。
- `h ^= (h >> 16)`: 上位ビットの情報を下位ビットに戻す。

たとえば 7 バイトの入力なら、ここで 1 回まわり、3 バイト残ります。

### 3. 余りを落下で処理する

```cpp:line-numbers=36
  // 残りのバイトを取り込む
  switch (limit - data) {
    case 3:
      h += static_cast<uint8_t>(data[2]) << 16;
      FALLTHROUGH_INTENDED;
    case 2:
      h += static_cast<uint8_t>(data[1]) << 8;
      FALLTHROUGH_INTENDED;
    case 1:
      h += static_cast<uint8_t>(data[0]);
      h *= m;
      h ^= (h >> r);
      break;
  }
```
残りが 3 なら `case 3` から入ります。3 バイト目を 16 ビット左にずらして足し、`break` がないので `case 2` に落ちて 2 バイト目を、さらに `case 1` で 1 バイト目を足します。最後に掛け算と XOR で混ぜて終わりです。
残りが 1 なら `case 1` だけ、0 なら何もしません。

## ここがすごい

- **4 バイト単位の処理**: 1 バイトずつ処理するより、ループの回数が 4 分の 1 になります。`DecodeFixed32` はコンパイラによって 1 回の読み込み命令にまとまるので、高速です。
- **フォールスルーで重複をなくす**: 「3 バイトのとき」「2 バイトのとき」「1 バイトのとき」と 3 通り書くと、同じ足し算があちこちに重複します。落下を使えば、大きい場合が小さい場合の処理を「通り抜ける」ので、各処理は 1 回ずつ書けば済みます。
- **意図を明示する**: フォールスルーは書き忘れによるバグの温床です。`FALLTHROUGH_INTENDED` を置いて意図を示し、コンパイラの警告も黙らせています。古いコンパイラ向けに、マクロを外から差し替えられるようにもしています。
- **用途を割り切る**: これは暗号用のハッシュではありません。速くて、偏りが少なければ十分なキャッシュやフィルタのための関数です。

## まとめ

- ハッシュは「取り込む・掛けて広げる・シフトして XOR で戻す」のくり返しで作れる。
- データはなるべく大きな単位でまとめて処理し、端数は最後に片付ける。
- `switch` のフォールスルーは、「大きい場合が小さい場合の処理を含む」ときに重複を消せる。
- 意図的なフォールスルーには `[[fallthrough]]` を付けて、読み手とコンパイラに伝える。
