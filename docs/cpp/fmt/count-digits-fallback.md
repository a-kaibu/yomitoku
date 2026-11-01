---
title: 4 桁ずつまとめて割る、素朴だけど速い桁数カウント
description: CPU 命令に頼れない環境やコンパイル時計算のための、桁数を数える予備の実装。割り算を 4 桁に 1 回へ減らすだけで、素直なループよりずっと速くなる。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1251, 1263]
function: detail::count_digits_fallback
difficulty: 1
format: 2
tags: [最適化, アルゴリズム, 数値計算]
---

## ひとことで

整数 `n` が 10 進で何桁かを返す関数です。`7` なら 1、`12345` なら 5 です。

{fmt} には CLZ 命令を使った速い版もありますが、それが使えない環境や、コンパイル時に計算するときはこの関数が使われます。工夫は **「割り算を 4 桁に 1 回しかしない」** ことです。

## コード

::: code-group

```cpp:line-numbers=1251 [日本語訳]
template <typename T> FMT_CONSTEXPR auto count_digits_fallback(T n) -> int {
  int count = 1;
  for (;;) {
    // 整数の割り算は遅いので、1 桁ごとではなく 4 桁のまとまりごとに
    // 割る。このアイデアは Alexandrescu の講演
    // "Three Optimization Tips for C++" による。比較は speed-test を参照。
    if (n < 10) return count;
    if (n < 100) return count + 1;
    if (n < 1000) return count + 2;
    if (n < 10000) return count + 3;
    n /= 10000u;
    count += 4;
  }
```

```cpp:line-numbers=1251 [原文]
template <typename T> FMT_CONSTEXPR auto count_digits_fallback(T n) -> int {
  int count = 1;
  for (;;) {
    // Integer division is slow so do it for a group of four digits instead
    // of for every digit. The idea comes from the talk by Alexandrescu
    // "Three Optimization Tips for C++". See speed-test for a comparison.
    if (n < 10) return count;
    if (n < 100) return count + 1;
    if (n < 1000) return count + 2;
    if (n < 10000) return count + 3;
    n /= 10000u;
    count += 4;
  }
```

:::

## 前提知識

- **`template <typename T>`**: テンプレートです。`T` には `uint32_t` や `uint64_t`、128 ビット整数などの型が入ります。同じコードから、型ごとの関数をコンパイラが作ってくれます。
- **`FMT_CONSTEXPR`**: 対応するコンパイラでは `constexpr` に展開されるマクロです。`constexpr` 関数はコンパイル時にも実行できます。
- **`auto f(...) -> int`**: 戻り値の型を後ろに書く書き方（後置戻り値型）です。`int f(...)` と同じ意味です。
- **`for (;;)`**: 条件のない無限ループです。中の `return` で抜けます。
- **`10000u`**: 末尾の `u` は符号なし整数の定数という意味です。`n` が符号なしなので型をそろえています。
- **`n /= 10000u`**: `n = n / 10000u` の短縮形です。整数の割り算なので小数点以下は切り捨てです。

## 何をしているか

### 1. 小さい数は比較だけで答える

```cpp:line-numbers=1256
    // "Three Optimization Tips for C++" による。比較は speed-test を参照。
    if (n < 10) return count;
    if (n < 100) return count + 1;
    if (n < 1000) return count + 2;
```

`n` が 1 万未満なら、比較を最大 4 回するだけで桁数がわかります。

- `n = 7`: `7 < 10` なので `count`（1）を返す → **1**
- `n = 345`: `345 < 1000` で `count + 2` → **3**

### 2. 大きい数は 4 桁ずつ削る

```cpp:line-numbers=1260
    if (n < 10000) return count + 3;
    n /= 10000u;
```

1 万以上なら、1 万で割って下の 4 桁を捨て、`count` に 4 を足して繰り返します。

`n = 12345678` の例:

1. 1 周目: どの比較にも当てはまらない → `n = 1234`、`count = 5`
2. 2 周目: `1234 < 10000` → `count + 3 = 8` を返す → **8**

割り算は 1 回だけで済みました。素直に 10 で割り続けると 7 回かかります。

## ここがすごい

- **割り算は高い、比較は安い**: 整数の割り算は、足し算や比較に比べてずっと時間がかかる命令です。比較を増やしてでも割り算を減らす、という交換が効きます。コメントにあるとおり、これは Alexandrescu の講演「Three Optimization Tips for C++」から来たアイデアです。
- **4 という数の選び方**: 1 回の割り算で 4 桁進み、そのぶん比較は 4 回に増えます。まとめる桁を増やすと比較が増え、減らすと割り算が増えます。そのバランスを取った値です。
- **予備の実装としての価値**: 速い版は CPU 固有の命令に頼るので、コンパイル時（`constexpr`）には使えません。この関数は標準的な演算だけでできているので、どこでも動きます。
- **型を選ばない**: テンプレートなので 128 ビット整数にもそのまま使えます。実際、128 ビット版の `count_digits` もコンパイル時にはこの関数を呼びます。

## まとめ

- 重い演算（割り算）を軽い演算（比較）と交換すると速くなることがある。
- 「何個ずつまとめて処理するか」はトレードオフで、ちょうどよい値がある。
- 速い実装の横に、どこでも動く予備の実装を置いておくと移植性が上がる。
- テンプレートにすれば、1 つのコードをいろいろな整数型で使い回せる。
