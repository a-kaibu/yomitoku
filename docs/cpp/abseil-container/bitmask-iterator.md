---
title: ビットマスクをそのまま for 文で回せるイテレータにする
description: SwissTable が SIMD 比較の結果として得たビット列を、「立っているビットの位置」を順に返すイテレータとして扱えるようにする小さなクラス。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2025 The Abseil Authors
file: absl/container/internal/hashtable_control_bytes.h
lines: [123, 162]
function: BitMask
difficulty: 2
tags: [ビット演算, イテレータ, ジェネリクス, イディオム]
---

## ひとことで

SwissTable は 8 個や 16 個のスロットを一度に調べ、「一致したスロット」をビットの立った整数（ビットマスク）として受け取ります。
`BitMask` はそのビットマスクを **`for (uint32_t i : mask)` のように範囲 for 文で回せる** ようにするクラスです。
たとえば `0b101` なら `0` と `2` が順に取り出せます。

## コード

::: code-group

```cpp:line-numbers=123 [日本語訳]
template <class T, int SignificantBits, int Shift = 0,
          bool NullifyBitsOnIteration = false>
class BitMask : public NonIterableBitMask<T, SignificantBits, Shift> {
  using Base = NonIterableBitMask<T, SignificantBits, Shift>;
  static_assert(std::is_unsigned_v<T>);
  static_assert(Shift == 0 || Shift == 3);
  static_assert(!NullifyBitsOnIteration || Shift == 3);

 public:
  explicit BitMask(T mask) : Base(mask) {
    if (Shift == 3 && !NullifyBitsOnIteration) {
      ABSL_SWISSTABLE_ASSERT(this->mask_ == (this->mask_ & kMsbs8Bytes));
    }
  }
  // BitMask は、抽象ビットの位置を順にたどるイテレータである。
  using value_type = int;
  using iterator = BitMask;
  using const_iterator = BitMask;

  BitMask& operator++() {
    if (Shift == 3 && NullifyBitsOnIteration) {
      this->mask_ &= kMsbs8Bytes;
    }
    this->mask_ &= (this->mask_ - 1);
    return *this;
  }

  uint32_t operator*() const { return Base::LowestBitSet(); }

  BitMask begin() const { return *this; }
  BitMask end() const { return BitMask(0); }

 private:
  friend bool operator==(const BitMask& a, const BitMask& b) {
    return a.mask_ == b.mask_;
  }
  friend bool operator!=(const BitMask& a, const BitMask& b) {
    return a.mask_ != b.mask_;
  }
};
```

```cpp:line-numbers=123 [原文]
template <class T, int SignificantBits, int Shift = 0,
          bool NullifyBitsOnIteration = false>
class BitMask : public NonIterableBitMask<T, SignificantBits, Shift> {
  using Base = NonIterableBitMask<T, SignificantBits, Shift>;
  static_assert(std::is_unsigned_v<T>);
  static_assert(Shift == 0 || Shift == 3);
  static_assert(!NullifyBitsOnIteration || Shift == 3);

 public:
  explicit BitMask(T mask) : Base(mask) {
    if (Shift == 3 && !NullifyBitsOnIteration) {
      ABSL_SWISSTABLE_ASSERT(this->mask_ == (this->mask_ & kMsbs8Bytes));
    }
  }
  // BitMask is an iterator over the indices of its abstract bits.
  using value_type = int;
  using iterator = BitMask;
  using const_iterator = BitMask;

  BitMask& operator++() {
    if (Shift == 3 && NullifyBitsOnIteration) {
      this->mask_ &= kMsbs8Bytes;
    }
    this->mask_ &= (this->mask_ - 1);
    return *this;
  }

  uint32_t operator*() const { return Base::LowestBitSet(); }

  BitMask begin() const { return *this; }
  BitMask end() const { return BitMask(0); }

 private:
  friend bool operator==(const BitMask& a, const BitMask& b) {
    return a.mask_ == b.mask_;
  }
  friend bool operator!=(const BitMask& a, const BitMask& b) {
    return a.mask_ != b.mask_;
  }
};
```

:::

## 前提知識

- **テンプレート `template <class T, int SignificantBits, ...>`**: 型や整数を引数にとって、クラスを「型ごと・値ごと」に作り分ける仕組みです。`T` は中身の整数型、`Shift` は 1 個の「論理ビット」が実際には何ビット幅かを表します。
- **`: public NonIterableBitMask<...>`**: 継承です。基底クラス `NonIterableBitMask` が `mask_` というメンバと、最下位の立っているビットの位置を返す `LowestBitSet()` を持っています。
- **`static_assert`**: コンパイル時の条件チェックです。条件が偽ならコンパイルエラーになります。
- **`std::is_unsigned_v<T>`**: `T` が符号なし整数型なら `true` になる定数です。
- **`explicit`**: コンストラクタが暗黙の型変換に使われないようにする指定です。
- **演算子オーバーロード**: `operator++` や `operator*` を定義すると、自作クラスに `++it` や `*it` が使えるようになります。
- **範囲 for 文**: `for (x : c)` は `c.begin()` と `c.end()` を呼び、`!=` で比べながら `++` と `*` を繰り返す構文です。
- **`friend` 関数**: クラスの外の関数ですが、非公開メンバにアクセスできるように許可したものです。

## 何をしているか

### 1. begin と end

```cpp:line-numbers=152
  BitMask begin() const { return *this; }
  BitMask end() const { return BitMask(0); }
```

`begin()` は自分自身のコピー、`end()` は `BitMask(0)` を返します。つまり **「残りのビットが 0 になったら終わり」** というルールです。比較は末尾の `friend` 関数 `==`・`!=` で、`mask_` 同士を比べるだけです。

```cpp:line-numbers=157
    return a.mask_ == b.mask_;
  }
  friend bool operator!=(const BitMask& a, const BitMask& b) {
    return a.mask_ != b.mask_;
  }
};
```

### 2. いまの要素

```cpp:line-numbers=150
  uint32_t operator*() const { return Base::LowestBitSet(); }
```

`*it` は `LowestBitSet()`、つまり **いちばん下の立っているビットの位置** を返します。基底クラスでは「末尾の 0 の個数（trailing zeros）」を数え、`Shift` ぶん右シフトしています。

### 3. 次へ進む

```cpp:line-numbers=142
  BitMask& operator++() {
    if (Shift == 3 && NullifyBitsOnIteration) {
      this->mask_ &= kMsbs8Bytes;
    }
    this->mask_ &= (this->mask_ - 1);
    return *this;
  }
```

`mask_ &= (mask_ - 1)` は **いちばん下の 1 だけを消す** 定番のビット演算です。
`0b10100` から 1 を引くと `0b10011` になり、AND を取ると `0b10000` になります。下の 1 が消えて、それより上は残ります。

### 具体例: Shift = 3 の場合

8 スロットを 64 ビット整数で表す版では、各スロットが 1 バイトで、一致したバイトは `0x80` になります。
`0x0000000080800000` なら、末尾の 0 は 23 個なので `23 >> 3 = 2`。下の 1 を消すと `0x0000000080000000` で、`31 >> 3 = 3`。次は 0 になって終了です。結果は `2, 3` で、ファイル中のコメントにある例と一致します。

### NullifyBitsOnIteration

バイトに `0x80` 以外のビットが混ざってもよい版では、`++` の前に `kMsbs8Bytes`（各バイトの最上位ビットだけ 1）でマスクして余計なビットを消します。コンストラクタのアサートは、そうでない版で余計なビットが混ざっていないことを確かめています。

```cpp:line-numbers=132
  explicit BitMask(T mask) : Base(mask) {
    if (Shift == 3 && !NullifyBitsOnIteration) {
      ABSL_SWISSTABLE_ASSERT(this->mask_ == (this->mask_ & kMsbs8Bytes));
    }
  }
```

## ここがすごい

- **イテレータなのに中身は整数 1 個**: 配列もポインタも持たず、`mask_` だけで「現在位置」と「残り」を表しています。コピーも比較もとても安いです。
- **`x & (x - 1)` と「末尾の 0 を数える」命令の組み合わせ**: どちらも多くの CPU で 1 命令になります。立っているビットの数だけしかループしないので、16 スロット中 1 個だけ一致した場合は 1 回で終わります。
- **呼び出し側が読みやすい**: SwissTable の検索は `for (uint32_t i : g.Match(h2))` のように書けます。ビット演算の細かい話をこのクラスに閉じ込め、使う側は「一致した位置を順に見る」とだけ書けばよくなっています。

## まとめ

- `x & (x - 1)` で最下位の 1 を消し、trailing zeros でその位置を得られる。
- `begin()` が自分、`end()` が 0 の値、という作りで整数をイテレータにできる。
- テンプレート引数 `Shift` で、1 ビット = 1 要素の表現と 1 バイト = 1 要素の表現を同じコードで扱える。
- 低レベルの工夫は小さなクラスに閉じ込めると、呼び出し側が読みやすくなる。
