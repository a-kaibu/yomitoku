---
title: 「左に番兵がいる」と信じて境界チェックを消した挿入ソート
description: クイックソートの右側の区間では、左隣に必ず小さい値がある。その性質を使い、挿入ソートの内側ループから「先頭を越えたか」の確認を取り除いた関数。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [267, 297]
function: std::__insertion_sort_unguarded
difficulty: 2
format: 2
tags: [ソート, 最適化, 防御的プログラミング]
---

## ひとことで

`__insertion_sort_unguarded` は、挿入ソートから **「配列の先頭を越えていないか」の確認を消した** 版です。
その代わりに「範囲のすぐ左（`__first - 1`）に、範囲内のどの値以下でもある要素がある」ことを前提にします（関数の前のコメントにそう書かれています）。

左に小さな値が「番兵（見張り役）」として立っているので、ずらしていく途中で必ずそこで止まり、先頭を突き抜けることがありません。

## コード

::: code-group

```cpp:line-numbers=267 [日本語訳]
// イテレータ範囲 [__first, __last) を、比較関数 __comp を使い
// 挿入ソートで並べる。挿入ソートには外側と内側の 2 つのループがある。
// 以下の実装は、内側のループに範囲チェックがない（unguarded）。
// 位置 (__first - 1) に要素があり、入力範囲のどの要素も
// __first - 1 の要素以上であることを前提とする。
template <class _AlgPolicy, class _Compare, class _RandomAccessIterator>
void __insertion_sort_unguarded(_RandomAccessIterator const __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename iterator_traits<_RandomAccessIterator>::value_type value_type;
  if (__first == __last)
    return;
  const _RandomAccessIterator __leftmost = __first - difference_type(1);
  (void)__leftmost; // アサーションが無効なときは使われないことがある
  for (_RandomAccessIterator __i = __first + difference_type(1); __i != __last; ++__i) {
    _RandomAccessIterator __j = __i - difference_type(1);
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _RandomAccessIterator __k = __j;
      __j                       = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
        _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
            __k != __leftmost,
            "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      } while (__comp(__t, *--__k)); // 上に書いた前提があるので範囲チェックは不要。
      *__j = std::move(__t);
    }
  }
}
```

```cpp:line-numbers=267 [原文]
// Sort the iterator range [__first, __last) using the comparator __comp using
// the insertion sort algorithm.  Insertion sort has two loops, outer and inner.
// The implementation below has no bounds check (unguarded) for the inner loop.
// Assumes that there is an element in the position (__first - 1) and that each
// element in the input range is greater or equal to the element at __first - 1.
template <class _AlgPolicy, class _Compare, class _RandomAccessIterator>
void __insertion_sort_unguarded(_RandomAccessIterator const __first, _RandomAccessIterator __last, _Compare __comp) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  typedef typename iterator_traits<_RandomAccessIterator>::value_type value_type;
  if (__first == __last)
    return;
  const _RandomAccessIterator __leftmost = __first - difference_type(1);
  (void)__leftmost; // can be unused when assertions are disabled
  for (_RandomAccessIterator __i = __first + difference_type(1); __i != __last; ++__i) {
    _RandomAccessIterator __j = __i - difference_type(1);
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _RandomAccessIterator __k = __j;
      __j                       = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
        _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
            __k != __leftmost,
            "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      } while (__comp(__t, *--__k)); // No need for bounds check due to the assumption stated above.
      *__j = std::move(__t);
    }
  }
}
```

:::

## 前提知識

- **イテレータの足し引き**: この関数は `_RandomAccessIterator`（ランダムアクセスイテレータ）を受け取ります。ポインタと同じように `__first - 1` や `__i + 1` と書いて、好きな距離だけ一度に動けます。
- **`difference_type(1)`**: イテレータどうしの距離を表す整数型で `1` を作っています。型をきちんと合わせるための書き方です。
- **`const` 引数**: 引数の `_RandomAccessIterator const __first` は、関数の中で `__first` 自体を動かさないという宣言です。
- **`(void)__leftmost;`**: 変数を使ったことにして、「使われていない変数」の警告を消すおまじないです。`__leftmost` は確認用のマクロの中でしか使われず、そのマクロが無効だと誰も使わなくなるためです（その行のコメントにそう書かれています）。
- **`_LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(条件, メッセージ)`**: libc++ の「安全確認モード」が有効なときだけ、条件が偽ならメッセージを出して止まるマクロです。無効なときは何もしません。
- **ムーブ（`__iter_move`, `std::move`）**: 値をコピーせずに中身を引っ越しさせる操作です。

## 何をしているか

### どんな場面で呼ばれるか

`std::sort` はクイックソートで配列を「軸（ピボット）より小さい左側」と「軸以上の右側」に分けます。右側の区間を並べるときは、そのすぐ左に軸があり、**右側のどの値も軸以上** です。これがちょうど前提を満たします。

例として、全体が `[2, 4 | 9, 6, 5]` で、`4` が軸、右側 `[9, 6, 5]` をこの関数で並べるとします。`__leftmost`は `4` の位置です。

### 内側のループ

```cpp:line-numbers=287
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
        _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
            __k != __leftmost,
            "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
      } while (__comp(__t, *--__k)); // 上に書いた前提があるので範囲チェックは不要。
```

`__i` が `5` のとき、`5 < 6` なので取り出して `__t = 5` とし、穴をずらしていきます。

- `6` を右へ。左を見ると `9`。`5 < 9` なので続行。
- `9` を右へ。左を見ると軸の `4`。`5 < 4` は偽なので停止。

穴に `5` を書いて `[5, 6, 9]` です。止まったのは軸のおかげで、**先頭に来たかどうかは一度も調べていません**。

通常版の `__insertion_sort` は、内側のループの最後で 2 つの条件を毎回調べます。

```cpp:line-numbers=261
      } while (__j != __first && __comp(__t, *--__k));
```

こちらは比較 1 つだけです。

```cpp:line-numbers=293
      } while (__comp(__t, *--__k)); // 上に書いた前提があるので範囲チェックは不要。
```


### 安全網

```cpp:line-numbers=290
        _LIBCPP_ASSERT_VALID_ELEMENT_ACCESS(
            __k != __leftmost,
            "Would read out of bounds, does your comparator satisfy the strict-weak ordering requirement?");
```

もし比較関数がおかしく、たとえば `a < a` を真と答えるようなものだと、前提が崩れて先頭を突き抜けてしまいます。
安全確認モードでは、`__k` が `__leftmost` に達した時点で「比較関数が strict weak ordering（正しい大小関係のルール）を満たしているか？」というメッセージで止めます。

## ここがすごい

- **いちばん内側のループから条件を 1 つ消す**: 挿入ソートで最も多く回るのは内側のループです。ここから比較を 1 つ減らすと、その分の命令と分岐が丸ごと減ります。番兵を置いてループの終了判定を減らすのは古典的な手法ですが、ここでは **わざわざ番兵を置かず、クイックソートが自然に作る並びを番兵として再利用** しています。
- **使い分けは呼び出し側が決める**: 配列の一番左の区間には左隣がないので使えません。そこで `__introsort` は「いまの区間が一番左か」を `__leftmost` というフラグで覚えておき、左端なら通常版、それ以外ならこの版を呼びます。
- **速さと安全を両立**: 前提が破れるのは利用者の比較関数が壊れているときだけです。通常は確認を省いて速く、確認モードでは早めに異常を知らせて、配列の外を読む前に止まれます。

## まとめ

- ループの終了判定は、データ側の性質（番兵）で肩代わりさせられることがある。
- クイックソートの右側の区間には、軸という天然の番兵がいる。
- 前提を置いて速くする関数は、前提をコメントに明記し、確認用のアサーションを添えると安全に使える。
- 比較関数が正しい大小関係のルールを守ることは、ソートの安全性そのものに関わる。
