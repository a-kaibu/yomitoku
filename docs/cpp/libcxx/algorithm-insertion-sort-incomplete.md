---
title: 8 回動かしたら諦める「お試し」挿入ソート
description: クイックソートの途中で「もうほぼ並んでいるのでは」と思ったときに呼ぶ挿入ソート。要素を 8 回差し込んだ時点で打ち切り、並べ終えたかどうかを返す。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [299, 350]
function: std::__insertion_sort_incomplete
difficulty: 2
format: 2
tags: [ソート, アルゴリズム, 最適化]
---

## ひとことで

`__insertion_sort_incomplete` は、**途中で諦めてもよい挿入ソート** です。
範囲を挿入ソートで並べ始めますが、「要素を差し込む」作業が 8 回に達したら打ち切ります。最後まで並べ終えたら `true`、打ち切ったら `false` を返します。

`std::sort` はクイックソートで配列を分けるとき、「1 回も入れ替えずに分割できた」場合に、その両側をこの関数で試します。もともと並んでいる配列なら、ここで一気に終わります。

## コード

```cpp:line-numbers=299
template <class _AlgPolicy, class _Comp, class _RandomAccessIterator>
bool __insertion_sort_incomplete(_RandomAccessIterator __first, _RandomAccessIterator __last, _Comp __comp) {
  using _Ops = _IterOps<_AlgPolicy>;

  typedef typename iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  switch (__last - __first) {
  case 0:
  case 1:
    return true;
  case 2:
    if (__comp(*--__last, *__first))
      _Ops::iter_swap(__first, __last);
    return true;
  case 3:
    std::__sort3<_AlgPolicy, _Comp>(__first, __first + difference_type(1), --__last, __comp);
    return true;
  case 4:
    std::__sort4<_AlgPolicy, _Comp>(
        __first, __first + difference_type(1), __first + difference_type(2), --__last, __comp);
    return true;
  case 5:
    std::__sort5<_AlgPolicy, _Comp>(
        __first,
        __first + difference_type(1),
        __first + difference_type(2),
        __first + difference_type(3),
        --__last,
        __comp);
    return true;
  }
  typedef typename iterator_traits<_RandomAccessIterator>::value_type value_type;
  _RandomAccessIterator __j = __first + difference_type(2);
  std::__sort3<_AlgPolicy, _Comp>(__first, __first + difference_type(1), __j, __comp);
  const unsigned __limit = 8;
  unsigned __count       = 0;
  for (_RandomAccessIterator __i = __j + difference_type(1); __i != __last; ++__i) {
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _RandomAccessIterator __k = __j;
      __j                       = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
      } while (__j != __first && __comp(__t, *--__k));
      *__j = std::move(__t);
      if (++__count == __limit)
        return ++__i == __last;
    }
    __j = __i;
  }
  return true;
}
```

## 前提知識

- **`switch (式) { case 値: ... }`**: 式の値に応じて処理を飛び分ける文です。`case 0:` と `case 1:` を並べると、どちらでも同じ処理になります。
- **ランダムアクセスイテレータ**: 配列の位置を指す値で、`__last - __first` で要素数を、`__first + 2` で 2 つ先の位置を求められます。
- **`--__last`**: `__last` は「最後の要素の 1 つ後ろ」を指すので、1 つ戻すと最後の要素になります。
- **`__sort3` / `__sort4` / `__sort5`**: 同じファイルにある、3〜5 個の要素を専用の手順で並べる関数です。
- **ムーブ（`__iter_move`, `std::move`）**: 値をコピーせず中身を引っ越しさせる操作です。
- **`++__i == __last`**: 先に `__i` を 1 つ進めてから、`__last` と等しいか比べる式です。

## 何をしているか

### 5 要素以下は専用の手順で必ず終わらせる

```cpp:line-numbers=304
  switch (__last - __first) {
  case 0:
  case 1:
    return true;
  case 2:
    if (__comp(*--__last, *__first))
      _Ops::iter_swap(__first, __last);
    return true;
  case 3:
    std::__sort3<_AlgPolicy, _Comp>(__first, __first + difference_type(1), --__last, __comp);
    return true;
  case 4:
    std::__sort4<_AlgPolicy, _Comp>(
        __first, __first + difference_type(1), __first + difference_type(2), --__last, __comp);
    return true;
  case 5:
    std::__sort5<_AlgPolicy, _Comp>(
        __first,
        __first + difference_type(1),
        __first + difference_type(2),
        __first + difference_type(3),
        --__last,
        __comp);
    return true;
  }
```

要素数が 0〜5 のときは、`__sort3` などで確実に並べて `true` を返します。短い範囲を諦める理由はないからです。

### 先頭 3 つを並べて土台にする

```cpp:line-numbers=330
  _RandomAccessIterator __j = __first + difference_type(2);
  std::__sort3<_AlgPolicy, _Comp>(__first, __first + difference_type(1), __j, __comp);
```

6 要素以上なら、まず先頭 3 つを `__sort3` で並べます。`__j` は「並び終わった部分の最後」です。

### 差し込みを数えながら挿入ソート

```cpp:line-numbers=332
  const unsigned __limit = 8;
  unsigned __count       = 0;
  for (_RandomAccessIterator __i = __j + difference_type(1); __i != __last; ++__i) {
    if (__comp(*__i, *__j)) {
      value_type __t(_Ops::__iter_move(__i));
      _RandomAccessIterator __k = __j;
      __j                       = __i;
      do {
        *__j = _Ops::__iter_move(__k);
        __j  = __k;
      } while (__j != __first && __comp(__t, *--__k));
      *__j = std::move(__t);
      if (++__count == __limit)
        return ++__i == __last;
    }
    __j = __i;
  }
```

ここからはふつうの挿入ソートです（要素を 1 つ取り出し、左の大きい値を右へずらして、空いた所に書き戻す）。
違いは、差し込みを 1 回するたびに `__count` を増やし、8（`__limit`）に達したら抜けることです。

```cpp:line-numbers=344
      if (++__count == __limit)
        return ++__i == __last;
```


例 1: `[1, 2, 3, 5, 4, 6, 7, 8, 9, 10]`
`4` の差し込みが 1 回起きるだけなので、最後まで進んで、ループの後の `return true;` に着きます。

例 2: `[20, 19, 18, ..., 1]`（逆順 20 個）
先頭 3 つを並べたあと、`17`、`16`、…と毎回差し込みが起きます。8 回目の差し込みで打ち切り、`false` を返します。配列は途中まで並んだ状態で残りますが、要素が失われることはありません。

### 打ち切ったのが最後の要素なら成功

```cpp:line-numbers=345
        return ++__i == __last;
```

`return ++__i == __last;` は、「8 回目の差し込みが最後の要素だったなら、実は全部並び終わっている」という場合を拾います。打ち切ったからといって、すぐ `false` にしないのが細かいところです。

## ここがすごい

- **賭けに負けても損が小さい**: `__introsort` は、分割が「入れ替えなし」で済んだときだけこの関数を試します。並んでいる配列なら比較だけで素通りでき、クイックソートの再帰を丸ごと省けます。並んでいなければ、8 回差し込んだところで諦めて通常のクイックソートに戻ります。無駄になるのはその 8 回分だけです。
- **上限は「回数」で決める**: 打ち切りを「比較回数」ではなく「差し込み回数」で数えているので、並んでいる部分を素通りするコストは上限に数えられません。ほぼ並んだ長い配列でも、乱れが少なければ最後まで並べ切れます。
- **結果を 2 つの区間で組み合わせる**: 呼び出し側は左右の区間それぞれでこの関数を呼び、両方 `true` なら終了、片方だけなら残った方だけ続けます。部分的に並んだデータにも強くなります。
- **既存の研究を取り入れている**: `__introsort` の冒頭コメントには、この実装が Orson Peters 氏の pdqsort（pattern-defeating quicksort）を一部もとにしていると書かれています。並んだ入力に強いソートは、こうした小さな工夫の積み重ねでできています。

## まとめ

- 「うまくいけば速い」処理は、上限を決めて試し、だめなら元の方法に戻すと安全に使える。
- 挿入ソートは、ほぼ並んだデータに対しては非常に速い。
- 打ち切り条件は、本当に高くつく操作（ここでは要素の移動）で数える。
- 打ち切った瞬間にも「実は終わっていた」場合を拾うと、判定がより正確になる。
