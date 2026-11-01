---
title: 64 ビット同士の積の上半分を「四捨五入」して取り出す
description: 2 つの 64 ビット仮数を掛けて 2^64 で割り、最も近い整数に丸める関数。128 ビット型があれば下位の最上位ビットを見るだけ、なければ筆算の途中に 2^31 を足して丸める。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1884, 1900]
function: detail::multiply
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 移植性]
---

## ひとことで

`multiply(lhs, rhs)` は、64 ビットの整数 2 つを掛けた 128 ビットの積から **上位 64 ビットを、四捨五入して** 返します。式で書くと round(lhs × rhs / 2^64) です。

浮動小数点数 `f × 2^e` 同士を掛けるとき（すぐ下の `operator*`）に使われます。

@@L 1902-1904@@仮数の積の上半分を取れば、精度を保ったまま 64 ビットに収められます。

## コード

::: code-group

```cpp:line-numbers=1884 [日本語訳]
// lhs * rhs / pow(2, 64) を、ちょうど半分は切り上げる方式で最も近い整数に丸めて求める。
FMT_CONSTEXPR inline auto multiply(uint64_t lhs, uint64_t rhs) -> uint64_t {
#if FMT_USE_INT128
  auto product = static_cast<__uint128_t>(lhs) * rhs;
  auto f = static_cast<uint64_t>(product >> 64);
  return (static_cast<uint64_t>(product) & (1ULL << 63)) != 0 ? f + 1 : f;
#else
  // 仮数の 32 ビットずつの部分を掛ける。
  uint64_t mask = (1ULL << 32) - 1;
  uint64_t a = lhs >> 32, b = lhs & mask;
  uint64_t c = rhs >> 32, d = rhs & mask;
  uint64_t ac = a * c, bc = b * c, ad = a * d, bd = b * d;
  // 結果の中央の 64 ビットを求めて丸める。
  uint64_t mid = (bd >> 32) + (ad & mask) + (bc & mask) + (1U << 31);
  return ac + (ad >> 32) + (bc >> 32) + (mid >> 32);
#endif
}
```

```cpp:line-numbers=1884 [原文]
// Computes lhs * rhs / pow(2, 64) rounded to nearest with half-up tie breaking.
FMT_CONSTEXPR inline auto multiply(uint64_t lhs, uint64_t rhs) -> uint64_t {
#if FMT_USE_INT128
  auto product = static_cast<__uint128_t>(lhs) * rhs;
  auto f = static_cast<uint64_t>(product >> 64);
  return (static_cast<uint64_t>(product) & (1ULL << 63)) != 0 ? f + 1 : f;
#else
  // Multiply 32-bit parts of significands.
  uint64_t mask = (1ULL << 32) - 1;
  uint64_t a = lhs >> 32, b = lhs & mask;
  uint64_t c = rhs >> 32, d = rhs & mask;
  uint64_t ac = a * c, bc = b * c, ad = a * d, bd = b * d;
  // Compute mid 64-bit of result and round.
  uint64_t mid = (bd >> 32) + (ad & mask) + (bc & mask) + (1U << 31);
  return ac + (ad >> 32) + (bc >> 32) + (mid >> 32);
#endif
}
```

:::

## 前提知識

- **`__uint128_t`**: GCC や Clang が持つ 128 ビットの符号なし整数型です。`FMT_USE_INT128` が真の環境で使えます。
- **`static_cast<__uint128_t>(lhs) * rhs`**: 片方を 128 ビットにしてから掛けると、計算全体が 128 ビットで行われ、あふれません。
- **`>> 64`**: 上位 64 ビットを取り出します。
- **`1ULL << 63`**: 64 ビットの最上位ビットだけが 1 の値（2^63）です。
- **三項演算子 `a ? b : c`**: 条件が真なら `b`、偽なら `c` です。
- **`FMT_CONSTEXPR`**: `constexpr` に展開されるマクロです。コンパイル時にも計算できます。

## 何をしているか

### 1. 128 ビット型がある場合

```cpp:line-numbers=1886
#if FMT_USE_INT128
  auto product = static_cast<__uint128_t>(lhs) * rhs;
  auto f = static_cast<uint64_t>(product >> 64);
  return (static_cast<uint64_t>(product) & (1ULL << 63)) != 0 ? f + 1 : f;
```

128 ビットで積を求め、上位 64 ビットを `f` とします。四捨五入するには、捨てる下位 64 ビットが **2^63（ちょうど半分）以上か** を見ればよく、それは下位の最上位ビットが 1 かどうかと同じです。1 なら `f + 1` にします。

10 進で考えると、`1234.5678` を整数に丸めるとき、小数第 1 位が 5 以上なら切り上げるのと同じです。

### 2. 128 ビット型がない場合

```cpp:line-numbers=1890
#else
  // 仮数の 32 ビットずつの部分を掛ける。
  uint64_t mask = (1ULL << 32) - 1;
  uint64_t a = lhs >> 32, b = lhs & mask;
  uint64_t c = rhs >> 32, d = rhs & mask;
  uint64_t ac = a * c, bc = b * c, ad = a * d, bd = b * d;
  // 結果の中央の 64 ビットを求めて丸める。
  uint64_t mid = (bd >> 32) + (ad & mask) + (bc & mask) + (1U << 31);
  return ac + (ad >> 32) + (bc >> 32) + (mid >> 32);
```

64 ビットの数をそれぞれ 32 ビットずつ（`a, b` と `c, d`）に分け、4 つの部分積 `ac`, `bc`, `ad`, `bd` を求めます。どれも 32×32 ビットなので 64 ビットに収まります。

`mid` は「答えの 32〜63 ビット目に積もる量」です。ここで **`1U << 31` を足す** のが丸めの工夫です。

- `mid` の 31 ビット目は、元の積の 63 ビット目にあたります。
- そこに 2^31 を足すと、元の積に 2^63（= 2^64 の半分）を足したのと同じになります。
- 「半分を足してから切り捨てる」は四捨五入そのものです。

最後に `ac` と、`ad`・`bc` の上位、`mid` の上位（繰り上がり）を足して完成です。

## ここがすごい

- **丸めを足し算 1 つで**: 「下位を見て、半分以上なら 1 足す」という判定を、筆算版では「途中で半分を足しておく」に置き換えて、条件分岐なしにしています。
- **ちょうど半分は切り上げ**: 関数の直前のコメントのとおり、ちょうど半分のときは切り上げ（half-up）です。浮動小数点数の文字列化で使う近似計算では、これで十分な精度が出るように設計されています。
- **あふれない分割**: `mid` に足す 4 つの項はそれぞれ 2^32 未満（`1U << 31` は 2^31）なので、合計しても 64 ビットに収まります。
- **環境に応じた 2 通り**: 128 ビット型が使える環境では短く速く、使えない環境（MSVC の 32 ビット版など）でも同じ結果になります。

## まとめ

- 四捨五入は「半分を足してから切り捨てる」と書ける。
- 2 進では、捨てる部分の最上位ビットを見れば半分以上かがわかる。
- 大きな積は 32 ビットずつに分けた部分積の和として求められる。
- 途中の和があふれないように、項の大きさを見積もって組み立てる。
