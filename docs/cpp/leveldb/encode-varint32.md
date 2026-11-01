---
title: 小さい数ほど短くなる可変長整数をループなしで書き出す
description: LevelDB の varint エンコード。32 ビット整数を 7 ビットずつに分け、続きがあるかを最上位ビットで示す。値の大きさごとに場合分けしてループを展開している。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/coding.cc
lines: [21, 47]
function: EncodeVarint32
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 入出力]
---

## ひとことで

`EncodeVarint32` は、32 ビットの整数を **varint（可変長整数）** という形式でバッファに書き込む関数です。varint は、小さい数ほど少ないバイト数で表せる形式で、Protocol Buffers などでも使われています。
たとえば 5 は 1 バイト、300 は 2 バイト、最大でも 5 バイトです。LevelDB では、キーの長さなど「たいてい小さい数」を保存するのに使い、ファイルを小さくしています。

## コード

::: code-group

```cpp:line-numbers=21 [日本語訳]
char* EncodeVarint32(char* dst, uint32_t v) {
  // 文字を符号なしとして扱う
  uint8_t* ptr = reinterpret_cast<uint8_t*>(dst);
  static const int B = 128;
  if (v < (1 << 7)) {
    *(ptr++) = v;
  } else if (v < (1 << 14)) {
    *(ptr++) = v | B;
    *(ptr++) = v >> 7;
  } else if (v < (1 << 21)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = v >> 14;
  } else if (v < (1 << 28)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = v >> 21;
  } else {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = (v >> 21) | B;
    *(ptr++) = v >> 28;
  }
  return reinterpret_cast<char*>(ptr);
}
```

```cpp:line-numbers=21 [原文]
char* EncodeVarint32(char* dst, uint32_t v) {
  // Operate on characters as unsigneds
  uint8_t* ptr = reinterpret_cast<uint8_t*>(dst);
  static const int B = 128;
  if (v < (1 << 7)) {
    *(ptr++) = v;
  } else if (v < (1 << 14)) {
    *(ptr++) = v | B;
    *(ptr++) = v >> 7;
  } else if (v < (1 << 21)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = v >> 14;
  } else if (v < (1 << 28)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = v >> 21;
  } else {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = (v >> 21) | B;
    *(ptr++) = v >> 28;
  }
  return reinterpret_cast<char*>(ptr);
}
```

:::

## 前提知識

- **`char*` と `uint8_t*`**: どちらも「1 バイトの並び」を指すポインタです。`char` は符号ありかなしかが環境によって違うので、ビット演算をするときは符号なしの `uint8_t` として扱うのが安全です。
- **`reinterpret_cast<T*>(p)`**: ポインタの型だけを読み替えます。指している住所は変わりません。
- **`*(ptr++) = x;`**: 「`ptr` が指す場所に `x` を書き、`ptr` を 1 つ進める」という C/C++ の定番の書き方です。
- **`1 << 7`**: 1 を左に 7 ビットずらした値、つまり 128 です。`1 << 14` は 16384 です。
- **`v | B`**: `B = 128`（2 進数で `10000000`）と OR を取り、最上位ビットを 1 にします。
- **暗黙の切り捨て**: `uint8_t` の場所に `uint32_t` の値を代入すると、下位 8 ビットだけが残ります。

## 何をしているか

varint のルールは次のとおりです。

- 数を下位から 7 ビットずつ区切る。
- 1 バイトに 7 ビットずつ入れる。下位の区切りから先に書く。
- まだ続きがあるバイトは最上位ビットを 1、最後のバイトは 0 にする。

### 1. 128 未満なら 1 バイト

```cpp:line-numbers=25
  if (v < (1 << 7)) {
    *(ptr++) = v;
```
たとえば `v = 5` なら、そのまま `00000101` を書きます。最上位ビットが 0 なので「これで終わり」の意味になります。

### 2. 16384 未満なら 2 バイト

```cpp:line-numbers=27
  } else if (v < (1 << 14)) {
    *(ptr++) = v | B;
    *(ptr++) = v >> 7;
```
`v = 300` を追います。300 は 2 進数で `1 0010 1100` です。

- 1 バイト目: `v | B` は下位 8 ビットが `1010 1100` になります（`0010 1100` の最上位を 1 に）。下位 7 ビット `010 1100` と「続きあり」の印です。
- 2 バイト目: `v >> 7` は `10`（2）。最上位ビットは 0 なので「終わり」です。

結果は `0xAC 0x02` の 2 バイトです。

ここで、1 バイト目に `v | B` を代入すると 8 ビットに切り捨てられます。`v` の 8 ビット目は最上位ビットの位置なので、`| B` で常に 1 に上書きされます。だから `(v & 127) | B` と書く必要がありません。

### 3. 以降も同じ形

```cpp:line-numbers=30
  } else if (v < (1 << 21)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = v >> 14;
  } else if (v < (1 << 28)) {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = v >> 21;
  } else {
    *(ptr++) = v | B;
    *(ptr++) = (v >> 7) | B;
    *(ptr++) = (v >> 14) | B;
    *(ptr++) = (v >> 21) | B;
    *(ptr++) = v >> 28;
  }
```
2^21 未満なら 3 バイト、2^28 未満なら 4 バイト、それ以上は 5 バイトです。各バイトは「7 ビットずらして、最後以外は `| B`」で作ります。

### 4. 書き終わった位置を返す

```cpp:line-numbers=46
  return reinterpret_cast<char*>(ptr);
```
戻り値は、最後に書いたバイトの次の位置です。呼び出し側は `ptr - buf` で、何バイト書いたかがわかります。

```cpp:line-numbers=49
void PutVarint32(std::string* dst, uint32_t v) {
  char buf[5];
  char* ptr = EncodeVarint32(buf, v);
  dst->append(buf, ptr - buf);
}
```

## ここがすごい

- **ループを展開している**: 同じファイルの 64 ビット版 `EncodeVarint64` は `while` ループで書かれています。32 ビット版は最大 5 バイトと決まっているので、場合分けを全部書き出しています。ループの条件判定がなくなり、各場合で必要なシフトが直接並びます。
- **切り捨てを味方にする**: `uint8_t` への代入で上位ビットが落ちる性質を利用して、マスク（`& 127`）を省いています。
- **ポインタを返す API**: 書き込んだバイト数ではなく「次に書く位置」を返すので、続けて別の値を書くときに `p = EncodeVarint32(p, x);` と連鎖させやすくなっています。
- **小さい数が多いデータに強い**: 固定長なら毎回 4 バイトです。キーの長さのように小さい値が多いデータでは、ほとんどが 1 バイトで済みます。

## まとめ

- varint は 7 ビットずつ区切り、最上位ビットで「続きがあるか」を示す。
- 繰り返し回数の上限が小さいなら、ループを展開して分岐を減らせる。
- 小さい型への代入で上位ビットが落ちる性質は、マスクの代わりに使える。
- 「次に書く位置」を返す関数は、連続した書き込みを書きやすくする。
