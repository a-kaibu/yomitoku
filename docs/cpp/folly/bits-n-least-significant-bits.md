---
title: 下位 n ビットだけ 1 の値を作る、未定義動作を踏まないシフト
description: 下位 n ビットがすべて 1 の整数を返す n_least_significant_bits。64 ビットを 64 回シフトする未定義動作を避けつつ、使える CPU では専用命令 bzhi に任せる。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [212, 233]
function: folly::n_least_significant_bits_fn::operator()
difficulty: 3
format: 2
tags: [ビット演算, 防御的プログラミング, 移植性]
---

## ひとことで

`n_least_significant_bits<T>(n)` は、**下位 `n` ビットだけが `1` で、残りが `0` の値** を返します。
`n_least_significant_bits<uint8_t>(3)` なら `00000111`（= 7）です。ビットのマスクを作るときに使います。

教科書どおりなら `(1 << n) - 1` の 1 行ですが、この式には **`n` が型の幅と同じときに壊れる** という落とし穴があります。この関数はその穴をふさぎつつ、速い専用命令も使えるようにしています。

## コード

```cpp:line-numbers=212
template <class T>
struct n_least_significant_bits_fn {
  static_assert(detail::supported_in_bits_operations_v<T>);

  [[nodiscard]] constexpr T operator()(std::uint32_t n) const {
    if (!folly::is_constant_evaluated_or(true)) {
      compiler_may_unsafely_assume(n <= sizeof(T) * 8);

#ifdef __BMI2__
      if constexpr (sizeof(T) <= 4) {
        return static_cast<T>(_bzhi_u32(static_cast<std::uint32_t>(-1), n));
      }
      return static_cast<T>(_bzhi_u64(static_cast<std::uint64_t>(-1), n));
#endif
    }

    if (sizeof(T) == 8 && n == 64) {
      return static_cast<T>(-1);
    }
    return static_cast<T>((std::uint64_t{1} << n) - 1);
  }
};
```

## 前提知識

- **関数オブジェクト（`struct` + `operator()`）**: `operator()` を持つ構造体は、関数のように `f(3)` と呼べます。Folly はこの形で「関数」を定義し、`inline constexpr n_least_significant_bits_fn<T> n_least_significant_bits;` という変数として公開しています。
- **`[[nodiscard]]`**: 戻り値を捨てると警告を出す属性です。
- **`static_cast<T>(x)`**: `x` を型 `T` に変換します。`static_cast<std::uint64_t>(-1)` は 64 ビットすべてが `1` の値です。
- **シフトの未定義動作**: C++ では、**型のビット幅以上のシフト（64 ビット値を 64 回など）は未定義動作** です。何が起きても文句は言えません。実際、x86 ではシフト量の下位 6 ビットしか見ないので `1 << 64` が `1` になります。
- **`#ifdef __BMI2__`**: コンパイル対象の CPU が BMI2 という命令セット拡張を持つときだけ、中のコードを有効にします。
- **`_bzhi_u64(x, n)`**: BMI2 の命令 `bzhi` を呼ぶ関数で、「`x` の `n` ビット目以上をゼロにする」処理を 1 命令で行います。
- **`if constexpr`**: 条件がコンパイル時に決まる `if` です。選ばれなかった側はコンパイルされません。

## 何をしているか

### 1. 実行時なら、前提を伝えて専用命令を使う

```cpp:line-numbers=217
    if (!folly::is_constant_evaluated_or(true)) {
      compiler_may_unsafely_assume(n <= sizeof(T) * 8);

#ifdef __BMI2__
      if constexpr (sizeof(T) <= 4) {
        return static_cast<T>(_bzhi_u32(static_cast<std::uint32_t>(-1), n));
      }
      return static_cast<T>(_bzhi_u64(static_cast<std::uint64_t>(-1), n));
#endif
    }
```

`folly::is_constant_evaluated_or(true)` は「今コンパイル時に評価されているか」を返す Folly のヘルパです（判定できない環境では引数の `true` を返します）。`!` が付いているので、**実行時のときだけ** 中に入ります。

`compiler_may_unsafely_assume(n <= sizeof(T) * 8)` は「`n` は型の幅以下だと思ってよい」とコンパイラに約束する関数です。最適化のヒントになります。

BMI2 が使えるなら、「全ビット `1`（`-1`）」の `n` ビット目以上をゼロにします。`n = 3` なら `…11111111` → `00000111` です。`bzhi` は `n = 64` でも正しく全ビット `1` を返してくれるので、特別扱いがいりません。

### 2. 普通の計算に落とす

```cpp:line-numbers=228
    if (sizeof(T) == 8 && n == 64) {
      return static_cast<T>(-1);
    }
    return static_cast<T>((std::uint64_t{1} << n) - 1);
```

BMI2 が無い環境やコンパイル時評価では、`(std::uint64_t{1} << n) - 1` を計算します。`n = 3` なら `1000 - 1` = `0111` です。

ただし `T` が 64 ビットで `n == 64` のときは `1 << 64` が未定義動作になるので、`if (sizeof(T) == 8 && n == 64)` で先に `-1`（全ビット `1`）を返します。

`T` が 32 ビット以下のときは、計算を **64 ビットで** 行っています。`n = 32` でも `1 << 32` は 64 ビットの中では合法です。最後に `static_cast<T>` で必要な幅に切り詰めれば、正しく `0xFFFFFFFF` になります。

## ここがすごい

- **未定義動作を「たまたま動く」で済ませない**: `(1 << n) - 1` は多くのテストで正しく動くので、`n == 64` の不具合は見逃されがちです。ここでは 64 ビットのときだけ、その 1 ケースを明示的に処理しています。
- **小さい型は広い型で計算する**: 32 ビット以下の型では特別扱いを書かずに、64 ビットで計算してから切り詰めています。分岐が 1 つ減ります。
- **速い道と安全な道の両立**: 実行時かつ BMI2 があれば 1 命令、それ以外では移植性のある式、と使い分けています。コンパイル時評価ではインライン関数（`_bzhi_u64`）が使えないこともあるため、`is_constant_evaluated_or` で避けています。
- **関数オブジェクトとして定義**: テンプレート引数 `T` を明示して呼ぶ API（`n_least_significant_bits<uint32_t>(5)`）を、変数テンプレートで実現しています。

## まとめ

- `(1 << n) - 1` は、`n` が型の幅と同じときに未定義動作になる。
- 小さい型のマスクは、広い型で作ってから切り詰めると例外処理が減る。
- 専用命令（`bzhi`）が使えるなら任せ、使えないときの安全な実装も用意する。
- 「実行時だけ」の最適化は `is_constant_evaluated` 系で切り替えられる。
