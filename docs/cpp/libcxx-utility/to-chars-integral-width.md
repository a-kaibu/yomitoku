---
title: 任意の基数で桁数を数えるとき、基数の 4 乗で割って 4 桁ずつ進む
description: std::to_chars の 2〜36 進変換で、出力の桁数を先に求める __to_chars_integral_width。基数の 2〜4 乗を前もって用意し、1 回の割り算で 4 桁ぶん進むことで割り算の回数を 4 分の 1 にする。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_integral.h
lines: [228, 252]
function: std::__to_chars_integral_width
difficulty: 2
format: 2
tags: [数値計算, 最適化, アルゴリズム]
---
## ひとことで

`__to_chars_integral_width` は、整数 `__value` を `__base` 進数で書いたとき **何桁になるか** を返す関数です。
たとえば 255 を 16 進で書くと `ff` なので 2、7 進で書くと `513` なので 3 です。
`std::to_chars` は、書き込む前にバッファに収まるかを確かめるため、この関数で桁数を求めます。

## コード

```cpp:line-numbers=228
template <typename _Tp>
_LIBCPP_CONSTEXPR_SINCE_CXX23 int __to_chars_integral_width(_Tp __value, unsigned __base) {
  _LIBCPP_ASSERT_INTERNAL(__value >= 0, "The function requires a non-negative value.");

  unsigned __base_2 = __base * __base;
  unsigned __base_3 = __base_2 * __base;
  unsigned __base_4 = __base_2 * __base_2;

  int __r = 0;
  while (true) {
    if (__value < __base)
      return __r + 1;
    if (__value < __base_2)
      return __r + 2;
    if (__value < __base_3)
      return __r + 3;
    if (__value < __base_4)
      return __r + 4;

    __value /= __base_4;
    __r += 4;
  }

  __libcpp_unreachable();
}
```

## 前提知識

- **`template <typename _Tp>`**: どの整数型でも使えるテンプレートです。`_Tp` には `unsigned` や `unsigned long long` などが入ります。
- **`_LIBCPP_ASSERT_INTERNAL(条件, "説明")`**: ライブラリ内部の前提を確かめる検査です。ここでは「負の数は来ない」ことを確かめています。
- **`unsigned`**: 符号なし整数です。
- **`while (true)`**: 中で `return` するまで回り続けるループです。
- **`__value /= __base_4`**: 「`__base_4` で割った商を自分に入れる」複合代入です。
- **`__libcpp_unreachable()`**: 「ここには絶対に来ない」とコンパイラに伝える関数です。ループの後ろに戻り値のない道がない、と知らせて警告や余計なコードを防ぎます。

## 何をしているか

### 1. 基数のべき乗を用意する

```cpp:line-numbers=232
  unsigned __base_2 = __base * __base;
  unsigned __base_3 = __base_2 * __base;
  unsigned __base_4 = __base_2 * __base_2;
```

`__base = 10` なら、`__base_2 = 100`、`__base_3 = 1000`、`__base_4 = 10000` です。
`__base_4` を `__base_2 * __base_2` で計算しているのは、すでにある値を再利用して掛け算を 1 回で済ませるためです。

### 2. 4 段の比較

```cpp:line-numbers=237
  while (true) {
    if (__value < __base)
      return __r + 1;
    if (__value < __base_2)
      return __r + 2;
    if (__value < __base_3)
      return __r + 3;
    if (__value < __base_4)
      return __r + 4;
```

ループの中で、値を基数のべき乗と順に比べます。

- `__value < __base` なら 1 桁
- `__value < __base_2` なら 2 桁
- `__value < __base_3` なら 3 桁
- `__value < __base_4` なら 4 桁

`__r` は「すでに数えた桁数」で、最初は 0 です。

### 3. 4 桁ずつ削る

```cpp:line-numbers=247
    __value /= __base_4;
    __r += 4;
```

どれにも当てはまらなければ、値は 5 桁以上です。`__base_4` で割って下の 4 桁を捨て、`__r` に 4 を足してもう一周します。

### 具体例

`__value = 1234567`、`__base = 10` で追います。

```
1 周目: 1234567 は 10000 以上 → 1234567 / 10000 = 123, __r = 4
2 周目: 123 < 1000 → return 4 + 3 = 7
```

7 桁と正しく求まりました。割り算は 1 回だけです。

## ここがすごい

素直に書くと、桁数は「0 になるまで基数で割り、回数を数える」ループです。

```
int n = 0;
do { v /= base; ++n; } while (v != 0);
```

これは 1 桁ごとに 1 回割り算をします。割り算は足し算や比較に比べて重い命令なので、64 ビットの最大値を 3 進で数えると 41 回の割り算になります。

この関数は、**比較 4 回と割り算 1 回で 4 桁ぶん** 進みます。割り算の回数はおよそ 4 分の 1 です。比較は割り算よりずっと軽いので、全体として速くなります。

基数が実行時の引数（2〜36 のどれか）なので、`__base_2` などをコンパイル時の定数にはできません。そこで関数の頭で 1 回だけ計算し、ループの中で使い回しています。

なお、よく使われる 2・8・10・16 進は、同じファイルで専用の処理が用意されています（ビット数や表を使う、もっと速い方法です）。この関数は、それ以外の基数のための汎用版です。

最大の基数 36 でも `36^4 = 1679616` なので、`unsigned` で桁あふれしません。

## まとめ

- 桁数を数えるとき、割り算の代わりに比較を増やすと速くなる。
- 「基数の k 乗」で割れば、1 回の割り算で k 桁ずつ進める。
- 実行時にしかわからない値は、ループの外で 1 回だけ計算して使い回す。
- `__libcpp_unreachable()` のように「到達しない」と明示すると、コンパイラに意図を伝えられる。
