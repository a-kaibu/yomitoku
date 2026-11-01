---
title: 割り算なしで末尾の 0 を消す、「5 の逆数」と回転の魔法
description: 浮動小数点数を最短表記にしたあと、仮数の末尾の 0 を取り除く Dragonbox の関数。割り算の代わりに 2^32 を法とした 5 の逆数を掛け、ビット回転で「割り切れたか」まで同時に判定する。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format-inl.h
lines: [1170, 1189]
function: dragonbox::remove_trailing_zeros (uint32_t 版)
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, ハック, 最適化]
---

## ひとことで

浮動小数点数を文字列にするとき、Dragonbox アルゴリズムはまず「仮数 × 10 の指数」の形を作ります。たとえば `1.2f` は `12 × 10^-1` ですが、途中で `1200 × 10^-3` のような形になることがあります。

`remove_trailing_zeros(n)` は `n` の **末尾の 0 を取り除き**、取り除いた個数を返します。`n = 1200` なら `n` を `12` にして `2` を返します。しかも **割り算を一度も使いません**。

## コード

::: code-group

```cpp:line-numbers=1170 [日本語訳]
// n の末尾の 0 を取り除き、取り除いた 0 の個数を返す（float 用）。
FMT_INLINE auto remove_trailing_zeros(uint32_t& n, int s = 0) noexcept -> int {
  FMT_ASSERT(n != 0, "");
  // 5 の法の逆数（mod 2^32）: (mod_inv_5 * 5) mod 2^32 = 1。
  constexpr uint32_t mod_inv_5 = 0xcccccccd;
  constexpr uint32_t mod_inv_25 = 0xc28f5c29;  // = mod_inv_5 * mod_inv_5

  while (true) {
    auto q = rotr(n * mod_inv_25, 2);
    if (q > max_value<uint32_t>() / 100) break;
    n = q;
    s += 2;
  }
  auto q = rotr(n * mod_inv_5, 1);
  if (q <= max_value<uint32_t>() / 10) {
    n = q;
    s |= 1;
  }
  return s;
}
```

```cpp:line-numbers=1170 [原文]
// Remove trailing zeros from n and return the number of zeros removed (float).
FMT_INLINE auto remove_trailing_zeros(uint32_t& n, int s = 0) noexcept -> int {
  FMT_ASSERT(n != 0, "");
  // Modular inverse of 5 (mod 2^32): (mod_inv_5 * 5) mod 2^32 = 1.
  constexpr uint32_t mod_inv_5 = 0xcccccccd;
  constexpr uint32_t mod_inv_25 = 0xc28f5c29;  // = mod_inv_5 * mod_inv_5

  while (true) {
    auto q = rotr(n * mod_inv_25, 2);
    if (q > max_value<uint32_t>() / 100) break;
    n = q;
    s += 2;
  }
  auto q = rotr(n * mod_inv_5, 1);
  if (q <= max_value<uint32_t>() / 10) {
    n = q;
    s |= 1;
  }
  return s;
}
```

:::

`rotr` は同じファイルにある「右回転」の関数です。右にはみ出したビットを左端に戻します。

```cpp:line-numbers=196
// Compilers should be able to optimize this into the ror instruction.
FMT_INLINE auto rotr(uint32_t n, uint32_t r) noexcept -> uint32_t {
  r &= 31;
  return (n >> r) | (n << (32 - r));
}
```

## 前提知識

- **`uint32_t& n`**: 参照引数です。関数の中で `n` を書き換えると、呼び出し元の変数が書き換わります。結果を 2 つ（新しい `n` と 0 の個数）返すための書き方です。
- **`int s = 0`**: デフォルト引数です。64 ビット版がこの関数を呼ぶとき、すでに数えた 0 の個数を渡せるようにしています。
- **符号なし整数の掛け算は 2^32 で割った余り**: `uint32_t` 同士の掛け算であふれた分は捨てられます。数学的には「2^32 を法とする（mod 2^32）」計算です。
- **法の逆数（モジュラ逆数）**: `5 × 0xcccccccd = 0x400000001` で、下位 32 ビットは `1` です。つまり mod 2^32 の世界では `0xcccccccd` は「1/5」として働きます。5 の倍数にこれを掛けると、ちょうど 5 で割った値になります。
- **`max_value<uint32_t>()`**: 32 ビットの最大値 `0xFFFFFFFF` です。

## 何をしているか

### 1. 5 と 25 の逆数を用意する

```cpp:line-numbers=1173
  // 5 の法の逆数（mod 2^32）: (mod_inv_5 * 5) mod 2^32 = 1。
  constexpr uint32_t mod_inv_5 = 0xcccccccd;
  constexpr uint32_t mod_inv_25 = 0xc28f5c29;  // = mod_inv_5 * mod_inv_5
```

`mod_inv_25` は `mod_inv_5` の二乗で、「1/25」として働きます。

### 2. 100 で割れる間、2 桁ずつ削る

```cpp:line-numbers=1177
  while (true) {
    auto q = rotr(n * mod_inv_25, 2);
    if (q > max_value<uint32_t>() / 100) break;
    n = q;
    s += 2;
  }
```

`n = 1200` で追います。

- `1200` は 25 の倍数なので、`1200 × mod_inv_25` はちょうど `1200 / 25 = 48` になります。
- `48` を 2 ビット右回転します。`48` は 4 の倍数で下位 2 ビットが `00` なので、回転しても左端には 0 が入り、`48 / 4 = 12` になります。合わせて `1200 / 100 = 12` です。
- `12` は `0xFFFFFFFF / 100` 以下なので、`n = 12`、`s = 2` です。

もう 1 周すると、`12` は 25 の倍数ではないので、掛け算の結果は巨大な値になります。回転しても大きいままなので `break` します。

### 3. 最後に 10 で割れるかを 1 回だけ見る

```cpp:line-numbers=1183
  auto q = rotr(n * mod_inv_5, 1);
  if (q <= max_value<uint32_t>() / 10) {
    n = q;
    s |= 1;
  }
```

`12 × mod_inv_5` も、12 が 5 の倍数ではないので巨大な値になり、条件を満たしません。結果は `n = 12`、戻り値 `2` です。

2 桁ずつ削ったあとなので、残りの 0 は高々 1 個です。`s` はこの時点で偶数なので、`s |= 1` は `s += 1` と同じです。

## ここがすごい

- **割り算を掛け算 1 回に**: 「10 で割り切れるか調べてから割る」は普通 `n % 10` と `n / 10` です。この関数は逆数の掛け算 1 回と回転 1 回で、**判定と割り算を同時に** 済ませます。
- **回転が判定を兼ねる**: `n` が 5 の倍数でも偶数でなければ（たとえば 15）、`n × mod_inv_5` は奇数になります（15 なら 3）。右回転すると最下位の 1 が最上位に回って、値が巨大になります。だから「回転後の値が `max / 10` 以下か」だけで、**10 で割り切れたかどうか** がわかります。5 の倍数でない数は、もともと結果が大きくなります。
- **2 桁ずつ進める**: 末尾の 0 が多い数でもループの回数が半分で済みます。
- **64 ビット版との分担**: 64 ビット版（同じファイルのすぐ下）は、まず 10^8 で割れるかを調べ、割れたらこの 32 ビット版に `s = 8` を渡して続きを任せます。64 ビットの掛け算より 32 ビットのほうが軽いからです。

## まとめ

- 2^32 を法とした世界では、奇数にはすべて「逆数」があり、割り算を掛け算に置き換えられる。
- 割り切れないときは結果が大きくなるので、大小比較で「割り切れたか」を判定できる。
- 右回転は、偶数かどうかの判定と 2 での割り算を同時にこなす。
- まとめて 2 桁ずつ削ると、ループの回数が減る。
