---
title: 「正確な掛け算の定数」をコンパイル時に探し出す
description: 桁数計算で使う定数 mult を constexpr 関数で求める。ビット数 1〜64 のすべてで正しい答えになる範囲を区間の共通部分として計算し、見つからなければコンパイルを止める。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/ToAscii.h
lines: [189, 230]
function: folly::detail::to_ascii_size_clzll_mult
difficulty: 3
format: 2
tags: [メタプログラミング, 数値計算, アルゴリズム]
---

## ひとことで

Folly は、整数の 10 進数での桁数を `(ビット数 × mult) >> 16` という整数演算で推定します。ここで使う定数 `mult` を **手で書かずに、コンパイル時に計算して求める** のがこの 2 つの関数です。

`to_ascii_size_clzll_exp` は「`bits` ビットに収まる最大の `Base` のべき乗の指数」を数え、`to_ascii_size_clzll_mult` は「ビット数 1〜64 の **すべて** でその指数を正確に出せる `mult`」を探します。

## コード

::: code-group

```cpp:line-numbers=189 [日本語訳]
//  bits が [0, 64] のとき Base^e <= 2^bits となる最大の e。これは
//  対数の底の変換 floor(bits / log<2>(Base)) に等しい。
template <uint64_t Base>
constexpr size_t to_ascii_size_clzll_exp(size_t bits) {
  constexpr auto const max = ~uint64_t(0);
  //  Base^(e+1) <= 2^bits は Base^e <= floor(2^bits / Base) と同じで、こうすると
  //  Base^(e+1) を直接作るときのあふれを避けられる。bits == 64 では被除数が
  //  表せない。max をちょうど 1 超えるので、Base がそれを割り切るとき、
  //  つまり max % Base が Base - 1 のときだけ商が切り上がる。
  uint64_t const lim = bits < 64
      ? (uint64_t(1) << bits) / Base
      : max / Base + (max % Base == Base - 1 ? 1 : 0);
  //  lim 以下の Base のべき乗を、掛けて上げるのではなく割って下げて数える。
  //  Base が 2^64 を割り切るとき Base^(e+1) はちょうど 2^64 になるから
  size_t e = 0;
  for (uint64_t q = lim; q; q /= Base) {
    ++e;
  }
  return e;
}

//  (bits * m) >> shift が、[0, 64] のすべての bits で底の変換
//  to_ascii_size_clzll_exp<Base>(bits) にちょうど一致する乗数 m。
//
//  各 bits ごとに、そうなる乗数は連続した区間になる。全 bits での共通部分を
//  取るからこそ、下の見積もりは to_ascii_size_route がたまたまここへ回す基数に限らず
//  どの基数でも正確になる。共通部分が空なら 0 を返し、
//  呼び出し側がコンパイル時に拒否する。
template <uint64_t Base>
constexpr uint64_t to_ascii_size_clzll_mult(size_t shift) {
  uint64_t lo = 0;
  uint64_t hi = ~uint64_t(0);
  for (size_t bits = 1; bits <= 64; ++bits) {
    //  (bits * m) >> shift == e は e <= bits * m / 2^shift < e + 1 と同じ
    uint64_t const e = to_ascii_size_clzll_exp<Base>(bits);
    uint64_t const elo = ((e << shift) + bits - 1) / bits;
    uint64_t const ehi = (((e + 1) << shift) + bits - 1) / bits - 1;
    lo = elo > lo ? elo : lo;
    hi = ehi < hi ? ehi : hi;
  }
  return lo <= hi ? lo : 0;
}
```

```cpp:line-numbers=189 [原文]
//  The largest e for which Base^e <= 2^bits, for bits in [0, 64], which is the
//  log change-of-base floor(bits / log<2>(Base)).
template <uint64_t Base>
constexpr size_t to_ascii_size_clzll_exp(size_t bits) {
  constexpr auto const max = ~uint64_t(0);
  //  Base^(e+1) <= 2^bits is Base^e <= floor(2^bits / Base), which avoids the
  //  overflow of forming Base^(e+1) directly. At bits == 64 the dividend is not
  //  representable; it exceeds max by exactly 1, which rounds up the quotient
  //  just when Base divides it, which is just when max % Base is Base - 1.
  uint64_t const lim = bits < 64
      ? (uint64_t(1) << bits) / Base
      : max / Base + (max % Base == Base - 1 ? 1 : 0);
  //  count the powers of Base within lim by dividing down rather than by
  //  multiplying up, since Base^(e+1) is 2^64 exactly when Base divides it
  size_t e = 0;
  for (uint64_t q = lim; q; q /= Base) {
    ++e;
  }
  return e;
}

//  The multiplier m for which (bits * m) >> shift is exactly the change-of-base
//  to_ascii_size_clzll_exp<Base>(bits) for every bits in [0, 64].
//
//  Each bits admits a contiguous interval of such multipliers; the intersection
//  over all bits is what makes the estimate below exact for every base rather
//  than only for the bases to_ascii_size_route happens to send here. Returns 0
//  when the intersection is empty, which callers reject at compile time.
template <uint64_t Base>
constexpr uint64_t to_ascii_size_clzll_mult(size_t shift) {
  uint64_t lo = 0;
  uint64_t hi = ~uint64_t(0);
  for (size_t bits = 1; bits <= 64; ++bits) {
    //  (bits * m) >> shift == e is e <= bits * m / 2^shift < e + 1
    uint64_t const e = to_ascii_size_clzll_exp<Base>(bits);
    uint64_t const elo = ((e << shift) + bits - 1) / bits;
    uint64_t const ehi = (((e + 1) << shift) + bits - 1) / bits - 1;
    lo = elo > lo ? elo : lo;
    hi = ehi < hi ? ehi : hi;
  }
  return lo <= hi ? lo : 0;
}
```

:::

## 前提知識

- **`constexpr` 関数**: コンパイル時に実行できる関数です。ループや `if` も書けます。結果を `constexpr auto const mult = ...;` のように定数として受け取ると、計算はコンパイル時に済み、実行ファイルには答えの数値だけが残ります。
- **`template <uint64_t Base>`**: 値を引数に取るテンプレートです。`Base = 10` や `Base = 16` ごとに別の関数が作られます。
- **`~uint64_t(0)`**: 0 のビットをすべて反転した値、つまり 64 ビット符号なし整数の最大値 `2^64 - 1` です。
- **`>> shift`**: 右シフトです。`x >> 16` は `x / 2^16` の切り捨てと同じです。
- **切り上げ割り算 `(a + b - 1) / b`**: 整数の割り算は切り捨てなので、`b - 1` を足してから割ると切り上げになります。

## 何をしているか

### 1. 指数 e を数える

```cpp:line-numbers=191
template <uint64_t Base>
constexpr size_t to_ascii_size_clzll_exp(size_t bits) {
  constexpr auto const max = ~uint64_t(0);
  //  Base^(e+1) <= 2^bits is Base^e <= floor(2^bits / Base), which avoids the
  //  overflow of forming Base^(e+1) directly. At bits == 64 the dividend is not
  //  representable; it exceeds max by exactly 1, which rounds up the quotient
  //  just when Base divides it, which is just when max % Base is Base - 1.
  uint64_t const lim = bits < 64
      ? (uint64_t(1) << bits) / Base
      : max / Base + (max % Base == Base - 1 ? 1 : 0);
  //  count the powers of Base within lim by dividing down rather than by
  //  multiplying up, since Base^(e+1) is 2^64 exactly when Base divides it
  size_t e = 0;
  for (uint64_t q = lim; q; q /= Base) {
    ++e;
  }
  return e;
}
```

`Base = 10`、`bits = 14` で追います。`2^14 = 16384` に収まる最大の 10 のべき乗は `10^4` なので、答えは `4` です。

- `lim = 2^14 / 10 = 1638`
- `q = 1638 → 163 → 16 → 1 → 0` と 10 で割っていき、0 でない回数を数えると `4`

「`10^(e+1) ≤ 2^bits`」を直接調べると `10^(e+1)` が 64 ビットからあふれる恐れがあるので、`2^bits / 10` 側を割っていく形に変えています。

`bits = 64` だけは `2^64` 自体が表せません。そこで `max / Base` に、必要なら 1 を足して補正しています。`2^64 = max + 1` なので、`max` を `Base` で割った余りが `Base - 1` のときだけ商が 1 増える、という理屈です。

### 2. 各ビット数で「許される mult の範囲」を求める

```cpp:line-numbers=221
  for (size_t bits = 1; bits <= 64; ++bits) {
    //  (bits * m) >> shift == e is e <= bits * m / 2^shift < e + 1
    uint64_t const e = to_ascii_size_clzll_exp<Base>(bits);
    uint64_t const elo = ((e << shift) + bits - 1) / bits;
    uint64_t const ehi = (((e + 1) << shift) + bits - 1) / bits - 1;
```

`(bits * m) >> shift == e` となる条件は、`e ≤ bits * m / 2^shift < e + 1` です。これを `m` について解くと、

- 下限 `elo = ceil(e * 2^shift / bits)`
- 上限 `ehi = ceil((e + 1) * 2^shift / bits) - 1`

になります。`shift = 16`、`bits = 14`、`e = 4` なら、`elo = ceil(262144 / 14) = 18725`、`ehi = ceil(327680 / 14) - 1 = 23405` です。

### 3. 全ビット数の共通部分を取る

```cpp:line-numbers=226
    lo = elo > lo ? elo : lo;
    hi = ehi < hi ? ehi : hi;
  }
  return lo <= hi ? lo : 0;
```

`lo` は下限の最大値、`hi` は上限の最小値として更新していきます。1〜64 ビットのすべてを調べ終えて `lo <= hi` なら、その範囲の `m` はどのビット数でも正しい答えを出します。最小の `lo` を返します。共通部分が空なら `0` を返し、呼び出し側の `static_assert(mult, ...)` でコンパイルエラーになります。

## ここがすごい

- **マジックナンバーを書かない**: 普通は `log10(2) ≈ 0.30103` から手計算した定数をソースに直書きします。しかし近似値だと、ある桁数の境目でだけ 1 ずれる、という見つけにくいバグが起きえます。ここでは「すべての入力で正しい」ことを条件に、定数を **導出** しています。
- **正しさの保証がコンパイル時に終わる**: 64 通りの全ケースをコンパイラが調べるので、実行時のテストに頼らずに済みます。基数を変えても同じ関数で正しい定数が求まります。
- **区間の共通部分という考え方**: 「条件を満たす値の集合」を区間として持ち、条件を 1 つずつ足して区間を狭めていく方法は、他の問題にも使える汎用的な手法です。
- **あふれへの配慮**: `10^(e+1)` を作らない、`2^64` を作らない、という 2 か所の工夫で、64 ビット整数の範囲内だけで計算を完結させています。

## まとめ

- 近似の定数は、手で決めるより「全入力で正しい」条件から導くほうが安全。
- `constexpr` 関数なら、その探索をコンパイル時に済ませられる。
- 条件を満たす範囲は、区間の下限の最大値と上限の最小値で管理できる。
- 大きな数を作らずに済む形に式を変形すると、オーバーフローを避けられる。
