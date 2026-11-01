---
title: 多倍長整数の二乗を「斜めに足す」筆算で計算する
description: 32 ビットの桁を並べた多倍長整数を二乗する関数。結果の各桁を、添字の和が等しい部分積の合計として下から順に求め、128 ビットの累積器で繰り上がりを運ぶ。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [3120, 3146]
function: bigint::square
difficulty: 3
format: 2
tags: [アルゴリズム, 数値計算, データ構造]
---

## ひとことで

`square()` は、多倍長整数 `bigint` を **自分自身と掛けて（二乗して）** 置き換えます。10 の大きなべき乗を作る `assign_pow10` の中で何度も呼ばれます。

やっていることは小学校の掛け算の筆算です。ただし 1 桁が 32 ビットで、結果を **桁ごとに「縦に」まとめて** 計算します。

## コード

::: code-group

```cpp:line-numbers=3120 [日本語訳]
  FMT_CONSTEXPR20 void square() {
    int num_bigits = static_cast<int>(bigits_.size());
    int num_result_bigits = 2 * num_bigits;
    basic_memory_buffer<bigit, bigits_capacity> n(std::move(bigits_));
    bigits_.resize(to_unsigned(num_result_bigits));
    auto sum = uint128_t();
    for (int bigit_index = 0; bigit_index < num_bigits; ++bigit_index) {
      // 結果の bigit_index 桁目を、i + j == bigit_index となる
      // 交差項 n[i] * n[j] を足し合わせて求める。
      for (int i = 0, j = bigit_index; j >= 0; ++i, --j) {
        // ほとんどの項は 2 回掛けられている。将来ここは最適化できる。
        sum += double_bigit(n[i]) * n[j];
      }
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();  // 繰り上がりを求める。
    }
    // 上半分についても同じことをする。
    for (int bigit_index = num_bigits; bigit_index < num_result_bigits;
         ++bigit_index) {
      for (int j = num_bigits - 1, i = bigit_index - j; i < num_bigits;)
        sum += double_bigit(n[i++]) * n[j--];
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();
    }
    remove_leading_zeros();
    exp_ *= 2;
  }
```

```cpp:line-numbers=3120 [原文]
  FMT_CONSTEXPR20 void square() {
    int num_bigits = static_cast<int>(bigits_.size());
    int num_result_bigits = 2 * num_bigits;
    basic_memory_buffer<bigit, bigits_capacity> n(std::move(bigits_));
    bigits_.resize(to_unsigned(num_result_bigits));
    auto sum = uint128_t();
    for (int bigit_index = 0; bigit_index < num_bigits; ++bigit_index) {
      // Compute bigit at position bigit_index of the result by adding
      // cross-product terms n[i] * n[j] such that i + j == bigit_index.
      for (int i = 0, j = bigit_index; j >= 0; ++i, --j) {
        // Most terms are multiplied twice which can be optimized in the future.
        sum += double_bigit(n[i]) * n[j];
      }
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();  // Compute the carry.
    }
    // Do the same for the top half.
    for (int bigit_index = num_bigits; bigit_index < num_result_bigits;
         ++bigit_index) {
      for (int j = num_bigits - 1, i = bigit_index - j; i < num_bigits;)
        sum += double_bigit(n[i++]) * n[j--];
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();
    }
    remove_leading_zeros();
    exp_ *= 2;
  }
```

:::

## 前提知識

- **bigit**: `bigint` の 1 桁で、32 ビットの符号なし整数（`uint32_t`）です。`bigits_[0]` がいちばん下の桁です。
- **`double_bigit`**: 64 ビット整数（`uint64_t`）です。32 ビット × 32 ビットの積を受け取れます。
- **`uint128_t`**: 128 ビットの整数です（環境によっては {fmt} 自前の実装）。64 ビットの積をたくさん足しても、あふれないように使います。
- **`basic_memory_buffer<bigit, bigits_capacity> n(std::move(bigits_))`**: 今の桁の配列を `n` に **ムーブ**（コピーせず中身を移す）しています。元の `bigits_` は空になり、結果の書き込み先として使い直せます。
- **`static_cast<bigit>(sum)`**: 128 ビットの値の下位 32 ビットを取り出します。
- **`sum >>= 32`**: 下位 32 ビットを捨て、残りを次の桁への繰り上がりにします。

## 何をしているか

### 1. 結果の置き場所を用意する

```cpp:line-numbers=3121
    int num_bigits = static_cast<int>(bigits_.size());
    int num_result_bigits = 2 * num_bigits;
    basic_memory_buffer<bigit, bigits_capacity> n(std::move(bigits_));
    bigits_.resize(to_unsigned(num_result_bigits));
    auto sum = uint128_t();
```

N 桁の数の二乗は最大 2N 桁です。元の桁を `n` に移し、`bigits_` を 2N 桁にします。

### 2. 結果の各桁を「斜めの和」で求める

```cpp:line-numbers=3126
    for (int bigit_index = 0; bigit_index < num_bigits; ++bigit_index) {
      // 結果の bigit_index 桁目を、i + j == bigit_index となる
      // 交差項 n[i] * n[j] を足し合わせて求める。
      for (int i = 0, j = bigit_index; j >= 0; ++i, --j) {
        // ほとんどの項は 2 回掛けられている。将来ここは最適化できる。
        sum += double_bigit(n[i]) * n[j];
      }
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();  // 繰り上がりを求める。
    }
```

結果の k 桁目には、`i + j = k` となるすべての `n[i] × n[j]` が積もります。10 進の 2 桁 × 2 桁、`23 × 23` で考えると、

- 0 桁目: 3×3 = 9 → 9
- 1 桁目: 2×3 + 3×2 = 12 → 2、繰り上がり 1
- 2 桁目: 2×2 + 繰り上がり 1 = 5 → 5

となり、答えは 529 です。コードも同じで、`sum` に部分積を足し、下位 32 ビットを結果の桁に書き、残りを次の桁へ持ち越します。

ここまでの前半は k = 0〜N-1 を求めます。次の後半は k = N〜2N-1 です。

```cpp:line-numbers=3136
    // 上半分についても同じことをする。
    for (int bigit_index = num_bigits; bigit_index < num_result_bigits;
         ++bigit_index) {
      for (int j = num_bigits - 1, i = bigit_index - j; i < num_bigits;)
        sum += double_bigit(n[i++]) * n[j--];
      bigits_[bigit_index] = static_cast<bigit>(sum);
      sum >>= num_bits<bigit>();
    }
```

後半は `i` や `j` が範囲外にならないよう、ループの始まりを調整しています。

### 3. 後片づけ

```cpp:line-numbers=3144
    remove_leading_zeros();
    exp_ *= 2;
```

上位の 0 の桁を取り除き、指数 `exp_`（「下に 0 の桁がいくつ付いているか」）を 2 倍にします。`(x × 2^(32e))^2 = x^2 × 2^(32·2e)` だからです。

## ここがすごい

- **桁ごとにまとめると繰り上がりが 1 本で済む**: 筆算をそのまま書くと「部分積を並べて最後に足す」になり、途中の配列が必要です。この関数は結果の桁を下から 1 つずつ確定させ、繰り上がりを `sum` 1 つで運びます。
- **128 ビットの累積器**: 1 つの桁には最大 N 個の 64 ビットの積が積もります。128 ビットの `sum` なら、N がかなり大きくても桁あふれしません。
- **ムーブで余計なコピーを避ける**: 元の値を `std::move` で別のバッファに移し、結果用のバッファを確保し直します。内蔵配列（32 桁）に収まる大きさなら、ヒープも使いません。
- **正直な TODO**: 内側のループのコメント（「ほとんどの項は 2 回掛けられている」）のとおり、`n[i] × n[j]` と `n[j] × n[i]` は同じ値なので、本当は半分の掛け算で済みます。今は単純さを優先していて、改善の余地を明記しています。

## まとめ

- 掛け算の結果の k 桁目は、添字の和が k になる部分積の合計。
- 結果を下の桁から確定させれば、繰り上がりは 1 つの変数で運べる。
- 積を何個も足すときは、累積用の変数を広い型にしておく。
- 二乗では対称な項が 2 回ずつ現れるので、さらに半分にできる余地がある。
