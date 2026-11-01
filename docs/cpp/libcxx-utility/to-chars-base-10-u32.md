---
title: 整数を文字列にする前に、二分探索のような if の木で桁数を決め打つ
description: std::to_chars の 10 進変換 __base_10_u32。値の大きさを入れ子の if で 1〜10 桁に振り分け、桁数ごとに専用の書き出し関数を呼ぶ。ループも逆順書きも要らない。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_base_10.h
lines: [74, 107]
function: std::__itoa::__base_10_u32
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 探索]
---
## ひとことで

`__base_10_u32` は、32 ビットの符号なし整数を 10 進の文字列にしてバッファに書き込み、書き終えた位置を返す関数です。
たとえば `12345` を渡すと、`'1' '2' '3' '4' '5'` を書いて、5 文字先のポインタを返します。
最初に **桁数を if の木で決めてしまう** のが特徴です。

## コード

::: code-group

```cpp:line-numbers=74 [日本語訳]
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __base_10_u32(char* __first, uint32_t __value) _NOEXCEPT {
  if (__value < 1000000) {
    if (__value < 10000) {
      if (__value < 100) {
        // 範囲: 0 <= __value < 100
        if (__value < 10)
          return __itoa::__append1(__first, __value);
        return __itoa::__append2(__first, __value);
      }
      // 範囲: 100 <= __value < 10'000
      if (__value < 1000)
        return __itoa::__append3(__first, __value);
      return __itoa::__append4(__first, __value);
    }

    // 範囲: 10'000 <= __value < 1'000'000
    if (__value < 100000)
      return __itoa::__append5(__first, __value);
    return __itoa::__append6(__first, __value);
  }

  // 範囲: __value => 1'000'000
  if (__value < 100000000) {
    // 範囲: 1'000'000 <= __value < 100'000'000
    if (__value < 10000000)
      return __itoa::__append7(__first, __value);
    return __itoa::__append8(__first, __value);
  }

  // 範囲: 100'000'000 <= __value < 最大値
  if (__value < 1000000000)
    return __itoa::__append9(__first, __value);
  return __itoa::__append10(__first, __value);
}
```

```cpp:line-numbers=74 [原文]
_LIBCPP_CONSTEXPR_SINCE_CXX23 inline char* __base_10_u32(char* __first, uint32_t __value) _NOEXCEPT {
  if (__value < 1000000) {
    if (__value < 10000) {
      if (__value < 100) {
        // 0 <= __value < 100
        if (__value < 10)
          return __itoa::__append1(__first, __value);
        return __itoa::__append2(__first, __value);
      }
      // 100 <= __value < 10'000
      if (__value < 1000)
        return __itoa::__append3(__first, __value);
      return __itoa::__append4(__first, __value);
    }

    // 10'000 <= __value < 1'000'000
    if (__value < 100000)
      return __itoa::__append5(__first, __value);
    return __itoa::__append6(__first, __value);
  }

  // __value => 1'000'000
  if (__value < 100000000) {
    // 1'000'000 <= __value < 100'000'000
    if (__value < 10000000)
      return __itoa::__append7(__first, __value);
    return __itoa::__append8(__first, __value);
  }

  // 100'000'000 <= __value < max
  if (__value < 1000000000)
    return __itoa::__append9(__first, __value);
  return __itoa::__append10(__first, __value);
}
```

:::

## 前提知識

- **`char* __first`**: 書き込み先のメモリ位置を指すポインタです。関数は書いた分だけ進めた位置を返します。
- **`uint32_t`**: ちょうど 32 ビットの符号なし整数型です。最大値は 4294967295（10 桁）です。
- **`inline`**: ヘッダに本体を書いても複数ファイルで問題が起きないようにする指定です。
- **`_LIBCPP_CONSTEXPR_SINCE_CXX23`**: C++23 以降では `constexpr`（コンパイル時にも実行できる関数）になる、という意味のマクロです。
- **`_NOEXCEPT`**: 例外を投げないことを示します。
- **`__itoa::`**: `__itoa` という名前空間（名前のグループ）の中の関数を呼ぶ、という意味です。
- **`__append1` 〜 `__append10`**: 同じファイルにある補助関数で、「ちょうど N 桁の数」を書き出します。N 桁であることがわかっているので、先頭のゼロを気にしなくてよい作りです。

## 何をしているか

### 1. 大きく 2 つに分ける

```cpp:line-numbers=75
  if (__value < 1000000) {
```

最初の比較は `__value < 1000000`（100 万）です。1〜6 桁と 7〜10 桁に分かれます。

### 2. さらに細かく分ける

```cpp:line-numbers=76
    if (__value < 10000) {
      if (__value < 100) {
        // 範囲: 0 <= __value < 100
        if (__value < 10)
          return __itoa::__append1(__first, __value);
        return __itoa::__append2(__first, __value);
      }
      // 範囲: 100 <= __value < 10'000
      if (__value < 1000)
        return __itoa::__append3(__first, __value);
      return __itoa::__append4(__first, __value);
    }

    // 範囲: 10'000 <= __value < 1'000'000
    if (__value < 100000)
      return __itoa::__append5(__first, __value);
    return __itoa::__append6(__first, __value);
```

6 桁以下の側では、`10000` で「4 桁以下」と「5〜6 桁」に分け、さらに `100`、`10`、`1000`、`100000` で 1 桁ずつに分けていきます。

`12345` を例に追います。

```
12345 < 1000000 ? → はい（6 桁以下）
12345 < 10000   ? → いいえ（5〜6 桁）
12345 < 100000  ? → はい → __append5
```

3 回の比較で「5 桁」と決まり、`__append5` が `'1'` と `"2345"` を書き出します。

### 3. 大きい側も同じ

```cpp:line-numbers=96
  if (__value < 100000000) {
    // 範囲: 1'000'000 <= __value < 100'000'000
    if (__value < 10000000)
      return __itoa::__append7(__first, __value);
    return __itoa::__append8(__first, __value);
  }

  // 範囲: 100'000'000 <= __value < 最大値
  if (__value < 1000000000)
    return __itoa::__append9(__first, __value);
  return __itoa::__append10(__first, __value);
```

7 桁以上では `100000000`（1 億）で 7〜8 桁と 9〜10 桁に分け、さらに 1 回ずつ比較します。最大値の 4294967295 は `__append10` に行き着きます。

どの値でも、比較は 3〜4 回で済みます。

## ここがすごい

素直な整数→文字列変換は、次のように書くのが定番です。

```
do { *--p = '0' + v % 10; v /= 10; } while (v != 0);
```

これは「下の桁から逆順に書く」ので、桁数がわからないと書き始める位置が決まりません。いったん一時バッファに書いて反転するか、先に桁数を数える必要があります。しかも 1 桁ごとに割り算が要ります。

この関数は、先に **比較だけで桁数を確定** させます。桁数がわかれば、上の桁から順に正しい位置へ書けます。比較の木は、1〜10 桁の 10 通りを二分探索のように振り分ける形で、どの値でも少ない比較回数で決まります。

さらに、`__append5` などの補助関数は 2 桁ずつ表を引いて書き出すので、1 桁ずつ割る方法より割り算の回数が少なくなります。

`// 0 <= __value < 100` のようなコメントで各枝の値の範囲を書いているのも、読み手への配慮です。入れ子の if は範囲を見失いやすいからです。

## まとめ

- 数値を文字列にするとき、先に桁数がわかれば上の桁から直接書ける。
- 桁数は、10 のべき乗との比較を二分探索のように並べると数回で決まる。
- 「桁数ごとに専用の関数」を用意すると、各関数は先頭ゼロなどの心配をしなくてよい。
- 入れ子の if には、各枝の値の範囲をコメントで書くと読みやすい。
