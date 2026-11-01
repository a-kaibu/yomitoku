---
title: ポインタの空きビットに小さな整数を埋め込む PointerIntPair の中身
description: 8 の倍数の住所なら下位 3 ビットは常に 0 です。PointerIntPair はそこに整数を詰め、ポインタ 1 個ぶんの大きさで「ポインタ + 小さな整数」を持ちます。そのマスクとシフトの計算です。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/PointerIntPair.h
lines: [167, 213]
function: PointerIntPairInfo
difficulty: 3
format: 2
tags: [ビット演算, メモリ管理, ハック]
---

## ひとことで

オブジェクトの住所は、たいてい 4 や 8 の倍数に揃えられています（アラインメント）。8 の倍数なら、2 進数の下位 3 ビットはいつも 0 です。
`PointerIntPair` は、**この使われていないビットに小さな整数（bool など）を詰め込み**、ポインタ 1 個ぶんの大きさで「ポインタ + 整数」を持つクラスです。
`PointerIntPairInfo` は、その詰め方・取り出し方を担当する部分です。

## コード

::: code-group

```cpp:line-numbers=167 [日本語訳]
template <typename PointerT, unsigned IntBits, typename PtrTraits>
struct PointerIntPairInfo {
  static_assert(PtrTraits::NumLowBitsAvailable <
                    std::numeric_limits<uintptr_t>::digits,
                "cannot use a pointer type that has all bits free");
  static_assert(IntBits <= PtrTraits::NumLowBitsAvailable,
                "PointerIntPair with integer size too large for pointer");
  enum MaskAndShiftConstants : uintptr_t {
    /// PointerBitMask - ポインタ由来のビット。
    PointerBitMask = (~(uintptr_t)0) << PtrTraits::NumLowBitsAvailable,

    /// IntShift - ほかの用途のために取っておき、0 のままにする
    /// 下位ビットの数。
    IntShift = (uintptr_t)PtrTraits::NumLowBitsAvailable - IntBits,

    /// IntMask - 整数型の有効なビットのマスク（シフト前）。
    IntMask = ((uintptr_t)1 << IntBits) - 1,

    // ShiftedIntMask - 整数を所定の位置にずらしたときのビット。
    ShiftedIntMask = (uintptr_t)(IntMask << IntShift)
  };

  static PointerT getPointer(intptr_t Value) {
    return PtrTraits::getFromVoidPointer(
        reinterpret_cast<void *>(Value & PointerBitMask));
  }

  static intptr_t getInt(intptr_t Value) {
    return (Value >> IntShift) & IntMask;
  }

  static intptr_t updatePointer(intptr_t OrigValue, PointerT Ptr) {
    intptr_t PtrWord =
        reinterpret_cast<intptr_t>(PtrTraits::getAsVoidPointer(Ptr));
    assert((PtrWord & ~PointerBitMask) == 0 &&
           "Pointer is not sufficiently aligned");
    // 下位ビットはすべて残し、ポインタだけを更新する。
    return PtrWord | (OrigValue & ~PointerBitMask);
  }

  static intptr_t updateInt(intptr_t OrigValue, intptr_t Int) {
    assert((Int & ~IntMask) == 0 && "Integer too large for field");

    // 更新するビット以外はすべて残す。
    return (OrigValue & ~ShiftedIntMask) | Int << IntShift;
  }
};
```

```cpp:line-numbers=167 [原文]
template <typename PointerT, unsigned IntBits, typename PtrTraits>
struct PointerIntPairInfo {
  static_assert(PtrTraits::NumLowBitsAvailable <
                    std::numeric_limits<uintptr_t>::digits,
                "cannot use a pointer type that has all bits free");
  static_assert(IntBits <= PtrTraits::NumLowBitsAvailable,
                "PointerIntPair with integer size too large for pointer");
  enum MaskAndShiftConstants : uintptr_t {
    /// PointerBitMask - The bits that come from the pointer.
    PointerBitMask = (~(uintptr_t)0) << PtrTraits::NumLowBitsAvailable,

    /// IntShift - The number of low bits that we reserve for other uses, and
    /// keep zero.
    IntShift = (uintptr_t)PtrTraits::NumLowBitsAvailable - IntBits,

    /// IntMask - This is the unshifted mask for valid bits of the int type.
    IntMask = ((uintptr_t)1 << IntBits) - 1,

    // ShiftedIntMask - This is the bits for the integer shifted in place.
    ShiftedIntMask = (uintptr_t)(IntMask << IntShift)
  };

  static PointerT getPointer(intptr_t Value) {
    return PtrTraits::getFromVoidPointer(
        reinterpret_cast<void *>(Value & PointerBitMask));
  }

  static intptr_t getInt(intptr_t Value) {
    return (Value >> IntShift) & IntMask;
  }

  static intptr_t updatePointer(intptr_t OrigValue, PointerT Ptr) {
    intptr_t PtrWord =
        reinterpret_cast<intptr_t>(PtrTraits::getAsVoidPointer(Ptr));
    assert((PtrWord & ~PointerBitMask) == 0 &&
           "Pointer is not sufficiently aligned");
    // Preserve all low bits, just update the pointer.
    return PtrWord | (OrigValue & ~PointerBitMask);
  }

  static intptr_t updateInt(intptr_t OrigValue, intptr_t Int) {
    assert((Int & ~IntMask) == 0 && "Integer too large for field");

    // Preserve all bits other than the ones we are updating.
    return (OrigValue & ~ShiftedIntMask) | Int << IntShift;
  }
};
```

:::

## 前提知識

- **アラインメント**: 型ごとに「この倍数の住所に置く」という決まりです。8 バイトの型なら 8 の倍数の住所に置かれます。
- **`intptr_t` / `uintptr_t`**: ポインタを整数として扱うための、ポインタと同じ大きさの整数型です。
- **`reinterpret_cast`**: ポインタと整数の間など、ビットの並びをそのまま別の型として解釈し直すキャストです。
- **`PtrTraits::NumLowBitsAvailable`**: そのポインタ型で「下位何ビットが空いているか」を表す定数です。`PtrTraits` は型ごとの情報をまとめた特性クラス（traits）です。
- **`enum ... : uintptr_t`**: 列挙型をコンパイル時の整数定数の入れ物として使っています。
- **`static_assert`**: 条件を満たさなければコンパイルエラーにします。

## 何をしているか

ここでは、空きビット 3（8 の倍数の住所）、`IntBits = 1`（bool を 1 個詰める）として追います。

### 1. マスクを計算

```cpp:line-numbers=174
  enum MaskAndShiftConstants : uintptr_t {
    /// PointerBitMask - ポインタ由来のビット。
    PointerBitMask = (~(uintptr_t)0) << PtrTraits::NumLowBitsAvailable,

    /// IntShift - ほかの用途のために取っておき、0 のままにする
    /// 下位ビットの数。
    IntShift = (uintptr_t)PtrTraits::NumLowBitsAvailable - IntBits,

    /// IntMask - 整数型の有効なビットのマスク（シフト前）。
    IntMask = ((uintptr_t)1 << IntBits) - 1,

    // ShiftedIntMask - 整数を所定の位置にずらしたときのビット。
    ShiftedIntMask = (uintptr_t)(IntMask << IntShift)
  };
```

| 定数 | 計算 | 値（下位 8 ビット） |
| --- | --- | --- |
| `PointerBitMask` | `~0 << 3` | `1111 1000` |
| `IntShift` | `3 - 1` | `2` |
| `IntMask` | `(1 << 1) - 1` | `0000 0001` |
| `ShiftedIntMask` | `IntMask << 2` | `0000 0100` |

整数を **空きビットのうち一番上（ビット 2）** に置くのがポイントです。ビット 0 と 1 は、別の用途のために空けておきます。

### 2. 取り出す

```cpp:line-numbers=189
  static PointerT getPointer(intptr_t Value) {
    return PtrTraits::getFromVoidPointer(
        reinterpret_cast<void *>(Value & PointerBitMask));
  }

  static intptr_t getInt(intptr_t Value) {
    return (Value >> IntShift) & IntMask;
  }
```

- ポインタは `Value & PointerBitMask` で下位 3 ビットを消せば元に戻ります。
- 整数は `(Value >> IntShift) & IntMask` で、ビット 2 を右端へずらして取り出します。

例: 住所 `0x1000` に `true` を詰めた値は `0x1004` です。`0x1004 & ...1111 1000` = `0x1000`、`(0x1004 >> 2) & 1` = `1` です。

### 3. 書き換える

```cpp:line-numbers=198
  static intptr_t updatePointer(intptr_t OrigValue, PointerT Ptr) {
    intptr_t PtrWord =
        reinterpret_cast<intptr_t>(PtrTraits::getAsVoidPointer(Ptr));
    assert((PtrWord & ~PointerBitMask) == 0 &&
           "Pointer is not sufficiently aligned");
    // 下位ビットはすべて残し、ポインタだけを更新する。
    return PtrWord | (OrigValue & ~PointerBitMask);
  }

  static intptr_t updateInt(intptr_t OrigValue, intptr_t Int) {
    assert((Int & ~IntMask) == 0 && "Integer too large for field");

    // 更新するビット以外はすべて残す。
    return (OrigValue & ~ShiftedIntMask) | Int << IntShift;
  }
```

- `updatePointer`: 新しいポインタの下位ビットが本当に 0 か `assert` で確かめ、元の値の下位ビット（整数部分）と OR します。
- `updateInt`: 整数が `IntBits` に収まるか確かめ、元の値から `ShiftedIntMask` の部分だけを消して、新しい整数をずらして OR します。

### 4. 使いすぎを止める

```cpp:line-numbers=169
  static_assert(PtrTraits::NumLowBitsAvailable <
                    std::numeric_limits<uintptr_t>::digits,
                "cannot use a pointer type that has all bits free");
  static_assert(IntBits <= PtrTraits::NumLowBitsAvailable,
                "PointerIntPair with integer size too large for pointer");
```

詰めたいビット数が空きビットより多いと、ポインタを壊してしまいます。`static_assert` でコンパイル時に止めます。

## ここがすごい

- **メモリを倍も節約**: 「ポインタ + bool」を普通に構造体にすると、パディング（隙間）込みで 16 バイトになりがちです。これなら 8 バイトです。LLVM はこの部品を大量に使うので、効果が大きくなります。
- **入れ子にできる設計**: 整数を空きビットの上の方に置くので、`PointerIntPair<PointerIntPair<void*, 1, bool>, 1, bool>` のように重ねると、2 つの bool が別々のビットに入ります。内側は空きビット 3 のうち上の 1 つを使い、外側には残り 2 ビットが空いていると伝えます。
- **型ごとの空きビット数を差し替え可能**: 空きビット数を `PtrTraits` から受け取るので、アラインメントの大きい型ならより多くのビットを使えます。
- **安全装置が二重**: コンパイル時は `static_assert` でビット数を、実行時（デバッグ版）は `assert` でポインタの揃い方と整数の大きさを確かめています。

## まとめ

- 揃えられた住所の下位ビットは常に 0 なので、情報を詰める場所として使える。
- 詰める・取り出すは、マスクの AND とシフトだけでできる。
- 空きビットの上の方を使うと、さらに入れ子で詰められる。
- ビットを詰めるハックには、コンパイル時と実行時のチェックを必ず付ける。

