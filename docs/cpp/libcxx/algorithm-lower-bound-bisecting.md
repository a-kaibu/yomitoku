---
title: 「範囲の長さ」だけを半分にしていく二分探索
description: std::lower_bound の本体。終わりの位置を持たず、先頭と残りの長さだけで二分探索する。符号なしにしてから 2 で割る小技も入っている。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/lower_bound.h
lines: [29, 48]
function: std::__lower_bound_bisecting
difficulty: 1
format: 2
tags: [探索, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`__lower_bound_bisecting` は、並んだ配列から「`value` 以上になる最初の位置」を二分探索で見つける関数です。`std::lower_bound` の中身です。
たとえば `[1, 3, 5, 7, 9, 11]` で `7` を探すと位置 3（`7` の場所）を、`6` を探しても位置 3 を返します。

特徴は、探索範囲を「先頭」と「残りの長さ `__len`」の 2 つだけで表している点です。終わりの位置は持ちません。

## コード

```cpp:line-numbers=29
template <class _AlgPolicy, class _Iter, class _Type, class _Proj, class _Comp>
[[__nodiscard__]] _LIBCPP_CONSTEXPR_SINCE_CXX20 _Iter __lower_bound_bisecting(
    _Iter __first,
    const _Type& __value,
    typename iterator_traits<_Iter>::difference_type __len,
    _Comp& __comp,
    _Proj& __proj) {
  while (__len != 0) {
    auto __l2 = std::__half_positive(__len);
    _Iter __m = __first;
    _IterOps<_AlgPolicy>::advance(__m, __l2);
    if (std::__invoke(__comp, std::__invoke(__proj, *__m), __value)) {
      __first = ++__m;
      __len -= __l2 + 1;
    } else {
      __len = __l2;
    }
  }
  return __first;
}
```

## 前提知識

- **`[[__nodiscard__]]`**: 戻り値を捨てると警告を出す、という印です。`lower_bound` を呼んで結果を使わないのは、ほぼ間違いなのでこう指定しています。
- **`const _Type& __value`**: 探す値を「読み取り専用の参照」で受け取ります。`&` はコピーせずに元の値を直接見ること、`const` は書き換えないことを表します。
- **イテレータ `_Iter`**: 配列などの中の位置です。`*__m` でその位置の値を読み、`++__m` で 1 つ進めます。
- **`_IterOps<_AlgPolicy>::advance(__m, __l2)`**: イテレータを `__l2` 歩進めます。配列なら一気に飛べますが、連結リストのように 1 歩ずつしか進めない入れ物でも動くように、この書き方をしています。
- **`std::__invoke(f, x)`**: `f(x)` を呼ぶのとほぼ同じですが、`f` がメンバ関数へのポインタなどでも正しく呼べる汎用の呼び出し方です。
- **射影 `__proj`**: 比べる前に要素を変換する関数です。たとえば「人のリストを年齢で探す」なら、射影は「人から年齢を取り出す」関数です。ふつうの `std::lower_bound` では何もしない射影（`__identity`）が渡されます。
- **`auto`**: 変数の型をコンパイラに推論させる書き方です。

## 何をしているか

`[1, 3, 5, 7, 9, 11]` で `7` を探します。最初は `__first` が位置 0、`__len = 6` です。

### 1 回目

```cpp:line-numbers=37
    auto __l2 = std::__half_positive(__len);
    _Iter __m = __first;
    _IterOps<_AlgPolicy>::advance(__m, __l2);
    if (std::__invoke(__comp, std::__invoke(__proj, *__m), __value)) {
      __first = ++__m;
      __len -= __l2 + 1;
    } else {
      __len = __l2;
    }
```

`__l2 = 3`。`__m` は位置 3 の `7`。`7 < 7` は偽なので、答えは位置 3 以前にあります。`__len = 3` にします。

### 2 回目

`__l2 = 1`。`__m` は位置 1 の `3`。`3 < 7` は真なので、答えは位置 2 以降です。`__first` を位置 2 にし、`__len -= 1 + 1` で `__len = 1` にします。

### 3 回目

`__l2 = 0`。`__m` は位置 2 の `5`。`5 < 7` は真なので、`__first` を位置 3 にして `__len = 0`。

`__len` が 0 になったのでループを抜け、位置 3 を返します。

### `__half_positive` の小技

```cpp:line-numbers=37
    auto __l2 = std::__half_positive(__len);
```

`__half_positive` は `__algorithm/half_positive.h` にある関数で、整数を **いったん符号なしに変換してから 2 で割ります**。コメントには「正の整数を速く 2 で割る」とあり、LLVM のバグ報告（PR39129）が参照されています。
符号付き整数を 2 で割るとき、コンパイラは負の数でも正しく切り捨てるための補正命令を入れる必要があります。ここでは長さが負になることはないので、符号なしにしてしまえば単純な右シフト 1 回で済みます。

## ここがすごい

- **長さで持つと計算が簡単**: 「先頭と終わり」で範囲を持つと、真ん中を求めるのに引き算が要り、配列でないイテレータでは終わりからの距離を測るのが大変です。「先頭と長さ」なら、真ん中は「先頭から長さの半分進んだ所」で済みます。
- **ループの条件が 1 つ**: 終わりの位置と比べる必要がなく、`__len != 0` だけを見ます。どちらに進んでも `__len` は必ず減るので、無限ループにもなりません。
- **比較は約 `log2(n)` 回で一定**: 毎回ちょうど半分ずつ範囲が縮むので、6 要素なら 3 回、1000 要素でも 10 回ほどで終わります。等しい値を見つけても途中で止まらないので、同じ値が並んでいても必ず **最初の** 位置が返ります。
- **射影と比較を分けている**: 比較関数と射影を別々に受け取るので、`std::ranges::lower_bound(people, 30, {}, &Person::age)` のような書き方にも同じコードで対応できます。

## まとめ

- 二分探索は「先頭と長さ」で範囲を持つと、真ん中の計算もループの条件も単純になる。
- 「`value` 以上の最初の位置」を探すなら、等しい値を見つけても止まらず左へ詰めていく。
- 負にならないとわかっている整数は、符号なしにしてから割ると速いコードになる。
- 比較と射影を分けると、1 つの実装でいろいろな探し方に対応できる。
