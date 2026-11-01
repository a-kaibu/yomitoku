---
title: if を使わずに「小さい方を左へ」入れ替える
description: std::sort の内部で使われる 2 要素の条件付き入れ替え。比較結果を三項演算子だけで使い、分岐の予測ミスが起きないコードにしている。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [65, 76]
function: std::__cond_swap
difficulty: 2
format: 2
tags: [ソート, 最適化, 標準ライブラリ]
---

## ひとことで

`__cond_swap` は、2 つの位置 `x` と `y` にある値を見て、**順番が逆なら入れ替える** だけの小さな関数です。
たとえば `*x = 5, *y = 3` なら入れ替えて `3, 5` にし、`*x = 1, *y = 4` ならそのままにします。

おもしろいのは、ふつうなら `if (y < x) swap(x, y);` と書くところを、**`if` を使わずに** 書いている点です。
LLVM の C++ 標準ライブラリ libc++ の `std::sort` は、要素が数値のときにこの関数を組み合わせて、小さな範囲を並べ替えます。

## コード

::: code-group

```cpp:line-numbers=65 [日本語訳]
// 必要なら *__x と *__y を入れ替えて、__c(*__x, *__y) が真になるようにする。
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_CONSTEXPR_SINCE_CXX14 bool
__cond_swap(_RandomAccessIterator __x, _RandomAccessIterator __y, _Compare __c) {
  // 注: この関数は（`value_type` を使っているので）代理イテレータでも正しく動く。
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r         = __c(*__x, *__y);
  value_type __tmp = __r ? *__x : *__y;
  *__y             = __r ? *__y : *__x;
  *__x             = __tmp;
  return !__r;
}
```

```cpp:line-numbers=65 [原文]
// Ensures that __c(*__x, *__y) is true by swapping *__x and *__y if necessary.
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_CONSTEXPR_SINCE_CXX14 bool
__cond_swap(_RandomAccessIterator __x, _RandomAccessIterator __y, _Compare __c) {
  // Note: this function behaves correctly even with proxy iterators (because it relies on `value_type`).
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r         = __c(*__x, *__y);
  value_type __tmp = __r ? *__x : *__y;
  *__y             = __r ? *__y : *__x;
  *__x             = __tmp;
  return !__r;
}
```

:::

## 前提知識

- **テンプレート（`template <class _Compare, class _RandomAccessIterator>`）**: 型をあとから差し込める関数の「ひな形」です。`_Compare` は比較関数の型、`_RandomAccessIterator` は位置を表す型で、呼び出したときに具体的な型が決まります。
- **イテレータ**: 配列の中の位置を指す値です。ポインタ（メモリ上の番地を持つ値）の一般化だと思ってください。`*__x` と書くと、その位置にある値を読み書きできます。
- **比較関数 `__c`**: `__c(a, b)` が `true` なら「`a` を `b` より前に置くべき」という意味です。ふつうは「`a < b`」です。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` を値として返す式です。
- **`using value_type = ...`**: 型に別名を付ける書き方です。`iterator_traits<...>::value_type` は「このイテレータが指す要素の型」を取り出す決まり文句です。
- **`_LIBCPP_CONSTEXPR_SINCE_CXX14`**: libc++ のマクロ（文字の置き換え）で、C++14 以降ならコンパイル時にも実行できる `constexpr` 関数にする、という印です。
- **名前の先頭の `__`**: 標準ライブラリの内部用の名前です。利用者のコードやマクロとぶつからないよう、処理系だけが使える名前にしています。

## 何をしているか

### 比較を 1 回だけする

```cpp:line-numbers=71
  bool __r         = __c(*__x, *__y);
```

`__r = __c(*__x, *__y)` で「`x` の値は `y` の値より前に置くべきか」を 1 回だけ調べます。
`*x = 5, *y = 3` なら `5 < 3` は偽なので `__r = false` です。

### 入れ替えを「選択」で書く

```cpp:line-numbers=72
  value_type __tmp = __r ? *__x : *__y;
  *__y             = __r ? *__y : *__x;
  *__x             = __tmp;
```

```
__tmp = __r ? *__x : *__y;   // 前に来るべき値（小さい方）
*__y  = __r ? *__y : *__x;   // 後ろに来るべき値（大きい方）
*__x  = __tmp;
```

`__r = false` の例では、`__tmp = 3`、`*y = 5`、`*x = 3` となり、`3, 5` に並びます。
`*x = 1, *y = 4` なら `__r = true` で、`__tmp = 1`、`*y = 4`、`*x = 1` と、同じ値を書き戻すだけです。

つまりこの関数は、**入れ替えるかどうかを if で分けず、毎回 3 回の書き込みを必ず行います**。
変わるのは「どちらの値を書くか」だけです。

### 戻り値

```cpp:line-numbers=75
  return !__r;
```

`!__r` を返します。順番が逆だった（＝入れ替えた）ときに `true` です。
値が等しいときも `__c` は偽になるので `true` が返りますが、等しい値を入れ替えても結果は同じです。

## ここがすごい

- **分岐の予測ミスがなくなる**: CPU は `if` の行き先を予想して先回りで実行します。ソートの比較結果は入力によってほぼランダムなので、予想がよく外れ、そのたびに作業がやり直しになります。三項演算子で「値の選択」として書くと、コンパイラは条件付き移動命令（x86 の `cmov` など）を使いやすくなり、行き先を予想する必要そのものがなくなります。
- **使う場面を絞っている**: 毎回 3 回書き込むので、要素のコピーが重い型では逆に遅くなります。そこで libc++ は、同じファイルの冒頭にある `__use_branchless_sort` で「連続したメモリ上にある」「コピーが安い」「算術型（整数や浮動小数点数）」「比較が `<` か `>`」の条件がそろったときだけ、この版を使います。

```cpp:line-numbers=53
template <class _Compare, class _Iter, class _Tp = typename iterator_traits<_Iter>::value_type>
inline const bool __use_branchless_sort =
    __libcpp_is_contiguous_iterator<_Iter>::value && __is_cheap_to_copy<_Tp> && is_arithmetic<_Tp>::value &&
    (__desugars_to_v<__less_tag, _Compare, _Tp, _Tp> || __desugars_to_v<__greater_tag, _Compare, _Tp, _Tp>);
```

- **代理イテレータでも壊れない**: 関数の先頭のコメントのとおり、一時変数を参照ではなく `value_type`（値そのもの）で持つので、`std::vector<bool>` のように「参照のふりをする代理オブジェクト」を返すイテレータでも正しく動きます。

## まとめ

- `if (a > b) swap(a, b)` は、三項演算子による「値の選択」に書き換えられる。
- 予測しにくい分岐をなくすと、CPU のパイプラインが止まりにくくなる。
- 分岐をなくす代わりに毎回書き込むので、コピーが安い型に限って使うのが正しい使い方。
- 小さな部品を「条件がそろったときだけ使う」ように型で選び分けるのが、標準ライブラリの定番の作り方。
