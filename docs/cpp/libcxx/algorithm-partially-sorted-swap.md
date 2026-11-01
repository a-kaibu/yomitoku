---
title: 「2 つは並んでいる」前提で 3 つを分岐なしに整列する
description: y と z が並んでいることを前提に、x を正しい位置へ入れる 3 要素ソートの部品。比較 2 回と三項演算子だけで書かれている。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [78, 92]
function: std::__partially_sorted_swap
difficulty: 3
format: 2
tags: [ソート, 最適化, 標準ライブラリ]
---

## ひとことで

`__partially_sorted_swap` は、3 つの位置 `x, y, z` について「**`y <= z` はもう成り立っている**」という前提のもとで、3 つ全部を `x <= y <= z` に並べる関数です。
たとえば `x = 7, y = 2, z = 5` なら、`2, 5, 7` にします。

`std::sort` が数値を並べるときの小さな部品で、`if` を使わず、比較 2 回と三項演算子だけで書かれています。

## コード

::: code-group

```cpp:line-numbers=78 [日本語訳]
// *__y と *__z がすでに並んでいるという前提のもとで、
// *__x, *__y, *__z が比較関数 __c の順に並ぶようにする。
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_CONSTEXPR_SINCE_CXX14 bool
__partially_sorted_swap(_RandomAccessIterator __x, _RandomAccessIterator __y, _RandomAccessIterator __z, _Compare __c) {
  // 注: この関数は（`value_type` を使っているので）代理イテレータでも正しく動く。
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r1        = __c(*__z, *__x);
  value_type __tmp = __r1 ? *__z : *__x;
  *__z             = __r1 ? *__x : *__z;
  bool __r2        = __c(__tmp, *__y);
  *__x             = __r2 ? *__x : *__y;
  *__y             = __r2 ? *__y : __tmp;
  return !__r1 || !__r2;
}
```

```cpp:line-numbers=78 [原文]
// Ensures that *__x, *__y and *__z are ordered according to the comparator __c,
// under the assumption that *__y and *__z are already ordered.
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_CONSTEXPR_SINCE_CXX14 bool
__partially_sorted_swap(_RandomAccessIterator __x, _RandomAccessIterator __y, _RandomAccessIterator __z, _Compare __c) {
  // Note: this function behaves correctly even with proxy iterators (because it relies on `value_type`).
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r1        = __c(*__z, *__x);
  value_type __tmp = __r1 ? *__z : *__x;
  *__z             = __r1 ? *__x : *__z;
  bool __r2        = __c(__tmp, *__y);
  *__x             = __r2 ? *__x : *__y;
  *__y             = __r2 ? *__y : __tmp;
  return !__r1 || !__r2;
}
```

:::

## 前提知識

- **イテレータと `*`**: イテレータは配列の中の位置を指す値で、`*__x` でその位置の値を読み書きします。
- **比較関数 `__c(a, b)`**: 「`a` を `b` より前に置くべきか」を返します。ふつうは `a < b` です。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` になる式です。`if` 文と違い「値を選ぶ」だけです。
- **`value_type`**: イテレータが指す要素の型です。`__tmp` はその型の一時変数です。
- **`inline`**: 関数の中身を呼び出し元に展開してよい、という印です。小さな関数を呼び出しの手間なく使えます。

## 何をしているか

考え方は「`x` を、すでに並んでいる `y, z` の列に差し込む」です。差し込む先は 3 通り（先頭・真ん中・末尾）あります。

### 1. 末尾を決める

```cpp:line-numbers=85
  bool __r1        = __c(*__z, *__x);
  value_type __tmp = __r1 ? *__z : *__x;
  *__z             = __r1 ? *__x : *__z;
```

`__r1 = __c(*__z, *__x)` は「`z < x` か」です。

- 真なら `x` がいちばん大きいので、`z` の位置に `x` を書き、もとの `z` を `__tmp` に退避します。
- 偽なら `z` がいちばん大きいままなので、`z` はそのまま、`__tmp` には `x` を入れます。

どちらの場合も、`z` には **3 つのうちの最大値** が入り、`__tmp` には「`x` と `z` のうち小さい方」が残ります。

例 `x = 7, y = 2, z = 5` では `5 < 7` が真なので、`z = 7`、`__tmp = 5` です。

### 2. 先頭と真ん中を決める

```cpp:line-numbers=88
  bool __r2        = __c(__tmp, *__y);
  *__x             = __r2 ? *__x : *__y;
  *__y             = __r2 ? *__y : __tmp;
```

残りは `__tmp` と `y` の 2 つです。`__r2 = __c(__tmp, *__y)` で「`__tmp < y` か」を調べます。

- 真なら `x` の位置は変えず、`y` もそのまま。
- 偽なら `x` の位置に `y` を、`y` の位置に `__tmp` を書きます。

例では `5 < 2` が偽なので、`x = 2`、`y = 5` になり、全体は `2, 5, 7` です。

`__r2` が真になるのは、`__tmp` が元の `x` のとき（ステップ 1 で `x <= z` だったとき）だけです。
`__tmp` が `z` なら、前提 `y <= z` から `z < y` は成り立たないからです。なので「真なら `x` はそのまま」で正しく動きます。

### 3. 戻り値

```cpp:line-numbers=91
  return !__r1 || !__r2;
```

`!__r1 || !__r2` を返します。上の考察のとおり、`__r1` が真なら `__r2` は必ず偽になるので、前提が守られていれば戻り値は常に `true` です。
呼び出し側（たとえば `nth_element`）はこの値を「並び替えが起きなかったなら、すでに整列済みか確かめてみる」という目安にしか使わず、確かめるときには実際に要素を調べ直します。なので保守的に `true` を返しても結果は正しいままです。

## ここがすごい

- **前提を使って比較を減らす**: 3 要素を一から並べると最大 3 回の比較が必要です。「`y <= z` は済んでいる」という前提を受け取ることで、比較は 2 回で済みます。同じファイルの `__sort3`は、まず `__cond_swap` で `y, z` を並べ、そのあとこの関数を呼んで 3 要素ソートを完成させています。
- **書き込み先が毎回同じ**: どの入力でも `z`、`x`、`y` の順に 1 回ずつ書きます。分岐がないので CPU の分岐予測が外れる心配がありません。
- **`__tmp` 1 つで 3 つを回す**: 一時変数を 1 つしか使わずに、最大値の確定と残り 2 つの整列を順番に片付けています。

## まとめ

- 「すでにわかっていること」を引数の前提にすると、比較の回数を減らせる。
- 挿入ソートの 1 ステップ（並んだ列への差し込み）は、分岐なしでも書ける。
- 戻り値を「目安」として使う設計なら、保守的な値を返しても正しさは崩れない。
- 小さな部品を組み合わせて、3 要素・5 要素のソートを作るのが libc++ の作り方。
