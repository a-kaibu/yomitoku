---
title: わざと混ぜてからソートし、並べたあとで検算する
description: std::sort の入口。デバッグ時は入力をわざとシャッフルして順序への依存を暴き、並べ終えたら比較関数の正しさを検算する。コンパイル時実行では別のアルゴリズムに切り替える。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__algorithm/sort.h
lines: [928, 940]
function: std::__sort_impl
difficulty: 2
format: 2
tags: [ソート, 防御的プログラミング, テスト]
---

## ひとことで

`__sort_impl` は、`std::sort` と `std::ranges::sort` が共通で通る入口です。本体のソートを呼ぶ前後に、2 つの「検査」を挟んでいます。

- 前: デバッグ用の設定が有効なら、**入力をわざとランダムに並べ替える**。
- 後: 安全確認モードが有効なら、**本当に並んだか、比較関数がルールを守っているか** を確かめる。

さらに、コンパイル時に実行される場合（`constexpr`）は、ふだんとは別のアルゴリズムでソートします。

## コード

```cpp:line-numbers=928
template <class _AlgPolicy, class _RandomAccessIterator, class _Comp>
inline _LIBCPP_CONSTEXPR_SINCE_CXX20 void
__sort_impl(_RandomAccessIterator __first, _RandomAccessIterator __last, _Comp& __comp) {
  std::__debug_randomize_range<_AlgPolicy>(__first, __last);

  if (__libcpp_is_constant_evaluated()) {
    std::__partial_sort<_AlgPolicy>(
        std::__unwrap_iter(__first), std::__unwrap_iter(__last), std::__unwrap_iter(__last), __comp);
  } else {
    std::__sort_dispatch<_AlgPolicy>(std::__unwrap_iter(__first), std::__unwrap_iter(__last), __comp);
  }
  std::__check_strict_weak_ordering_sorted(std::__unwrap_iter(__first), std::__unwrap_iter(__last), __comp);
}
```

## 前提知識

- **`constexpr` とコンパイル時実行**: `constexpr` 関数は、条件がそろえばプログラムのコンパイル中に実行され、結果だけが埋め込まれます。`_LIBCPP_CONSTEXPR_SINCE_CXX20` は「C++20 以降は `constexpr` にする」という印です。
- **`__libcpp_is_constant_evaluated()`**: いまコンパイル時に実行されているなら `true` を返します。標準の `std::is_constant_evaluated()` と同じ働きです。
- **`std::__unwrap_iter`**: `std::vector<int>::iterator` のような「ポインタを包んだイテレータ」から、中のポインタを取り出します。ポインタになると、ポインタ向けの速い経路（作り置きのソートなど）を選べます。
- **`_AlgPolicy`**: `std::sort` と `std::ranges::sort` で、要素の入れ替えやムーブのやり方が少し違います。その違いを型で渡すための引数です。
- **安定でないソート**: `std::sort` は「等しい要素の順番を保つ」ことを約束しません（保つのは `std::stable_sort`）。

## 何をしているか

### 1. わざと混ぜる

```cpp:line-numbers=931
  std::__debug_randomize_range<_AlgPolicy>(__first, __last);
```

`__debug_randomize_range` は、`_LIBCPP_DEBUG_RANDOMIZE_UNSPECIFIED_STABILITY` というマクロが定義されているときだけ、範囲をシャッフルします（`__debug_utils/randomize_range.h`）。定義されていなければ何もしません。

たとえば `{名前, 年齢}` の組を年齢だけで並べると、同じ年齢の人どうしの順番は決まっていません。それなのに「たまたま入力順のまま残る」ことに頼ったコードを書くと、ライブラリの実装が変わったときに壊れます。先に混ぜておけば、そうした依存がテストですぐ表に出ます。

### 2. コンパイル時は部分ソートで

```cpp:line-numbers=933
  if (__libcpp_is_constant_evaluated()) {
    std::__partial_sort<_AlgPolicy>(
        std::__unwrap_iter(__first), std::__unwrap_iter(__last), std::__unwrap_iter(__last), __comp);
```

コンパイル時に実行されているときは、`__partial_sort`（ヒープを使うソート）で全体を並べます。第 3 引数を `__last` にしているので、「先頭から最後までを並べる」という意味になります。
本体の `__introsort`には `constexpr` が付いていないので、コンパイル時には呼べません。ライブラリ本体に作り置きされた関数も同様です。そこで `constexpr` 対応の `__partial_sort` で代用しています。

### 3. ふだんは本体へ

```cpp:line-numbers=936
  } else {
    std::__sort_dispatch<_AlgPolicy>(std::__unwrap_iter(__first), std::__unwrap_iter(__last), __comp);
  }
```

実行時は `__sort_dispatch` に進みます。ここで型に応じて、作り置きの関数か、汎用のイントロソートが選ばれます。

### 4. 検算

```cpp:line-numbers=939
  std::__check_strict_weak_ordering_sorted(std::__unwrap_iter(__first), std::__unwrap_iter(__last), __comp);
```

`__check_strict_weak_ordering_sorted` は、libc++ のデバッグ用の安全確認モードのときだけ働きます（`__debug_utils/strict_weak_ordering_check.h`）。結果が本当に並んでいるかを `is_sorted` で確かめ、さらに先頭 100 要素までについて「等しいと判定された要素どうしが互いに等しいか」などを調べて、比較関数がルール（strict weak ordering）を破っていないかを確認します。

## ここがすごい

- **「決まっていないこと」を本当にばらばらにする**: 仕様で決まっていない動作は、実装によって「たまたま」一定になりがちです。それを利用者が当てにすると、移行のときに壊れます。デバッグ設定で毎回ばらばらにすることで、仕様が約束していないことに頼るコードを早く見つけられます。
- **壊れた比較関数を見つける**: 比較関数が `a < b` と `b < a` を両方真にするなどルールを破ると、ソートは配列の外を読むことさえあります（番兵を信じた最適化が崩れるため）。並べたあとに検算しておけば、こうした問題を原因に近い場所で知らせられます。
- **検査は設定で消える**: どちらの検査も、マクロや安全確認モードが無効なら空の関数になります。ふだんのビルドでは速さに影響しません。
- **実行時とコンパイル時で道を分ける**: 1 つの `std::sort` が両方の場面で使えるように、入口で `__libcpp_is_constant_evaluated()` を見て道を分けています。利用者は区別を意識せずに使えます。

## まとめ

- 仕様が決めていない動作は、デバッグ時にわざとばらばらにすると、依存しているコードを早く見つけられる。
- 結果の検算は、前提（比較関数のルール）が破られていないかを確かめる手段になる。
- 検査はビルド設定で消せるように作れば、ふだんの速さを犠牲にしない。
- `is_constant_evaluated` を使うと、コンパイル時と実行時で別の実装を選べる。
