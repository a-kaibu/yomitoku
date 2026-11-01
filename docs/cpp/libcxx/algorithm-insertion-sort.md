---
title: 入れ替えずに「ずらして」入れる挿入ソート
description: std::sort が短い範囲で使う挿入ソート。swap を繰り返す教科書版と違い、要素を 1 つ取り出して穴をずらし、最後に 1 回だけ書き戻す。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [240, 265]
function: std::__insertion_sort
difficulty: 1
format: 2
tags: [ソート, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`__insertion_sort` は、トランプの手札を並べるように「左側の並んだ部分に、次の 1 枚を正しい場所へ差し込む」を繰り返す **挿入ソート** です。
`std::sort` は、並べる範囲が 24 要素未満になると、クイックソートをやめてこの関数（またはその変種）に切り替えます。

たとえば `[3, 7, 5, 1]` は、`[3, 7]` → `[3, 5, 7]` → `[1, 3, 5, 7]` と育っていきます。

## コード

::: code-group

```cpp:line-numbers=240 [日本語訳]
// イテレータ範囲 [__first, __last) を、比較関数 __comp を使い
// 挿入ソートのアルゴリズムで並べる。
template <class _AlgPolicy, class _Compare, class _BidirectionalIterator>
_LIBCPP_CONSTEXPR_SINCE_CXX26 void
__insertion_sort(_BidirectionalIterator __first, _BidirectionalIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;

  typedef typename iterator_traits<_BidirectionalIterator>::value_type value_type;
  if (__first == __last)
    return;
  _BidirectionalIterator __i = __first;
  for (++__i; __i != __last; ++__i) {
    _BidirectionalIterator __j = __i;
    --__j;
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _BidirectionalIterator __k = __j;
      __j                        = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
      } while (__j != __first && __comp(__t, *--__k));
      *__j = std::move(__t);
    }
  }
}
```

```cpp:line-numbers=240 [原文]
// Sort the iterator range [__first, __last) using the comparator __comp using
// the insertion sort algorithm.
template <class _AlgPolicy, class _Compare, class _BidirectionalIterator>
_LIBCPP_CONSTEXPR_SINCE_CXX26 void
__insertion_sort(_BidirectionalIterator __first, _BidirectionalIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;

  typedef typename iterator_traits<_BidirectionalIterator>::value_type value_type;
  if (__first == __last)
    return;
  _BidirectionalIterator __i = __first;
  for (++__i; __i != __last; ++__i) {
    _BidirectionalIterator __j = __i;
    --__j;
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _BidirectionalIterator __k = __j;
      __j                        = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
      } while (__j != __first && __comp(__t, *--__k));
      *__j = std::move(__t);
    }
  }
}
```

:::

## 前提知識

- **イテレータ**: 配列などの中の位置を表す値です。`++__i` で 1 つ右へ、`--__j` で 1 つ左へ動き、`*__i` でその位置の値を読み書きします。この関数は左右に 1 歩ずつ動ければよいので、型名が `_BidirectionalIterator`（双方向に動けるイテレータ）になっています。
- **半開区間 `[__first, __last)`**: `__first` は先頭の要素、`__last` は「最後の要素の 1 つ後ろ」を指します。C++ の標準ライブラリの決まりです。
- **ムーブ（`std::move` と `__iter_move`）**: 値をコピーせずに「中身を引っ越しさせる」操作です。文字列などでは、メモリの確保とコピーを省けます。`_Ops::__iter_move(__i)` は「`*__i` の中身をムーブで取り出す」という意味です。
- **`typedef ... value_type`**: 型に別名を付ける書き方で、ここでは「要素の型」に `value_type` という名前を付けています。
- **`do { ... } while (条件);`**: 本体を 1 回実行してから条件を調べるループです。
- **`_LIBCPP_CONSTEXPR_SINCE_CXX26`**: C++26 以降ではコンパイル時にも実行できるようにする、という libc++ のマクロです。

## 何をしているか

`[3, 7, 5, 1]` を例に追います。

### 外側のループ

```cpp:line-numbers=251
  for (++__i; __i != __last; ++__i) {
```

`__i` を 2 番目の要素から最後まで 1 つずつ進めます。`__i` より左は、いつも並び終わっています。

### すでに正しい位置ならスキップ

```cpp:line-numbers=252
    _BidirectionalIterator __j = __i;
    --__j;
    if (__comp(*__i, *__j)) {
```

`__j` を `__i` の 1 つ左に置き、`*__i < *__j` かを調べます。
`__i` が `7` のときは `7 < 3` ではないので、何もせず次へ進みます。

### 取り出して、穴をずらす

```cpp:line-numbers=255
      value_type __t(_Ops::__iter_move(__i));
      _BidirectionalIterator __k = __j;
      __j                        = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
      } while (__j != __first && __comp(__t, *--__k));
      *__j = std::move(__t);
```

`__i` が `5` のとき、`5 < 7` なので差し込みが必要です。

1. `__t` の初期化で `5` を取り出します。配列の `5` があった場所は「穴」だと考えます。
2. `do`〜`while` のループで、穴の左の値を穴に移し、穴を 1 つ左へずらします。`7` が右へ移って `[3, _, 7]` になります。
3. 次に `5 < 3` を調べ、偽なのでループを抜けます。
4. 最後の `*__j = std::move(__t);` で穴に `5` を書き戻し、`[3, 5, 7]` になります。

`__i` が `1` のときは、`7`、`5`、`3` を順に右へずらし、穴が先頭まで来たところで `__j != __first` が偽になって止まります。`1` を先頭に書いて `[1, 3, 5, 7]` の完成です。

## ここがすごい

- **swap ではなく「穴」を動かす**: 教科書によくある書き方は、隣どうしを `swap` しながら左へ進めるものです。`swap` は 1 回で 3 回の代入をするので、`k` 個ずらすと約 `3k` 回の代入になります。この実装は「取り出し 1 回 + ずらし `k` 回 + 書き戻し 1 回」の約 `k + 2` 回で済みます。
- **最初に 1 回だけ比べてから取り出す**: `if (__comp(*__i, *__j))` で「そもそも動かす必要があるか」を先に調べるので、すでに並んでいる部分では要素を一切動かしません。ほぼ並んだデータでは、比較だけで素通りできます。
- **比較の順番がずれないように工夫した `do-while`**: 内側のループは「ずらしてから、左を見る」順に書かれています。外側の `if` で最初の比較は済んでいるので、同じ比較をもう一度しないで済みます。
- **境界チェックつき**: `while` の条件の `__j != __first` で先頭を越えないようにしています。この確認を省いた「unguarded」版も同じファイルにあり、使える場面ではそちらが選ばれます。

## まとめ

- 挿入ソートは、要素を 1 つ取り出して「穴」をずらし、最後に書き戻すと代入の回数が少なくて済む。
- 動かす前に 1 回比べるだけで、整列済みの部分をほぼ無料で通り抜けられる。
- 短い範囲では、単純な挿入ソートのほうが複雑なアルゴリズムより速いことが多い。
- ムーブを使うと、重い型でもコピーせずに要素を移動できる。
