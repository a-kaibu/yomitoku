---
title: 短い方の塊をまるごと入れ替えて配列を回転させる
description: 配列向けの std::rotate。左右の区間のうち短い方と同じ長さの塊を swap_ranges で入れ替え、残りの小さな回転を繰り返す。ユークリッドの互除法と同じ形をしている。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/rotate.h
lines: [88, 113]
function: std::__rotate_random_access
difficulty: 2
format: 2
tags: [アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

`__rotate_random_access` は、配列のように好きな位置へ一気に飛べる入れ物向けの `std::rotate` です。
`[1, 2 | 3, 4, 5, 6, 7]`（`|` が `middle`）を `[3, 4, 5, 6, 7, 1, 2]` にします。

やり方は、**左右の区間のうち短い方と同じ長さの塊を、まるごと入れ替える** ことの繰り返しです。入れ替えるたびに一部が最終位置に収まり、残りがもっと小さな回転になります。

## コード

```cpp:line-numbers=88
template <class _AlgPolicy, class _Iter, class _Sent>
_LIBCPP_CONSTEXPR_SINCE_CXX17 _Iter __rotate_random_access(_Iter __first, _Iter __middle, _Sent __sent) {
  auto __left  = _IterOps<_AlgPolicy>::distance(__first, __middle);
  auto __right = _IterOps<_AlgPolicy>::distance(__middle, __sent);
  auto __last  = __first + __right;

  auto __min_len = std::min(__left, __right);

  while (__min_len > 0) {
    if (__left <= __right) {
      do {
        std::__swap_ranges<_AlgPolicy>(__first, __first + __left, __first + __left);
        __first += __left;
        __right -= __left;
      } while (__left <= __right);
      __min_len = __right;
    } else {
      do {
        std::__swap_ranges<_AlgPolicy>(__first + (__left - __right), __first + __left, __first + __left);
        __left -= __right;
      } while (__left > __right);
      __min_len = __left;
    }
  }
  return __last;
}
```

## 前提知識

- **ランダムアクセスイテレータ**: ポインタのように `__first + 3` で 3 つ先へ一気に飛べるイテレータです。`std::vector` や配列のイテレータがこれに当たります。
- **`std::__swap_ranges(a, b, c)`**: 範囲 `[a, b)` と、`c` から始まる同じ長さの範囲を、要素ごとに入れ替えます。
- **`auto`**: 変数の型をコンパイラに推論させます。ここではイテレータどうしの距離（整数）です。
- **`_Sent __sent`**: 範囲の終わりを表す値（番兵）です。イテレータと別の型でもかまいません。
- **`do { ... } while (条件);`**: 本体を 1 回実行してから条件を調べるループです。

## 何をしているか

`[1, 2 | 3, 4, 5, 6, 7]` で追います。左の長さ `__left = 2`、右の長さ `__right = 5` です。

### 戻り値を先に計算

```cpp:line-numbers=90
  auto __left  = _IterOps<_AlgPolicy>::distance(__first, __middle);
  auto __right = _IterOps<_AlgPolicy>::distance(__middle, __sent);
  auto __last  = __first + __right;
```

回転後、もとの先頭 `1` が来る位置は「先頭 + 右の長さ」= 位置 5 です。これを `__last` として先に求めておきます。

### 左が短いとき

```cpp:line-numbers=97
    if (__left <= __right) {
      do {
        std::__swap_ranges<_AlgPolicy>(__first, __first + __left, __first + __left);
        __first += __left;
        __right -= __left;
      } while (__left <= __right);
      __min_len = __right;
```

左の塊 `[1, 2]` を、そのすぐ右の同じ長さの塊と入れ替えます。

1. `[1, 2]` と `[3, 4]` を入れ替え → `[3, 4, 1, 2, 5, 6, 7]`。`[3, 4]` は最終位置です。`__first` を 2 進め、`__right = 3`。
2. `[1, 2]` と `[5, 6]` を入れ替え → `[3, 4, 5, 6, 1, 2, 7]`。`__first` は位置 4、`__right = 1`。

今度は左（2）が右（1）より長くなったのでループを抜けます。

### 右が短いとき

```cpp:line-numbers=104
    } else {
      do {
        std::__swap_ranges<_AlgPolicy>(__first + (__left - __right), __first + __left, __first + __left);
        __left -= __right;
      } while (__left > __right);
      __min_len = __left;
    }
```

左の塊のうち **右端の `__right` 個** を、右の塊と入れ替えます。

1. 左 `[1, 2]` の右端 `[2]` と、右 `[7]` を入れ替え → `[3, 4, 5, 6, 1, 7, 2]`。`[2]` が最終位置に。`__left = 1`。

左（1）と右（1）が等しくなったので、また左が短い（以下）側の処理に戻ります。

1. `[1]` と `[7]` を入れ替え → `[3, 4, 5, 6, 7, 1, 2]`。`__right = 0`。

`__min_len` が 0 になったので終わり、位置 5 を返します。

## ここがすごい

- **ユークリッドの互除法と同じ形**: 長い方から短い方を引き続ける流れは、最大公約数を求める互除法そのものです。左右の長さ `(2, 5)` は `(2, 3)` → `(2, 1)` → `(1, 1)` → `(1, 0)` と減っていきます。
- **連続した塊の入れ替えは速い**: 入れ替えは、隣り合うメモリを先頭から順に触る `swap_ranges` で行います。CPU のキャッシュ（よく使うメモリを手元に置く仕組み）と相性がよく、コンパイラがまとめて処理する命令に置き換えやすい形です。
- **余分なメモリが要らない**: 一時配列を使わずに、入れ替えだけで回転します。
- **使う場面は呼び出し側が選ぶ**: この版が使われるのは、要素が「中身を単純にコピーしてよい型」（`is_trivially_move_assignable`）のときです。左右どちらかが 1 要素だけなら、さらに簡単な `__rotate_left` / `__rotate_right` に回されます。

## まとめ

- 回転は「短い方の塊を入れ替える → 残りの小さな回転」を繰り返すと、追加メモリなしで解ける。
- 長さの変化はユークリッドの互除法と同じ形になる。
- 戻り値（もとの先頭の行き先）は、最初に長さから計算できる。
- 連続したメモリをまとめて扱う操作に落とし込むと、キャッシュに優しく速いコードになりやすい。
