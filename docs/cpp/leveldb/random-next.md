---
title: 割り算なしで「2^31-1 で割った余り」を求める乱数生成器
description: LevelDB の簡易乱数生成器。Park–Miller 法の剰余計算を、2^31 ≡ 1 (mod 2^31-1) という性質を使ってシフトと足し算だけで済ませている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/random.h
lines: [26, 46]
function: Random::Next
difficulty: 3
format: 2
tags: [乱数, 数値計算, ビット演算]
---

## ひとことで

`Random::Next` は、次の疑似乱数を返す関数です。中身は `seed = seed × 16807 mod (2^31 − 1)` という、昔からある Park–Miller 型の線形合同法です。
おもしろいのは「`mod (2^31 − 1)`」の計算で、**割り算命令を使わず**、シフトと AND と足し算だけで余りを出しているところです。

## コード

::: code-group

```cpp:line-numbers=26 [日本語訳]
  uint32_t Next() {
    static const uint32_t M = 2147483647L;  // 2^31-1
    static const uint64_t A = 16807;        // ビット 14, 8, 7, 5, 2, 1, 0
    // 計算しているのは
    //       seed_ = (seed_ * A) % M,    ただし M = 2^31-1
    //
    // seed_ は 0 や M であってはならない。そうでないと以後の値はすべて
    // それぞれ 0 か M になる。それ以外の値なら、seed_ は最終的に
    // [1,M-1] のすべての数を巡回する
    uint64_t product = seed_ * A;

    // ((x << 31) % M) == x という事実を使って (product % M) を計算する。
    seed_ = static_cast<uint32_t>((product >> 31) + (product & M));
    // 最初の簡約は 1 ビットあふれることがあるので、もう一度
    // 引く必要があるかもしれない。mod == M にはならないので、> を使うと
    // 符号ビットによる速い判定ができる。
    if (seed_ > M) {
      seed_ -= M;
    }
    return seed_;
  }
```

```cpp:line-numbers=26 [原文]
  uint32_t Next() {
    static const uint32_t M = 2147483647L;  // 2^31-1
    static const uint64_t A = 16807;        // bits 14, 8, 7, 5, 2, 1, 0
    // We are computing
    //       seed_ = (seed_ * A) % M,    where M = 2^31-1
    //
    // seed_ must not be zero or M, or else all subsequent computed values
    // will be zero or M respectively.  For all other values, seed_ will end
    // up cycling through every number in [1,M-1]
    uint64_t product = seed_ * A;

    // Compute (product % M) using the fact that ((x << 31) % M) == x.
    seed_ = static_cast<uint32_t>((product >> 31) + (product & M));
    // The first reduction may overflow by 1 bit, so we may need to
    // repeat.  mod == M is not possible; using > allows the faster
    // sign-bit-based test.
    if (seed_ > M) {
      seed_ -= M;
    }
    return seed_;
  }
```

:::

## 前提知識

- **`uint32_t` / `uint64_t`**: それぞれ 32 ビット・64 ビットの符号なし整数です。`<cstdint>` で定義される、大きさが決まった型です。
- **`static const`（関数の中）**: 関数の中の `static const` は、呼び出しのたびに作り直されない定数です。ここでは単に名前付きの定数として使っています。
- **`2147483647L`**: 末尾の `L` は `long` 型のリテラル（そのまま書いた値）であることを表します。値は 2^31 − 1 です。
- **`static_cast<uint32_t>(x)`**: `x` を 32 ビット整数に明示的に変換します。上位ビットは切り捨てられます。
- **`>>` と `&`**: `x >> 31` は右に 31 ビットずらす（2^31 で割って切り捨て）、`x & M` は M の 1 のビットだけを残します。`M = 2^31 − 1` は下位 31 ビットがすべて 1 なので、`x & M` は「下位 31 ビット」を取り出します。
- **`seed_ * A`**: `seed_` は 32 ビットですが、`A` が 64 ビット型なので、掛け算は 64 ビットで行われます。上位ビットがあふれません。

## 何をしているか

### 1. 掛け算する

```cpp:line-numbers=35
    uint64_t product = seed_ * A;
```
`seed_` は 1〜2^31−2 の値です。`A = 16807` は 2^15 より小さいので、積 `product` は 2^46 未満に収まり、64 ビットで安全に計算できます。

### 2. 余りを「上半分 + 下半分」で求める

```cpp:line-numbers=37
    // ((x << 31) % M) == x という事実を使って (product % M) を計算する。
    seed_ = static_cast<uint32_t>((product >> 31) + (product & M));
```
`product` を 2^31 を境に 2 つに分けます。`hi = product >> 31`（上位）、`lo = product & M`（下位 31 ビット）とすると、`product = hi × 2^31 + lo` です。
ここで 2^31 = M + 1 なので、M で割った余りで考えると **2^31 は 1 と同じ** です。よって `product ≡ hi + lo (mod M)` になります。コメントの「`((x << 31) % M) == x`」はこのことです。

具体的に追ってみます。種が 1 なら、`product = 16807` で `hi = 0`、結果は 16807 です。次は `16807 × 16807 = 282475249` で、これも 2^31 未満なので `hi = 0`、そのまま 282475249 です。
その次は `282475249 × 16807 = 4747561509943` です。`hi = 2210`、`lo = 1622647863` となり、足して **1622650073** になります。これは実際に割り算したときの余りと一致します。

### 3. 1 回だけ引き直す

```cpp:line-numbers=42
    if (seed_ > M) {
      seed_ -= M;
    }
```
`hi + lo` は最大で約 2^31 + 2^15 なので、M を少し超えることがあります。そのときは M を 1 回引けば範囲に戻ります。
コメントのとおり、ちょうど M になることは起こりません。だから `>=` ではなく `>` で比べています。`seed_ > M` は「32 ビットの最上位ビットが立っているか」と同じ意味なので、CPU にとって判定が速い、という狙いもコメントに書かれています。

## ここがすごい

- **割り算を消している**: 64 ビットの `%` は、足し算やシフトよりずっと重い命令です。M が 2^31 − 1 という特別な形（メルセンヌ数）であることを使い、`%` をシフト・AND・足し算・比較に置き換えています。
- **0 と M を避ける**: コメントにあるとおり、種が 0 か M だと以後ずっと同じ値になります。コンストラクタで、そうした悪い種を 1 に置き換えています。

```cpp:line-numbers=20
  explicit Random(uint32_t s) : seed_(s & 0x7fffffffu) {
    // 悪い種を避ける。
    if (seed_ == 0 || seed_ == 2147483647L) {
      seed_ = 1;
    }
  }
```

それ以外の種なら 1〜M−1 のすべての値を一巡します。
- **用途に合った割り切り**: クラスのコメントには「本当にランダムなビットを作るのは得意ではないが、このパッケージには十分」とあります。スキップリストの高さ決めやテストに使うだけなので、暗号用のような質は求めず、軽さを優先しています。

## まとめ

- `2^k − 1` で割った余りは、「上位 + 下位」を足して 1 回補正するだけで求まる。
- 掛け算の結果があふれないよう、片方を 64 ビット型にして計算する。
- 乱数生成器では、抜け出せない「悪い種」をはじめに除外しておく。
- 乱数の質は用途で決める。暗号に使わないなら、単純で速いもので十分なことが多い。
