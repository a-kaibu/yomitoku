---
title: 39 桁の 128 ビット整数を、19 桁ずつ切り分けて 64 ビットの道具で書く
description: to_chars の 128 ビット版 __base_10_u128。最大値の桁の並びを図に描いてから、1 桁・19 桁・19 桁の 3 段に切り分け、既存の 32/64 ビット用の書き出し関数を再利用する。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_base_10.h
lines: [136, 173]
function: std::__itoa::__base_10_u128
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, 可読性]
---
## ひとことで

`__base_10_u128` は、128 ビットの符号なし整数（最大 39 桁）を 10 進の文字列として書き出す関数です。
128 ビットの割り算は重いので、**大きな塊に切り分け**、あとは 32 ビット・64 ビット用の既存の関数に任せます。
コメントに描かれた「桁の地図」が設計をそのまま語っています。

## コード

::: code-group

```cpp:line-numbers=136 [日本語訳]
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __base_10_u128(char* __buffer, __uint128_t __value) _NOEXCEPT {
  _LIBCPP_ASSERT_INTERNAL(
      __value > numeric_limits<uint64_t>::max(), "The optimizations for this algorithm fails when this isn't true.");

  // 64→32 ビットの場合と違い、128 ビットの場合は「上半分」を
  // 「下半分」に格納できない。代わりに、まず最上位の数桁を
  // 別に処理する必要がある。
  //
  // 符号なし整数の最大値
  // 64  bit                             18'446'744'073'709'551'615 (20 桁)
  // 128 bit    340'282'366'920'938'463'463'374'607'431'768'211'455 (39 桁)
  // 手順 1     ^                                                   ([0-1] 桁)
  // 手順 2      ^^^^^^^^^^^^^^^^^^^^^^^^^                          ([0-19] 桁)
  // 手順 3                               ^^^^^^^^^^^^^^^^^^^^^^^^^ (19 桁)
  if (__value >= __itoa::__pow_10(38)) {
    // 手順 1
    __buffer = __itoa::__append1(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(38)));
    __value %= __itoa::__pow_10(38);

    // 手順 2 は常に 19 桁。
    // 先頭のゼロをバッファに書く必要があるので、ここで処理する。
    __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(29)));
    __value %= __itoa::__pow_10(29);
    __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
  } else {
    // 手順 2
    // こちらは先頭の 0 でない桁の位置を決める必要がある版。
    __buffer = __base_10_u64(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
  }

  // 手順 3
  __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / 10000000000));
  __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value % 10000000000));

  return __buffer;
}
```

```cpp:line-numbers=136 [原文]
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __base_10_u128(char* __buffer, __uint128_t __value) _NOEXCEPT {
  _LIBCPP_ASSERT_INTERNAL(
      __value > numeric_limits<uint64_t>::max(), "The optimizations for this algorithm fails when this isn't true.");

  // Unlike the 64 to 32 bit case the 128 bit case the "upper half" can't be
  // stored in the "lower half". Instead we first need to handle the top most
  // digits separately.
  //
  // Maximum unsigned values
  // 64  bit                             18'446'744'073'709'551'615 (20 digits)
  // 128 bit    340'282'366'920'938'463'463'374'607'431'768'211'455 (39 digits)
  // step 1     ^                                                   ([0-1] digits)
  // step 2      ^^^^^^^^^^^^^^^^^^^^^^^^^                          ([0-19] digits)
  // step 3                               ^^^^^^^^^^^^^^^^^^^^^^^^^ (19 digits)
  if (__value >= __itoa::__pow_10(38)) {
    // step 1
    __buffer = __itoa::__append1(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(38)));
    __value %= __itoa::__pow_10(38);

    // step 2 always 19 digits.
    // They are handled here since leading zeros need to be appended to the buffer,
    __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(29)));
    __value %= __itoa::__pow_10(29);
    __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
  } else {
    // step 2
    // This version needs to determine the position of the leading non-zero digit.
    __buffer = __base_10_u64(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
  }

  // Step 3
  __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / 10000000000));
  __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value % 10000000000));

  return __buffer;
}
```

:::

## 前提知識

- **`__uint128_t`**: Clang/GCC が提供する 128 ビットの符号なし整数型です。規格の型ではありません。
- **`#if _LIBCPP_HAS_INT128`**（この関数を囲む前後の行）: 128 ビット整数が使える環境でだけコンパイルする、というプリプロセッサの条件です。
- **`__itoa::__pow_10(n)`**: 10 の n 乗を表から引く関数です。19 乗から 39 乗までしか入っていない、128 ビット専用の表です。
- **`static_cast<uint32_t>(...)`**: 値を 32 ビット整数に変換します。値が収まっていることがわかっているときに使います。
- **`%=`**: 「割った余りを自分に入れる」複合代入です。`v %= 100` は `v = v % 100` と同じです。
- **`__append9` / `__append10`**: ちょうど 9 桁・10 桁を 0 埋めで書く関数です。
- **`__base_10_u64`**: 64 ビットの値を、先頭ゼロなしで書く関数です。
- **`_LIBCPP_ASSERT_INTERNAL`**: ライブラリ内部の前提を確かめるアサーション（条件が偽なら止める検査）です。

## 何をしているか

### 0. 前提: 64 ビットを超える値だけが来る

```cpp:line-numbers=137
  _LIBCPP_ASSERT_INTERNAL(
      __value > numeric_limits<uint64_t>::max(), "The optimizations for this algorithm fails when this isn't true.");
```

呼び出し側で、64 ビットに収まる値は 64 ビット用の処理に回されています。ここに来るのは 2^64 以上、つまり 20 桁以上の値だけです。

### 1. コメントの地図

```cpp:line-numbers=144
  // 符号なし整数の最大値
  // 64  bit                             18'446'744'073'709'551'615 (20 桁)
  // 128 bit    340'282'366'920'938'463'463'374'607'431'768'211'455 (39 桁)
  // 手順 1     ^                                                   ([0-1] 桁)
  // 手順 2      ^^^^^^^^^^^^^^^^^^^^^^^^^                          ([0-19] 桁)
  // 手順 3                               ^^^^^^^^^^^^^^^^^^^^^^^^^ (19 桁)
```

```
128 bit    340'282'366'920'938'463'463'374'607'431'768'211'455 (39 digits)
step 1     ^                                                   ([0-1] digits)
step 2      ^^^^^^^^^^^^^^^^^^^^^^^^^                          ([0-19] digits)
step 3                               ^^^^^^^^^^^^^^^^^^^^^^^^^ (19 digits)
```

39 桁を「先頭 1 桁」「中央 19 桁」「末尾 19 桁」に分けます。19 桁にするのは、19 桁の数（最大 10^19 − 1）が 64 ビット（最大約 1.8 × 10^19）に収まるからです。

### 2. 39 桁の場合

```cpp:line-numbers=150
  if (__value >= __itoa::__pow_10(38)) {
    // 手順 1
    __buffer = __itoa::__append1(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(38)));
    __value %= __itoa::__pow_10(38);

    // 手順 2 は常に 19 桁。
    // 先頭のゼロをバッファに書く必要があるので、ここで処理する。
    __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / __itoa::__pow_10(29)));
    __value %= __itoa::__pow_10(29);
    __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
```

`__value >= 10^38` なら 39 桁です。

- `10^38` で割った商（1〜3）を `__append1` で 1 桁書く。
- 残りを `10^29` で割り、上の 9 桁を `__append9` で書く。
- 残りを `10^19` で割り、次の 10 桁を `__append10` で書く。

中央の 19 桁は、先頭が 0 でも 0 埋めが必要です。だから「ちょうど N 桁」を書く関数を使います（コード中のコメントもそう説明しています）。

### 3. 20〜38 桁の場合

```cpp:line-numbers=161
  } else {
    // 手順 2
    // こちらは先頭の 0 でない桁の位置を決める必要がある版。
    __buffer = __base_10_u64(__buffer, static_cast<uint64_t>(__value / __itoa::__pow_10(19)));
    __value %= __itoa::__pow_10(19);
  }
```

`10^19` で割った商は 64 ビットに収まります。先頭のゼロを書いてはいけないので、桁数を自分で判断する `__base_10_u64` に任せます。

### 4. 末尾の 19 桁

```cpp:line-numbers=169
  __buffer = __itoa::__append9(__buffer, static_cast<uint32_t>(__value / 10000000000));
  __buffer = __itoa::__append10(__buffer, static_cast<uint64_t>(__value % 10000000000));
```

残りは必ず 19 桁です。`10^10` で割って、上 9 桁を `__append9`、下 10 桁を `__append10` で書きます。

## ここがすごい

1 桁ずつ 10 で割る方法では、128 ビットの割り算が最大 39 回必要です。128 ビットの割り算は、多くの CPU で 1 命令にならず、ソフトウェアで計算される重い処理です。

この関数では、128 ビットの割り算は数回だけです。切り出した塊はすべて 32 ビットか 64 ビットに収まるので、残りの細かい処理は軽い既存の関数がやってくれます。

関数冒頭のコメントは、64→32 ビットの場合との違いも説明しています。64 ビット版では「上半分」を 32 ビットに収めて既存の関数に渡せましたが、128 ビットでは上半分が 64 ビットに収まりません。だから「先頭の数桁を先に処理する」段が必要になる、という理屈です。

値の桁の並びを ASCII の図で描くのは、桁の境界を扱うコードでとても有効です。「どこで切るか」が数式より図のほうがずっと速く伝わります。

## まとめ

- 重い型の計算は、軽い型に収まる塊に切り分けて既存の処理を再利用する。
- 64 ビットに収まる 10 進の塊は 19 桁。境界の数字は「最大値の桁数」から決まる。
- 中間の塊は 0 埋めの固定長で、先頭の塊だけは先頭ゼロなしで書く。
- 桁の切り方のような設計は、コメントの図にすると読み手に伝わりやすい。
