---
title: 2 進文字列を 4 ビットずつ表から書き、桁数はゼロ数えで一発で決める
description: std::to_chars の 2 進数版。必要な桁数を先頭ゼロの数から求め、末尾から 16 で割りながら 4 文字ずつ表をコピーする。最後の端数だけ 1 ビットずつ書く。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__charconv/to_chars_integral.h
lines: [113, 145]
function: std::__itoa::__integral<2>::__to_chars
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 最適化]
---
## ひとことで

`__integral<2>` は、整数を **2 進数の文字列** に変換するための部品です。
たとえば 182 は `"10110110"` になります。
桁数をビット演算で一発で求め、文字は **4 ビットぶん（4 文字）ずつ** 表からコピーします。

## コード

::: code-group

```cpp:line-numbers=113 [日本語訳]
template <>
struct _LIBCPP_HIDDEN __integral<2> {
  template <typename _Tp>
  static _LIBCPP_CONSTEXPR int __width(_Tp __value) _NOEXCEPT {
    // 値が 0 でも 1 桁は必要。値が 0 でなければ、これは何の
    // 影響もない。コードは立っている最上位ビットを探すからだ。
    return numeric_limits<_Tp>::digits - std::__countl_zero(__value | 1);
  }

  template <typename _Tp>
  _LIBCPP_CONSTEXPR_SINCE_CXX23 static __to_chars_result __to_chars(char* __first, char* __last, _Tp __value) {
    ptrdiff_t __cap = __last - __first;
    int __n         = __width(__value);
    if (__n > __cap)
      return {__last, errc::value_too_large};

    __last                   = __first + __n;
    char* __p                = __last;
    const unsigned __divisor = 16;
    while (__value > __divisor) {
      unsigned __c = __value % __divisor;
      __value /= __divisor;
      __p -= 4;
      std::copy_n(&__base_2_lut[4 * __c], 4, __p);
    }
    do {
      unsigned __c = __value % 2;
      __value /= 2;
      *--__p = "01"[__c];
    } while (__value != 0);
    return {__last, errc(0)};
  }
};
```

```cpp:line-numbers=113 [原文]
template <>
struct _LIBCPP_HIDDEN __integral<2> {
  template <typename _Tp>
  static _LIBCPP_CONSTEXPR int __width(_Tp __value) _NOEXCEPT {
    // If value == 0 still need one digit. If the value != this has no
    // effect since the code scans for the most significant bit set.
    return numeric_limits<_Tp>::digits - std::__countl_zero(__value | 1);
  }

  template <typename _Tp>
  _LIBCPP_CONSTEXPR_SINCE_CXX23 static __to_chars_result __to_chars(char* __first, char* __last, _Tp __value) {
    ptrdiff_t __cap = __last - __first;
    int __n         = __width(__value);
    if (__n > __cap)
      return {__last, errc::value_too_large};

    __last                   = __first + __n;
    char* __p                = __last;
    const unsigned __divisor = 16;
    while (__value > __divisor) {
      unsigned __c = __value % __divisor;
      __value /= __divisor;
      __p -= 4;
      std::copy_n(&__base_2_lut[4 * __c], 4, __p);
    }
    do {
      unsigned __c = __value % 2;
      __value /= 2;
      *--__p = "01"[__c];
    } while (__value != 0);
    return {__last, errc(0)};
  }
};
```

:::

## 前提知識

- **`template <>` と `struct __integral<2>`**: `__integral` は基数を引数に取るテンプレートで、ここは「基数が 2 のとき専用の版」（完全特殊化）です。同じファイルに 8 進と 16 進の版もあります。
- **`static` 関数**: オブジェクトを作らずに `__integral<2>::__to_chars(...)` のように呼べる関数です。
- **`numeric_limits<_Tp>::digits`**: 型のビット数です。`unsigned` なら多くの環境で 32 です。
- **`__countl_zero(x)`**: 上位から続く 0 の数を数える関数です。
- **`ptrdiff_t`**: ポインタ同士の差（要素数）を表す整数型です。
- **`*--__p = ...`**: ポインタを 1 つ戻してから、その位置に書き込みます。末尾から先頭へ向かって書くときの定番です。
- **`"01"[__c]`**: 文字列リテラルも配列なので、添字で 1 文字を取り出せます。`"01"[1]` は `'1'` です。
- **`__base_2_lut`**: `"0000" "0001" "0010" ... "1111"` の 64 文字を並べた表（LUT = Look-Up Table）です。

## 何をしているか

`__value = 182`（2 進で `1011 0110`）、32 ビットの `unsigned` で追います。

### 1. 桁数を求める

```cpp:line-numbers=116
  static _LIBCPP_CONSTEXPR int __width(_Tp __value) _NOEXCEPT {
    // 値が 0 でも 1 桁は必要。値が 0 でなければ、これは何の
    // 影響もない。コードは立っている最上位ビットを探すからだ。
    return numeric_limits<_Tp>::digits - std::__countl_zero(__value | 1);
  }
```

`32 - __countl_zero(182 | 1)` です。182 は 8 ビットの数なので先頭ゼロは 24 個、答えは 8 桁です。
`| 1` は 0 のための工夫です。コメントのとおり、値が 0 でも 1 桁（`"0"`）必要なので、最下位ビットを立てて「1 ビットの数」として数えさせます。0 でなければ最上位ビットの位置は変わらないので、結果に影響しません。

### 2. バッファの確認

```cpp:line-numbers=124
    ptrdiff_t __cap = __last - __first;
    int __n         = __width(__value);
    if (__n > __cap)
      return {__last, errc::value_too_large};
```

8 桁ぶんの空きがなければ `value_too_large` を返します。

### 3. 末尾から 4 文字ずつ書く

```cpp:line-numbers=129
    __last                   = __first + __n;
    char* __p                = __last;
    const unsigned __divisor = 16;
    while (__value > __divisor) {
      unsigned __c = __value % __divisor;
      __value /= __divisor;
      __p -= 4;
      std::copy_n(&__base_2_lut[4 * __c], 4, __p);
    }
```

`__last` を「先頭 + 8」に置き直し、そこから後ろ向きに書きます。

```
182 > 16 → __c = 182 % 16 = 6, __value = 11
           表の 4×6 = 24 番目から "0110" をコピー → ____0110
11 > 16 ではないのでループ終了
```

16 で割った余りは、下位 4 ビットそのものです。その 4 ビットの文字列を表から丸ごとコピーします。

### 4. 端数を 1 ビットずつ書く

```cpp:line-numbers=138
    do {
      unsigned __c = __value % 2;
      __value /= 2;
      *--__p = "01"[__c];
    } while (__value != 0);
```

残りの 11（`1011`）を 1 ビットずつ書きます。

```
11 % 2 = 1 → '1', 5 % 2 = 1 → '1', 2 % 2 = 0 → '0', 1 % 2 = 1 → '1'
```

後ろから書くので並びは `1011` となり、全体で `"10110110"` が完成します。

`do ... while` なので、値が 0 でも 1 回は回り、`"0"` が書かれます。

## ここがすごい

素直な方法は「2 で割った余りを 1 文字ずつ書く」を 1 ビットごとに繰り返すことです。32 ビットなら最大 32 回のループになります。

この関数は、16 で割るたびに **4 文字をまとめて** 書くので、ループの回数はおよそ 4 分の 1 です。`% 16` と `/ 16` は、コンパイラが「下位 4 ビットを取る」「4 ビット右へずらす」という軽い命令に置き換えられます。表はたった 64 バイトなので、CPU のキャッシュにもすぐ載ります。

桁数を先に正確に求めているのも重要です。末尾の位置が決まるので、一時バッファに書いてから反転する手間がありません。先頭ゼロ数えは多くの CPU で 1 命令なので、桁数を数えるループも要りません。

8 進版では 64 で割って 2 文字ずつ、16 進版では 256 で割って 2 文字ずつ、と同じ形で書かれています。基数が 2 のべき乗のときは、割り算がビット操作になる性質をうまく使っています。

## まとめ

- 2 進の桁数は「型のビット数 − 先頭ゼロの数」で求まる。0 は `| 1` で 1 桁扱いにできる。
- 基数の累乗で割れば、複数桁ぶんの文字を表から一度に書ける。
- 桁数が先にわかれば、末尾から書いても反転が要らない。
- 2 のべき乗での割り算や余りは、ビット操作に置き換わるので軽い。
