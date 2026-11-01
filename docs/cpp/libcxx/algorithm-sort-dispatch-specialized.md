---
title: よく使う型の sort はライブラリに作り置きしておく
description: int や double のポインタを既定の比較で並べるとき、比較関数の型を 1 つにそろえ、ライブラリ本体に事前コンパイルされた __sort を呼ぶようにする仕組み。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [876, 926]
function: std::__sort_dispatch（組み込み型向けの多重定義）
difficulty: 3
format: 2
tags: [メタプログラミング, ソート, 最適化]
---

## ひとことで

このコードは、`int*` や `double*` のような **組み込みの数値型の配列を、既定の比較で並べる** ときだけ選ばれる `__sort_dispatch` の特別版です。
中身は、比較関数を `__less<_Type>` という 1 つの型にそろえて `std::__sort` を呼ぶだけです。そしてその `std::__sort` は、**libc++ のライブラリ本体（共有ライブラリ）にあらかじめコンパイルして入れてあります**。

`std::sort(v.begin(), v.end())` も `std::ranges::sort(v)` も `std::sort(v.begin(), v.end(), std::less<int>())` も、最後は同じ 1 つの関数にたどり着きます。

## コード

```cpp:line-numbers=876
template <class _Type, class... _Options>
using __is_any_of _LIBCPP_NODEBUG = _Or<is_same<_Type, _Options>...>;

template <class _Type>
using __sort_is_specialized_in_library _LIBCPP_NODEBUG = __is_any_of<
    _Type,
    char,
#if _LIBCPP_HAS_WIDE_CHARACTERS
    wchar_t,
#endif
    signed char,
    unsigned char,
    short,
    unsigned short,
    int,
    unsigned int,
    long,
    unsigned long,
    long long,
    unsigned long long,
    float,
    double,
    long double>;

template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, __less<>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}

template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, less<_Type>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}

#if _LIBCPP_STD_VER >= 14
template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, less<>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}
#endif

#if _LIBCPP_STD_VER >= 20
template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, ranges::less&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}
#endif
```

## 前提知識

- **テンプレートの実体化**: テンプレートは「ひな形」で、使われた型ごとにコンパイラが関数を作ります（実体化）。ふつうは使った側のファイルでその都度作られます。
- **`extern template`**: このコードのすぐ上に並んでいる宣言で、「この型の実体はほかの場所（ライブラリ本体）にあるので、ここでは作らなくてよい」とコンパイラに伝えます。実際の実体は `libcxx/src/algorithm.cpp` で作られています。
- **`using 名前 = ...`（別名テンプレート）**: 型に名前を付けます。冒頭の `__is_any_of<_Type, A, B, ...>` は、「`_Type` が A, B, … のどれかと同じか」を表す型です。`_Or<is_same<...>...>` の `...` は、並んだ型を 1 つずつ展開する「パック展開」です。
- **`#if`**: コンパイル前に条件で行を残したり消したりする命令です。`wchar_t` がない環境や、古い C++ の版では使えない部分を外しています。
- **`__enable_if_t<条件, int> = 0`**: 条件が真のときだけこの関数を候補にする仕掛けです。
- **多重定義（オーバーロード）**: 同じ名前の関数を、引数の型違いで何個も定義できます。呼び出し時に、引数に最も合うものが選ばれます。
- **`_Type*`**: `_Type` 型の値を指すポインタ（メモリ上の番地）です。

## 何をしているか

### 対象の型を列挙する

```cpp:line-numbers=879
template <class _Type>
using __sort_is_specialized_in_library _LIBCPP_NODEBUG = __is_any_of<
    _Type,
    char,
#if _LIBCPP_HAS_WIDE_CHARACTERS
    wchar_t,
#endif
    signed char,
    unsigned char,
    short,
    unsigned short,
    int,
    unsigned int,
    long,
    unsigned long,
    long long,
    unsigned long long,
    float,
    double,
    long double>;
```

`char`、`int`、`unsigned long long`、`float`、`double` など、組み込みの文字型・整数型・浮動小数点型が並んでいます。`__sort_is_specialized_in_library<int>` は真、`std::string` なら偽です。

### 4 通りの「既定の比較」を受け止める

```cpp:line-numbers=900
template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, __less<>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}

template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, less<_Type>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}

#if _LIBCPP_STD_VER >= 14
template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, less<>&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}
#endif

#if _LIBCPP_STD_VER >= 20
template <class _AlgPolicy, class _Type, __enable_if_t<__sort_is_specialized_in_library<_Type>::value, int> = 0>
void __sort_dispatch(_Type* __first, _Type* __last, ranges::less&) {
  __less<_Type> __comp;
  std::__sort<__less<_Type>&, _Type*>(__first, __last, __comp);
}
#endif
```

利用者が渡す比較は、書き方によって型が違います。

| 呼び方 | 比較の型 | 受ける行 |
| --- | --- | --- |
| `std::sort(p, q)` | `__less<>`（内部用） | 900〜904 |
| `std::sort(p, q, std::less<int>())` | `less<int>` | 906〜910 |
| `std::sort(p, q, std::less<>())` | `less<>`（C++14 以降） | 912〜917 |
| `std::ranges::sort(...)` | `ranges::less`（C++20 以降） | 920〜925 |

どれも「`<` で比べる」という意味は同じです。そこで全部の中で `__less<_Type> __comp;` を作り直し、`std::__sort<__less<_Type>&, _Type*>` を呼びます。

### ライブラリ本体の実体を使う

`int*` の場合、呼ばれるのは `__sort<__less<int>&, int*>` です。すぐ上にある次のような `extern template` 宣言により、利用者のプログラムではこの関数の中身をコンパイルせず、libc++ の共有ライブラリにある実体を呼び出します。

```cpp:line-numbers=844
extern template _LIBCPP_EXPORTED_FROM_ABI void __sort<__less<int>&, int*>(int*, int*, __less<int>&);
```

## ここがすごい

- **コンパイル時間とプログラムの大きさを減らす**: `std::sort` の中身（イントロソート、分割、挿入ソートなど）はかなり大きなコードです。`int` のソートを使うたびに各ファイルで実体化すると、コンパイルが遅くなり、プログラムも大きくなります。よく使う型だけはライブラリに 1 つ作り置きし、みんなでそれを共有します。
- **比較の型をそろえて実体を 1 つにする**: 比較の型が 4 種類あると、作り置きも 4 倍必要になります。意味が同じ比較を `__less<_Type>` 1 つに正規化することで、型ごとに 1 個の実体で済ませています。
- **効く場面を厳密に絞る**: ポインタ（`_Type*`）であること、型が列挙されたもののどれかであること、比較が既定のものであることがすべてそろったときだけ選ばれます。利用者が自作の比較関数を渡した場合など、それ以外はすべて、すぐ上にある汎用版の `__sort_dispatch` が使われます。
- **実行時の違いはない**: どちらの経路でも最後は同じ `__introsort` が動きます。利用者から見た結果は同じで、違うのはどこでコンパイルされたかだけです。

## まとめ

- `extern template` を使うと、よく使うテンプレートの実体をライブラリに作り置きし、利用側のコンパイルを省ける。
- 意味が同じ複数の型（ここでは 4 種類の「<」）を 1 つにそろえると、作り置きの数を減らせる。
- パック展開を使えば「型がこの一覧のどれかか」を短く書ける。
- 多重定義と `enable_if` を組み合わせて、条件がそろったときだけ特別な経路に入れる。
