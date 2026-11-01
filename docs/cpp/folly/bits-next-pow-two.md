---
title: 「次の 2 のべき乗」と「2 のべき乗か」を 1 行で判定する
description: v 以上で最小の 2 のべき乗を返す nextPowTwo と、2 のべき乗かを調べる isPowTwo。v-1 を使う小さなトリックで、ループも対数計算も使わずに答えを出す。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/Bits.h
lines: [181, 193]
function: folly::nextPowTwo / folly::isPowTwo
difficulty: 2
format: 2
tags: [ビット演算, イディオム, 最適化]
---

## ひとことで

`nextPowTwo(v)` は **`v` 以上で最小の 2 のべき乗** を返します。`5` なら `8`、`8` なら `8`、`0` なら `1` です。
`isPowTwo(v)` は **`v` が 2 のべき乗（1, 2, 4, 8, …）かどうか** を返します。

どちらもハッシュテーブルやバッファの容量を決めるときによく使われる処理です。2 つとも「`v - 1`」を使う小さなビットの技で書かれています。

## コード

```cpp:line-numbers=181
template <class T>
FOLLY_ALWAYS_INLINE constexpr T nextPowTwo(T const v) {
  static_assert(std::is_unsigned<T>::value, "signed type");
  return v ? (T(1) << findLastSet(v - 1)) : T(1);
}

template <class T>
inline constexpr bool isPowTwo(T const v) {
  static_assert(std::is_integral<T>::value, "non-integral type");
  static_assert(std::is_unsigned<T>::value, "signed type");
  static_assert(!std::is_same<T, bool>::value, "bool type");
  return (v != 0) && !(v & (v - 1));
}
```

## 前提知識

- **`template <class T>`**: 型 `T` を引数に取るテンプレートです。`uint32_t` でも `uint64_t` でも同じコードで使えます。
- **`constexpr`**: コンパイル時にも計算できる関数です。配列の大きさなど定数が必要な場所でも呼べます。
- **`static_assert` と `std::is_unsigned<T>::value`**: `T` が符号なし整数でなければコンパイルエラーにします。符号付きだと負の数で意味が崩れるためです。
- **`T(1) << n`**: `1` を型 `T` にしてから左に `n` ビットずらします。`2^n` になります。
- **`&` と `!`**: `&` はビットごとの AND、`!` は論理否定です。`!(x)` は「`x` が 0 なら真」です。
- **`findLastSet(x)`**: 同じファイルにある関数で、`x` のいちばん上の `1` が何桁目か（1 始まり）を返します。`findLastSet(4)` は `3`（`100`）、`findLastSet(0)` は `0` です。

## 何をしているか

### 1. nextPowTwo

```cpp:line-numbers=182
FOLLY_ALWAYS_INLINE constexpr T nextPowTwo(T const v) {
  static_assert(std::is_unsigned<T>::value, "signed type");
  return v ? (T(1) << findLastSet(v - 1)) : T(1);
}
```

`v ? (T(1) << findLastSet(v - 1)) : T(1)` という 1 行です。`v = 5` で追います。

- `v - 1` = `4`（2 進数 `100`）
- `findLastSet(4)` = `3`
- `1 << 3` = `8`

`v = 8` のときはどうでしょう。

- `v - 1` = `7`（`111`）
- `findLastSet(7)` = `3`
- `1 << 3` = `8`

ちょうど 2 のべき乗のときに、答えが **2 倍にならない** のがポイントです。`v` をそのまま使うと `findLastSet(8)` = `4` で `16` になってしまいます。先に 1 引いておくことで「`v` 以上」をきれいに表しています。

`v = 0` のときは `v - 1` が最大値に回り込んでしまうので、三項演算子で先に `1` を返しています。

### 2. isPowTwo

```cpp:line-numbers=187
template <class T>
inline constexpr bool isPowTwo(T const v) {
  static_assert(std::is_integral<T>::value, "non-integral type");
  static_assert(std::is_unsigned<T>::value, "signed type");
  static_assert(!std::is_same<T, bool>::value, "bool type");
  return (v != 0) && !(v & (v - 1));
}
```

`(v != 0) && !(v & (v - 1))` です。

2 のべき乗は 2 進数で `1` が 1 個だけの数です。`v - 1` をすると、その `1` が `0` になり、下の桁がすべて `1` になります。

```
v      = 1000  (8)
v - 1  = 0111  (7)
v & (v-1) = 0000   → 2 のべき乗
```

`1` が 2 個以上あると、上のほうの `1` は残ります。

```
v      = 1010  (10)
v - 1  = 1001  (9)
v & (v-1) = 1000   → 0 でないので 2 のべき乗ではない
```

`0` は `v & (v - 1)` も `0` になってしまうので、`v != 0` で別に除外しています。

## ここがすごい

- **ループが無い**: 素直に書くと「`p = 1; while (p < v) p *= 2;`」のようなループになり、64 ビットなら最大 64 回まわります。ここでは `findLastSet`（CPU の 1 命令に対応）と 1 回のシフトで済みます。
- **境界の扱いが 1 か所にまとまっている**: 「ちょうど 2 のべき乗」の場合を `v - 1` で、`0` の場合を三項演算子で処理しています。条件分岐をたくさん並べずに済んでいます。
- **`x & (x - 1)` は「いちばん下の 1 を消す」定番技**: これは popcount や集合の列挙などでもよく出てくるイディオムです。覚えておくと他のコードも読みやすくなります。
- **型の制約をコンパイル時に課す**: `static_assert` で符号付き整数や `bool` を拒否しています。`-4` が 2 のべき乗かどうか、のような曖昧な問いを最初から許さない設計です。

ただし `nextPowTwo` は、結果が型に入らないとき（`uint32_t` で `v` が 2^31 より大きいなど）は正しく動きません。呼び出す側が範囲を守る前提の関数です。

## まとめ

- `v - 1` を挟むと「ちょうど 2 のべき乗」の場合を自然に扱える。
- `x & (x - 1)` はいちばん下の `1` を消す。結果が 0 なら `1` は 1 個だけだった。
- 0 は多くのビット技の例外なので、別に扱う。
- 型の前提は `static_assert` でコンパイル時に確かめられる。
