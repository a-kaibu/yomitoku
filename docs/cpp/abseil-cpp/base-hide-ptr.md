---
title: XOR でポインタを「見えなくする」リークチェッカー対策
description: ポインタを固定のマスクと XOR して整数にし、メモリリーク検出ツールから隠す関数。もう一度同じマスクと XOR すれば元に戻る。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/base/internal/hide_ptr.h
lines: [26, 45]
function: base_internal::HidePtr
difficulty: 1
tags: [ビット演算, メモリ管理, ハック]
---

## ひとことで

`HidePtr` はポインタを整数に変え、さらに決まった値 `HideMask()` と XOR します。`UnhidePtr` は同じ XOR をもう一度かけて元のポインタに戻します。
目的は、メモリリーク検出ツール（リークチェッカー）に **「このメモリはまだ誰かが指している」と気づかせない** ことです。

## コード

::: code-group

```cpp:line-numbers=26 [日本語訳]
// 上位ビットが立った適当な値。これと XOR しても、ある有効なポインタが
// 別の有効なポインタに化ける可能性は低い。
constexpr uintptr_t HideMask() {
  return (uintptr_t{0xF03A5F7BU} << (sizeof(uintptr_t) - 4) * 8) | 0xF03A5F7BU;
}

// ポインタをリークチェッカーから隠す。内部専用。
// absl::IgnoreLeak(ptr) との違い: absl::IgnoreLeak(ptr) は ptr と、
// ptr からたどれるすべてのオブジェクトを、リークチェッカーの対象外にする。
template <class T>
inline uintptr_t HidePtr(T* ptr) {
  return reinterpret_cast<uintptr_t>(ptr) ^ HideMask();
}

// リークチェッカーから隠されたポインタを元に戻して返す。
// 内部専用。
template <class T>
inline T* UnhidePtr(uintptr_t hidden) {
  return reinterpret_cast<T*>(hidden ^ HideMask());
}
```

```cpp:line-numbers=26 [原文]
// Arbitrary value with high bits set. Xor'ing with it is unlikely
// to map one valid pointer to another valid pointer.
constexpr uintptr_t HideMask() {
  return (uintptr_t{0xF03A5F7BU} << (sizeof(uintptr_t) - 4) * 8) | 0xF03A5F7BU;
}

// Hide a pointer from the leak checker. For internal use only.
// Differs from absl::IgnoreLeak(ptr) in that absl::IgnoreLeak(ptr) causes ptr
// and all objects reachable from ptr to be ignored by the leak checker.
template <class T>
inline uintptr_t HidePtr(T* ptr) {
  return reinterpret_cast<uintptr_t>(ptr) ^ HideMask();
}

// Return a pointer that has been hidden from the leak checker.
// For internal use only.
template <class T>
inline T* UnhidePtr(uintptr_t hidden) {
  return reinterpret_cast<T*>(hidden ^ HideMask());
}
```

:::

## 前提知識

- **リークチェッカーの仕組み**: LeakSanitizer などのツールは、プログラムの終了時にメモリ全体を調べ、「ヒープ上のブロックを指すポインタらしき値」を探します。どこからも指されていないブロックを「リーク（解放忘れ）」と報告します。
- **`uintptr_t`**: ポインタと同じ大きさの符号なし整数型です。ポインタを数値として扱うときに使います。
- **`reinterpret_cast<uintptr_t>(ptr)`**: ポインタを、そのアドレスを表す整数に変換します。逆向きの変換もできます。
- **XOR（`^`）**: ビットごとに「違えば 1、同じなら 0」を返す演算です。`(a ^ m) ^ m == a` が必ず成り立つので、同じ値と 2 回 XOR すると元に戻ります。
- **`constexpr uintptr_t HideMask()`**: コンパイル時に計算できる関数です。マスクの値は定数として埋め込まれます。
- **`sizeof(uintptr_t)`**: その型のバイト数です。64 ビット環境では 8、32 ビット環境では 4 です。

## 何をしているか

### 1. マスクを作る

```cpp:line-numbers=28
constexpr uintptr_t HideMask() {
  return (uintptr_t{0xF03A5F7BU} << (sizeof(uintptr_t) - 4) * 8) | 0xF03A5F7BU;
}
```

`0xF03A5F7B` を上位に、同じ値を下位に置いた数を作ります。

- 64 ビット環境: `(sizeof(uintptr_t) - 4) * 8 = 32` なので、`0xF03A5F7B` を 32 ビット左にずらし、下位にも `0xF03A5F7B` を OR します。結果は `0xF03A5F7BF03A5F7B` です。
- 32 ビット環境: シフト量は 0 なので、`0xF03A5F7B` そのものになります。

どちらの環境でも、**最上位のビットが立った** マスクになります。

### 2. 隠す

```cpp:line-numbers=35
template <class T>
inline uintptr_t HidePtr(T* ptr) {
  return reinterpret_cast<uintptr_t>(ptr) ^ HideMask();
}
```

ポインタを整数にして、マスクと XOR します。たとえば 64 ビットのアドレス `0x00007f12_34567890` なら、結果は `0xF03A20…` のように上位ビットがほとんど立った値になります。

### 3. 戻す

```cpp:line-numbers=42
template <class T>
inline T* UnhidePtr(uintptr_t hidden) {
  return reinterpret_cast<T*>(hidden ^ HideMask());
}
```

隠した値にもう一度同じマスクを XOR すれば、元のアドレスが復元されます。それを `T*` に戻して返します。

## ここがすごい

- **「ポインタに見えない値」にする**: 普通のプロセスのアドレスは、64 ビット環境では上位ビットがほぼ 0 です。XOR で上位ビットを立てると、どのヒープブロックのアドレスとも似ても似つかない値になります。リークチェッカーはこれをポインタと見なしません。`HideMask` のコメントも「ある有効なポインタが別の有効なポインタに化ける可能性は低い」と書いています。
- **`IgnoreLeak` との違い**: `HidePtr` のコメントが説明するとおり、`absl::IgnoreLeak(ptr)` は `ptr` と、そこからたどれるすべてのオブジェクトを検査対象から外します。`HidePtr` はそのポインタ 1 本だけを隠すので、その先にある別のメモリのリークは引き続き検出できます。
- **復元にコストがほとんどない**: XOR は CPU の最も基本的な命令の 1 つです。隠す・戻すのたびに 1 命令しかかかりません。
- **環境のビット幅に合わせる**: マスクの作り方を `sizeof` で書いているので、32 ビットでも 64 ビットでも同じコードで正しいマスクになります。

なお、この関数は内部用です。たとえば Abseil の `Mutex` のデッドロック検出（`synchronization/internal/graphcycles.cc`）は、利用者のミューテックスのアドレスを内部の表に記録するときに `HidePtr` を使っています。生のポインタのまま記録すると、利用者が解放し忘れたオブジェクトまで「表から指されているから生きている」と見なされ、本物のリークが見逃されてしまうからです。

## まとめ

- 同じ値と 2 回 XOR すると元に戻る。軽い「可逆な変換」として便利。
- リークチェッカーは「ポインタらしき値」を探している。上位ビットを立てればポインタに見えなくなる。
- 隠す範囲を 1 本のポインタに限ると、ほかのリークの検出力を落とさずに済む。
- ビット幅に依存する定数は `sizeof` を使って組み立てると移植性が上がる。
