---
title: ハッシュ関数を「逆再生」する――掛け算の逆元と XOR シフトの解き方
description: 32 ビット整数を混ぜるハッシュ jenkins_rev_mix32 の逆関数。各手順の逆操作（2^32 を法とした逆元の掛け算、XOR シフトを解く式）を逆順に並べて、ハッシュ値から元の値を復元する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/hash/Hash.h
lines: [279, 300]
function: folly::hash::jenkins_rev_unmix32
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 数値計算]
---

## ひとことで

Folly には、32 ビット整数のビットをよく混ぜる `jenkins_rev_mix32` というハッシュ関数があります。名前の `rev` は reversible（逆にできる）の意味です。
`jenkins_rev_unmix32` はその **逆関数** で、ハッシュ値から元の整数を取り戻します。たとえば `mix(42)` は `321460029` になり、`unmix(321460029)` は `42` に戻ります。

「混ぜる」操作を 1 つずつ逆にして、逆の順番で並べる、というのが基本の考え方です。

## コード

::: code-group

```cpp:line-numbers=279 [日本語訳]
constexpr uint32_t jenkins_rev_unmix32(uint32_t key) noexcept {
  // これらは jenkins_rev_mix32 の掛け算の係数の、Z_2^32 におけるモジュラ逆元を
  // 逆順に並べたもの。
  // 拡張ユークリッドの互除法で計算した。参照:
  // http://en.wikipedia.org/wiki/Modular_multiplicative_inverse
  key *= 2364026753U;

  // a ^= (a >> n) の逆は次のとおり
  // b = a
  // for (int i = n; i < 32; i += n) {
  //   b ^= (a >> i);
  // }
  key ^= (key >> 2) ^ (key >> 4) ^ (key >> 6) ^ (key >> 8) ^ (key >> 10) ^
      (key >> 12) ^ (key >> 14) ^ (key >> 16) ^ (key >> 18) ^ (key >> 20) ^
      (key >> 22) ^ (key >> 24) ^ (key >> 26) ^ (key >> 28) ^ (key >> 30);
  key *= 3222273025U;
  key ^= (key >> 9) ^ (key >> 18) ^ (key >> 27);
  key *= 4042322161U;
  key ^= (key >> 22);
  key *= 16773121U;
  return key;
}
```

```cpp:line-numbers=279 [原文]
constexpr uint32_t jenkins_rev_unmix32(uint32_t key) noexcept {
  // These are the modular multiplicative inverses (in Z_2^32) of the
  // multiplication factors in jenkins_rev_mix32, in reverse order.  They were
  // computed using the Extended Euclidean algorithm, see
  // http://en.wikipedia.org/wiki/Modular_multiplicative_inverse
  key *= 2364026753U;

  // The inverse of a ^= (a >> n) is
  // b = a
  // for (int i = n; i < 32; i += n) {
  //   b ^= (a >> i);
  // }
  key ^= (key >> 2) ^ (key >> 4) ^ (key >> 6) ^ (key >> 8) ^ (key >> 10) ^
      (key >> 12) ^ (key >> 14) ^ (key >> 16) ^ (key >> 18) ^ (key >> 20) ^
      (key >> 22) ^ (key >> 24) ^ (key >> 26) ^ (key >> 28) ^ (key >> 30);
  key *= 3222273025U;
  key ^= (key >> 9) ^ (key >> 18) ^ (key >> 27);
  key *= 4042322161U;
  key ^= (key >> 22);
  key *= 16773121U;
  return key;
}
```

:::

参考までに、元の `jenkins_rev_mix32` の本体は次の手順です。

```cpp:line-numbers=262
  key += (key << 12); // key *= (1 + (1 << 12))
  key ^= (key >> 22);
  key += (key << 4); // key *= (1 + (1 << 4))
  key ^= (key >> 9);
  key += (key << 10); // key *= (1 + (1 << 10))
  key ^= (key >> 2);
  // key *= (1 + (1 << 7)) * (1 + (1 << 12))
  key += (key << 7);
  key += (key << 12);
```

## 前提知識

- **`uint32_t` の演算は 2^32 で割った余り**: 符号なし 32 ビット整数の足し算や掛け算はあふれると上位が捨てられます。つまり計算はいつも「2^32 を法とする」世界で行われます。
- **`key += (key << 12)` は掛け算**: `key << 12` は `key * 4096` なので、`key + key * 4096` は `key * 4097` です。
- **モジュラ逆元**: 2^32 を法とする世界で、奇数 `a` には `a * b ≡ 1` となる `b` が必ず 1 つあります。`b` を掛ければ `a` を掛けたことが打ち消されます。たとえば `4097 * 16773121` を 2^32 で割った余りは `1` です。
- **`constexpr` と `noexcept`**: `constexpr` はコンパイル時にも計算できること、`noexcept` は例外を投げないことを表します。
- **`^` と `>>`**: XOR と右シフトです。`key ^= key >> n` は「上位のビットを下位に混ぜる」操作です。

## 何をしているか

### 1. 手順を逆順にたどる

元の関数は「掛け算 → XOR シフト」を 3 回くり返し、最後に 2 回掛け算をします。逆関数は最後の手順から順に打ち消していきます。

| 逆関数の手順 | 打ち消す元の手順 |
| --- | --- |
| `key *= 2364026753U;` | 最後の `*(1+2^7)*(1+2^12)` |
| `key ^= (key >> 2) ^ …` | `^= key >> 2` |
| `key *= 3222273025U;` | `*(1+2^10)` |
| `key ^= (key >> 9) ^ …` | `^= key >> 9` |
| `key *= 4042322161U;` | `*(1+2^4)` |
| `key ^= (key >> 22);` | `^= key >> 22` |
| `key *= 16773121U;` | 最初の `*(1+2^12)` |

掛け算の逆は、コメントのとおり、拡張ユークリッドの互除法で求めた逆元を掛けることです。掛ける数 `1 + 2^k` はどれも奇数なので、必ず逆元があります。

### 2. XOR シフトの解き方

```cpp:line-numbers=286
  // The inverse of a ^= (a >> n) is
  // b = a
  // for (int i = n; i < 32; i += n) {
  //   b ^= (a >> i);
  // }
  key ^= (key >> 2) ^ (key >> 4) ^ (key >> 6) ^ (key >> 8) ^ (key >> 10) ^
      (key >> 12) ^ (key >> 14) ^ (key >> 16) ^ (key >> 18) ^ (key >> 20) ^
      (key >> 22) ^ (key >> 24) ^ (key >> 26) ^ (key >> 28) ^ (key >> 30);
```

`b = a ^ (a >> 2)` から `a` を取り戻すことを考えます。

`b` の最上位 2 ビットは、`a >> 2` の影響を受けないので `a` と同じです。その 2 ビットがわかれば、次の 2 ビットは `b` の値と XOR して求まります。これを上から順に続けると、全ビットが決まります。

まとめると、`a = b ^ (b >> 2) ^ (b >> 4) ^ … ^ (b >> 30)` になります。コメントにある一般形のとおり、シフト量の倍数ずつずらして XOR していけばよいのです。

- `>> 2` の逆は、2, 4, …, 30 の 15 項
- `>> 9` の逆は、9, 18, 27 の 3 項
- `>> 22` の逆は、22 の 1 項だけ。22 の 2 倍の 44 は 32 を超えるので、それ以上の項は 0 になります。

## ここがすごい

- **ハッシュなのに情報を捨てていない**: 足し算・掛け算（奇数）・XOR シフトは、どれも 32 ビットの値を 1 対 1 に写す操作です。組み合わせても 1 対 1 のままなので、衝突が 1 つも起きず、逆関数も作れます。
- **逆関数があるとうれしい場面**: 整数のキーをハッシュ値として保存しておき、必要なときに元のキーに戻す、といった使い方ができます。テストで「mix してから unmix すると元に戻る」ことを確認すれば、実装の正しさも検証しやすくなります。
- **定数の根拠をコメントに残す**: 突然現れる `2364026753` のような数も、「どの掛け算の逆元か」「どう計算したか」がコメントで説明されています。
- **XOR シフトの逆が手で書ける**: ループを使わずに項を展開して書いているので、コンパイラはこれを数個のシフトと XOR に直接変換できます。

なお、このファイルのコメントでは `jenkins_rev_mix32` は非推奨（DEPRECATED）とされ、新しいコードには `lowbias_mix32` が勧められています。逆関数の作り方は、どちらにも同じように当てはまります。

## まとめ

- 奇数の掛け算、XOR シフトは、どちらも逆にできる操作である。
- 逆にできる操作の組み合わせは、逆の操作を逆順に並べれば元に戻せる。
- 2^32 を法とする逆元は、拡張ユークリッドの互除法で求められる。
- `a ^= a >> n` の逆は、`n` の倍数ずつずらした値をすべて XOR すること。
