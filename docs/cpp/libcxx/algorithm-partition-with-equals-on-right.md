---
title: 番兵を信じて境界チェックを省くクイックソートの分割
description: std::sort の標準の分割処理。軸を取り出して穴を作り、左右から走査して入れ替える。3 つの中央値で置いた番兵のおかげで、内側のループに範囲チェックがない。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [578, 647]
function: std::__partition_with_equals_on_right
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`__partition_with_equals_on_right` は、クイックソートの心臓部である **分割** を行う関数です。
先頭に置かれた軸（ピボット）を基準に、軸より小さい要素を左へ、軸以上の要素を右へ集め、最後に軸を境目に置きます。軸と等しい要素は右側に入ります（関数名の由来）。

戻り値は「軸の最終位置」と「1 回も入れ替えずに済んだか」の 2 つです。後者は、すでに並んだ入力を見抜くのに使われます。

## コード

::: code-group

```cpp:line-numbers=578 [日本語訳]
// [__first, __last) を比較関数 __comp で分割する。*__first には選んだ軸がある。
// 軸と等しい要素は軸の右に置く。
// 軸を指すイテレータと、範囲がもともと並んでいたなら真、
// そうでなければ偽になる bool を返す。範囲の長さは
// 3 要素以上であると仮定する。
template <class _AlgPolicy, class _RandomAccessIterator, class _Compare>
std::pair<_RandomAccessIterator, bool>
__partition_with_equals_on_right(_RandomAccessIterator __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename std::iterator_traits<_RandomAccessIterator>::value_type value_type;
  _LIBCPP_ASSERT_INTERNAL(__last - __first >= difference_type(3), "");
  const _RandomAccessIterator __begin = __first; // 範囲チェック用。これらは動かさない
  const _RandomAccessIterator __end   = __last;
  (void)__end; //
  value_type __pivot(_Ops::__iter_move(__first));
  // 軸以上の最初の要素を探す。__introsort が呼ぶ前に
  // 3 つの中央値を取るので、
  // 必ず番兵がある。
  do {
    ++__first;
    _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
        __first != __end,
        "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
  } while (__comp(*__first, __pivot));

  // 軸より小さい最後の要素を探す。
  if (__begin == __first - difference_type(1)) {
    while (__first < __last && !__comp(*--__last, __pivot))
      ;
  } else {
    // 番兵あり。
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }

  // 軸以上の最初の要素が、軸より小さい最後の要素と同じ位置かそれより後ろなら、
  // 要素を入れ替えずに範囲全体を見終えたことになる。
  // つまり範囲はもう分割済みである。
  bool __already_partitioned = __first >= __last;
  // 残りの要素を調べる。軸の正しい側にいない要素の組
  // （一方は軸の右、もう一方は軸の左にいるもの）を
  // 入れ替えていく。
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (__comp(*__first, __pivot));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }
  // 軸を正しい位置に動かす。
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return std::make_pair(__pivot_pos, __already_partitioned);
}
```

```cpp:line-numbers=578 [原文]
// Partition [__first, __last) using the comparator __comp.  *__first has the
// chosen pivot.  Elements that are equivalent are kept to the right of the
// pivot.  Returns the iterator for the pivot and a bool value which is true if
// the provided range is already sorted, false otherwise.  We assume that the
// length of the range is at least three elements.
template <class _AlgPolicy, class _RandomAccessIterator, class _Compare>
std::pair<_RandomAccessIterator, bool>
__partition_with_equals_on_right(_RandomAccessIterator __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename std::iterator_traits<_RandomAccessIterator>::value_type value_type;
  _LIBCPP_ASSERT_INTERNAL(__last - __first >= difference_type(3), "");
  const _RandomAccessIterator __begin = __first; // used for bounds checking, those are not moved around
  const _RandomAccessIterator __end   = __last;
  (void)__end; //
  value_type __pivot(_Ops::__iter_move(__first));
  // Find the first element greater or equal to the pivot.  It will be always
  // guarded because __introsort will do the median-of-three before calling
  // this.
  do {
    ++__first;
    _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
        __first != __end,
        "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
  } while (__comp(*__first, __pivot));

  // Find the last element less than the pivot.
  if (__begin == __first - difference_type(1)) {
    while (__first < __last && !__comp(*--__last, __pivot))
      ;
  } else {
    // Guarded.
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }

  // If the first element greater than or equal to the pivot is at or after the
  // last element less than the pivot, then we have covered the entire range
  // without swapping elements.  This implies the range is already partitioned.
  bool __already_partitioned = __first >= __last;
  // Go through the remaining elements.  Swap pairs of elements (one to the
  // right of the pivot and the other to left of the pivot) that are not on the
  // correct side of the pivot.
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (__comp(*__first, __pivot));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }
  // Move the pivot to its correct position.
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return std::make_pair(__pivot_pos, __already_partitioned);
}
```

:::

## 前提知識

- **`std::pair<A, B>`**: 2 つの値をひとまとめにする型です。`std::make_pair(x, y)` で作ります。
- **ランダムアクセスイテレータ**: 配列の位置を指す値で、`<` や `>=` で前後を比べたり、`- 1` で 1 つ戻ったりできます。
- **ムーブ（`__iter_move`, `std::move`）**: 値をコピーせず中身を引っ越しさせる操作です。最初に軸を取り出すと、先頭は「穴」になります。
- **`_LIBCPP_ASSERT_VALID_ELEMENT_ACCESS`**: libc++ の安全確認モードのときだけ有効になる確認です。範囲の外を読もうとしたら止めます。
- **`(void)__end;`**: 確認マクロが無効のとき「使われていない変数」の警告が出ないようにするおまじないです。
- **`while (...) ;`**: 本体が空のループです。条件の中で `--__last` などの仕事をしています。

## 何をしているか

呼ぶ前に `__introsort` が「3 つの中央値」を先頭に置いています。このとき末尾の要素は軸以上になります。例として `[5, 3, 8, 1, 9, 2, 7]`、軸は `5` とします。

### 軸を取り出す

```cpp:line-numbers=593
  value_type __pivot(_Ops::__iter_move(__first));
```

`__pivot = 5`。先頭は穴になります。

### 左から「軸以上」を探す

```cpp:line-numbers=597
  do {
    ++__first;
    _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
        __first != __end,
        "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
  } while (__comp(*__first, __pivot));
```

`3` は軸より小さいので進み、`8` で止まります。範囲チェックがないのは、**末尾に軸以上の要素があるので必ずどこかで止まる** からです。

### 右から「軸未満」を探す

```cpp:line-numbers=604
  // 軸より小さい最後の要素を探す。
  if (__begin == __first - difference_type(1)) {
    while (__first < __last && !__comp(*--__last, __pivot))
      ;
  } else {
    // 番兵あり。
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }
```

`7` は軸以上なので進み、`2` で止まります。
左の走査で 1 歩目から止まった場合（`__begin == __first - difference_type(1)`、つまり軸のすぐ右がもう軸以上）は、左側に軸未満の要素が 1 つもないかもしれません。そのときだけ `__first < __last` を確かめながら進みます。そうでなければ、左の走査で通り過ぎた要素（軸未満）が番兵になるので確認は不要です。

### 入れ替えなしで済んだかを記録

```cpp:line-numbers=621
  bool __already_partitioned = __first >= __last;
```

左の止まり位置が右の止まり位置以上なら、もう分かれています。例では `8`（位置 2）と `2`（位置 5）なので、まだです。

### 入れ替えては走査

```cpp:line-numbers=625
  while (__first < __last) {
    _Ops::iter_swap(__first, __last);
    do {
      ++__first;
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __first != __end,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
    } while (__comp(*__first, __pivot));
    do {
      _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
          __last != __begin,
          "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      --__last;
    } while (!__comp(*__last, __pivot));
  }
```

`8` と `2` を入れ替えて `[_, 3, 2, 1, 9, 8, 7]`。左は `1` を通り過ぎて `9` で、右は `9` を通り過ぎて `1` で止まります。左が右を追い越したので終わりです。
1 回入れ替えたあとは、入れ替えた要素自身が左右の番兵になるので、ここでも範囲チェックは要りません。

### 軸を境目に置く

```cpp:line-numbers=640
  // 軸を正しい位置に動かす。
  _RandomAccessIterator __pivot_pos = __first - difference_type(1);
  if (__begin != __pivot_pos) {
    *__begin = _Ops::__iter_move(__pivot_pos);
  }
  *__pivot_pos = std::move(__pivot);
  return std::make_pair(__pivot_pos, __already_partitioned);
```

境目は `__first - 1`、つまり `1` の位置です。その `1` を先頭の穴に移し、空いた所に軸を書きます。
結果は `[1, 3, 2, 5, 9, 8, 7]` で、軸 `5` の左は全部小さく、右は全部 `5` 以上です。

## ここがすごい

- **内側のループは比較 1 つだけ**: 素直に書くと「範囲内か」と「軸と比べてどうか」の 2 つを毎回調べます。この関数は番兵の存在を論理的に保証し、ほとんどのループから範囲チェックを消しています。番兵がいない可能性があるのは、右からの最初の走査の `if` 側 1 か所だけで、そこだけ確認を残しています。
- **軸を「穴」として持ち歩く**: 軸を最初に取り出しておき、最後に 1 回だけ書き戻します。分割の途中で軸自体を何度も動かす必要がありません。
- **ついでに「並んでいたか」がわかる**: `__already_partitioned` は、追加の比較なしで得られる情報です。`__introsort` はこれが真のとき、`__insertion_sort_incomplete` で「もう並んでいるかも」と試し、並んだ入力をほぼ線形の時間で片付けます。
- **壊れた比較関数への備え**: 番兵を信じるのは、比較関数が正しい大小関係のルールを守る場合だけです。安全確認モードでは、範囲の外に出そうになった時点で「比較関数は strict weak ordering を満たしていますか」と知らせて止まります。

## まとめ

- クイックソートの分割は「左から大きいもの、右から小さいものを探して入れ替える」の繰り返し。
- 番兵（必ずループを止める要素）を用意すると、内側のループから範囲チェックを消せる。
- 軸を取り出して穴にしておくと、書き込みの回数を減らせる。
- 分割の副産物として「入れ替えが要らなかった」ことを返すと、呼び出し側が賢く振る舞える。
