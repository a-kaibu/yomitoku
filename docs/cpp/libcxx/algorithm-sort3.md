---
title: コメントで「いまわかっていること」を書きながら 3 つを並べる
description: std::sort が使う 3 要素ソート。比較 2〜3 回・入れ替え 0〜2 回で済む決定木を、各行の右に不変条件のコメントを添えて書いている。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [107, 135]
function: std::__sort3
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 可読性]
---

## ひとことで

`__sort3` は、3 つの位置 `x, y, z` の値を小さい順に並べる関数です。
`std::sort` が要素 3 個の範囲を並べるときや、クイックソートの「軸（ピボット）」を選ぶための「3 つの中央値」を求めるときに使われます。

たとえば `x = 5, y = 1, z = 3` なら `1, 3, 5` にします。全部で 6 通りある並び方を、**最大 3 回の比較** で見分けています。

## コード

```cpp:line-numbers=107
template <class _AlgPolicy,
          class _Compare,
          class _RandomAccessIterator,
          __enable_if_t<!__use_branchless_sort<_Compare, _RandomAccessIterator>, int> = 0>
inline _LIBCPP_CONSTEXPR_SINCE_CXX14 bool
__sort3(_RandomAccessIterator __x, _RandomAccessIterator __y, _RandomAccessIterator __z, _Compare __c) {
  using _Ops = _IterOps<_AlgPolicy>;

  if (!__c(*__y, *__x)) // if x <= y
  {
    if (!__c(*__z, *__y))        // if y <= z
      return false;              // x <= y && y <= z
                                 // x <= y && y > z
    _Ops::iter_swap(__y, __z);   // x <= z && y < z
    if (__c(*__y, *__x))         // if x > y
      _Ops::iter_swap(__x, __y); // x < y && y <= z
    return true;                 // x <= y && y < z
  }
  if (__c(*__z, *__y)) // x > y, if y > z
  {
    _Ops::iter_swap(__x, __z); // x < y && y < z
    return true;
  }
  _Ops::iter_swap(__x, __y); // x > y && y <= z
  // x < y && x <= z
  if (__c(*__z, *__y))         // if y > z
    _Ops::iter_swap(__y, __z); // x <= y && y < z
  return true;
} // x <= y && y <= z
```

## 前提知識

- **テンプレートと `__enable_if_t`**: `template <...>` は型をあとから決める関数のひな形です。テンプレート引数の最後の `__enable_if_t<条件, int> = 0` は「条件が真のときだけこの版を候補にする」という仕掛け（SFINAE と呼ばれます）です。ここでは「分岐なし版が使えない型」のときにこの関数が選ばれます。分岐なし版はすぐ上にあります。
- **イテレータと `*`**: `__x` などは配列の中の位置で、`*__x` がその位置の値です。
- **比較関数 `__c(a, b)`**: 「`a` を `b` より前に置くべきか」を返します。ふつうは `a < b` です。なので `!__c(*__y, *__x)` は「`y < x` ではない」、つまり `x <= y` を意味します。
- **`_Ops::iter_swap(a, b)`**: 2 つの位置の値を入れ替えます。`_IterOps<_AlgPolicy>` は、昔ながらの `std::sort` と C++20 の `std::ranges::sort` の両方から同じコードを使うための「入れ替えや移動のやり方」をまとめた型です。
- **戻り値 `bool`**: 入れ替えが起きたかどうかです。呼び出し側が「もともと並んでいたか」の手がかりに使います。

## 何をしているか

コードの右側のコメントは、その行を実行した直後に **何が成り立っているか** を書いたものです。これを追うと読み解けます。

### 1. x <= y の場合

```cpp:line-numbers=115
  if (!__c(*__y, *__x)) // if x <= y
  {
    if (!__c(*__z, *__y))        // if y <= z
      return false;              // x <= y && y <= z
                                 // x <= y && y > z
    _Ops::iter_swap(__y, __z);   // x <= z && y < z
    if (__c(*__y, *__x))         // if x > y
      _Ops::iter_swap(__x, __y); // x < y && y <= z
    return true;                 // x <= y && y < z
  }
```

- `y <= z` でもあれば、もう並んでいるので `false` を返します。比較は 2 回です。
- そうでなければ `y > z` です。`y` と `z` を入れ替えます。これで `z` は最大です。
- 新しい `y`（もとの `z`）が `x` より小さければ、さらに `x` と `y` を入れ替えます。

例 `x = 2, y = 5, z = 3`: `2 <= 5`、`5 > 3` なので入れ替えて `2, 3, 5`。`3 < 2` ではないので終わりです。

### 2. x > y で、y > z の場合

```cpp:line-numbers=125
  if (__c(*__z, *__y)) // x > y, if y > z
  {
    _Ops::iter_swap(__x, __z); // x < y && y < z
    return true;
  }
```

`x > y > z`、つまり完全に逆順です。`x` と `z` を 1 回入れ替えるだけで `z, y, x` の順に並びます。

例 `x = 9, y = 5, z = 1` → `1, 5, 9`。比較 2 回、入れ替え 1 回です。

### 3. x > y で、y <= z の場合

```cpp:line-numbers=130
  _Ops::iter_swap(__x, __y); // x > y && y <= z
  // x < y && x <= z
  if (__c(*__z, *__y))         // if y > z
    _Ops::iter_swap(__y, __z); // x <= y && y < z
  return true;
```

まず `x` と `y` を入れ替えます。これで先頭は `x` と `y` のうち小さい方です。
残りの 2 つ（新しい `y` と `z`）が逆順なら、もう 1 回入れ替えます。

例 `x = 5, y = 1, z = 3`: 入れ替えて `1, 5, 3`。`3 < 5` なので入れ替えて `1, 3, 5` です。

## ここがすごい

- **最初の比較の結果を使い回す**: 3 つの値の並び方は 6 通りあり、それを見分けるには最低でも 3 回の比較が要る場合があります（2 回では 4 通りしか区別できないため）。この関数は「すでに並んでいる」「逆順」の 2 パターンを 2 回の比較で見抜き、残りだけ 3 回目の比較をしています。
- **余計な入れ替えをしない**: 等しい値どうしは比較で「前に置くべき」と判定されないので、入れ替えが起きません。関数の前のコメントにある「stable（等しい要素の順番を保つ）」はこの性質のことです。
- **コメントが証明になっている**: 各行に「この時点で `x <= z && y < z`」のような条件を書いておくことで、読む人がどの経路でも最後に `x <= y <= z` になることを順に確かめられます。分岐が多い短いコードほど、この書き方が効きます。
- **2 つの版を型で選ぶ**: 数値のように比較が軽い型には、分岐を使わない版が選ばれます。比較や入れ替えが重い型には、回数を減らせるこの分岐版が選ばれます。

## まとめ

- 小さな固定サイズのソートは、比較の結果で枝分かれする「決定木」として書ける。
- 「すでに並んでいる」「逆順」を早めに見抜くと、比較と入れ替えの回数を減らせる。
- 各行の後に成り立つ条件をコメントに書くと、分岐の多いコードでも正しさを追いやすい。
- 同じ処理でも、型の性質によって分岐あり・なしの版を使い分けるのが効率のこつ。
