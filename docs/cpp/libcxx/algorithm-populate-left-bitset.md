---
title: 64 個の比較結果を if なしで 1 つの整数に詰め込む
description: ブロッククイックソートの前半。64 要素を軸と比べた結果を、bool をビットにずらして OR するだけで記録する。分岐がなくベクトル化もしやすい。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [368, 382]
function: std::__populate_left_bitset
difficulty: 2
format: 2
tags: [ビット演算, ソート, 最適化]
---

## ひとことで

`__populate_left_bitset` は、配列の左端から 64 個の要素を軸（ピボット）と比べ、**「軸以上か」を 64 ビットの整数に 1 ビットずつ記録する** 関数です。
たとえば先頭 4 つが `[3, 8, 1, 9]` で軸が `5` なら、軸以上なのは 1 番目と 3 番目なので、下位のビットは `0b1010` になります。

`std::sort` が数値を並べるときの分割処理（ブロッククイックソート）の部品です。記録したビットは、あとで `__swap_bitmap_pos` が入れ替えに使います。

## コード

::: code-group

```cpp:line-numbers=368 [日本語訳]
template <class _Compare,
          class _RandomAccessIterator,
          class _ValueType = typename iterator_traits<_RandomAccessIterator>::value_type>
inline void
__populate_left_bitset(_RandomAccessIterator __first, _Compare __comp, _ValueType& __pivot, uint64_t& __left_bitset) {
  // ベクトル化の余地あり。適切な "-march" フラグを付ければ、次のループは
  // SIMD 命令の並びにコンパイルされる。
  _RandomAccessIterator __iter = __first;
  for (int __j = 0; __j < __detail::__block_size;) {
    bool __comp_result = !__comp(*__iter, __pivot);
    __left_bitset |= (static_cast<uint64_t>(__comp_result) << __j);
    __j++;
    ++__iter;
  }
}
```

```cpp:line-numbers=368 [原文]
template <class _Compare,
          class _RandomAccessIterator,
          class _ValueType = typename iterator_traits<_RandomAccessIterator>::value_type>
inline void
__populate_left_bitset(_RandomAccessIterator __first, _Compare __comp, _ValueType& __pivot, uint64_t& __left_bitset) {
  // Possible vectorization. With a proper "-march" flag, the following loop
  // will be compiled into a set of SIMD instructions.
  _RandomAccessIterator __iter = __first;
  for (int __j = 0; __j < __detail::__block_size;) {
    bool __comp_result = !__comp(*__iter, __pivot);
    __left_bitset |= (static_cast<uint64_t>(__comp_result) << __j);
    __j++;
    ++__iter;
  }
}
```

:::

## 前提知識

- **テンプレートの既定の型引数**: テンプレート引数の `class _ValueType = typename iterator_traits<...>::value_type` は、型を指定しなければ「イテレータが指す要素の型」を使う、という意味です。
- **参照引数 `&`**: `_ValueType& __pivot` と `uint64_t& __left_bitset` は、呼び出し元の変数そのものを受け取ります。軸はコピーせずに読み、ビットセットには直接書き込みます。
- **`bool` から整数への変換**: `static_cast<uint64_t>(true)` は `1`、`false` は `0` になります。`static_cast<型>(値)` は、型を明示して変換する書き方です。
- **`<<`（左シフト）と `|=`（OR 代入）**: `1 << 3` は `0b1000` です。`x |= y` は「`x` のうち `y` で `1` の桁も `1` にする」です。
- **`__detail::__block_size`**: 同じファイルの冒頭で `sizeof(uint64_t) * 8`、つまり 64 と定義された定数です。`sizeof` は型のバイト数を返します。

  @@Q 60-61@@
- **`!__comp(a, b)`**: 比較関数 `__comp(a, b)` は「`a < b` か」なので、その否定は「`a >= b` か」です。

## 何をしているか

軸 `5`、左端からの要素 `[3, 8, 1, 9, ...]`、`__left_bitset = 0` から始めます（呼び出し元は空のときだけこの関数を呼びます）。

### 1 要素ずつ、比較結果をビットにする

```cpp:line-numbers=376
  for (int __j = 0; __j < __detail::__block_size;) {
    bool __comp_result = !__comp(*__iter, __pivot);
    __left_bitset |= (static_cast<uint64_t>(__comp_result) << __j);
    __j++;
    ++__iter;
  }
```

| `__j` | 要素 | `!(要素 < 5)` | ビット | `__left_bitset` |
| --- | --- | --- | --- | --- |
| 0 | 3 | false | `0 << 0` | `0b0000` |
| 1 | 8 | true | `1 << 1` | `0b0010` |
| 2 | 1 | false | `0 << 2` | `0b0010` |
| 3 | 9 | true | `1 << 3` | `0b1010` |

これを 64 回繰り返すと、64 要素ぶんの「右へ行くべきか」が 1 つの整数にそろいます。

### 右側の版との違い

すぐ下の `__populate_right_bitset`は、右端から左へ進みながら「軸より小さいか（左へ行くべきか）」を記録します。左右で記録する条件が逆なのは、それぞれ「間違った側にいる要素」を探しているからです。

## ここがすごい

- **比較結果で分岐しない**: ふつうの分割は「軸以上なら止まる」と、比較のたびに行き先が変わります。入力がランダムだと、CPU の分岐予測はよく外れます。この関数は比較結果を「0 か 1 の数値」として足し込むだけなので、ループの流れは入力に関係なく常に 64 回です。
- **ベクトル化の余地がある**: ループの前のコメントにあるとおり、適切な `-march`（対象 CPU を指定するコンパイラのオプション）を付ければ、このループは SIMD 命令（1 命令で複数の値を同時に処理する命令）にまとめられる可能性があります。64 回のループに依存関係がほとんどないためです。
- **記録と入れ替えを分ける**: 比較を先に 64 回まとめて行い、入れ替えはあとでビットを見ながら行います。仕事を種類ごとにまとめると、それぞれを分岐の少ない形で書けます。
- **使う場面は限定**: この方式は比較が軽い数値型で、かつ比較が `<` か `>` のときだけ使われます（`__sort_dispatch` が `__use_branchless_sort` で判定）。比較が重い型では、64 回まとめて比較する利点が薄れるためです。

## まとめ

- `bool` を整数に変換してシフトし OR すれば、if なしで真偽値をビット列に記録できる。
- 64 個の真偽値は 1 つの 64 ビット整数に収まり、まとめて扱える。
- 予測しにくい分岐は、「比較結果を数値として使う」ことで消せる場合が多い。
- 処理を「まとめて比較」「まとめて入れ替え」に分けると、それぞれを単純で速いループにできる。
