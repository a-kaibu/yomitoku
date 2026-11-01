---
title: 半分ずつシフトして試す、二分探索による先頭の 0 の数え方
description: 上位から続く 0 の数を数える countl_zero の constexpr 版です。16, 8, 4, 2, 1 ビットと半分ずつずらしてみて、0 になるかで答えのビットを 1 つずつ決めていきます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/bit.h
lines: [232, 255]
function: llvm::countl_zero_constexpr
difficulty: 2
format: 2
tags: [ビット演算, アルゴリズム, 探索]
---

## ひとことで

`countl_zero_constexpr` は、整数の **最上位ビットから数えて 0 が何個続くか** を返します。
32 ビットの `0xF0`（2 進数で `1111 0000`）なら、上に 0 が 24 個並んでいるので 24 です。

1 ビットずつ見ると最大 32 回かかりますが、この関数は **二分探索** で、32 ビットなら 5 回、64 ビットなら 6 回のループで答えを出します。

## コード

::: code-group

```cpp:line-numbers=232 [日本語訳]
/// 最上位ビットから最下位に向かって 0 の数を数え、
///   最初の 1 で止まる。
///
/// countl_zero の constexpr 版。
///
/// 符号なし整数型だけを受け付ける。
///
/// 入力が 0 のときは std::numeric_limits<T>::digits を返す。
template <typename T> [[nodiscard]] constexpr int countl_zero_constexpr(T Val) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (!Val)
    return std::numeric_limits<T>::digits;

  unsigned ZeroBits = 0;
  for (T Shift = std::numeric_limits<T>::digits >> 1; Shift; Shift >>= 1) {
    T Tmp = Val >> Shift;
    if (Tmp)
      Val = Tmp;
    else
      ZeroBits |= Shift;
  }
  return ZeroBits;
}
```

```cpp:line-numbers=232 [原文]
/// Count number of 0's from the most significant bit to the least
///   stopping at the first 1.
///
/// A constexpr version of countl_zero.
///
/// Only unsigned integral types are allowed.
///
/// Returns std::numeric_limits<T>::digits on an input of 0.
template <typename T> [[nodiscard]] constexpr int countl_zero_constexpr(T Val) {
  static_assert(std::is_unsigned_v<T>,
                "Only unsigned integral types are allowed.");
  if (!Val)
    return std::numeric_limits<T>::digits;

  unsigned ZeroBits = 0;
  for (T Shift = std::numeric_limits<T>::digits >> 1; Shift; Shift >>= 1) {
    T Tmp = Val >> Shift;
    if (Tmp)
      Val = Tmp;
    else
      ZeroBits |= Shift;
  }
  return ZeroBits;
}
```

:::

## 前提知識

- **`constexpr` 関数**: コンパイル時にも計算できる関数です。CPU 専用の組み込み関数はこの中で使えないことがあるため、純粋な演算だけで書かれた版が必要になります。
- **`std::numeric_limits<T>::digits`**: 型 `T` の値を表すビット数です。`uint32_t` なら 32 です。
- **`for (初期化; 条件; 更新)`**: C 系言語のループです。ここでは `Shift` を 16 → 8 → 4 → 2 → 1 と半分にし、0 になったら止まります。
- **`>>=` と `|=`**: `a >>= b` は `a = a >> b`、`a |= b` は `a = a | b` の省略形です。
- **二分探索**: 答えの範囲を毎回半分に絞り込む探し方です。

## 何をしているか

### 1. 0 は特別扱い

```cpp:line-numbers=243
  if (!Val)
    return std::numeric_limits<T>::digits;
```

すべて 0 ならビット数（32）を返します。この後の処理は「どこかに 1 がある」前提です。

### 2. 半分ずらして 0 になるか試す

```cpp:line-numbers=247
  for (T Shift = std::numeric_limits<T>::digits >> 1; Shift; Shift >>= 1) {
    T Tmp = Val >> Shift;
    if (Tmp)
      Val = Tmp;
    else
      ZeroBits |= Shift;
  }
```

考え方は「`Val` を `Shift` ビット右へずらして、まだ何か残るか」です。

- 残る（`Tmp != 0`）なら、最上位の 1 は下から `Shift` ビットより上にあります。`Val = Tmp` として上半分に注目を移します。
- 残らない（`Tmp == 0`）なら、上の `Shift` ビットはすべて 0 です。答えに `Shift` を足します（`ZeroBits |= Shift`）。

### 3. `0xF0` で追ってみる（32 ビット）

| Shift | Val >> Shift | 結果 | ZeroBits |
| --- | --- | --- | --- |
| 16 | 0 | 上 16 ビットは 0 | 16 |
| 8 | 0 | さらに 8 ビット 0 | 24 |
| 4 | `0xF` | 残る → `Val = 0xF` | 24 |
| 2 | `0x3` | 残る → `Val = 0x3` | 24 |
| 1 | `0x1` | 残る → `Val = 0x1` | 24 |

答えは 24 です。確かに `0xF0` の最上位の 1 はビット 7 なので、`32 - 8 = 24` 個の 0 が上にあります。

### 4. 足し算ではなく OR

`Shift` は 16, 8, 4, 2, 1 と 2 のべき乗で、それぞれ 1 回しか足されません。だから `+=` の代わりに `|=` で、答えのビットを 1 つずつ立てる形で書けます。

## ここがすごい

- **ループ回数がビット数の log**: 32 ビットで 5 回、64 ビットで 6 回です。入力がどんな値でも回数は変わりません。
- **答えを 2 進数の桁ごとに決める**: 「上 16 ビットは全部 0 か？」の答えが、そのまま答えの 16 の位のビットになっています。二分探索と 2 進表現がうまく対応しています。
- **型に依存しない**: `Shift` の初期値を `digits >> 1` にしているので、8, 16, 32, 64 ビットのどの型でも同じコードで動きます。
- **高速版との分担**: すぐ下の `countl_zero`は組み込み関数で 1 命令にしようとし、使えない環境ではこの関数に頼ります。

## まとめ

- 「最上位の 1 の位置」は、半分ずつシフトして試す二分探索で求められる。
- 2 のべき乗の幅で探すと、答えの各ビットを 1 つずつ確定できる。
- `numeric_limits<T>::digits` を使えば、どの幅の整数にも同じコードが使える。
- `constexpr` 用の素直な実装と、実行時用の高速な実装を分けて用意する。

