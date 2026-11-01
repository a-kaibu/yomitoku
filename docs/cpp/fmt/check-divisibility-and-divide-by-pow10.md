---
title: 1 回の掛け算で「10 で割った商」と「割り切れたか」を同時に得る
description: 小さな整数 n を 10 か 100 で割り、割り切れたかも返す Dragonbox の補助関数。定数を掛けてシフトすると商、捨てた下位ビットの大きさで割り切れたかがわかる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format-inl.h
lines: [239, 264]
function: dragonbox::check_divisibility_and_divide_by_pow10
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化, メタプログラミング]
---

## ひとことで

`check_divisibility_and_divide_by_pow10<N>(n)` は、`n` を `10^N`（N は 1 か 2）で割った商に置き換え、**ちょうど割り切れたか** を `bool` で返します。

`n = 30, N = 1` なら `n` は `3` になり、`true` を返します。`n = 31` なら `n` は `3`、`false` です。割り算も `%` も使わず、**掛け算 1 回** から両方を取り出します。

## コード

::: code-group

```cpp:line-numbers=239 [日本語訳]
// n を floor(n / pow(10, N)) に置き換え、n が pow(10, N) で割り切れるときに
// 限り true を返す。
// 前提条件: n <= pow(10, N + 1)。
template <int N>
auto check_divisibility_and_divide_by_pow10(uint32_t& n) noexcept -> bool {
  // 以下の数は次の条件を満たすように選んである:
  //   1. d=10 または d=100 について floor(n/d) = floor(nm / 2^k)、
  //   2. nm mod 2^k < m となるのは n が d で割り切れるときに限る、
  // ここで m は magic_number、k は shift_amount、
  // d は divisor である。
  //
  // 1. は定数での割り算を掛け算に置き換える一般的な技法で、たとえば
  // Granlund と Montgomery の "Division by Invariant Integers Using
  // Multiplication"（1994）を参照。magic_number (m) は十分大きな k について
  // ceil(2^k/d) にしてある。
  // 2. のアイデアは Schubfach に由来する。
  constexpr auto info = div_small_pow10_infos[N - 1];
  FMT_ASSERT(n <= info.divisor * 10, "n is too large");
  constexpr uint32_t magic_number =
      (1u << info.shift_amount) / info.divisor + 1;
  n *= magic_number;
  const uint32_t comparison_mask = (1u << info.shift_amount) - 1;
  bool result = (n & comparison_mask) < magic_number;
  n >>= info.shift_amount;
  return result;
}
```

```cpp:line-numbers=239 [原文]
// Replaces n by floor(n / pow(10, N)) returning true if and only if n is
// divisible by pow(10, N).
// Precondition: n <= pow(10, N + 1).
template <int N>
auto check_divisibility_and_divide_by_pow10(uint32_t& n) noexcept -> bool {
  // The numbers below are chosen such that:
  //   1. floor(n/d) = floor(nm / 2^k) where d=10 or d=100,
  //   2. nm mod 2^k < m if and only if n is divisible by d,
  // where m is magic_number, k is shift_amount
  // and d is divisor.
  //
  // Item 1 is a common technique of replacing division by a constant with
  // multiplication, see e.g. "Division by Invariant Integers Using
  // Multiplication" by Granlund and Montgomery (1994). magic_number (m) is set
  // to ceil(2^k/d) for large enough k.
  // The idea for item 2 originates from Schubfach.
  constexpr auto info = div_small_pow10_infos[N - 1];
  FMT_ASSERT(n <= info.divisor * 10, "n is too large");
  constexpr uint32_t magic_number =
      (1u << info.shift_amount) / info.divisor + 1;
  n *= magic_number;
  const uint32_t comparison_mask = (1u << info.shift_amount) - 1;
  bool result = (n & comparison_mask) < magic_number;
  n >>= info.shift_amount;
  return result;
}
```

:::

使っている定数の表は、関数のすぐ上で次のように定義されています。

```cpp:line-numbers=234
FMT_INLINE_VARIABLE constexpr struct div_small_pow10_infos_struct {
  uint32_t divisor;
  int shift_amount;
} div_small_pow10_infos[] = {{10, 16}, {100, 16}};
```

## 前提知識

- **`template <int N>`**: 型ではなく整数をテンプレート引数にしています。`N` はコンパイル時に決まる定数なので、`div_small_pow10_infos[N - 1]` も `constexpr` で取り出せます。
- **`constexpr auto info`**: コンパイル時に値が決まる変数です。`magic_number` もコンパイル時に計算され、実行時には定数として埋め込まれます。
- **`uint32_t& n`**: 参照引数です。`n` を書き換えると呼び出し元の変数が変わります。
- **`n *= m`**: `n = n * m` です。符号なしなので、あふれたら 2^32 で割った余りになります（ここではあふれない範囲で使います）。
- **`&` マスク**: `(1u << 16) - 1` は下位 16 ビットがすべて 1 の値で、`&` を取ると下位 16 ビットだけが残ります。

## 何をしているか

### 1. 定数を決める

```cpp:line-numbers=255
  constexpr auto info = div_small_pow10_infos[N - 1];
  FMT_ASSERT(n <= info.divisor * 10, "n is too large");
  constexpr uint32_t magic_number =
      (1u << info.shift_amount) / info.divisor + 1;
```

N = 1 のとき、`divisor = 10`、`shift_amount = 16` です。`magic_number = 65536 / 10 + 1 = 6554` になります。これは「2^16 / 10 を切り上げた数」で、`6554 / 65536 ≒ 0.1` です。

### 2. 掛けて、下位と上位に分ける

```cpp:line-numbers=259
  n *= magic_number;
  const uint32_t comparison_mask = (1u << info.shift_amount) - 1;
  bool result = (n & comparison_mask) < magic_number;
  n >>= info.shift_amount;
```

`n = 30` の場合:

- `30 × 6554 = 196620`
- 上位（`>> 16`）: `196620 / 65536 = 3.0001…` → **3**
- 下位 16 ビット: `196620 - 3 × 65536 = 12`。`12 < 6554` なので **割り切れた**

`n = 31` の場合:

- `31 × 6554 = 203174`
- 上位: **3**
- 下位 16 ビット: `203174 - 196608 = 6566`。`6566 >= 6554` なので **割り切れない**

下位のビットは「`n / 10` の小数部分 × 2^16」にあたります。割り切れるなら小数部分はほぼ 0（切り上げの誤差ぶんだけ）、割り切れなければ少なくとも 0.1 程度になるので、`magic_number` との比較で見分けられます。

### 3. 前提条件

`FMT_ASSERT(n <= info.divisor * 10, …)` のとおり、`n` は 100（N = 2 なら 1000）以下に限られます。この範囲なら切り上げの誤差がたまらず、両方の判定が正しくなるように定数が選ばれています。

## ここがすごい

- **1 回の掛け算で 2 つの答え**: コメントの 1. は「定数での割り算を掛け算に置き換える」という定番の技（Granlund と Montgomery の論文）です。2. の「捨てる下位ビットで割り切れたかを判定する」は Schubfach というアルゴリズムから来たアイデアだとコメントにあります。普通は `n / 10` と `n % 10 == 0` で 2 回の演算が要るところを 1 回にしています。
- **定数はコンパイル時に計算**: テンプレート引数 `N` と `constexpr` のおかげで、表引きも `magic_number` の計算も実行時には残りません。
- **前提を絞って正しさを保証**: 入力の範囲を小さく限定したからこそ、16 ビットという短いシフトで済み、32 ビットの掛け算に収まります。範囲は assert で明示しています。
- **長いコメントが証明の要点になっている**: どういう条件を満たす数を選んだのか、元になった論文やアルゴリズムは何か、がコメントにまとまっています。

## まとめ

- 定数での割り算は「定数を掛けて右シフト」に置き換えられる。
- シフトで捨てる下位ビットは、商の小数部分にあたる。
- 小数部分が小さいかどうかで、割り切れたかを判定できる。
- 入力の範囲を限定すると、短いビット幅で正確な計算ができる。
