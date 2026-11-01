---
title: 前にしか進めないイテレータで配列を回転させる
description: std::rotate の汎用版。前へ 1 歩ずつしか進めない入れ物でも、入れ替えだけで「後半を前へ、前半を後ろへ」回転させる。追加のメモリは要らない。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/rotate.h
lines: [59, 86]
function: std::__rotate_forward
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 標準ライブラリ]
---

## ひとことで

`std::rotate(first, middle, last)` は、範囲を「`middle` が先頭に来るように」ぐるっと回す関数です。
`[1, 2, 3, 4, 5]` で `middle` を `3` の位置にすると、`[3, 4, 5, 1, 2]` になります。

`__rotate_forward` はその汎用版で、**前にしか進めないイテレータ**（単方向リストなど）でも動くように、「隣り合う 2 区間の先頭どうしを入れ替えて進む」ことだけで回転を実現します。戻り値は、もとの先頭の要素（例では `1`）が移った位置です。

## コード

```cpp:line-numbers=59
template <class _AlgPolicy, class _ForwardIterator>
_LIBCPP_CONSTEXPR_SINCE_CXX17 _ForwardIterator
__rotate_forward(_ForwardIterator __first, _ForwardIterator __middle, _ForwardIterator __last) {
  _ForwardIterator __i = __middle;
  while (true) {
    _IterOps<_AlgPolicy>::iter_swap(__first, __i);
    ++__first;
    if (++__i == __last)
      break;
    if (__first == __middle)
      __middle = __i;
  }
  _ForwardIterator __r = __first;
  if (__first != __middle) {
    __i = __middle;
    while (true) {
      _IterOps<_AlgPolicy>::iter_swap(__first, __i);
      ++__first;
      if (++__i == __last) {
        if (__first == __middle)
          break;
        __i = __middle;
      } else if (__first == __middle)
        __middle = __i;
    }
  }
  return __r;
}
```

## 前提知識

- **前方イテレータ（forward iterator）**: `++` で前へ進むことしかできないイテレータです。`std::forward_list`（単方向リスト）がその例です。後ろへ戻ったり、一気に何歩も飛んだりはできません。
- **`_IterOps<_AlgPolicy>::iter_swap(a, b)`**: 2 つの位置の値を入れ替えます。`std::rotate` と `std::ranges::rotate` で同じコードを使うための書き方です。
- **`++__i == __last`**: 先に `__i` を進めてから、終わりに着いたかを比べます。
- **`while (true)` と `break`**: `break` で抜けるまで回るループです。
- **値渡しの引数**: `__first` や `__middle` はコピーで受け取っているので、関数の中で動かしても呼び出し元には影響しません。

## 何をしているか

`[1, 2, 3, 4, 5]`、`__middle` は位置 2（値 `3`）とします。前半 `[1, 2]` を A、後半 `[3, 4, 5]` を B と呼びます。

### 1 つ目のループ

```cpp:line-numbers=62
  _ForwardIterator __i = __middle;
  while (true) {
    _IterOps<_AlgPolicy>::iter_swap(__first, __i);
    ++__first;
    if (++__i == __last)
      break;
    if (__first == __middle)
      __middle = __i;
  }
```

`__first` は前半を、`__i` は後半を、それぞれ 1 歩ずつ進みながら入れ替えます。

1. 位置 0 と 2 を入れ替え → `[3, 2, 1, 4, 5]`。`__first` = 1、`__i` = 3。
2. 位置 1 と 3 を入れ替え → `[3, 4, 1, 2, 5]`。`__first` = 2 が `__middle` に追いついたので、`__middle` を `__i` の位置 4 に更新。
3. 位置 2 と 4 を入れ替え → `[3, 4, 5, 2, 1]`。`__first` = 3、`__i` が `__last` に着いたので抜けます。

この時点で先頭 3 つ `[3, 4, 5]` は完成しています。`__first`（位置 3）が、もとの先頭 `1` の最終位置です。戻り値 `__r` として覚えておきます。

```cpp:line-numbers=71
  _ForwardIterator __r = __first;
```

### 2 つ目のループ

```cpp:line-numbers=72
  if (__first != __middle) {
    __i = __middle;
    while (true) {
      _IterOps<_AlgPolicy>::iter_swap(__first, __i);
      ++__first;
      if (++__i == __last) {
        if (__first == __middle)
          break;
        __i = __middle;
      } else if (__first == __middle)
        __middle = __i;
    }
  }
```

残りの `[2, 1]` は、まだ回転が終わっていない小さな問題です。`__middle` は位置 4 なので、「`[2]` と `[1]` を入れ替える」回転になります。

1. 位置 3 と 4 を入れ替え → `[3, 4, 5, 1, 2]`。`__i` が `__last` に着き、`__first` が `__middle` と一致したので終わります。

`__i` が `__last` に着いても `__first` が `__middle` に届いていなければ、`__i` を `__middle` に戻して続けます。これは「残りの部分で、また回転をやり直す」ことに当たります。

## ここがすごい

- **追加のメモリが要らない**: 一時的な配列に前半を退避すれば簡単ですが、要素数に比例したメモリが必要です。この方法は入れ替えだけで回転するので、余分なメモリは要素 1 個ぶん（入れ替えの中）だけです。
- **前に進むだけで済む**: 範囲を何度も先頭からたどり直すことなく、`__first` と `__i` はどちらも前へ進むだけです。後ろへ戻れない単方向リストでも使えます。
- **大きな問題を同じ形の小さな問題に変える**: 短い方の区間ぶん入れ替えると、片方は最終位置に収まり、残りは「もっと小さな回転」になります。2 つ目のループは、その小さな回転を `__middle` の付け替えで繰り返しているだけです。
- **戻り値の場所を途中で確定させる**: 1 つ目のループが終わった時点で、もとの先頭の行き先は決まっています。そこで覚えておけば、最後に計算し直す必要がありません。

## まとめ

- 回転は「A B を B A にする」操作で、入れ替えを繰り返すだけで実現できる。
- 短い区間ぶん入れ替えると、残りは同じ形の小さな回転になる。
- 前にしか進めないイテレータでも、2 本のイテレータを並走させれば多くの操作ができる。
- 戻り値に必要な情報は、確定した時点で保存しておくとよい。
