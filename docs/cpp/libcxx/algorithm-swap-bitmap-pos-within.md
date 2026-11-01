---
title: 相手がいない残りの要素を、上位ビットから順に端へ寄せる
description: ブロッククイックソートの後始末。片側だけに残った「間違った側の要素」を、最上位の立っているビットから順に区間の端と入れ替えて片付ける。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [450, 481]
function: std::__swap_bitmap_pos_within
difficulty: 3
format: 2
tags: [ビット演算, ソート, アルゴリズム]
---

## ひとことで

`__swap_bitmap_pos_within` は、ブロッククイックソートの分割の **最後の後始末** をする関数です。
ふだんは「左の間違った要素」と「右の間違った要素」を 1 組ずつ入れ替えますが、最後には片側だけに間違った要素が残ることがあります。入れ替える相手がいないので、この関数は **同じブロックの中で、間違った要素を端へ寄せて** 片付けます。

たとえば左のブロック `[a, B, c, D]`（大文字が軸以上で、右へ行くべき要素）を `[a, c, B, D]` に並べ替え、境目を `B` の位置に置きます。

## コード

::: code-group

```cpp:line-numbers=450 [日本語訳]
template <class _AlgPolicy, class _RandomAccessIterator>
inline void __swap_bitmap_pos_within(
    _RandomAccessIterator& __first, _RandomAccessIterator& __lm1, uint64_t& __left_bitset, uint64_t& __right_bitset) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename std::iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  if (__left_bitset) {
    // 左側の中で入れ替える。立っているビットの位置を
    // 逆順に探す必要がある。
    while (__left_bitset != 0) {
      difference_type __tz_left = __detail::__block_size - 1 - std::__countl_zero(__left_bitset);
      __left_bitset &= (static_cast<uint64_t>(1) << __tz_left) - 1;
      _RandomAccessIterator __it = __first + __tz_left;
      if (__it != __lm1) {
        _Ops::iter_swap(__it, __lm1);
      }
      --__lm1;
    }
    __first = __lm1 + difference_type(1);
  } else if (__right_bitset) {
    // 右側の中で入れ替える。立っているビットの位置を
    // 逆順に探す必要がある。
    while (__right_bitset != 0) {
      difference_type __tz_right = __detail::__block_size - 1 - std::__countl_zero(__right_bitset);
      __right_bitset &= (static_cast<uint64_t>(1) << __tz_right) - 1;
      _RandomAccessIterator __it = __lm1 - __tz_right;
      if (__it != __first) {
        _Ops::iter_swap(__it, __first);
      }
      ++__first;
    }
  }
}
```

```cpp:line-numbers=450 [原文]
template <class _AlgPolicy, class _RandomAccessIterator>
inline void __swap_bitmap_pos_within(
    _RandomAccessIterator& __first, _RandomAccessIterator& __lm1, uint64_t& __left_bitset, uint64_t& __right_bitset) {
  using _Ops = _IterOps<_AlgPolicy>;
  typedef typename std::iterator_traits<_RandomAccessIterator>::difference_type difference_type;
  if (__left_bitset) {
    // Swap within the left side.  Need to find set positions in the reverse
    // order.
    while (__left_bitset != 0) {
      difference_type __tz_left = __detail::__block_size - 1 - std::__countl_zero(__left_bitset);
      __left_bitset &= (static_cast<uint64_t>(1) << __tz_left) - 1;
      _RandomAccessIterator __it = __first + __tz_left;
      if (__it != __lm1) {
        _Ops::iter_swap(__it, __lm1);
      }
      --__lm1;
    }
    __first = __lm1 + difference_type(1);
  } else if (__right_bitset) {
    // Swap within the right side.  Need to find set positions in the reverse
    // order.
    while (__right_bitset != 0) {
      difference_type __tz_right = __detail::__block_size - 1 - std::__countl_zero(__right_bitset);
      __right_bitset &= (static_cast<uint64_t>(1) << __tz_right) - 1;
      _RandomAccessIterator __it = __lm1 - __tz_right;
      if (__it != __first) {
        _Ops::iter_swap(__it, __first);
      }
      ++__first;
    }
  }
}
```

:::

## 前提知識

- **参照引数 `&`**: `__first` や `__lm1` を参照で受け取っているので、関数の中で動かすと呼び出し元の変数も動きます。この関数は「分割の境目がどこになったか」をこの 2 つで返します。
- **`__lm1`**: 「last minus 1」の略で、範囲の **最後の要素そのもの** を指します（`__last` が最後の 1 つ後ろなのと区別しています）。
- **ビットセット**: 64 ビットの整数を 64 個の真偽値として使います。`__left_bitset` のビット `j` は「`__first + j` の要素は右へ行くべき」、`__right_bitset` のビット `j` は「`__lm1 - j` の要素は左へ行くべき」という意味です。
- **`std::__countl_zero(x)`**: 左端（最上位）から続く `0` の個数です。`63 - __countl_zero(x)` で **いちばん上にある `1` の位置** がわかります。
- **`x &= (1 << t) - 1`**: `(1 << t) - 1` は下位 `t` ビットだけが `1` の値です。これと AND すると、位置 `t` 以上のビットがすべて消えます。

## 何をしているか

呼ばれる時点で、片方のビットセットは必ず空です（直前の処理がそうなるまで入れ替えを続けるため）。また、残ったブロックがちょうど `[__first, __lm1]` の範囲全体になっています。

### 左に残った場合

```cpp:line-numbers=455
  if (__left_bitset) {
    // 左側の中で入れ替える。立っているビットの位置を
    // 逆順に探す必要がある。
    while (__left_bitset != 0) {
      difference_type __tz_left = __detail::__block_size - 1 - std::__countl_zero(__left_bitset);
      __left_bitset &= (static_cast<uint64_t>(1) << __tz_left) - 1;
      _RandomAccessIterator __it = __first + __tz_left;
      if (__it != __lm1) {
        _Ops::iter_swap(__it, __lm1);
      }
      --__lm1;
    }
    __first = __lm1 + difference_type(1);
```

4 要素の例 `[a, B, c, D]`、`__left_bitset = 0b1010`（ビット 1 と 3）、`__lm1` は位置 3 とします。

1 回目:
- `__tz_left` の計算: 最上位の `1` は位置 3。
- `__left_bitset &= ...`: ビット 3 以上を消して `0b0010`。
- 位置 3 は `__lm1` と同じなので入れ替えは不要。`__lm1` を位置 2 へ。

2 回目:
- 最上位の `1` は位置 1。ビットは `0` に。
- 位置 1 と `__lm1`（位置 2）を入れ替え → `[a, c, B, D]`。`__lm1` を位置 1 へ。

ループを抜け、`__first = __lm1 + difference_type(1);` でつまり位置 2 になります。ここから右が「軸以上」の側です。

### 右に残った場合

```cpp:line-numbers=468
  } else if (__right_bitset) {
    // 右側の中で入れ替える。立っているビットの位置を
    // 逆順に探す必要がある。
    while (__right_bitset != 0) {
      difference_type __tz_right = __detail::__block_size - 1 - std::__countl_zero(__right_bitset);
      __right_bitset &= (static_cast<uint64_t>(1) << __tz_right) - 1;
      _RandomAccessIterator __it = __lm1 - __tz_right;
      if (__it != __first) {
        _Ops::iter_swap(__it, __first);
      }
      ++__first;
    }
  }
```

左右が逆になるだけです。右のブロックで「左へ行くべき要素」を、最上位ビット（左端に近い方）から順に `__first` と入れ替え、`__first` を右へ進めます。

### なぜ上位ビットから処理するのか

`__lm1` と入れ替えて持ってくる要素は、**正しい側の要素でなければなりません**。
上位ビットから順に処理すると、いま見ている位置より右にあった「間違った要素」はすでに `__lm1` より右へ送られています。なので `__lm1` にあるのは必ず正しい側の要素で、入れ替えても新しい間違いは生まれません。
下位ビットから処理すると、右端にまだ残っている間違った要素を持ってきてしまうことがあります。

## ここがすごい

- **追加のメモリなしで片付く**: 相手がいない要素を一時的な配列に退避したりせず、ブロックの中だけで入れ替えて終わります。
- **ビット演算で「次の位置」を一発で求める**: 最上位ビットの位置を `__countl_zero` で求め、`(1 << t) - 1` のマスクで消すので、64 個の候補を 1 つずつ調べる必要がありません。`__countl_zero` には多くの CPU に専用命令があります。
- **自分自身との入れ替えを避ける**: `if (__it != __lm1)` と `if (__it != __first)` で、同じ位置どうしの入れ替えを省いています。要素の型によっては、自分自身とのムーブは無駄なうえ注意が要る操作です。

## まとめ

- 「組にして入れ替える」処理には、相手がいない残りを片付ける後始末が必ず要る。
- 端へ寄せる処理は、端に近い側（上位ビット）から行うと、持ってくる要素が正しい側であることが保証される。
- `63 - countl_zero(x)` で最上位ビットの位置、`x &= (1 << t) - 1` でそのビット以上を消せる。
- 参照引数で境目を返すと、呼び出し元はそのまま次の処理に進める。
