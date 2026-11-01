---
title: 5 回の比較交換で 4 つを並べる「ソーティングネットワーク」
description: 数値の 4 要素ソートを、決まった 5 組の比較交換だけで行う関数。入力によって処理の流れが変わらないので分岐予測に強い。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [137, 154]
function: std::__sort4
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`__sort4` は 4 つの位置の値を小さい順に並べる関数です。この版は要素が数値のときに選ばれる「分岐なし版」です。
中身は **`__cond_swap`（逆順なら入れ替える）を、決まった 5 組に対して順番に呼ぶだけ** です。

このように「どの組を比べるか」が入力に関係なく固定された並べ方を、**ソーティングネットワーク** と呼びます。

## コード

::: code-group

```cpp:line-numbers=137 [日本語訳]
// 安定、比較 3〜6 回、入れ替え 0〜5 回

template <class,
          class _Compare,
          class _RandomAccessIterator,
          __enable_if_t<__use_branchless_sort<_Compare, _RandomAccessIterator>, int> = 0>
inline void
__sort4(_RandomAccessIterator __x1,
        _RandomAccessIterator __x2,
        _RandomAccessIterator __x3,
        _RandomAccessIterator __x4,
        _Compare __c) {
  std::__cond_swap<_Compare>(__x1, __x3, __c);
  std::__cond_swap<_Compare>(__x2, __x4, __c);
  std::__cond_swap<_Compare>(__x1, __x2, __c);
  std::__cond_swap<_Compare>(__x3, __x4, __c);
  std::__cond_swap<_Compare>(__x2, __x3, __c);
}
```

```cpp:line-numbers=137 [原文]
// stable, 3-6 compares, 0-5 swaps

template <class,
          class _Compare,
          class _RandomAccessIterator,
          __enable_if_t<__use_branchless_sort<_Compare, _RandomAccessIterator>, int> = 0>
inline void
__sort4(_RandomAccessIterator __x1,
        _RandomAccessIterator __x2,
        _RandomAccessIterator __x3,
        _RandomAccessIterator __x4,
        _Compare __c) {
  std::__cond_swap<_Compare>(__x1, __x3, __c);
  std::__cond_swap<_Compare>(__x2, __x4, __c);
  std::__cond_swap<_Compare>(__x1, __x2, __c);
  std::__cond_swap<_Compare>(__x3, __x4, __c);
  std::__cond_swap<_Compare>(__x2, __x3, __c);
}
```

:::

## 前提知識

- **`__cond_swap(a, b, c)`**: 同じファイルの少し上にある関数です。`a` と `b` の位置の値が逆順なら入れ替え、そうでなければそのままにします。中で `if` を使わず、三項演算子で値を選んで書き込みます。
- **テンプレート引数 `template <class, ...>`**: 最初の `class` に名前がないのは、この版ではその型（入れ替え方の方針 `_AlgPolicy`）を使わないからです。名前を付けないことで「使っていない」とはっきり示しています。
- **`__enable_if_t<条件, int> = 0`**: 条件が真のときだけこの関数を候補にする仕掛けです。ここでは `__use_branchless_sort`（数値型で、メモリが連続していて、比較が `<` か `>`）のときに選ばれます。条件が偽のときは、すぐ下にある分岐ありの版が選ばれます。
- **`std::`**: 標準ライブラリの名前空間（名前の住所）です。`std::__cond_swap` と書くことで、利用者が同名の関数を作っていてもそちらが呼ばれないようにしています。

## 何をしているか

4 つの位置を 1〜4 番と呼び、`[3, 1, 4, 2]` を例に追います。

### 1. 1 と 3、2 と 4 を比べる

```cpp:line-numbers=149
  std::__cond_swap<_Compare>(__x1, __x3, __c);
  std::__cond_swap<_Compare>(__x2, __x4, __c);
```

1・2 番に「各組の小さい方」、3・4 番に「大きい方」を集めます。

- 1 と 3: `3, 4` は並んでいるのでそのまま → `[3, 1, 4, 2]`
- 2 と 4: `1, 2` もそのまま → `[3, 1, 4, 2]`

この時点で、全体の最小値は 1 番か 2 番のどちらかに、最大値は 3 番か 4 番のどちらかにあります。

### 2. 最小値と最大値を確定する

```cpp:line-numbers=151
  std::__cond_swap<_Compare>(__x1, __x2, __c);
  std::__cond_swap<_Compare>(__x3, __x4, __c);
```

- 1 と 2: `3, 1` は逆なので入れ替え → `[1, 3, 4, 2]`。最小値 `1` が 1 番に確定。
- 3 と 4: `4, 2` を入れ替え → `[1, 3, 2, 4]`。最大値 `4` が 4 番に確定。

### 3. 真ん中の 2 つを整える

```cpp:line-numbers=153
  std::__cond_swap<_Compare>(__x2, __x3, __c);
```

- 2 と 3: `3, 2` を入れ替え → `[1, 2, 3, 4]`

残った 2 番と 3 番を比べれば完成です。

### 例 2: `[4, 3, 2, 1]`（逆順）

`[2, 3, 4, 1]` → `[2, 1, 4, 3]` → `[1, 2, 4, 3]` → `[1, 2, 3, 4]` → そのまま、と進みます。どんな並びでも、同じ 5 回で必ず並びます。

## ここがすごい

- **処理の流れが入力に依存しない**: 分岐あり版は、入力によって比較が 3〜6 回、入れ替えが 0〜5 回と変わります（関数の前のコメント）。この版はいつも 5 回で、しかも各回が分岐なしの `__cond_swap` なので、CPU の分岐予測が外れることがありません。
- **独立した組は並列に動ける**: 最初の 2 回（1-3 と 2-4）は別々の位置しか触らないので、CPU は 2 つを同時に進められます。次の 2 回（1-2 と 3-4）も同様です。依存関係の「深さ」は 3 段だけです。
- **5 回は 4 要素で最少**: 4 要素のソーティングネットワークは比較交換 5 回が最少として知られています。部品を最小限の回数で組み合わせています。

## まとめ

- ソーティングネットワークは、比べる組が固定された並べ方で、分岐のない実装と相性がよい。
- 4 要素は「1-3, 2-4, 1-2, 3-4, 2-3」の 5 回の比較交換で並べられる。
- 互いに独立した比較交換は、CPU が同時に実行できる。
- 型の性質に応じて「回数が少ない分岐あり版」と「流れが一定な分岐なし版」を使い分けている。
