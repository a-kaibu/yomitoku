---
title: 同じ値だらけの区間を一気に飛ばすための逆向き分割
description: 軸と等しい要素を左側に集める分割。左隣の値と軸が等しいときに使われ、等しい要素の塊を丸ごと「並べ終えた」ことにして先へ進める。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [649, 705]
function: std::__partition_with_equals_on_left
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`__partition_with_equals_on_left` は、クイックソートの分割のもう 1 つの版です。
標準の分割（`__partition_with_equals_on_right`）とは逆に、**軸（ピボット）と等しい要素を左側に** 集めます。左には「軸以下」、右には「軸より大きい」要素が並びます。

この版が使われるのは、`[2, 2, 2, 2, 2, 7, 2, 2]` のように **同じ値が大量にある** 配列で、しかも軸がすでに並べ終えた左隣の値と同じときです。そのとき左側はすべて軸と等しいので、もう並べる必要がありません。

## コード

::: code-group

```cpp:line-numbers=649 [日本語訳]
// 上の関数と同様。軸と等しい要素は軸の左に置く。
// 軸の要素を指すイテレータを返す。
template <class _AlgPolicy, class _RandomAccessIterator, class _Compare>
_RandomAccessIterator
__partition_with_equals_on_left(_RandomAccessIterator __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename std::iterator_traits<_RandomAccessIterator>::value_type value_type;
  const _RandomAccessIterator __begin = __first; // 範囲チェック用。これらは動かさない
  const _RandomAccessIterator __end   = __last;
  (void)__end; //
  value_type __pivot(_Ops::__iter_move(__first));
  if (__comp(__pivot, *(__last - difference_type(1)))) {
    // 番兵あり。
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
  } else {
    while (++__first < __last && !__comp(__pivot, *__first)) {
    }
  }

  if (__first < __last) {
    // __introsort が呼ぶ前に 3 つの中央値を取るので、
    // 必ず番兵がある。
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return __first;
}
```

```cpp:line-numbers=649 [原文]
// Similar to the above function.  Elements equivalent to the pivot are put to
// the left of the pivot.  Returns the iterator to the pivot element.
template <class _AlgPolicy, class _RandomAccessIterator, class _Compare>
_RandomAccessIterator
__partition_with_equals_on_left(_RandomAccessIterator __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename std::iterator_traits<_RandomAccessIterator>::value_type value_type;
  const _RandomAccessIterator __begin = __first; // used for bounds checking, those are not moved around
  const _RandomAccessIterator __end   = __last;
  (void)__end; //
  value_type __pivot(_Ops::__iter_move(__first));
  if (__comp(__pivot, *(__last - difference_type(1)))) {
    // Guarded.
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
  } else {
    while (++__first < __last && !__comp(__pivot, *__first)) {
    }
  }

  if (__first < __last) {
    // It will be always guarded because __introsort will do the
    // median-of-three before calling this.
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return __first;
}
```

:::

## 前提知識

- **比較関数 `__comp(a, b)`**: 「`a < b` か」を返します。`!__comp(__pivot, x)` は「`x <= 軸`」、`__comp(__pivot, x)` は「`x > 軸`」の意味です。標準の分割とは比較の向きが逆になっている点に注目してください。
- **ムーブ（`__iter_move`, `std::move`）**: コピーせずに中身を引っ越しさせる操作です。最初に軸を取り出し、先頭を「穴」にしています。
- **ランダムアクセスイテレータ**: 配列の位置で、`<` で前後を比べたり `- 1` で戻ったりできます。
- **`_LIBCPP_ASSERT_VALID_ELEMENT_ACCESS`**: 安全確認モードのときだけ有効な範囲チェックです。
- **戻り値**: 関数の前のコメントは「軸の位置を返す」と書いていますが、実際に返しているのは `__first`、つまり **軸の 1 つ右** です（軸の位置は `__first - 1` としています）。呼び出し側にとってはこちらが便利です（後述）。

## 何をしているか

例として、左隣（並べ終えた区間の最後の値）が `2` で、この区間が `[2, 3, 2, 7, 2]` だとします。前提により、区間内の値はすべて左隣の `2` 以上です。先頭の `2` が軸です。

### 左から「軸より大きい」を探す

```cpp:line-numbers=661
  if (__comp(__pivot, *(__last - difference_type(1)))) {
    // 番兵あり。
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
  } else {
    while (++__first < __last && !__comp(__pivot, *__first)) {
    }
  }
```

末尾 `2` は軸より大きくないので、番兵がありません。`else` 側の確認付きのループで進みます。`3` で止まります。
末尾が軸より大きければ、それが番兵になるので確認なしで進みます。

### 右から「軸以下」を探す

```cpp:line-numbers=674
  if (__first < __last) {
    // __introsort が呼ぶ前に 3 つの中央値を取るので、
    // 必ず番兵がある。
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
```

末尾の `2` は軸以下なので、そこで止まります。左の走査で通った要素（軸以下）があるので、この走査は範囲チェック不要です（コード中のコメントにもそう書かれています）。

### 入れ替えては走査

```cpp:line-numbers=684
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (!__comp(__pivot, *__first));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (__comp(__pivot, *__last));
  }
```

`3` と末尾の `2` を入れ替えて `[_, 2, 2, 7, 3]`。左は `2` を通り過ぎて `7` で、右は `7` を通り過ぎて `2` で止まり、追い越したので終わりです。

### 軸を置いて、その右を返す

```cpp:line-numbers=699
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return __first;
```

境目 `__first - 1` は 2 番目の `2` の位置です。その値を先頭へ移し、軸を書いて `[2, 2, 2, 7, 3]`。戻り値は `7` の位置です。

## ここがすごい

- **等しい要素を一度で片付ける**: 呼び出し元の `__introsort` は「左端の区間ではなく、左隣の値が軸より小さくない」ことを確かめてからこの関数を呼び、戻り値を新しい `__first` にして続けます。

  @@Q 794-797@@

  つまり軸と等しい要素の塊は、**再帰もせずに並べ終えたことになります**。同じ値が多い配列でも、同じ値を何度も分割し直さずに済みます。
- **前提から「左は全部等しい」が言える**: 区間内のどの値も左隣以上で、左隣と軸が等しいので、「軸以下」に集まった要素は全部軸と等しいはずです。この推論があるから、左側をソートせずに飛ばせます。
- **番兵の有無を 1 回の比較で決める**: 最初の `if` で末尾が軸より大きいかを 1 回調べ、大きければ確認なしの速いループ、そうでなければ確認付きのループを選びます。その後の入れ替えループでは、入れ替えた要素自身が番兵になります。
- **返す情報を絞っている**: 標準の分割と違い「入れ替えなしで済んだか」は返しません。等しい要素の塊を飛ばすのが目的なので、その情報は要らないからです。

## まとめ

- 同じ値が多い入力では、等しい要素をどちら側に集めるかが性能を大きく左右する。
- 「左隣の値と軸が等しい」なら、軸以下の側は全部軸と等しく、並べ直す必要がない。
- 戻り値を「次に処理すべき位置」にすると、呼び出し側はそのままループを続けられる。
- 番兵が保証できる場面とできない場面を見分け、確認付きのループは必要な所だけに置く。
