---
title: コイン投げと log2 で決める、スキップリストの「段数」
description: 低レベルアロケータが空きブロックに割り当てるスキップリストの段数を決める関数。大きなブロックほど段を多くし、乱数でばらつきを加え、ブロックに収まる範囲に切り詰める。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/low_level_alloc.cc
lines: [130, 159]
function: LLA_SkiplistLevels
difficulty: 2
tags: [データ構造, 乱数, メモリ管理]
---

## ひとことで

スキップリストでは、各要素が「何段目まで参加するか」（段数）を乱数で決めます。半分の要素は 1 段、4 分の 1 は 2 段、8 分の 1 は 3 段…となるようにすると、探索が速くなります。
`LLA_SkiplistLevels` は Abseil の低レベルアロケータで、空きメモリブロックの段数を決める関数です。普通のスキップリストと違い、**ブロックの大きさも段数に反映** し、さらに **ブロックに収まる段数に切り詰め** ます。

## コード

::: code-group

```cpp:line-numbers=130 [日本語訳]
// 乱数 n を返す: 1 <= n なら p(n)=1/(2**n)、n < 1 なら p(n)=0。
static int Random(uint32_t *state) {
  uint32_t r = *state;
  int result = 1;
  while ((((r = r * 1103515245 + 12345) >> 30) & 1) == 0) {
    result++;
  }
  *state = r;
  return result;
}

// 大きさ size バイトのノードに与えるスキップリストの段数を返す。
// base はノードの最小サイズ。level=log2(size / base)+n を計算する。
// n は random が false なら 1、そうでなければスキップリストの標準的な分布で
// 生成した乱数（上の Random() を参照）。
// log2(size / base) の項のおかげで、大きなノードほど段が多くなりやすく、
// first-fit の探索で触るノードが減る。"level" は
// level<kMaxLevel かつ next[level-1] がノードに収まるよう切り詰める。
// 0 < LLA_SkiplistLevels(x,y,false) <= LLA_SkiplistLevels(x,y,true) < kMaxLevel
static int LLA_SkiplistLevels(size_t size, size_t base, uint32_t *random) {
  // max_fit は、この大きさのノードに収まる段数の最大値。
  // 乱数生成器が何を言おうと、
  // max_fit より多くは返せない。
  size_t max_fit = (size - offsetof(AllocList, next)) / sizeof(AllocList *);
  int level = IntLog2(size, base) + (random != nullptr ? Random(random) : 1);
  if (static_cast<size_t>(level) > max_fit) level = static_cast<int>(max_fit);
  if (level > kMaxLevel - 1) level = kMaxLevel - 1;
  ABSL_RAW_CHECK(level >= 1, "block not big enough for even one level");
  return level;
}
```

```cpp:line-numbers=130 [原文]
// Return a random integer n:  p(n)=1/(2**n) if 1 <= n; p(n)=0 if n < 1.
static int Random(uint32_t *state) {
  uint32_t r = *state;
  int result = 1;
  while ((((r = r * 1103515245 + 12345) >> 30) & 1) == 0) {
    result++;
  }
  *state = r;
  return result;
}

// Return a number of skiplist levels for a node of size bytes, where
// base is the minimum node size.  Compute level=log2(size / base)+n
// where n is 1 if random is false and otherwise a random number generated with
// the standard distribution for a skiplist:  See Random() above.
// Bigger nodes tend to have more skiplist levels due to the log2(size / base)
// term, so first-fit searches touch fewer nodes.  "level" is clipped so
// level<kMaxLevel and next[level-1] will fit in the node.
// 0 < LLA_SkiplistLevels(x,y,false) <= LLA_SkiplistLevels(x,y,true) < kMaxLevel
static int LLA_SkiplistLevels(size_t size, size_t base, uint32_t *random) {
  // max_fit is the maximum number of levels that will fit in a node for the
  // given size.   We can't return more than max_fit, no matter what the
  // random number generator says.
  size_t max_fit = (size - offsetof(AllocList, next)) / sizeof(AllocList *);
  int level = IntLog2(size, base) + (random != nullptr ? Random(random) : 1);
  if (static_cast<size_t>(level) > max_fit) level = static_cast<int>(max_fit);
  if (level > kMaxLevel - 1) level = kMaxLevel - 1;
  ABSL_RAW_CHECK(level >= 1, "block not big enough for even one level");
  return level;
}
```

:::

## 前提知識

- **スキップリスト**: 連結リストに「急行」の段を重ねたデータ構造です。上の段ほど要素がまばらで、上から順に降りながら探します。
- **`uint32_t *state`**: 乱数の状態を指すポインタです。関数の中で `*state = r;` と書くと、呼び出し元の変数が更新されます。
- **線形合同法**: `r = r * 1103515245 + 12345` を繰り返して疑似乱数を作る方法です。この定数は C の `rand()` の古典的な実装例で使われてきたものです。
- **`offsetof(AllocList, next)`**: 構造体 `AllocList` の先頭から、メンバ `next` までのバイト数です。
- **`size_t`**: 大きさや個数を表す符号なし整数型です。
- **`ABSL_RAW_CHECK(条件, "メッセージ")`**: 条件が偽ならメッセージを出してプログラムを止めるマクロです。`malloc` を使わない低レベル版のチェックです。
- **`random != nullptr ? … : 1`**: ポインタが渡されていれば乱数を使い、`nullptr` なら 1 を使う、という条件演算子です。

## 何をしているか

### 1. コイン投げ

```cpp:line-numbers=130
// 乱数 n を返す: 1 <= n なら p(n)=1/(2**n)、n < 1 なら p(n)=0。
static int Random(uint32_t *state) {
  uint32_t r = *state;
  int result = 1;
  while ((((r = r * 1103515245 + 12345) >> 30) & 1) == 0) {
    result++;
  }
  *state = r;
  return result;
}
```

`Random` は、1 から始めて、乱数のある 1 ビット（`>> 30` で取り出した 30 ビット目）が 0 の間だけ数を増やします。
そのビットが 1 になる確率は 1/2 なので、結果が 1 になる確率は 1/2、2 になる確率は 1/4、3 になる確率は 1/8 です。`Random` のコメントの `p(n) = 1/(2**n)` はこの意味です。

下位のビットではなく 30 ビット目を使うのは、線形合同法の下位ビットは周期が短く、乱数として質が悪いからだと考えられます。

### 2. 大きさの対数

```cpp:line-numbers=119
static int IntLog2(size_t size, size_t base) {
  int result = 0;
  for (size_t i = size; i > base; i >>= 1) {  // i == floor(size/2**result)
    result++;
  }
  //    floor(size / 2**result) <= base < floor(size / 2**(result-1))
  // =>     log2(size/(base+1)) <= result < 1+log2(size/base)
  // => result ~= log2(size/base)
  return result;
}
```

`IntLog2(size, base)` は、`size` を何回半分にすれば `base` 以下になるかを数えます。おおよそ `log2(size / base)` です。
最小ブロックが 32 バイトで、`size = 256` なら、`256 → 128 → 64 → 32` で 3 回なので 3 になります。

### 3. 段数を決める

```cpp:line-numbers=149
static int LLA_SkiplistLevels(size_t size, size_t base, uint32_t *random) {
  // max_fit は、この大きさのノードに収まる段数の最大値。
  // 乱数生成器が何を言おうと、
  // max_fit より多くは返せない。
  size_t max_fit = (size - offsetof(AllocList, next)) / sizeof(AllocList *);
  int level = IntLog2(size, base) + (random != nullptr ? Random(random) : 1);
  if (static_cast<size_t>(level) > max_fit) level = static_cast<int>(max_fit);
  if (level > kMaxLevel - 1) level = kMaxLevel - 1;
  ABSL_RAW_CHECK(level >= 1, "block not big enough for even one level");
  return level;
}
```

段数は `IntLog2(size, base) + Random(random)` です。256 バイトのブロックで乱数が 1 なら 4 段です。

ただし、無制限に増やすわけにはいきません。

- `max_fit`: ブロックの中に `next` ポインタを何個置けるかです。ブロックの大きさから `next` より前の部分を引き、ポインタ 1 個の大きさで割ります。それより多い段数にはできません。
- `kMaxLevel - 1`: 配列 `next[kMaxLevel]` の大きさを超えないようにします。
- 最後に、1 段もとれないほど小さいブロックでないことを確認します。

## ここがすごい

- **大きいブロックを上の段に**: `LLA_SkiplistLevels` のコメントのとおり、大きなブロックほど段が多くなります。このアロケータは「最初に見つかった十分大きいブロック」を使う first-fit 方式なので、大きなブロックが上の段にいると、探索で触るノードが減ります。普通のスキップリストの「純粋な乱数」に、用途に合わせた重み付けを足した工夫です。
- **物理的な制約を守る**: スキップリストの段の情報（`next` 配列）は、空きブロックそのものの中に置かれます。小さなブロックに多くの段を割り当てると、ブロックからはみ出してしまいます。`max_fit` で切り詰めることで、この危険を防いでいます。
- **乱数を使わない選択肢**: `random` に `nullptr` を渡すと、乱数の代わりに 1 を足します。コメントの最後の不等式のとおり、これは「その大きさのブロックが必ず持つ最小の段数」です。メモリを確保する側はこれを使い、「要求サイズ以上のブロックは、少なくともこの段には必ずいる」と分かるので、その段から探し始めて小さなブロックを飛ばせます。段数に大きさを反映させたことが、探索の近道にもなっているのです。
- **乱数生成も自前**: このアロケータは `malloc` すら使えない場面のためのものなので、標準の乱数ライブラリにも頼らず、数行の線形合同法で済ませています。

## まとめ

- スキップリストの段数は「1/2 の確率で 1 段ずつ増やす」コイン投げで決めるのが基本。
- 用途に合わせて、要素の性質（ここではブロックの大きさ）で段数に重みを付けられる。
- データ構造の情報をメモリブロックの中に置くときは、物理的に収まる範囲に必ず切り詰める。
- 依存できるものが少ない低レベルのコードでは、小さな乱数生成器を自前で持つ。
