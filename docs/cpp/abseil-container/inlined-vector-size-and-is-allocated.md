---
title: サイズとフラグを 1 つの整数に同居させる InlinedVector の節約術
description: absl::InlinedVector は「要素数」と「ヒープを使っているか」を 1 つの整数にまとめて持つ。最下位ビットをフラグにし、サイズは 1 ビットずらして保存する。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2019 The Abseil Authors.
file: absl/container/internal/inlined_vector.h
lines: [454, 483]
function: Storage::SetSize
difficulty: 1
tags: [ビット演算, メモリ管理, データ構造]
---

## ひとことで

`absl::InlinedVector<T, N>` は、要素が `N` 個以下のうちはオブジェクトの中（スタックなど）に要素を置き、それを超えるとヒープに移る可変長配列です。
そのため「いま何個入っているか」に加えて「いまヒープを使っているか」を覚えておく必要があります。
ここに並ぶ関数は、**その 2 つを 1 つの整数にまとめて読み書きする** ためのものです。最下位ビットがフラグ、残りのビットがサイズです。

## コード

```cpp:line-numbers=454
  void SetIsAllocated() {
    GetSizeAndIsAllocated() |= static_cast<SizeType<A>>(1);
  }

  void UnsetIsAllocated() {
    GetSizeAndIsAllocated() &= ((std::numeric_limits<SizeType<A>>::max)() - 1);
  }

  void SetSize(SizeType<A> size) {
    GetSizeAndIsAllocated() =
        (size << 1) | static_cast<SizeType<A>>(GetIsAllocated());
  }

  void SetAllocatedSize(SizeType<A> size) {
    GetSizeAndIsAllocated() = (size << 1) | static_cast<SizeType<A>>(1);
  }

  void SetInlinedSize(SizeType<A> size) {
    GetSizeAndIsAllocated() = size << static_cast<SizeType<A>>(1);
  }

  void AddSize(SizeType<A> count) {
    GetSizeAndIsAllocated() += count << static_cast<SizeType<A>>(1);
  }

  void SubtractSize(SizeType<A> count) {
    absl::base_internal::HardeningAssertLE(count, GetSize());

    GetSizeAndIsAllocated() -= count << static_cast<SizeType<A>>(1);
  }
```

## 前提知識

- **`SizeType<A>`**: アロケータ `A` が使うサイズの型で、ふつうは `size_t`（符号なし整数）です。
- **`GetSizeAndIsAllocated()`**: 「サイズとフラグ」をまとめた整数メンバへの **参照** を返す関数です。参照（`&` 付きの型）は別名のようなもので、`GetSizeAndIsAllocated() |= 1` と書くとメンバ本体が書き換わります。
- **複合代入 `|=` `&=` `+=` `-=`**: `x |= y` は `x = x | y` の省略形です。
- **`<<`（左シフト）**: `size << 1` はビットを 1 つ左にずらし、値を 2 倍にします。空いた最下位ビットは 0 になります。
- **`static_cast<SizeType<A>>(...)`**: 型を明示して変換します。`bool` を整数にしたり、`1` の型をそろえたりしています。
- **`(std::numeric_limits<...>::max)()`**: その型の最大値です。かっこで囲んでいるのは、Windows の `max` マクロに置き換えられないようにするためのよく使われる書き方です。
- **`HardeningAssertLE`**: 強化モードのビルドで「左辺 ≤ 右辺」を確認するチェックです。

## 何をしているか

まとめた整数を `v` と呼ぶことにします。`v = (サイズ << 1) | フラグ` という形です。

### フラグの操作

```cpp:line-numbers=454
  void SetIsAllocated() {
    GetSizeAndIsAllocated() |= static_cast<SizeType<A>>(1);
  }

  void UnsetIsAllocated() {
    GetSizeAndIsAllocated() &= ((std::numeric_limits<SizeType<A>>::max)() - 1);
  }
```

- `SetIsAllocated()`: `v |= 1` で最下位ビットだけを 1 にします。
- `UnsetIsAllocated()`: 最大値 − 1（`0b111...10`）と AND を取り、最下位ビットだけを 0 にします。

### サイズの設定

```cpp:line-numbers=462
  void SetSize(SizeType<A> size) {
    GetSizeAndIsAllocated() =
        (size << 1) | static_cast<SizeType<A>>(GetIsAllocated());
  }

  void SetAllocatedSize(SizeType<A> size) {
    GetSizeAndIsAllocated() = (size << 1) | static_cast<SizeType<A>>(1);
  }

  void SetInlinedSize(SizeType<A> size) {
    GetSizeAndIsAllocated() = size << static_cast<SizeType<A>>(1);
```

- `SetSize(size)`: 現在のフラグを保ったまま、サイズを入れ替えます。
- `SetAllocatedSize(size)` / `SetInlinedSize(size)`: フラグも同時に決め打ちで設定します。フラグを読む必要がないぶん速い版です。

たとえばサイズ 3 で中に置いている状態は `0b110 = 6`、ヒープに置いている状態は `0b111 = 7` です。

### サイズの増減

```cpp:line-numbers=475
  void AddSize(SizeType<A> count) {
    GetSizeAndIsAllocated() += count << static_cast<SizeType<A>>(1);
  }

  void SubtractSize(SizeType<A> count) {
    absl::base_internal::HardeningAssertLE(count, GetSize());

    GetSizeAndIsAllocated() -= count << static_cast<SizeType<A>>(1);
  }
```

`AddSize(count)` は `v += count << 1` です。最下位ビットには 0 を足すことになるので、**フラグを読まずに足すだけで、フラグは自動的に保たれます**。
`v = 7`（サイズ 3・ヒープ）に `AddSize(2)` すると `7 + 4 = 11 = 0b1011` で、サイズ 5・ヒープのままです。
`SubtractSize` も同じ考え方で、引く前にサイズが足りているかを確認しています。

なお、読み出し側は同じクラスの別の場所に、次のように定義されています。

```cpp:line-numbers=371
  SizeType<A> GetSize() const { return GetSizeAndIsAllocated() >> 1; }

  bool GetIsAllocated() const { return GetSizeAndIsAllocated() & 1; }
```

## ここがすごい

- **オブジェクトが小さくなる**: サイズとフラグを別々のメンバにすると、`bool` 1 個のためにアラインメント（メモリ上の並びの都合）で 8 バイト近く増えることがあります。`InlinedVector` は「小さいこと」が目的の型なので、この節約が効きます。
- **サイズの上限はほぼ減らない**: 1 ビット使うのでサイズの最大値は半分になりますが、64 ビット環境では現実に困ることはありません。
- **よく使う操作がフラグに無関心**: `push_back` のたびに呼ばれる `AddSize(1)` は、足し算 1 回だけです。フラグを取り出して戻す処理が要らないよう、フラグを最下位に置き、サイズをずらして保存しています。

## まとめ

- 値の範囲に余裕があれば、最下位ビットをフラグとして借りられる。
- `v = (n << 1) | flag` の形なら、`v += k << 1` でフラグを壊さずに n を増減できる。
- 状態を 1 つの整数にまとめると、コピーや比較もまとめて 1 回で済む。
- 「小ささ」が売りのデータ構造では、こうした数バイトの節約が設計の中心になる。
