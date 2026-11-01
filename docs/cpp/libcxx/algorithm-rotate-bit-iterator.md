---
title: vector<bool> の回転は、小さな手元のバッファで一気に済ませる
description: ビット単位の入れ物 vector<bool> 向けの rotate。短い側が 256 ビット以下なら手元の小さな配列に退避してコピー 2 回で終え、長ければ塊の入れ替えで縮める。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/rotate.h
lines: [176, 212]
function: std::__rotate（__bit_iterator 版）
difficulty: 3
format: 2
tags: [アルゴリズム, ビット演算, メモリ管理]
---

## ひとことで

この `__rotate` は、`std::vector<bool>` のための `std::rotate` です。
`std::vector<bool>` は `bool` を 1 個 1 バイトではなく **1 ビットずつ詰めて** 保存する特別な入れ物で、そのイテレータは `__bit_iterator` という専用の型です。

この関数は、回転させる左右の区間のうち短い方が **256 ビット（64 ビット環境で、語 4 つぶん）以下なら、関数の中に置いた小さな配列に退避して、コピー 2 回で回転を終わらせます**。長い場合は、塊の入れ替えで問題を小さくしてから同じことをします。

## コード

```cpp:line-numbers=176
template <class, class _Cp>
_LIBCPP_CONSTEXPR_SINCE_CXX20 pair<__bit_iterator<_Cp, false>, __bit_iterator<_Cp, false> >
__rotate(__bit_iterator<_Cp, false> __first, __bit_iterator<_Cp, false> __middle, __bit_iterator<_Cp, false> __last) {
  using _I1             = __bit_iterator<_Cp, false>;
  using difference_type = typename _I1::difference_type;
  difference_type __d1  = __middle - __first;
  difference_type __d2  = __last - __middle;
  _I1 __r               = __first + __d2;
  while (__d1 != 0 && __d2 != 0) {
    if (__d1 <= __d2) {
      if (__d1 <= __bit_array<_Cp>::capacity()) {
        __bit_array<_Cp> __b(__d1);
        std::copy(__first, __middle, __b.begin());
        std::copy(__b.begin(), __b.end(), std::copy(__middle, __last, __first));
        break;
      } else {
        __bit_iterator<_Cp, false> __mp = std::swap_ranges(__first, __middle, __middle);
        __first                         = __middle;
        __middle                        = __mp;
        __d2 -= __d1;
      }
    } else {
      if (__d2 <= __bit_array<_Cp>::capacity()) {
        __bit_array<_Cp> __b(__d2);
        std::copy(__middle, __last, __b.begin());
        std::copy_backward(__b.begin(), __b.end(), std::copy_backward(__first, __middle, __last));
        break;
      } else {
        __bit_iterator<_Cp, false> __mp = __first + __d2;
        std::swap_ranges(__first, __mp, __middle);
        __first = __mp;
        __d1 -= __d2;
      }
    }
  }
  return std::make_pair(__r, __last);
}
```

## 前提知識

- **`std::vector<bool>`**: `bool` の配列ですが、メモリを節約するため 64 個の `bool` を 1 つの 64 ビット整数（語）に詰めます。1 要素を指すには「どの語の、何ビット目か」の 2 つが要るので、イテレータは専用の `__bit_iterator<_Cp, false>` になります（`false` は「書き換え可能」の意味）。
- **関数テンプレートの多重定義**: 同じ名前 `__rotate` の関数が、ふつうのイテレータ用とこの `__bit_iterator` 用の 2 つあります。引数の型が `__bit_iterator` なら、より特化したこちらが選ばれます。
- **`__bit_array<_Cp>`**: `__bit_reference` ヘッダにある小さな構造体で、64 ビットの語を 4 つ（`_Np = 4`）だけ持つ固定長の配列です。`capacity()` は `4 × 64 = 256` ビットを返します。関数の中の変数として作るので、置き場所はスタック（関数ごとに用意される一時的なメモリ）で、ヒープからのメモリ確保は起きません。
- **`std::copy(a, b, out)`**: `[a, b)` を `out` から始まる場所へ前から順にコピーし、書き終えた次の位置を返します。`std::copy_backward(a, b, out_end)` は、後ろから順にコピーして `out_end` の手前に詰めます。
- **`std::swap_ranges(a, b, c)`**: `[a, b)` と `c` からの同じ長さの範囲を入れ替え、2 つ目の範囲の終わりを返します。

## 何をしているか

`__d1` は左の長さ、`__d2` は右の長さです。戻り値になる「もとの先頭の行き先」は `__first + __d2` と先に決まります。

### 左が短く、256 ビット以下のとき

```cpp:line-numbers=185
    if (__d1 <= __d2) {
      if (__d1 <= __bit_array<_Cp>::capacity()) {
        __bit_array<_Cp> __b(__d1);
        std::copy(__first, __middle, __b.begin());
        std::copy(__b.begin(), __b.end(), std::copy(__middle, __last, __first));
        break;
```

例: 左 100 ビット、右 1000 ビット。

1. 左の 100 ビットを `__b` にコピーして退避。
2. 右の 1000 ビットを先頭へコピー（内側の `std::copy`）。
3. 退避した 100 ビットを、その直後にコピー（外側の `std::copy`）。

次の行は、内側の `copy` が返す「書き終えた次の位置」を、そのまま外側の `copy` の書き込み先に使っています。

```cpp:line-numbers=189
        std::copy(__b.begin(), __b.end(), std::copy(__middle, __last, __first));
```

### 右が短く、256 ビット以下のとき

```cpp:line-numbers=198
      if (__d2 <= __bit_array<_Cp>::capacity()) {
        __bit_array<_Cp> __b(__d2);
        std::copy(__middle, __last, __b.begin());
        std::copy_backward(__b.begin(), __b.end(), std::copy_backward(__first, __middle, __last));
        break;
```

左右が逆になるだけです。右を退避し、左を `copy_backward` で末尾側へずらし、空いた先頭に退避分を書き戻します。

### 短い側も 256 ビットを超えるとき

```cpp:line-numbers=191
      } else {
        __bit_iterator<_Cp, false> __mp = std::swap_ranges(__first, __middle, __middle);
        __first                         = __middle;
        __middle                        = __mp;
        __d2 -= __d1;
      }
```

```cpp:line-numbers=203
      } else {
        __bit_iterator<_Cp, false> __mp = __first + __d2;
        std::swap_ranges(__first, __mp, __middle);
        __first = __mp;
        __d1 -= __d2;
      }
```

`swap_ranges` で短い方の長さぶんの塊を入れ替え、片方を最終位置に収めます。残りは同じ形の小さな回転なので、`__d1` か `__d2` を減らしてループを続けます。短い側が 256 ビット以下になった時点で、上のバッファ方式で終わらせます。

## ここがすごい

- **ビットのコピーは語単位で速い**: libc++ には、`vector<bool>` のイテレータ向けに、1 ビットずつではなく語単位でまとめて処理する `copy` / `copy_backward` の特別版があります（`__bit_reference` ヘッダや `copy_backward.h`）。退避と書き戻しを「コピー」に落とし込むことで、その速い道を使えます。
- **メモリ確保なしで済む上限を決めている**: 退避用の配列を毎回ヒープに確保すると、確保のコストや失敗の可能性が出てきます。256 ビット（32 バイト）という小さな固定長なら関数の中に置けます。上限を超える部分は、入れ替えで縮めればよいのです。
- **2 つの方法の良いとこ取り**: 塊の入れ替えは追加メモリ不要ですが何周か必要です。バッファ方式はコピー 2 回で終わりますが、バッファが要ります。「長い間は入れ替えで縮め、短くなったらバッファで一気に」という組み合わせで、どちらの弱点も抑えています。
- **特殊な入れ物には特殊な実装を**: 汎用のアルゴリズムをそのまま使うと、1 ビットずつ読み書きすることになります。標準ライブラリは、`vector<bool>` のような特殊な入れ物に専用の多重定義を用意して、利用者が意識しなくても速くなるようにしています。

## まとめ

- `vector<bool>` は 1 要素 1 ビットの特殊な入れ物で、専用のイテレータとアルゴリズムを持つ。
- 小さい固定長のバッファなら、ヒープを使わずに関数の中に置ける。
- 「長い間は入れ替えで縮め、短くなったらバッファで一気に」は、メモリと速さのバランスのよい戦略。
- `std::copy` の戻り値をそのまま次の書き込み先にすると、連続した書き込みを 1 行で書ける。
