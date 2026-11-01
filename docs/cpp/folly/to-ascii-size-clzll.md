---
title: 10 進数の桁数を、割り算もループもなしで数える
description: 整数を文字列にする前に必要な桁数を求める to_ascii_size_clzll。2 進数の桁数に定数を掛けてシフトし、10 のべき乗表と 1 回比べるだけで、どんな値でも一定時間で答えを出す。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/ToAscii.h
lines: [243, 281]
function: folly::detail::to_ascii_size_clzll
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`to_ascii_size_clzll<Base>(v)` は、整数 `v` を `Base` 進数で書いたときの **桁数** を返します。`Base = 10`、`v = 12345` なら `5` です。
Folly の整数→文字列変換は、先に桁数を求めてから後ろ向きに数字を書き込むので、この関数は変換のたびに呼ばれます。

素直に書くと「10 で割れなくなるまで割る」ループですが、この関数は **2 進数の桁数から 10 進数の桁数を推定し、1 回の比較で補正する** だけで済ませています。

## コード

::: code-group

```cpp:line-numbers=243 [日本語訳]
template <uint64_t Base>
FOLLY_ALWAYS_INLINE size_t to_ascii_size_clzll(uint64_t v) {
  using powers = to_ascii_powers<Base, uint64_t>;

  //  clzll は 0 で未定義なので、特別扱いが必要
  if (FOLLY_UNLIKELY(!v)) {
    return 1;
  }

  //  vlog2 はおよそ log<2>(v)
  size_t const vlog2 = 64 - static_cast<size_t>(__builtin_clzll(v));

  //  Base が 2 のべき乗なら直接計算する
  if constexpr (!(Base & (Base - 1))) {
    constexpr auto const blog2 = constexpr_log2(Base);
    return vlog2 / blog2 + size_t(vlog2 % blog2 != 0);
  }

  //  mult / 2^shift は 1 / log<2>(Base)。すぐ下の底の変換が近似ではなく
  //  正確になるだけの精度を持たせている。
  //
  //  基数 4096 までなら、[12, 57] のどの shift でもよい。それより小さいと
  //  乗数が粗すぎて正確な値が存在しない基数があり、
  //  static_assert がそれを拒否する。それより大きいと、導出中の (e + 1) << shift が
  //  黙ってあふれ、何も拒否しない。範囲内では
  //  ビットを増やしても何も得はない（乗数はすでに正確）ので、
  //  すべての乗数が 2^16 以下に収まる最大の値を選ぶ。そうすれば aarch64 では
  //  movz/movk の 2 命令ではなく movz 1 命令で済む。17 だと基数 3 で 2 命令要る。
  constexpr size_t const shift = 16;
  constexpr auto const mult = to_ascii_size_clzll_mult<Base>(shift);
  static_assert(mult, "no exact change-of-base multiplier for this base");

  //  vlogb は log<Base>(v) の切り捨てなので、桁数は vlogb か、
  //  v が Base^vlogb に達していればその 1 つ上
  auto const vlogb = size_t((vlog2 * mult) >> shift);

  //  vlogb を返す。必要なら補正する
  return vlogb + size_t(vlogb < powers::size && v >= powers::data.data[vlogb]);
}
```

```cpp:line-numbers=243 [原文]
template <uint64_t Base>
FOLLY_ALWAYS_INLINE size_t to_ascii_size_clzll(uint64_t v) {
  using powers = to_ascii_powers<Base, uint64_t>;

  //  clzll is undefined for 0; must special case this
  if (FOLLY_UNLIKELY(!v)) {
    return 1;
  }

  //  vlog2 is approx log<2>(v)
  size_t const vlog2 = 64 - static_cast<size_t>(__builtin_clzll(v));

  //  handle directly when Base is power-of-two
  if constexpr (!(Base & (Base - 1))) {
    constexpr auto const blog2 = constexpr_log2(Base);
    return vlog2 / blog2 + size_t(vlog2 % blog2 != 0);
  }

  //  mult / 2^shift is 1 / log<2>(Base), to just enough precision that the log
  //  change-of-base just below is exact rather than approximate.
  //
  //  Any shift in [12, 57] serves, for every base up to 4096. Below that the
  //  multiplier is too coarse for some bases to admit an exact one at all,
  //  which the static_assert rejects; above it, the (e + 1) << shift within the
  //  derivation silently overflows, which nothing rejects. Within the range
  //  more bits buy nothing, since the multiplier is already exact, so take the
  //  largest at which every multiplier is at most 2^16 and so costs aarch64 a
  //  single movz rather than a movz/movk pair. At 17, base 3 already needs two.
  constexpr size_t const shift = 16;
  constexpr auto const mult = to_ascii_size_clzll_mult<Base>(shift);
  static_assert(mult, "no exact change-of-base multiplier for this base");

  //  vlogb is log<Base>(v) rounded down, so the digit count is vlogb or, once
  //  v reaches Base^vlogb, one more
  auto const vlogb = size_t((vlog2 * mult) >> shift);

  //  return vlogb, adjusted if necessary
  return vlogb + size_t(vlogb < powers::size && v >= powers::data.data[vlogb]);
}
```

:::

## 前提知識

- **`template <uint64_t Base>`**: 型ではなく **値** を引数に取るテンプレートです。`to_ascii_size_clzll<10>(v)` のように呼ぶと、`Base` が `10` に固定された関数がコンパイル時に作られます。
- **`__builtin_clzll(v)`**: 64 ビット整数の上位に続く 0 の個数を返す組み込み関数です。`v = 0` のときは未定義なので、先に除外する必要があります。
- **`if constexpr`**: コンパイル時に決まる条件の `if` です。`Base` は定数なので、どちらの道を通るかはコンパイル時に決まります。
- **`static_assert(mult, "...")`**: コンパイル時のチェックです。`mult` が 0 ならコンパイルエラーになります。
- **`using powers = to_ascii_powers<Base, uint64_t>;`**: 同じファイルで定義された、`Base` のべき乗の表（`1, 10, 100, …`）です。`powers::data.data[i]` が `Base^i`、`powers::size` が表の長さです。
- **`FOLLY_UNLIKELY(x)`**: 「この条件はめったに真にならない」とコンパイラに伝えるマクロです。
- **`size_t(条件)`**: `bool` を整数にすると、真は `1`、偽は `0` になります。

## 何をしているか

### 1. 0 を特別扱い

```cpp:line-numbers=248
  if (FOLLY_UNLIKELY(!v)) {
    return 1;
  }
```

`clzll(0)` は未定義なので、`v = 0` なら「1 桁」と即答します。

### 2. 2 進数の桁数を求める

```cpp:line-numbers=253
  size_t const vlog2 = 64 - static_cast<size_t>(__builtin_clzll(v));
```

`vlog2 = 64 - clzll(v)` は `v` の 2 進数での桁数です。`v = 12345` は 2 進数で 14 桁（`8192 ≤ 12345 < 16384`）なので `vlog2 = 14` です。

### 3. 基数が 2 のべき乗なら割り算だけ

```cpp:line-numbers=256
  if constexpr (!(Base & (Base - 1))) {
    constexpr auto const blog2 = constexpr_log2(Base);
    return vlog2 / blog2 + size_t(vlog2 % blog2 != 0);
  }
```

16 進数なら 1 桁が 4 ビットなので、「14 ビット ÷ 4 の切り上げ」で桁数が出ます。`Base & (Base - 1)` が 0 なら 2 のべき乗です。

### 4. 掛け算とシフトで底を変える

```cpp:line-numbers=271
  constexpr size_t const shift = 16;
  constexpr auto const mult = to_ascii_size_clzll_mult<Base>(shift);
  static_assert(mult, "no exact change-of-base multiplier for this base");

  //  vlogb is log<Base>(v) rounded down, so the digit count is vlogb or, once
  //  v reaches Base^vlogb, one more
  auto const vlogb = size_t((vlog2 * mult) >> shift);
```

10 進数の桁数はおよそ `ビット数 × log10(2)`（≈ 0.301）です。小数を使わないように、`mult / 2^16` がちょうど `0.301…` に近い整数 `mult` を **コンパイル時に** 求めておきます（`to_ascii_size_clzll_mult`）。

`vlogb = (14 * mult) >> 16` は `floor(14 × 0.301…)` = `4` です。これは「14 ビットに収まる最大の 10 のべき乗の指数」（`10^4 = 10000 ≤ 2^14`）です。

### 5. 1 回の比較で補正

```cpp:line-numbers=280
  return vlogb + size_t(vlogb < powers::size && v >= powers::data.data[vlogb]);
```

同じ 14 ビットの数でも、`9999` は 4 桁、`12345` は 5 桁です。そこで `v >= 10^vlogb` かどうかを表で確認します。

- `v = 12345`: `12345 >= 10000` なので `4 + 1 = 5`
- `v = 9999`: `9999 < 10000` なので `4`

`vlogb < powers::size` の条件は、表の範囲外を読まないための安全装置です。

## ここがすごい

- **どんな値でも同じ速さ**: 割り算ループは桁数ぶん回ります。こちらは `clzll`（多くの CPU で 1 命令）、掛け算、シフト、表の参照と比較が 1 回ずつです。
- **整数だけで底の変換**: `log10(2)` を浮動小数点で計算せず、「掛けてから 2^16 で割る（=右シフト）」に置き換えています。浮動小数点の丸め誤差の心配もありません。
- **「近似 + 補正」の設計**: 2 進数の桁数だけでは 10 進数の桁数は 1 つに決まりません。決まらない分を表との 1 回の比較に押し込めています。
- **シフト量の選び方まで説明がある**: コメントは、なぜ `shift = 16` なのかを説明しています。12〜57 ならどれでも正確に計算できるので、その中で `mult` が 2^16 以下に収まる最大の値を選び、aarch64 で定数を 1 命令（`movz`）で作れるようにしています。
- **正しさをコンパイル時に保証**: `mult` が求まらない基数では `static_assert` でコンパイルが止まります。

## まとめ

- 10 進数の桁数は、2 進数の桁数 × log10(2) で近似できる。
- 定数の小数は「整数を掛けて右シフト」に置き換えられる。
- 近似で候補を 1 つか 2 つに絞り、表との比較 1 回で確定させる、という組み立てが速い。
- 未定義の入力（`clz(0)`）は先に除外する。
