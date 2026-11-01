---
title: 7 ビットずつ詰める可変長整数と、そのバイト数を一発で求める式
description: 整数を 1〜10 バイトの可変長形式（varint）に書き出す encodeVarint と、必要なバイト数を返す encodeVarintSize。val | 1 で clz の未定義動作を避け、(bit 数 + 6) / 7 で切り上げる。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/Varint.h
lines: [109, 132]
function: folly::encodeVarint / folly::encodeVarintSize
difficulty: 2
format: 2
tags: [ビット演算, 入出力, 最適化]
---

## ひとことで

**varint**（可変長整数）は、小さい数ほど少ないバイト数で表す整数の書き方です。1 バイトのうち下位 7 ビットに値を入れ、最上位ビットを「まだ続きがあるか」の印に使います。Protocol Buffers などで使われている形式です。

`encodeVarint(val, buf)` は `val` を `buf` に書き出して使ったバイト数を返し、`encodeVarintSize(val)` は **書き出す前に** 必要なバイト数だけを求めます。

## コード

::: code-group

```cpp:line-numbers=109 [日本語訳]
inline size_t encodeVarint(uint64_t val, uint8_t* buf) {
  uint8_t* p = buf;
  while (val >= 128) {
    *p++ = 0x80 | (val & 0x7f);
    val >>= 7;
  }
  *p++ = uint8_t(val);
  return size_t(p - buf);
}

inline int encodeVarintSize(uint64_t val) {
  if (folly::kIsArchAmd64) {
    // __builtin_clzll は 0 で未定義
    int highBit = 64 - __builtin_clzll(val | 1);
    return (highBit + 6) / 7;
  } else {
    int s = 1;
    while (val >= 128) {
      ++s;
      val >>= 7;
    }
    return s;
  }
}
```

```cpp:line-numbers=109 [原文]
inline size_t encodeVarint(uint64_t val, uint8_t* buf) {
  uint8_t* p = buf;
  while (val >= 128) {
    *p++ = 0x80 | (val & 0x7f);
    val >>= 7;
  }
  *p++ = uint8_t(val);
  return size_t(p - buf);
}

inline int encodeVarintSize(uint64_t val) {
  if (folly::kIsArchAmd64) {
    // __builtin_clzll is undefined for 0
    int highBit = 64 - __builtin_clzll(val | 1);
    return (highBit + 6) / 7;
  } else {
    int s = 1;
    while (val >= 128) {
      ++s;
      val >>= 7;
    }
    return s;
  }
}
```

:::

## 前提知識

- **`uint8_t* buf`**: 1 バイトずつ書き込む先を指すポインタです。
- **`*p++ = x`**: 「`p` が指す場所に `x` を書き、`p` を 1 つ進める」という C/C++ の定番の書き方です。
- **`0x7f` と `0x80`**: `0x7f` は `0111 1111`（下位 7 ビット）、`0x80` は `1000 0000`（最上位ビットだけ）です。
- **`val >>= 7`**: `val` を 7 ビット右にずらして代入します。下位 7 ビットを書き出したので、次の 7 ビットを下に持ってくる操作です。
- **`p - buf`**: 2 つのポインタの差で、何バイト進んだかがわかります。
- **`__builtin_clzll(x)`**: 64 ビット整数の上位に続く 0 の個数を返す組み込み関数です。`x = 0` のときは未定義です。
- **`folly::kIsArchAmd64`**: x86-64 向けにコンパイルしているときに `true` になるコンパイル時定数です。

## 何をしているか

### 1. エンコード

```cpp:line-numbers=109
inline size_t encodeVarint(uint64_t val, uint8_t* buf) {
  uint8_t* p = buf;
  while (val >= 128) {
    *p++ = 0x80 | (val & 0x7f);
    val >>= 7;
  }
  *p++ = uint8_t(val);
  return size_t(p - buf);
}
```

`val = 300` で追います。300 は 2 進数で `1 0010 1100` です。

- `300 >= 128` なので、下位 7 ビット `010 1100`（0x2C）に `0x80` を付けて `0xAC` を書く。`val = 300 >> 7 = 2`。
- `2 < 128` なのでループを抜け、`0x02` を書く。

結果は `AC 02` の 2 バイトです。**下位の 7 ビットから先に** 書くので、読む側は先頭から順に 7 ビットずつ下から積み上げれば元に戻せます。

### 2. バイト数の計算

```cpp:line-numbers=119
inline int encodeVarintSize(uint64_t val) {
  if (folly::kIsArchAmd64) {
    // __builtin_clzll is undefined for 0
    int highBit = 64 - __builtin_clzll(val | 1);
    return (highBit + 6) / 7;
  } else {
    int s = 1;
    while (val >= 128) {
      ++s;
      val >>= 7;
    }
    return s;
  }
}
```

1 バイトで 7 ビット運べるので、必要なバイト数は「`val` のビット数 ÷ 7 の切り上げ」です。

x86-64 では次のように計算します。

- `highBit = 64 - clzll(val | 1)` は `val` の 2 進数での桁数です。`300` なら 9 ビットなので `9`。
- `(9 + 6) / 7` = `2`。整数の割り算に `6`（= 7 - 1）を足しておくと、切り上げになります。

`val = 0` のときは `clzll(0)` が未定義なので、`val | 1` で最下位ビットを立ててから数えています。`0 | 1 = 1` は 1 ビットなので `(1 + 6) / 7 = 1` バイトとなり、0 を 1 バイトで書くという正しい答えになります。最下位ビットを立てても、`val > 0` のときの桁数は変わりません。

それ以外の CPU では、エンコードと同じように 7 ビットずつずらして数えるループを使います。

## ここがすごい

- **`val | 1` の一手**: `clz` 系の命令は 0 で未定義になるのが定番の落とし穴です。普通は `if (val == 0) return 1;` と分岐を書きますが、OR を 1 回入れるだけで 0 の場合も正しい答えに合流させています。コメントもその理由を説明しています。
- **割り算の切り上げを整数で**: `(n + 6) / 7` は「`n / 7` の切り上げ」の定番の書き方です。浮動小数点の `ceil` を使わずに済みます。
- **CPU ごとに速い方法を選ぶ**: x86-64 では `clzll` が高速な 1 命令（`lzcnt` / `bsr`）になるので、ループなしの式を使います。`kIsArchAmd64` はコンパイル時定数なので、使わない側のコードは最適化で消えます。
- **最大バイト数がはっきりしている**: 64 ビットなら `ceil(64 / 7) = 10` バイトが最大です。ファイルの冒頭では `kMaxVarintLength64 = 10` が定義されていて、書き込み先バッファの大きさの目安になっています。

## まとめ

- varint は「7 ビットの値 + 続きの印 1 ビット」を下位から順に並べる。
- 必要なバイト数は、ビット数を 7 で割って切り上げれば求まる。
- `clz(x | 1)` とすると、0 のときの未定義動作を分岐なしで避けられる。
- `(n + k - 1) / k` は整数の切り上げ割り算の定番。
