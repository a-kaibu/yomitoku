---
title: ロックを 1 個ずつキャッシュラインに隔離する配列
description: SpinLockArray は小さなロックを並べるとき、隣同士が同じキャッシュラインに乗らないよう詰め物をする配列。偽共有を型レベルで防ぐ設計を読む。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/MicroSpinLock.h
lines: [119, 146]
function: SpinLockArray
difficulty: 2
tags: [並行処理, キャッシュ, メモリ管理, メタプログラミング]
---

## ひとことで

`SpinLockArray<T, N>` は、ロック `T` を `N` 個並べた配列です。
ただし普通の配列と違い、**ロック 1 個ごとにキャッシュライン 1 本分の場所** を確保します。
データをいくつかの「区画（シャード）」に分け、区画ごとにロックを持たせる実装で使うことを想定しています。

## コード

::: code-group

```cpp:line-numbers=119 [日本語訳]
template <class T, size_t N>
struct alignas(max_align_v) SpinLockArray {
  T& operator[](size_t i) noexcept { return data_[i].lock; }

  const T& operator[](size_t i) const noexcept { return data_[i].lock; }

  constexpr size_t size() const noexcept { return N; }

 private:
  struct PaddedSpinLock {
    PaddedSpinLock() : lock() {}
    T lock;
    char padding[hardware_destructive_interference_size - sizeof(T)];
  };
  static_assert(
      sizeof(PaddedSpinLock) == hardware_destructive_interference_size,
      "Invalid size of PaddedSpinLock");

  // T が理論上キャッシュラインをまたぐ可能性がないか確認する。
  static_assert(
      max_align_v > 0 &&
          hardware_destructive_interference_size % max_align_v == 0 &&
          sizeof(T) <= max_align_v,
      "T can cross cache line boundaries");

  char padding_[hardware_destructive_interference_size];
  std::array<PaddedSpinLock, N> data_;
};
```

```cpp:line-numbers=119 [原文]
template <class T, size_t N>
struct alignas(max_align_v) SpinLockArray {
  T& operator[](size_t i) noexcept { return data_[i].lock; }

  const T& operator[](size_t i) const noexcept { return data_[i].lock; }

  constexpr size_t size() const noexcept { return N; }

 private:
  struct PaddedSpinLock {
    PaddedSpinLock() : lock() {}
    T lock;
    char padding[hardware_destructive_interference_size - sizeof(T)];
  };
  static_assert(
      sizeof(PaddedSpinLock) == hardware_destructive_interference_size,
      "Invalid size of PaddedSpinLock");

  // Check if T can theoretically cross a cache line.
  static_assert(
      max_align_v > 0 &&
          hardware_destructive_interference_size % max_align_v == 0 &&
          sizeof(T) <= max_align_v,
      "T can cross cache line boundaries");

  char padding_[hardware_destructive_interference_size];
  std::array<PaddedSpinLock, N> data_;
};
```

:::

## 前提知識

- **テンプレート（`template <class T, size_t N>`）**: 型や値を引数に取って、クラスを自動生成する仕組みです。`SpinLockArray<MicroSpinLock, 16>` と書くと「MicroSpinLock を 16 個持つ版」が作られます。`N` のように **値** をテンプレート引数にすることもできます。
- **`alignas(x)`**: その型や変数を、メモリ上で `x` バイトの倍数の番地に置くよう指定します。
- **`operator[]`**: `arr[i]` と書いたときに呼ばれる関数を自分で定義できます。
- **参照（`T&`）**: 変数の別名です。`T&` を返すと、呼び出し側は配列の中身を直接書き換えられます。`const T&` は読み取り専用の別名です。
- **`constexpr`**: コンパイル時に計算できる値・関数であることを示します。
- **`std::array<E, N>`**: 長さ `N` が固定の配列です。
- **キャッシュラインと偽共有**: CPU はメモリを 64 バイトなどの塊（キャッシュライン）単位で扱います。別々のスレッドが別々の変数を書いていても、それらが同じキャッシュラインにあると、CPU 同士がその塊を取り合って遅くなります。これを偽共有（false sharing）と呼びます。
- **`hardware_destructive_interference_size`**: 「この距離より離せば偽共有しない」というバイト数です。C++17 で標準に入った値で、Folly も同名の定数を持っています。

## 何をしているか

### 1. 1 個分の箱 PaddedSpinLock

```cpp:line-numbers=128
  struct PaddedSpinLock {
    PaddedSpinLock() : lock() {}
    T lock;
    char padding[hardware_destructive_interference_size - sizeof(T)];
  };
  static_assert(
      sizeof(PaddedSpinLock) == hardware_destructive_interference_size,
      "Invalid size of PaddedSpinLock");
```

`PaddedSpinLock` はロック本体 `lock` と、詰め物 `padding` を並べた構造体です。
詰め物の長さは `hardware_destructive_interference_size - sizeof(T)` です。
たとえば値が 64、`T` が 1 バイトの `MicroSpinLock` なら、詰め物は 63 バイトになり、合計ちょうど 64 バイトです。
`static_assert` で「合計がちょうど 64 バイトになったか」をコンパイル時に確かめています。

### 2. T がラインをまたがないか確認

```cpp:line-numbers=137
  // T が理論上キャッシュラインをまたぐ可能性がないか確認する。
  static_assert(
      max_align_v > 0 &&
          hardware_destructive_interference_size % max_align_v == 0 &&
          sizeof(T) <= max_align_v,
      "T can cross cache line boundaries");
```

`T` が `max_align_v`（その環境で最大のアライメント）以下の大きさで、64 がその倍数であることを確認します。
これが満たされれば、`T` がキャッシュラインの境目にまたがって置かれることはありません。

### 3. 先頭にも詰め物

```cpp:line-numbers=144
  char padding_[hardware_destructive_interference_size];
  std::array<PaddedSpinLock, N> data_;
```

`data_` の前に、`char padding_[64]` を置いています。
配列の直前にある別の変数が、最初のロックと同じキャッシュラインに入り込むのを防ぐためです。

### 4. 添字アクセス

```cpp:line-numbers=121
  T& operator[](size_t i) noexcept { return data_[i].lock; }

  const T& operator[](size_t i) const noexcept { return data_[i].lock; }

  constexpr size_t size() const noexcept { return N; }
```

`arr[3]` と書くと `data_[3].lock` への参照が返ります。
使う側は詰め物の存在を意識せず、普通の配列のように扱えます。
`size()` は `constexpr` なので、コンパイル時に `N` として扱えます。

## ここがすごい

- **偽共有を「型」で防ぐ**: 素直に `MicroSpinLock locks[16];` と書くと 16 バイトにぎっしり並び、全部が 1 本のキャッシュラインに乗ります。すると区画 0 を使うスレッドと区画 1 を使うスレッドが、別のロックなのに互いを遅くします。この配列はそれを構造的に起こらなくします。
- **メモリを惜しまない判断**: 1 バイトのロックに 64 バイトを使うのは贅沢に見えます。しかしクラス直前のコメントにあるとおり「競合が起きにくい環境での区画分けロック」が用途です。区画ごとに独立して速く動くことのほうが大事、という割り切りです。
- **前後両方を守る**: 要素間の詰め物だけでなく、配列の前にも詰め物を置いています。外側の変数との偽共有まで考えています。
- **前提が崩れたらコンパイルエラー**: 大きすぎる `T` を入れたなど、前提が崩れる使い方はすべて `static_assert` で弾かれます。

## まとめ

- 別スレッドが書く変数どうしは、キャッシュライン 1 本分以上離すと速くなる。
- 詰め物（パディング）を構造体に入れ、`static_assert` でサイズを固定すると、偽共有の防止を型で保証できる。
- 外から見た使い勝手は `operator[]` で普通の配列と同じに保てる。
- メモリと速度のトレードオフは、想定する使い方をコメントに残しておくと読み手が納得できる。

