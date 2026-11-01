---
title: 1, 2, 4, 8 歩と飛ばして近くの答えを速く見つける二分探索
description: 片側二分探索（ギャロッピング）。先頭から歩幅を倍々に広げて範囲を見つけてから二分探索するので、答えが近いほど速い。set_intersection で使われる。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/lower_bound.h
lines: [50, 84]
function: std::__lower_bound_onesided
difficulty: 2
format: 2
tags: [探索, アルゴリズム, 最適化]
---

## ひとことで

`__lower_bound_onesided` は、並んだ範囲から「`value` 以上になる最初の位置」を探す関数です。結果は `std::lower_bound` と同じですが、探し方が違います。
先頭から **1 歩、2 歩、4 歩、8 歩…と歩幅を倍にしながら** 進み、`value` を飛び越えたら、最後の区間だけを二分探索します。

答えが先頭の近くにあるほど速く、答えが先頭そのものなら比較 1 回で終わります。

## コード

::: code-group

```cpp:line-numbers=50 [日本語訳]
// 片側二分探索（メタ二分探索とも）は何十年も前から知られた手法で、一般に
// 古典的な方法の \Omega(log(n)) ではなく \Omega(1) で済む利点がある。欠点は、比較が古典的な方法のちょうど log(n) 回に対し
// 最大 2*log(n) 回になること。本領を発揮する場面は 2 つある:
// 1 つ目はランダムアクセスでないイテレータを扱うとき。古典的な方法は最初に
// 入れ物の大きさを知る必要があり、\Omega(n) 回のイテレータの前進が加わるからだ。2 つ目は
// 入れ物を順にたどりながら次の値まで早送りするとき。その場合、古典的な方法は
// \Omega(n*log(n)) 回の比較と、ランダムアクセスでないなら \Omega(n^2) 回のイテレータの前進になるが、
// 片側版はどちらも O(n) 回の操作で済み、比較回数の下限は
// \Omega(log(n)) になる。
template <class _AlgPolicy, class _ForwardIterator, class _Sent, class _Type, class _Comp>
[[__nodiscard__]] _LIBCPP_CONSTEXPR_SINCE_CXX20 _ForwardIterator
__lower_bound_onesided(_ForwardIterator __first, _Sent __last, const _Type& __value, _Comp& __comp) {
  // step = 0 の場合。これで後で距離が 1 のときに必ず近道できる
  if (__first == __last || !std::__invoke(__comp, *__first, __value))
    return __first;

  using _Distance = typename iterator_traits<_ForwardIterator>::difference_type;
  for (_Distance __step = 1; __first != __last; __step <<= 1) {
    auto __it   = __first;
    auto __dist = __step - _IterOps<_AlgPolicy>::__advance_to(__it, __step, __last);
    // 探す値がありうる最後の区間に着いたら、
    // 内側に向かってその区間を二分探索する
    if (__it == __last || !std::__invoke(__comp, *__it, __value)) {
      // 1 つ前の値はもう調べて小さいとわかっているので、
      // 二分探索を省いて比較を 1 回節約できる
      if (__dist == 1)
        return __it;
      __identity __proj;
      return std::__lower_bound_bisecting<_AlgPolicy>(__first, __value, __dist, __comp, __proj);
    }
    // 区間が見つからないので先へ進む！
    __first = __it;
  }
  return __first;
}
```

```cpp:line-numbers=50 [原文]
// One-sided binary search, aka meta binary search, has been in the public domain for decades, and has the general
// advantage of being \Omega(1) rather than the classic algorithm's \Omega(log(n)), with the downside of executing at
// most 2*log(n) comparisons vs the classic algorithm's exact log(n). There are two scenarios in which it really shines:
// the first one is when operating over non-random-access iterators, because the classic algorithm requires knowing the
// container's size upfront, which adds \Omega(n) iterator increments to the complexity. The second one is when you're
// traversing the container in order, trying to fast-forward to the next value: in that case, the classic algorithm
// would yield \Omega(n*log(n)) comparisons and, for non-random-access iterators, \Omega(n^2) iterator increments,
// whereas the one-sided version will yield O(n) operations on both counts, with a \Omega(log(n)) bound on the number of
// comparisons.
template <class _AlgPolicy, class _ForwardIterator, class _Sent, class _Type, class _Comp>
[[__nodiscard__]] _LIBCPP_CONSTEXPR_SINCE_CXX20 _ForwardIterator
__lower_bound_onesided(_ForwardIterator __first, _Sent __last, const _Type& __value, _Comp& __comp) {
  // step = 0, ensuring we can always short-circuit when distance is 1 later on
  if (__first == __last || !std::__invoke(__comp, *__first, __value))
    return __first;

  using _Distance = typename iterator_traits<_ForwardIterator>::difference_type;
  for (_Distance __step = 1; __first != __last; __step <<= 1) {
    auto __it   = __first;
    auto __dist = __step - _IterOps<_AlgPolicy>::__advance_to(__it, __step, __last);
    // once we reach the last range where needle can be we must start
    // looking inwards, bisecting that range
    if (__it == __last || !std::__invoke(__comp, *__it, __value)) {
      // we've already checked the previous value and it was less, we can save
      // one comparison by skipping bisection
      if (__dist == 1)
        return __it;
      __identity __proj;
      return std::__lower_bound_bisecting<_AlgPolicy>(__first, __value, __dist, __comp, __proj);
    }
    // range not found, move forward!
    __first = __it;
  }
  return __first;
}
```

:::

## 前提知識

- **番兵 `_Sent __last`**: 範囲の終わりを表す値です。C++20 からは、終わりがイテレータと別の型でもよくなりました（「ここで終わり」という印だけの型など）。
- **`__step <<= 1`**: `__step` を 1 ビット左にずらす、つまり 2 倍にする書き方です。1, 2, 4, 8, … と増えます。
- **`__advance_to(__it, __step, __last)`**: `__it` を最大 `__step` 歩進めますが、`__last` に着いたらそこで止まります。戻り値は **進めなかった残りの歩数** です。`__step - 残り` で、実際に進んだ距離 `__dist` がわかります。
- **`__identity`**: 値をそのまま返すだけの関数オブジェクトです。射影（比べる前の変換）が要らないときに渡します。
- **Ω（オメガ）と O（オー）**: コメントに出てくる記号で、計算量の下限と上限を表します。`\Omega(1)` は「最もよい場合は一定時間」という意味です。

## 何をしているか

`[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` で `6` を探します。

### 先頭がもう答えなら即終了

```cpp:line-numbers=63
  if (__first == __last || !std::__invoke(__comp, *__first, __value))
    return __first;
```

先頭の `1` は `6` より小さいので続けます。もし先頭が `6` 以上なら、比較 1 回で先頭を返します。

### 歩幅を倍々にして飛ぶ

```cpp:line-numbers=67
  for (_Distance __step = 1; __first != __last; __step <<= 1) {
    auto __it   = __first;
    auto __dist = __step - _IterOps<_AlgPolicy>::__advance_to(__it, __step, __last);
    // 探す値がありうる最後の区間に着いたら、
    // 内側に向かってその区間を二分探索する
    if (__it == __last || !std::__invoke(__comp, *__it, __value)) {
      // 1 つ前の値はもう調べて小さいとわかっているので、
      // 二分探索を省いて比較を 1 回節約できる
      if (__dist == 1)
        return __it;
      __identity __proj;
      return std::__lower_bound_bisecting<_AlgPolicy>(__first, __value, __dist, __comp, __proj);
    }
    // 区間が見つからないので先へ進む！
    __first = __it;
  }
```

| 歩幅 | 着いた所 | 値 | `< 6` か | 次の動き |
| --- | --- | --- | --- | --- |
| 1 | 位置 1 | 2 | はい | `__first` を位置 1 へ |
| 2 | 位置 3 | 4 | はい | `__first` を位置 3 へ |
| 4 | 位置 7 | 8 | いいえ | ここで二分探索へ |

### 最後の区間を二分探索

```cpp:line-numbers=72
    if (__it == __last || !std::__invoke(__comp, *__it, __value)) {
      // 1 つ前の値はもう調べて小さいとわかっているので、
      // 二分探索を省いて比較を 1 回節約できる
      if (__dist == 1)
        return __it;
      __identity __proj;
      return std::__lower_bound_bisecting<_AlgPolicy>(__first, __value, __dist, __comp, __proj);
    }
```

位置 3 の値は `6` より小さく、位置 7 の値は `6` 以上です。答えは「位置 3 より後ろ、位置 7 以前」にあります。
位置 3 から長さ `__dist = 4` の範囲を `__lower_bound_bisecting` で二分探索し、位置 5（値 `6`）を得ます。

`__dist == 1` のときは、1 つ前の値が `value` より小さいことはわかっているので、二分探索するまでもなく `__it` が答えです。

## ここがすごい

- **答えまでの距離に比例して速い**: 答えが先頭から `d` 個先にあるとき、飛ぶ回数も二分探索の回数も `log2(d)` 程度です。範囲全体の長さ `n` には関係しません。コメントにあるとおり、最悪でも比較は `2 log2(n)` 回程度で、ふつうの二分探索（`log2(n)` 回）の約 2 倍で済みます。
- **「順に追いかける」処理で真価を発揮**: `std::set_intersection`（並んだ 2 つの列の共通部分を求める）は、片方の列の次の値まで、もう片方の列を早送りする処理を繰り返します（`set_intersection.h` で `__lower_bound_onesided` を呼んでいます）。ふつうの二分探索で毎回「残り全体」を探すと、全体で `n log n` 回の比較になります。片側二分探索なら、毎回の探索が「前回からの距離」だけで済むので、合計しても `O(n)` に収まります。
- **長さを先に測らなくてよい**: ふつうの二分探索は最初に範囲の長さを知る必要があり、連結リストなどでは長さを測るだけで全体をたどることになります。この関数は進みながら終わりを確かめるので、その手間がありません（関数の前のコメントにもこの利点が書かれています）。
- **既存の部品を再利用**: 最後の絞り込みは `__lower_bound_bisecting` に任せています。歩幅を広げる部分だけを書き足して、新しい探索方法を作っています。

## まとめ

- 片側二分探索は「倍々に飛んで範囲を見つけ、その中を二分探索する」二段構えの探索。
- 答えが近くにあるほど速く、最悪でもふつうの二分探索の 2 倍程度の比較で済む。
- 並んだ列を順に追いかける処理（共通部分、マージなど）では、全体の計算量を下げられる。
- すでにわかっている事実（1 つ前は小さい）を使って、最後の比較を 1 回省いている。
