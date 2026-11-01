---
title: log10 を掛け算 1 回とシフトで求める、整数だけの対数計算
description: 2 の e 乗の常用対数の切り捨てを、浮動小数点を使わず e * 315653 >> 20 で求める関数。浮動小数点数を文字列にする Dragonbox アルゴリズムの下準備で使う。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1669, 1680]
function: dragonbox::floor_log10_pow2 / floor_log2_pow10
difficulty: 2
format: 2
tags: [数値計算, 最適化, アルゴリズム]
---

## ひとことで

`floor_log10_pow2(e)` は ⌊log₁₀(2^e)⌋、つまり **2 の e 乗が 10 進で何桁くらいか** を返します。`e = 10` なら 2^10 = 1024 なので 3 です。

`floor_log2_pow10(e)` はその逆で、⌊log₂(10^e)⌋ を返します。どちらも **整数の掛け算 1 回とシフト 1 回** だけで計算します。

## コード

::: code-group

```cpp:line-numbers=1669 [日本語訳]
// e が [-2620, 2620] のとき floor(log10(pow(2, e))) を次の方法で求める:
// https://fmt.dev/papers/Dragonbox.pdf#page=28 の 6.1 節。
inline auto floor_log10_pow2(int e) noexcept -> int {
  FMT_ASSERT(e <= 2620 && e >= -2620, "too large exponent");
  static_assert((-1 >> 1) == -1, "right shift is not arithmetic");
  return (e * 315653) >> 20;
}

inline auto floor_log2_pow10(int e) noexcept -> int {
  FMT_ASSERT(e <= 1233 && e >= -1233, "too large exponent");
  return (e * 1741647) >> 19;
}
```

```cpp:line-numbers=1669 [原文]
// Computes floor(log10(pow(2, e))) for e in [-2620, 2620] using the method from
// https://fmt.dev/papers/Dragonbox.pdf#page=28, section 6.1.
inline auto floor_log10_pow2(int e) noexcept -> int {
  FMT_ASSERT(e <= 2620 && e >= -2620, "too large exponent");
  static_assert((-1 >> 1) == -1, "right shift is not arithmetic");
  return (e * 315653) >> 20;
}

inline auto floor_log2_pow10(int e) noexcept -> int {
  FMT_ASSERT(e <= 1233 && e >= -1233, "too large exponent");
  return (e * 1741647) >> 19;
}
```

:::

## 前提知識

- **対数**: log₁₀(x) は「10 を何乗すると x になるか」です。log₁₀(2^e) = e × log₁₀2 ≒ e × 0.30103 です。
- **⌊x⌋（floor）**: x 以下の最大の整数です。⌊3.01⌋ = 3、⌊-0.30⌋ = -1 です。
- **`>> 20`（算術右シフト）**: 符号付き整数の右シフトは、2^20 で割って **マイナス方向に切り捨てる** 動きをします（算術シフトの場合）。
- **`static_assert`**: コンパイル時に条件を確かめ、満たさなければコンパイルエラーにします。
- **`FMT_ASSERT`**: 実行時（デバッグ時）に条件を確かめるマクロです。
- **`namespace dragonbox`**: Dragonbox（浮動小数点数を最短の 10 進表記にするアルゴリズム）用の名前空間です。

## 何をしているか

### 1. 固定小数点で log₁₀2 を表す

```cpp:line-numbers=1673
  static_assert((-1 >> 1) == -1, "right shift is not arithmetic");
```

`315653 / 2^20` を計算すると `0.3010292…` で、log₁₀2 = `0.3010299…` にとても近い値です。

つまり `e * 315653 >> 20` は「e × 0.30103 を計算して切り捨てる」を、整数だけで行っています。小数を 2^20 倍した整数で持つこの方法を **固定小数点** と呼びます。

- `e = 10`: `3156530 >> 20 = 3`（3156530 / 1048576 ≒ 3.01）→ **3**（1024 は 4 桁で、⌊log₁₀1024⌋ = 3）
- `e = -1`: `-315653 >> 20 = -1`（-0.30 の切り捨て）→ **-1**（2^-1 = 0.5 で、⌊log₁₀0.5⌋ = -1）

### 2. 算術シフトであることを確かめる

```cpp:line-numbers=1672
  FMT_ASSERT(e <= 2620 && e >= -2620, "too large exponent");
```

負の数の右シフトは、C++20 より前は「処理系定義」でした。`(-1 >> 1) == -1` を `static_assert` で確かめ、マイナス方向に切り捨てるシフトでなければコンパイルを止めます。

### 3. 使える範囲を明示する

```cpp:line-numbers=1671
inline auto floor_log10_pow2(int e) noexcept -> int {
```

近似値なので、e が大きくなると誤差がたまって答えがずれます。コメントの論文（Dragonbox の 6.1 節）で正しいと確かめられた範囲 `[-2620, 2620]` を `FMT_ASSERT` で守っています。

### 4. 逆向きも同じ考え方

```cpp:line-numbers=1677
inline auto floor_log2_pow10(int e) noexcept -> int {
  FMT_ASSERT(e <= 1233 && e >= -1233, "too large exponent");
  return (e * 1741647) >> 19;
}
```

`1741647 / 2^19 = 3.3219280…` で、log₂10 = `3.3219280…` の近似です。

## ここがすごい

- **浮動小数点の `log` を呼ばない**: `std::floor(e * std::log10(2.0))` と書くこともできますが、浮動小数点の丸め誤差で境目の値がずれる心配があり、遅くもあります。整数の掛け算とシフトなら速く、結果も環境によらず同じです。
- **範囲を絞って正確さを保証**: 近似は「必要な範囲で必ず正しい」ことが大事です。double の指数は ±1100 程度なので、±2620 で十分足ります。範囲を assert に書き、使う側との約束にしています。
- **前提をコンパイル時に検査**: 算術シフトという、環境に依存しうる前提を `static_assert` で確かめています。前提が崩れる環境では黙って間違えずにエラーになります。

## まとめ

- 定数の掛け算は「定数を 2^k 倍した整数を掛けて k ビット右シフト」で整数だけで計算できる。
- 近似を使うときは、正しい入力の範囲を明示して守る。
- 負の数の右シフトは切り捨て方向に注意。前提は `static_assert` で確かめる。
- 浮動小数点の関数を避けると、速さと再現性の両方が得られる。
