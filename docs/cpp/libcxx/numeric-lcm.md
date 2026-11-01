---
title: 先に割ってから掛けて、最小公倍数のあふれを防ぐ
description: C++17 の std::lcm。m×n÷gcd ではなく m÷gcd×n の順で計算して途中のあふれを避け、最後の掛け算のあふれもコンパイラ組み込み関数で検出する。
language: cpp
project: libc++
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__numeric/gcd_lcm.h
lines: [97, 112]
function: std::lcm
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`std::lcm(m, n)` は、2 つの整数の **最小公倍数**（両方で割り切れる最小の正の数）を返す関数です。`lcm(4, 6)` は `12` です。

公式は `|m × n| ÷ gcd(m, n)` ですが、そのまま計算すると `m × n` の時点で整数の上限を超えることがあります。この実装は **先に割ってから掛ける** ことで、答えが表せる範囲に収まるならあふれないようにしています。

## コード

```cpp:line-numbers=97
template <class _Tp, class _Up>
[[nodiscard]] constexpr _LIBCPP_HIDE_FROM_ABI common_type_t<_Tp, _Up> lcm(_Tp __m, _Up __n) {
  static_assert(is_integral<_Tp>::value && is_integral<_Up>::value, "Arguments to lcm must be integer types");
  static_assert(!is_same<__remove_cv_t<_Tp>, bool>::value, "First argument to lcm cannot be bool");
  static_assert(!is_same<__remove_cv_t<_Up>, bool>::value, "Second argument to lcm cannot be bool");
  if (__m == 0 || __n == 0)
    return 0;

  using _Rp  = common_type_t<_Tp, _Up>;
  _Rp __val1 = std::__abs_in_type<_Rp>(__m) / std::gcd(__m, __n);
  _Rp __val2 = std::__abs_in_type<_Rp>(__n);
  _Rp __res;
  [[maybe_unused]] bool __overflow = __builtin_mul_overflow(__val1, __val2, std::addressof(__res));
  _LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN(!__overflow, "Overflow in lcm");
  return __res;
}
```

## 前提知識

- **関数テンプレートと `common_type_t`**: 引数の型を呼び出し時に決めるひな形です。戻り値の型 `common_type_t<_Tp, _Up>` は、2 つの型を両方表せる共通の型です。
- **`static_assert`**: コンパイル時に条件を調べ、偽ならコンパイルを止めます。整数以外や `bool` を渡すとエラーになります。
- **`__remove_cv_t<T>`**: 型から `const`（変更不可）や `volatile` の印を取り除いた型です。`const bool` も `bool` としてはじくために使っています。
- **`__builtin_mul_overflow(a, b, &res)`**: GCC や Clang に組み込まれた関数で、`a × b` を計算して `res` に入れ、**あふれたら `true`** を返します。
- **`std::addressof(x)`**: `x` のアドレス（メモリ上の番地）を取ります。`&x` とほぼ同じですが、型が `&` 演算子を独自に定義していても正しく番地を返します。
- **`[[maybe_unused]]`**: 「この変数は使われないことがあっても警告しないで」という印です。
- **`_LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN`**: libc++ の安全確認モードで有効になる確認です。条件が偽ならプログラムを止めます。

## 何をしているか

### 1. どちらかが 0 なら 0

```cpp:line-numbers=102
  if (__m == 0 || __n == 0)
    return 0;
```

`lcm(0, 5)` は 0 と決められています。ここで返しておけば、あとで `gcd(0, 0)` による 0 での割り算も起きません。

### 2. 先に割る

```cpp:line-numbers=105
  using _Rp  = common_type_t<_Tp, _Up>;
  _Rp __val1 = std::__abs_in_type<_Rp>(__m) / std::gcd(__m, __n);
  _Rp __val2 = std::__abs_in_type<_Rp>(__n);
```

`lcm(4, 6)` なら `gcd(4, 6) = 2` なので、`__val1 = 4 / 2 = 2`、`__val2 = 6` です。
`m` は必ず `gcd` で割り切れるので、この割り算で誤差は出ません。

### 3. あふれを確かめながら掛ける

```cpp:line-numbers=108
  _Rp __res;
  [[maybe_unused]] bool __overflow = __builtin_mul_overflow(__val1, __val2, std::addressof(__res));
  _LIBCPP_ASSERT_ARGUMENT_WITHIN_DOMAIN(!__overflow, "Overflow in lcm");
  return __res;
```

`2 × 6 = 12` を計算し、あふれなかったので `12` を返します。

32 ビットの `int` で `lcm(65536, 65537)` を考えます。2 つは互いに素（gcd が 1）なので、答えは `4295032832` で、`int` の上限（約 21 億）を超えます。このとき `__builtin_mul_overflow` は `true` を返し、安全確認モードなら「Overflow in lcm」で止まります。

## ここがすごい

- **割り算と掛け算の順番を入れ替える**: `m × n ÷ g` と `m ÷ g × n` は数学的には同じですが、コンピュータの整数では違います。前者は途中の `m × n` が答えより `g` 倍大きくなります。後者なら、途中の値が答えを超えることはありません。たとえば `lcm(100000, 100000)` は、前者だと途中で 100 億になって 32 ビットの `int` からあふれますが、後者なら `1 × 100000` で済みます。
- **あふれを確実に検出する**: 符号付き整数のあふれは、C++ では「未定義動作」（何が起きても文句を言えない状態）です。あふれたかどうかを、あふれた後の値から推測するのは危険です。`__builtin_mul_overflow` は、あふれずに判定できるコンパイラの機能です。
- **確認はモード次第**: 戻り値の `__overflow` は、確認が無効なビルドでは使われません。`[[maybe_unused]]` を付けて警告を消し、確認が有効なときだけ止まるようにしています。
- **`gcd` を再利用**: 最大公約数は同じファイルの `std::gcd` に任せています。`lcm` 自身は「0 の扱い」「計算順」「あふれ検出」だけに集中しています。

## まとめ

- `a × b ÷ c` は、割り切れるとわかっているなら `a ÷ c × b` の順にすると途中であふれにくい。
- 0 のような特別な値は最初に処理しておくと、後の計算（0 での割り算など）を気にしなくてよい。
- 整数のあふれは、`__builtin_mul_overflow` のような組み込み関数で安全に検出できる。
- 既存の関数（`gcd`）を組み合わせると、新しい関数は本当に必要な部分だけになる。
