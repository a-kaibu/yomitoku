---
title: 番兵がいなければ、まず番兵を探してくる
description: nth_element の分割で、下向きの走査を止めてくれる要素（番兵）が保証されないときに、確認付きで 1 回だけ番兵を探す小さな関数。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/nth_element.h
lines: [31, 43]
function: std::__nth_element_find_guard
difficulty: 2
format: 2
tags: [アルゴリズム, 防御的プログラミング, 最適化]
---

## ひとことで

`__nth_element_find_guard` は、`std::nth_element`（配列の n 番目に小さい値を、その位置に持ってくる関数）の内部で使われる小さな関数です。
仕事は、配列の右から左へ `__j` を動かして、**軸（ピボット）より小さい要素を 1 つ見つけること** です。見つかれば `true`、`__i` にぶつかるまで見つからなければ `false` を返します。

見つけた要素は、そのあとの分割で「ループを必ず止めてくれる見張り役」、つまり **番兵（ガード）** として使われます。

## コード

::: code-group

```cpp:line-numbers=31 [日本語訳]
template <class _Compare, class _RandomAccessIterator>
_LIBCPP_CONSTEXPR_SINCE_CXX14 bool __nth_element_find_guard(
    _RandomAccessIterator& __i, _RandomAccessIterator& __j, _RandomAccessIterator __m, _Compare __comp) {
  // 下へ動く __j が __i を越えないよう手作業で見張る
  while (true) {
    if (__i == --__j) {
      return false;
    }
    if (__comp(*__j, *__m)) {
      return true; // 下へ動く __j の番兵が見つかった。以後は範囲チェックなしの分割を使う
    }
  }
}
```

```cpp:line-numbers=31 [原文]
template <class _Compare, class _RandomAccessIterator>
_LIBCPP_CONSTEXPR_SINCE_CXX14 bool __nth_element_find_guard(
    _RandomAccessIterator& __i, _RandomAccessIterator& __j, _RandomAccessIterator __m, _Compare __comp) {
  // manually guard downward moving __j against __i
  while (true) {
    if (__i == --__j) {
      return false;
    }
    if (__comp(*__j, *__m)) {
      return true; // found guard for downward moving __j, now use unguarded partition
    }
  }
}
```

:::

## 前提知識

- **`std::nth_element`**: 配列を全部並べずに、「並べたら n 番目に来る値」をちょうど n 番目の位置に置く関数です。その左にはそれ以下、右にはそれ以上の値が集まります。中身はクイックソートと同じ「分割」を、n 番目を含む側だけで繰り返すものです。
- **参照引数 `&`**: `__i` と `__j` は参照で受け取っているので、関数の中で `--__j` すると呼び出し元の `__j` も動きます。見つけた位置をそのまま呼び出し元に渡せます。
- **イテレータ**: 配列の位置を指す値です。`*__j` でその位置の値を読みます。`--__j` は 1 つ左へ動かしてから、その位置を使うという意味です。
- **比較関数 `__comp(a, b)`**: 「`a < b` か」を返します。
- **`while (true)`**: 中の `return` で抜けるまで回り続けるループです。

## 何をしているか

### 呼ばれる場面

呼び出し元の `__nth_element` は、先頭・真ん中・末尾の 3 つを `__sort3` で並べ、真ん中 `*__m` を軸にします。すると「先頭 ≦ 軸 ≦ 末尾」が成り立ちます。

```cpp:line-numbers=78
    _RandomAccessIterator __m   = __first + __len / 2;
    _RandomAccessIterator __lm1 = __last;
    unsigned __n_swaps          = std::__sort3<_AlgPolicy, _Compare>(__first, __m, --__lm1, __comp);
```

分割では、左から右へ進む `__i` が「軸以上」で止まり、右から左へ進む `__j` が「軸未満」で止まります。

- `__i` は、末尾が軸以上なので必ず止まります（番兵あり）。
- `__j` は、先頭が軸より **小さければ** そこで必ず止まります。ところが先頭が軸と **等しい** 場合は、止まる保証がありません。

先頭と軸が等しいとわかったときだけ、この関数が呼ばれます。見つかったら、その要素を先頭と入れ替えます。

```cpp:line-numbers=89
    if (!__comp(*__i, *__m)) // if *__first == *__m
    {
      // *__first == *__m, *__first doesn't go in first part
      if (std::__nth_element_find_guard<_Compare>(__i, __j, __m, __comp)) {
        _Ops::iter_swap(__i, __j);
        ++__n_swaps;
      } else {
```

### 確認しながら左へ

```cpp:line-numbers=35
  while (true) {
    if (__i == --__j) {
      return false;
    }
    if (__comp(*__j, *__m)) {
      return true; // 下へ動く __j の番兵が見つかった。以後は範囲チェックなしの分割を使う
    }
  }
```

例: 配列 `[4, 7, 9, 2, 4, 6, 5, 8]`（8 要素）とします。この処理に来るのは要素が 8 個以上のときです（7 個以下は選択ソートに回されます）。
真ん中は位置 4 の `4` で、先頭 `4`・真ん中 `4`・末尾 `8` はすでに並んでいるので、`__sort3` は何も動かしません。先頭と軸が等しいので、この関数が呼ばれます。`__i` は先頭、`__j` は末尾の `8` を指しています。

- `--__j` で `5`。`5 < 4` ではない。
- `--__j` で `6`。違う。
- `--__j` で `4`（軸そのもの）。`4 < 4` ではない。
- `--__j` で `2`。`2 < 4` なので `true` を返す。

呼び出し元は `_Ops::iter_swap(__i, __j)` で `__i`（先頭の `4`）と `__j`（`2`）を入れ替え、`[2, 7, 9, 4, 4, 6, 5, 8]` になります。先頭に軸より小さい番兵が立ったので、以後の分割では `__j` の範囲チェックが不要になります。

### 見つからない場合

```cpp:line-numbers=36
    if (__i == --__j) {
      return false;
```

`[4, 7, 9, 5, 4, 6, 5, 8]` のように軸より小さい要素が 1 つもないと、`__j` は `__i` にぶつかって `false` を返します。
このとき「先頭（＝軸と等しい値）がいちばん小さい」とわかるので、呼び出し元は `else` 側で「軸と等しいもの」と「軸より大きいもの」に分ける別の分割に切り替えます。

## ここがすごい

- **確認付きのループは 1 回だけ**: 範囲チェックが必要なのは「番兵がまだ見つかっていない間」だけです。この関数で 1 回だけ確認しながら探し、見つけたら入れ替えで番兵を左端に立てます。そのあとの何度も回る分割ループは、確認なしで走れます。
- **見つからなかったことも情報になる**: `false` は失敗ではなく「軸より小さい要素は存在しない」という事実です。呼び出し元はこれを使って、等しい要素が多い入力向けの分割に切り替えます。
- **小さく切り出して名前を付ける**: 呼び出し元の `__nth_element` は 150 行を超える長い関数です。「番兵を探す」という目的のはっきりした部分を別関数にして名前を付けることで、本体の流れが読みやすくなっています。

## まとめ

- 番兵が保証されないなら、確認付きのループで 1 回だけ探し、見つけたら決まった位置に置けばよい。
- 「見つからない」という結果も、次の処理を選ぶための情報として使える。
- 参照引数を使うと、探した位置を呼び出し元にそのまま渡せる。
- 長いアルゴリズムは、目的の明確な小さな関数に切り出すと読みやすくなる。
