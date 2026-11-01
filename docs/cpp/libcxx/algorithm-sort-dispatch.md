---
title: 再帰の深さに上限を付けて、クイックソートの最悪を防ぐ
description: std::sort の入口で、再帰の深さの上限を 2×log2(n) と決め、型に応じて分割の方式を選んでから本体のイントロソートを呼ぶ関数。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [860, 874]
function: std::__sort_dispatch
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, メタプログラミング]
---

## ひとことで

`__sort_dispatch` は、`std::sort` の本体である `__introsort` を呼ぶ直前の「準備係」です。やることは 2 つだけです。

1. 再帰の深さの上限を **`2 × log2(要素数)`** と決める。要素数 1000 なら、`log2(1000)` の整数部分は 9 なので上限は 18 です。
2. 要素の型を見て、分岐を使わない「ビットセット分割」を使うかどうかを **コンパイル時に** 決める。

短い関数ですが、`std::sort` がどんな入力でも遅くならない理由がここに詰まっています。

## コード

::: code-group

```cpp:line-numbers=860 [日本語訳]
template <class _AlgPolicy, class _RandomAccessIterator, class _Comp>
_LIBCPP_CONSTEXPR_SINCE_CXX20 void
__sort_dispatch(_RandomAccessIterator __first, _RandomAccessIterator __last, _Comp& __comp) {
  if (__first == __last) // log(0) は定義されないので、深さを計算しようとしない
    return;

  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  difference_type __depth_limit = 2 * std::__bit_log2(std::__to_unsigned_like(__last - __first));

  // ビットセット分割は算術型にだけ使う。比較関数に分岐がないと確信できるよう、
  // 既定の比較関数が使われていることも
  // 確かめるべきである。
  std::__introsort<_AlgPolicy, _Comp&, _RandomAccessIterator, __use_branchless_sort<_Comp, _RandomAccessIterator> >(
      __first, __last, __comp, __depth_limit);
}
```

```cpp:line-numbers=860 [原文]
template <class _AlgPolicy, class _RandomAccessIterator, class _Comp>
_LIBCPP_CONSTEXPR_SINCE_CXX20 void
__sort_dispatch(_RandomAccessIterator __first, _RandomAccessIterator __last, _Comp& __comp) {
  if (__first == __last) // log(0) is undefined, so don't try computing the depth
    return;

  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  difference_type __depth_limit = 2 * std::__bit_log2(std::__to_unsigned_like(__last - __first));

  // Only use bitset partitioning for arithmetic types.  We should also check
  // that the default comparator is in use so that we are sure that there are no
  // branches in the comparator.
  std::__introsort<_AlgPolicy, _Comp&, _RandomAccessIterator, __use_branchless_sort<_Comp, _RandomAccessIterator> >(
      __first, __last, __comp, __depth_limit);
}
```

:::

## 前提知識

- **テンプレート引数に値を渡す**: 最後の行の `__introsort<..., __use_branchless_sort<...> >` の最後の引数は型ではなく `bool` の値です。C++ のテンプレートには、型だけでなく定数も渡せます。渡した値ごとに別々の関数が作られるので、実行時に `if` で調べる必要がありません。
- **`__use_branchless_sort<_Comp, _RandomAccessIterator>`**: 同じファイルの冒頭にある、コンパイル時に決まる `bool` 定数です（後で引用します）。「要素が連続したメモリにある」「コピーが安い」「算術型（整数・浮動小数点数）」「比較が `<` か `>`」がすべて成り立つと `true` になります。
- **参照 `_Comp&`**: 比較関数をコピーせず、呼び出し元のものをそのまま使います。比較関数が状態を持つ大きなオブジェクトでも、コピーの手間がかかりません。
- **`std::__bit_log2(x)`**: `x` の 2 を底とする対数の整数部分、つまり「いちばん上の `1` のビットの位置」です。中身は `ビット数 - 1 - 先頭の 0 の数` です（`__bit/bit_log2.h`）。
- **`std::__to_unsigned_like`**: 符号付きの距離を符号なしの整数に変換します。`__bit_log2` は符号なし整数しか受け付けないためです。

## 何をしているか

### 空の範囲はすぐ返す

```cpp:line-numbers=863
  if (__first == __last) // log(0) は定義されないので、深さを計算しようとしない
    return;
```

`log2(0)` は定義できないので、要素が 0 個なら何もせずに戻ります。コメントにもそう書かれています。

### 深さの上限を決める

```cpp:line-numbers=866
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  difference_type __depth_limit = 2 * std::__bit_log2(std::__to_unsigned_like(__last - __first));
```

要素数 `n` から `2 * __bit_log2(n)` を計算します。

| 要素数 | `__bit_log2` | 上限 |
| --- | --- | --- |
| 10 | 3 | 6 |
| 1000 | 9 | 18 |
| 1,000,000 | 19 | 38 |

`__introsort` は分割するたびにこの値を 1 減らし、0 になったらクイックソートをやめてヒープソートに切り替えます。

### 分割の方式を型で選ぶ

```cpp:line-numbers=869
  // ビットセット分割は算術型にだけ使う。比較関数に分岐がないと確信できるよう、
  // 既定の比較関数が使われていることも
  // 確かめるべきである。
  std::__introsort<_AlgPolicy, _Comp&, _RandomAccessIterator, __use_branchless_sort<_Comp, _RandomAccessIterator> >(
      __first, __last, __comp, __depth_limit);
```

`int` の配列を `<` で並べるなら `__use_branchless_sort` が `true` になり、`__introsort<..., true>` が呼ばれます。その中では、比較結果をビットに記録して分岐なしで分割する `__bitset_partition` が使われます。
文字列の配列や、自作の比較関数を使う場合は `false` になり、通常の分割が使われます。

`__use_branchless_sort` の定義は次のとおりです。

```cpp:line-numbers=53
template <class _Compare, class _Iter, class _Tp = typename iterator_traits<_Iter>::value_type>
inline const bool __use_branchless_sort =
    __libcpp_is_contiguous_iterator<_Iter>::value && __is_cheap_to_copy<_Tp> && is_arithmetic<_Tp>::value &&
    (__desugars_to_v<__less_tag, _Compare, _Tp, _Tp> || __desugars_to_v<__greater_tag, _Compare, _Tp, _Tp>);
```

## ここがすごい

- **最悪のケースを防ぐ保険**: クイックソートは、軸の選び方が悪い入力に当たると、分割がほとんど進まず再帰が `n` 段まで深くなり、時間が `n^2` に比例してしまいます。深さに上限を付け、超えたらヒープソート（どんな入力でも `n log n`）に切り替えるのが「イントロソート」です。うまく分割できていれば深さは `log2(n)` 程度で済むので、上限に 2 倍の余裕を持たせています。
- **判定はコンパイル時に終わる**: 方式の選択はテンプレート引数で行うので、ソート中に「どちらの方式か」を調べるコストはゼロです。使わない方式のコードは、その型向けの関数には含まれません。
- **比較関数の中身まで考えている**: 関数の中のコメントにあるとおり、ビットセット分割は比較そのものに分岐がない前提で効果を発揮します。そこで型だけでなく「既定の比較（`<` や `>`）が使われているか」まで確かめています。利用者が書いた比較関数は中に `if` があるかもしれないので、選ばれません。

## まとめ

- イントロソートは、クイックソートに「再帰の深さの上限」を付け、超えたらヒープソートに逃げるアルゴリズム。
- 上限 `2 × log2(n)` は、うまくいけば届かず、悪い入力ならすぐ気づける程度の値。
- テンプレートに `bool` 定数を渡すと、実行時の分岐なしに処理の方式を切り替えられる。
- 最適化は「型」と「比較関数」の両方の性質を確かめてから使う。
