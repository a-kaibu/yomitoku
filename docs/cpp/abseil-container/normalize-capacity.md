---
title: 容量を「2 のべき乗 − 1」に固定して、全部をビット演算にする
description: SwissTable の容量はいつも 1, 3, 7, 15, … のどれか。その判定・切り上げ・倍化を、ビット演算 1〜2 回で書いた小さな constexpr 関数群。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/raw_hash_set.h
lines: [464, 501]
function: NormalizeCapacity
difficulty: 1
tags: [ビット演算, ハッシュ, データ構造, 最適化]
---

## ひとことで

Abseil のハッシュテーブルは、スロット数（容量）を **必ず `2^m - 1`**（1, 3, 7, 15, 31, …）にしています。
ここに並ぶ関数は、その容量を「正しい値か判定する」「正しい値に切り上げる」「1 段大きく・小さくする」ためのものです。
どれもビット演算 1〜2 回で書かれています。

## コード

::: code-group

```cpp:line-numbers=464 [日本語訳]
// `n` が正しい容量（つまりスロット数）かどうかを返す。
//
// 正しい容量とは、0 でない `2^m - 1` の形の整数である。
constexpr bool IsValidCapacity(size_t n) { return ((n + 1) & n) == 0 && n > 0; }

// キーのハッシュ計算すら要らないほど表が小さいかどうか。
constexpr bool IsSmallCapacity(size_t capacity) {
  return capacity <= kMaxSmallCapacity;
}

// 表全体が 1 つの探索グループに収まるかどうか。
// そのような表では、要素がどんな順に並んでいても正しく動く。
constexpr bool is_single_group(size_t capacity) {
  return capacity <= Group::kWidth;
}

// `cap` が、ブロックされた要素を保持できる表の容量として
// 正しいかどうか。
constexpr bool IsCapacityValidForBlockedElements(size_t cap) {
  return !IsSmallCapacity(cap);
}

// `IsValidCapacity` の意味で、`n` を次の正しい容量に変換する。
constexpr size_t NormalizeCapacity(size_t n) {
  return n ? ~size_t{} >> countl_zero(n) : 1;
}

// `n` の次の正しい容量を返す。
constexpr size_t NextCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n) || n == 0);
  return n * 2 + 1;
}

// `n` の前の正しい容量を返す。
constexpr size_t PreviousCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n));
  return n / 2;
}
```

```cpp:line-numbers=464 [原文]
// Returns whether `n` is a valid capacity (i.e., number of slots).
//
// A valid capacity is a non-zero integer `2^m - 1`.
constexpr bool IsValidCapacity(size_t n) { return ((n + 1) & n) == 0 && n > 0; }

// Whether a table is small enough that we don't need to hash any keys.
constexpr bool IsSmallCapacity(size_t capacity) {
  return capacity <= kMaxSmallCapacity;
}

// Whether a table fits entirely into a probing group.
// Arbitrary order of elements in such tables is correct.
constexpr bool is_single_group(size_t capacity) {
  return capacity <= Group::kWidth;
}

// Whether `cap` is a valid capacity for a table that can store blocked
// elements.
constexpr bool IsCapacityValidForBlockedElements(size_t cap) {
  return !IsSmallCapacity(cap);
}

// Converts `n` into the next valid capacity, per `IsValidCapacity`.
constexpr size_t NormalizeCapacity(size_t n) {
  return n ? ~size_t{} >> countl_zero(n) : 1;
}

// Returns the next valid capacity after `n`.
constexpr size_t NextCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n) || n == 0);
  return n * 2 + 1;
}

// Returns the previous valid capacity before `n`.
constexpr size_t PreviousCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n));
  return n / 2;
}
```

:::

## 前提知識

- **`constexpr` 関数**: 引数がコンパイル時に分かっていれば、コンパイル時に計算できる関数です。実行時にも普通の関数として呼べます。
- **`size_t`**: 符号なし整数型で、64 ビット環境なら 64 ビットです。
- **`~size_t{}`**: `size_t{}` は値 0 の `size_t`。`~` で全ビットを反転するので、**全ビットが 1**（最大値）になります。
- **`countl_zero(n)`**: 上位から数えて 0 が何個続くか（leading zeros）を返します。Abseil 版の `std::countl_zero` です。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、偽なら `c` になる式です。C++ では整数 0 は偽、それ以外は真として扱えます。
- **`Group::kWidth`**: 一度に SIMD で調べるスロット数（SSE2 環境なら 16）です。

## 何をしているか

### 1. 正しい容量か

```cpp:line-numbers=467
constexpr bool IsValidCapacity(size_t n) { return ((n + 1) & n) == 0 && n > 0; }
```

`((n + 1) & n) == 0` は「`n` が `0b0...0111...1` の形か」を調べています。
たとえば `n = 7`（`0b0111`）なら `n + 1 = 8`（`0b1000`）で、AND は 0 です。`n = 6`（`0b0110`）なら `7 & 6 = 6` で 0 になりません。
`n = 0` もこの式を通ってしまうので、`n > 0` で除外しています。

### 2. 切り上げ

```cpp:line-numbers=487
constexpr size_t NormalizeCapacity(size_t n) {
  return n ? ~size_t{} >> countl_zero(n) : 1;
}
```

`NormalizeCapacity(n)` は、`n` 以上で最小の正しい容量を返します。
`n = 10`（`0b1010`）の場合、64 ビットでの leading zeros は 60 個です。全ビット 1 の値を 60 ビット右にずらすと、下位 4 ビットだけが残って `0b1111 = 15` になります。

```
n = 10 → 15,  n = 15 → 15,  n = 16 → 31,  n = 0 → 1
```

`n` の最上位ビットより下を全部 1 にする、という発想です。`n = 0` は leading zeros が 64 で、64 ビットのシフトは C++ では未定義動作になるため、三項演算子で先に `1` を返しています。

### 3. 倍化と半分

```cpp:line-numbers=492
constexpr size_t NextCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n) || n == 0);
  return n * 2 + 1;
}

// Returns the previous valid capacity before `n`.
constexpr size_t PreviousCapacity(size_t n) {
  ABSL_SWISSTABLE_ASSERT(IsValidCapacity(n));
  return n / 2;
}
```

`2^m - 1` を 2 倍して 1 足すと `2^(m+1) - 1` になります（7 → 15）。逆に 2 で割ると（切り捨て）1 段小さい容量になります（15 → 7）。

### 4. そのほかの判定

```cpp:line-numbers=470
constexpr bool IsSmallCapacity(size_t capacity) {
  return capacity <= kMaxSmallCapacity;
}

// Whether a table fits entirely into a probing group.
// Arbitrary order of elements in such tables is correct.
constexpr bool is_single_group(size_t capacity) {
  return capacity <= Group::kWidth;
}

// Whether `cap` is a valid capacity for a table that can store blocked
// elements.
constexpr bool IsCapacityValidForBlockedElements(size_t cap) {
  return !IsSmallCapacity(cap);
}
```

容量 1 以下は「ハッシュすら計算しない小さな表」、`Group::kWidth` 以下は「全体が 1 グループに収まる表」として特別扱いされます。

## ここがすごい

- **余りの計算が `&` になる**: 容量が `2^m - 1` なので、ハッシュ値 `h` から位置を求める `h % (容量 + 1)` は `h & 容量` と書けます。容量そのものがマスク（AND で下位ビットを取り出すための値）を兼ねているのがうまいところです。
- **番兵とも相性がよい**: ファイル冒頭のコメントによると、制御バイトの配列は「容量ぶんの制御バイト」の直後に番兵（`kSentinel`）を 1 つ置き、イテレータはそこで止まります。スロットを `2^m - 1` 個にしておけば、マスクとして使える値と「ループの終わり」の両方をきれいに持てます。
- **ループのない切り上げ**: 「次の 2 のべき乗」を求めるとき、素直に書くと `while (p < n) p *= 2;` のようなループになります。ここでは leading zeros を数える命令（多くの CPU で 1 命令）とシフトだけで済ませています。
- **`constexpr` で書かれている**: コンパイル時に容量が分かる場面では、計算自体が消えます。

## まとめ

- `((n + 1) & n) == 0` で「下位ビットがすべて 1 の数」かを判定できる。
- `~0 >> countl_zero(n)` で「n 以上の最小の 2^m − 1」が求まる。0 の場合のシフトには注意。
- 容量を 2^m − 1 にそろえると、容量そのものをマスクとして使える。
- サイズの規則を 1 つに決めると、まわりの計算がすべてビット演算に落ちる。
