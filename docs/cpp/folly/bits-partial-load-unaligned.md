---
title: 1〜7 バイトの端数を、最大 3 回の読み込みで整数にまとめる
description: バッファの末尾に残った sizeof(T) 未満のバイトを整数に読み込む partialLoadUnaligned。長さ l の 2 進数のビットを見て 4・2・1 バイトの読み込みに分解する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [516, 545]
function: folly::partialLoadUnaligned
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

`partialLoadUnaligned<T>(p, l)` は、ポインタ `p` から **`l` バイト（`l` は `sizeof(T)` 未満）** を読んで、整数 `T` の下位側に詰めて返します。
ハッシュ関数などでバッファを 8 バイトずつ処理していくと、最後に 1〜7 バイトの端数が残ります。その端数を 1 つの整数として扱うための関数です。

1 バイトずつループで読むのではなく、**`l` を 4 + 2 + 1 に分解して、最大 3 回の読み込み** で済ませているのが工夫です。

## コード

::: code-group

```cpp:line-numbers=516 [日本語訳]
template <class T>
inline T partialLoadUnaligned(const void* p, size_t l) {
  static_assert(
      std::is_integral<T>::value && std::is_unsigned<T>::value &&
          sizeof(T) <= 8,
      "Invalid type");
  assume(l < sizeof(T));

  auto cp = static_cast<const char*>(p);
  T value = 0;
  if constexpr (!kHasUnalignedAccess || !kIsLittleEndian) {
    // 未対応の環境なので memcpy を使う。
    memcpy(&value, cp, l);
    return value;
  }

  auto avail = l;
  if (l & 4) {
    avail -= 4;
    value = static_cast<T>(loadUnaligned<uint32_t>(cp + avail)) << (avail * 8);
  }
  if (l & 2) {
    avail -= 2;
    value |= static_cast<T>(loadUnaligned<uint16_t>(cp + avail)) << (avail * 8);
  }
  if (l & 1) {
    value |= loadUnaligned<uint8_t>(cp);
  }
  return value;
}
```

```cpp:line-numbers=516 [原文]
template <class T>
inline T partialLoadUnaligned(const void* p, size_t l) {
  static_assert(
      std::is_integral<T>::value && std::is_unsigned<T>::value &&
          sizeof(T) <= 8,
      "Invalid type");
  assume(l < sizeof(T));

  auto cp = static_cast<const char*>(p);
  T value = 0;
  if constexpr (!kHasUnalignedAccess || !kIsLittleEndian) {
    // Unsupported, use memcpy.
    memcpy(&value, cp, l);
    return value;
  }

  auto avail = l;
  if (l & 4) {
    avail -= 4;
    value = static_cast<T>(loadUnaligned<uint32_t>(cp + avail)) << (avail * 8);
  }
  if (l & 2) {
    avail -= 2;
    value |= static_cast<T>(loadUnaligned<uint16_t>(cp + avail)) << (avail * 8);
  }
  if (l & 1) {
    value |= loadUnaligned<uint8_t>(cp);
  }
  return value;
}
```

:::

## 前提知識

- **`const void* p`**: 型の決まっていないメモリを指すポインタです。`static_cast<const char*>(p)` で「1 バイト単位で数えるポインタ」に変えると、`cp + 3` で 3 バイト先を指せます。
- **アラインメント（整列）**: 多くの CPU は、4 バイトの整数を 4 の倍数のアドレスから読むのが基本です。そうでない位置からの読み込み（unaligned access）は、CPU によっては遅かったり禁止されていたりします。
- **`loadUnaligned<uint32_t>(ptr)`**: 同じファイルにある関数で、整列していない位置からでも安全に 4 バイトを読みます。中身は `memcpy` で、コンパイラはこれを 1 回の読み込み命令に変えてくれます。
- **リトルエンディアン**: 整数をメモリに置くとき、下位バイトを先（小さいアドレス）に置く方式です。x86 や多くの ARM がこれです。
- **`if constexpr`**: コンパイル時に決まる条件の `if` です。`kHasUnalignedAccess`（非整列アクセスが使えるか）や `kIsLittleEndian` は Folly が定義するコンパイル時定数です。
- **`assume(l < sizeof(T))`**: 「この条件は必ず成り立つ」とコンパイラに伝えるヒントです。最適化に使われます。
- **`l & 4`**: `l` の 2 進数で、4 の位のビットが立っているかを調べます。

## 何をしているか

### 1. 使えない環境では memcpy に任せる

```cpp:line-numbers=526
  if constexpr (!kHasUnalignedAccess || !kIsLittleEndian) {
    // Unsupported, use memcpy.
    memcpy(&value, cp, l);
    return value;
  }
```

非整列アクセスができない CPU や、ビッグエンディアンの CPU では、単純に `memcpy` で `l` バイトを `value` にコピーして終わりです。以降の技はリトルエンディアン前提だからです。

### 2. l を 4・2・1 に分解する

```cpp:line-numbers=532
  auto avail = l;
  if (l & 4) {
    avail -= 4;
    value = static_cast<T>(loadUnaligned<uint32_t>(cp + avail)) << (avail * 8);
  }
  if (l & 2) {
    avail -= 2;
    value |= static_cast<T>(loadUnaligned<uint16_t>(cp + avail)) << (avail * 8);
  }
  if (l & 1) {
    value |= loadUnaligned<uint8_t>(cp);
  }
```

`l = 7`（2 進数 `111`）、メモリが `b0 b1 b2 b3 b4 b5 b6` の場合で追います。`avail` は「まだ読んでいない先頭部分の長さ」です。

- `l & 4` が真 → `avail` = `3`。`cp + 3` から 4 バイト（`b3 b4 b5 b6`）を読み、`3 * 8 = 24` ビット左にずらして置きます。
- `l & 2` が真 → `avail` = `1`。`cp + 1` から 2 バイト（`b1 b2`）を読み、8 ビット左にずらして OR します。
- `l & 1` が真 → `cp` から 1 バイト（`b0`）を読んで OR します。

結果の `value` は、下位から `b0 b1 b2 b3 b4 b5 b6` の順に並びます。リトルエンディアンで 7 バイトを `memcpy` したのと同じ値です。

`l = 5`（`101`）なら、4 バイト（`b1〜b4`、8 ビットずらす）と 1 バイト（`b0`）の 2 回だけです。

### 3. 後ろから読むのがミソ

大きい塊を **後ろ側** から取っていくので、各読み込みの位置と「何ビットずらすか」が `avail` 1 つで決まります。`avail * 8` がそのまま、その塊が整数の中で置かれる位置になります。

## ここがすごい

- **読み込み回数が最大 3 回で固定**: 素直に 1 バイトずつ読めば最大 7 回のループです。ここでは `l` の各ビットに対応する 3 つの `if` だけで、ループがありません。
- **範囲外を読まない**: よく使われる高速化に「8 バイトまとめて読んで、余分をマスクで消す」があります。しかしそれはバッファの終わりを越えて読む可能性があり、ページ境界をまたぐとクラッシュします。この関数は **ちょうど `l` バイトだけ** を読むので安全です。
- **`memcpy` 版と同じ結果**: 速い道でも、結果は `memcpy(&value, cp, l)` と同じになるよう、エンディアンを前提にしたうえで位置を計算しています。前提が崩れる環境では、`if constexpr` で素直な実装に切り替わります。
- **2 進数の分解というアイデア**: 「任意の 0〜7 は 4・2・1 の組み合わせで表せる」という性質を、メモリの読み込みに応用しています。

## まとめ

- 端数の長さを 2 進数で分解すれば、ループなしで読み込みを組み立てられる。
- 後ろから大きい塊を取ると、位置とシフト量が 1 つの変数で決まる。
- バッファの終わりを越えて読む高速化は危険。必要な分だけ読む方法がある。
- エンディアンなどの前提は `if constexpr` で確認し、合わない環境には素直な実装を残す。
