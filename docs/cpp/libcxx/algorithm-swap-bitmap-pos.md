---
title: ビットの「1」を拾っては消して、入れ替える相手を見つける
description: ブロッククイックソートの入れ替え部分。左右 64 個ずつの比較結果をビット列に持ち、末尾の 0 の数え上げと最下位ビット消去で入れ替え位置を次々に取り出す。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [352, 366]
function: std::__swap_bitmap_pos
difficulty: 3
format: 2
tags: [ビット演算, ソート, 最適化]
---

## ひとことで

`__swap_bitmap_pos` は、クイックソートの分割で「左にあるが右へ行くべき要素」と「右にあるが左へ行くべき要素」を 1 組ずつ入れ替える関数です。
どの要素が「間違った側」にいるかは、あらかじめ 64 ビットの整数 2 つ（ビットセット）に記録されています。この関数はそのビットの `1` を小さい位置から順に拾い、組にして入れ替えます。

数値をソートするとき、libc++ の `std::sort` はこの「ブロッククイックソート」と呼ばれる方式で分割します（`__introsort` の前のコメントに「block quick sort」とあります）。

## コード

::: code-group

```cpp:line-numbers=352 [日本語訳]
template <class _AlgPolicy, class _RandomAccessIterator>
inline void __swap_bitmap_pos(
    _RandomAccessIterator __first, _RandomAccessIterator __last, uint64_t& __left_bitset, uint64_t& __right_bitset) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename std::iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  // 両方のビットセットに入れ替え対象が 1 つ以上ある間、
  // 1 回につき 1 組ずつ入れ替える。
  while (__left_bitset != 0 && __right_bitset != 0) {
    difference_type __tz_left  = std::__countr_zero(__left_bitset);
    __left_bitset              = std::__libcpp_blsr(__left_bitset);
    difference_type __tz_right = std::__countr_zero(__right_bitset);
    __right_bitset             = std::__libcpp_blsr(__right_bitset);
    _Ops::iter_swap(__first + __tz_left, __last - __tz_right);
  }
}
```

```cpp:line-numbers=352 [原文]
template <class _AlgPolicy, class _RandomAccessIterator>
inline void __swap_bitmap_pos(
    _RandomAccessIterator __first, _RandomAccessIterator __last, uint64_t& __left_bitset, uint64_t& __right_bitset) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename std::iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  // Swap one pair on each iteration as long as both bitsets have at least one
  // element for swapping.
  while (__left_bitset != 0 && __right_bitset != 0) {
    difference_type __tz_left  = std::__countr_zero(__left_bitset);
    __left_bitset              = std::__libcpp_blsr(__left_bitset);
    difference_type __tz_right = std::__countr_zero(__right_bitset);
    __right_bitset             = std::__libcpp_blsr(__right_bitset);
    _Ops::iter_swap(__first + __tz_left, __last - __tz_right);
  }
}
```

:::

## 前提知識

- **`uint64_t`**: 64 ビットの符号なし整数です。ここでは「64 個の真偽値を 1 つの整数に詰めたもの」として使います。ビット `j` が `1` なら「`j` 番目の要素は入れ替えが必要」という意味です。
- **参照 `uint64_t&`**: 引数の型に `&` が付くと、値のコピーではなく **呼び出し元の変数そのもの** を受け取ります。関数の中でビットを消すと、呼び出し元の変数からも消えます。
- **`std::__countr_zero(x)`**: `x` を 2 進数で見たとき、右端（最下位）から続く `0` の個数を返します。つまり **いちばん下にある `1` の位置** です。`0b0110` なら `1` です。
- **`std::__libcpp_blsr(x)`**: いちばん下にある `1` を `0` にした値を返します。中身は `x ^ (x & -x)` です（`__bit/blsr.h`）。名前は x86 の BMI1 命令 BLSR（最下位のセットビットを消す）から来ています。
- **イテレータの足し引き**: `__first + 3` は先頭から 3 つ右、`__last - 3` は `__last` から 3 つ左の位置です。

## 何をしているか

### 2 つのビットセットの意味

分割中の配列の左端を `__first`、右端（最後の要素そのもの）を `__last` とします。

- `__left_bitset` のビット `j`: `__first + j` の要素が軸（ピボット）以上で、右へ行くべき。
- `__right_bitset` のビット `j`: `__last - j` の要素が軸未満で、左へ行くべき。

### 例で追う

```cpp:line-numbers=359
  while (__left_bitset != 0 && __right_bitset != 0) {
    difference_type __tz_left  = std::__countr_zero(__left_bitset);
    __left_bitset              = std::__libcpp_blsr(__left_bitset);
    difference_type __tz_right = std::__countr_zero(__right_bitset);
    __right_bitset             = std::__libcpp_blsr(__right_bitset);
    _Ops::iter_swap(__first + __tz_left, __last - __tz_right);
  }
```

`__left_bitset = 0b0110`、`__right_bitset = 0b1001` とします。

1 回目:
- `__tz_left = 1`（下から 1 番目に `1`）。`blsr` で `0b0100` に。
- `__tz_right = 0`。`blsr` で `0b1000` に。
- `__first + 1` と `__last - 0` を入れ替え。

2 回目:
- `__tz_left = 2`、左は `0` に。
- `__tz_right = 3`、右も `0` に。
- `__first + 2` と `__last - 3` を入れ替え。

どちらかが `0` になったらループを抜けます。残った側のビットは呼び出し元に参照で返り、次のブロックの分割で使われます。

### `x ^ (x & -x)` のしくみ

`-x` は 2 の補数（ビットを反転して 1 を足す）なので、`x & -x` は **最下位の `1` だけを残した値** になります。
`x = 0b0110` なら `x & -x = 0b0010`、それと `x` の排他的論理和で `0b0100` です。

## ここがすごい

- **分割の主役から分岐を追い出す**: ふつうのクイックソートの分割は「左から進んで、軸以上で止まる」「右から進んで、軸未満で止まる」という、止まる場所が読めないループです。CPU の分岐予測がよく外れます。ブロック方式では、まず比較結果を分岐なしでビットに記録し（`__populate_left_bitset` など）、そのあとこの関数で **ビットに従って入れ替えるだけ** にします。ループの回数は「入れ替える組の数」で決まり、比較結果による分岐がありません。
- **1 命令で位置がわかる**: `__countr_zero` も `blsr` も、多くの CPU に専用命令があります。64 個の候補から次の位置を探すのに、1 つずつ調べる必要がありません。
- **残りを捨てない**: 片方のビットセットが先に空になっても、もう片方の残りはそのまま呼び出し元へ返ります。比較をやり直さずに、次のブロックと組み合わせて入れ替えを続けられます。

## まとめ

- 64 個の真偽値は 1 つの `uint64_t` に詰められ、まとめて扱える。
- 「最下位の 1 の位置を求める」「最下位の 1 を消す」の組み合わせで、立っているビットを順に列挙できる。
- `x & -x` は最下位の 1 だけを取り出す定番のビットトリック。
- 比較と入れ替えを分けると、予測しにくい分岐をループから追い出せる。
