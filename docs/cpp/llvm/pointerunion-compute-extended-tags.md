---
title: 空きビット数の違う型を混ぜる PointerUnion の「可変長タグ」計算
description: PointerUnion は「どの型のポインタか」をポインタの空きビットに書きます。型ごとに空きビット数が違っても詰め込めるよう、エスケープ符号付きの可変長タグ表を constexpr で作ります。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/PointerUnion.h
lines: [81, 127]
function: pointer_union_detail::computeExtendedTags
difficulty: 3
format: 2
tags: [ビット演算, メタプログラミング, ハック]
---

## ひとことで

`PointerUnion<A*, B*, C*>` は、「A か B か C のどれかへのポインタ」を **ポインタ 1 個ぶんの大きさ** で持つ型です。どの型かを示す「タグ」は、ポインタの使われていない下位ビットに書き込みます。
ふつうは全部の型に同じ幅のタグを使いますが、型によって空きビット数が違うと足りなくなることがあります。
`computeExtendedTags` は、**空きの多い型には長いタグ、少ない型には短いタグを割り当てる表** をコンパイル時に作る関数です。

## コード

::: code-group

```cpp:line-numbers=81 [日本語訳]
/// 可変幅のタグ表を計算する。型が収まらなければ std::nullopt を返す。
/// 型は NumLowBitsAvailable が減らない順に並んでいる必要がある。
/// 空きビット数ごとに型を段（tier）にまとめ、最後以外の段は
/// 一番大きい符号をエスケープ用の接頭辞として予約する。
///
/// 3 段（2 ビット・3 ビット・5 ビットの型）の例:
///   第 0 段（2 ビット）: 符号 0b00, 0b01, 0b10、エスケープ = 0b11
///   第 1 段（3 ビット）: 符号 0b011、エスケープ = 0b111
///   第 2 段（5 ビット）: 符号 0b00111, 0b01111, 0b10111, 0b11111
template <typename... PTs>
constexpr std::optional<std::array<TagEntry, sizeof...(PTs)>>
computeExtendedTags() {
  constexpr size_t N = sizeof...(PTs);
  std::array<TagEntry, N> Result = {};
  int Bits[] = {PointerLikeTypeTraits<PTs>::NumLowBitsAvailable...};
  uintptr_t EscapePrefix = 0;
  int PrevBits = 0;
  size_t I = 0;
  // 段（NumLowBitsAvailable が同じ型のまとまり）を順にたどる。各段では、
  // その段で新たに増えたビットを使ってタグの値を割り当て、
  // それまでの段のエスケープ符号を前に付ける。最後以外の
  // 段は、一番大きい符号を次の段へのエスケープとして予約する。
  while (I < N) {
    int TierBits = Bits[I];
    if (TierBits < PrevBits)
      return std::nullopt;
    int NewBits = TierBits - PrevBits;
    size_t TierEnd = I;
    while (TierEnd < N && Bits[TierEnd] == TierBits)
      ++TierEnd;
    bool IsLastTier = (TierEnd == N);
    size_t TypesInTier = TierEnd - I;
    size_t Capacity =
        IsLastTier ? (size_t(1) << NewBits) : ((size_t(1) << NewBits) - 1);
    if (TypesInTier > Capacity)
      return std::nullopt;
    for (size_t J = 0; J < TypesInTier; ++J) {
      Result[I + J].Value = EscapePrefix | (uintptr_t(J) << PrevBits);
      Result[I + J].Mask = (uintptr_t(1) << TierBits) - 1;
    }
    uintptr_t EscapeCode = (uintptr_t(1) << NewBits) - 1;
    EscapePrefix |= EscapeCode << PrevBits;
    PrevBits = TierBits;
    I = TierEnd;
  }
  return Result;
}
```

```cpp:line-numbers=81 [原文]
/// Compute variable-width tag table, or return std::nullopt if the types
/// don't fit. Types must be in non-decreasing NumLowBitsAvailable order.
/// Groups types by available bits into tiers; each non-final tier reserves
/// its highest code as an escape prefix.
///
/// Example with 3 tiers (2-bit, 3-bit, 5-bit types):
///   Tier 0 (2 bits): codes 0b00, 0b01, 0b10; escape = 0b11
///   Tier 1 (3 bits): codes 0b011, escape = 0b111
///   Tier 2 (5 bits): codes 0b00111, 0b01111, 0b10111, 0b11111
template <typename... PTs>
constexpr std::optional<std::array<TagEntry, sizeof...(PTs)>>
computeExtendedTags() {
  constexpr size_t N = sizeof...(PTs);
  std::array<TagEntry, N> Result = {};
  int Bits[] = {PointerLikeTypeTraits<PTs>::NumLowBitsAvailable...};
  uintptr_t EscapePrefix = 0;
  int PrevBits = 0;
  size_t I = 0;
  // Walk tiers (groups of types with the same NumLowBitsAvailable). For each
  // tier, assign tag values using the new bits introduced by this tier,
  // prefixed by the accumulated escape codes from previous tiers. Non-final
  // tiers reserve their highest code as an escape to the next tier.
  while (I < N) {
    int TierBits = Bits[I];
    if (TierBits < PrevBits)
      return std::nullopt;
    int NewBits = TierBits - PrevBits;
    size_t TierEnd = I;
    while (TierEnd < N && Bits[TierEnd] == TierBits)
      ++TierEnd;
    bool IsLastTier = (TierEnd == N);
    size_t TypesInTier = TierEnd - I;
    size_t Capacity =
        IsLastTier ? (size_t(1) << NewBits) : ((size_t(1) << NewBits) - 1);
    if (TypesInTier > Capacity)
      return std::nullopt;
    for (size_t J = 0; J < TypesInTier; ++J) {
      Result[I + J].Value = EscapePrefix | (uintptr_t(J) << PrevBits);
      Result[I + J].Mask = (uintptr_t(1) << TierBits) - 1;
    }
    uintptr_t EscapeCode = (uintptr_t(1) << NewBits) - 1;
    EscapePrefix |= EscapeCode << PrevBits;
    PrevBits = TierBits;
    I = TierEnd;
  }
  return Result;
}
```

:::

## 前提知識

- **空きビット（NumLowBitsAvailable）**: 住所が 4 の倍数なら下位 2 ビット、32 の倍数なら下位 5 ビットが常に 0 で、自由に使えます。
- **可変長テンプレート `typename... PTs`**: 型をいくつでも受け取れます。`sizeof...(PTs)` はその個数です。
- **パック展開 `{PointerLikeTypeTraits<PTs>::NumLowBitsAvailable...}`**: 各型の空きビット数を並べた配列を作ります。
- **`constexpr` 関数**: コンパイル時に実行できる関数です。ループや配列も使えます。結果の表はプログラムに定数として埋め込まれます。
- **`std::optional<T>`**: 「値があるか、ないか」を表す型です。`std::nullopt` は「ない」です。
- **`std::array<T, N>`**: 大きさが固定の配列です。

## 何をしているか

コメントの例、空きビットが 2, 2, 2, 3, 5, 5, 5, 5 の 8 つの型で追います。型は空きビットの少ない順に並んでいる前提です。

### 1. 段（tier）に分ける

```cpp:line-numbers=103
  while (I < N) {
    int TierBits = Bits[I];
    if (TierBits < PrevBits)
      return std::nullopt;
    int NewBits = TierBits - PrevBits;
    size_t TierEnd = I;
    while (TierEnd < N && Bits[TierEnd] == TierBits)
      ++TierEnd;
    bool IsLastTier = (TierEnd == N);
    size_t TypesInTier = TierEnd - I;
```

同じ空きビット数の型をまとめて 1 段にします。2 ビットの段に 3 個、3 ビットの段に 1 個、5 ビットの段に 4 個です。

### 2. 第 1 段: 2 ビット

```cpp:line-numbers=113
    size_t Capacity =
        IsLastTier ? (size_t(1) << NewBits) : ((size_t(1) << NewBits) - 1);
    if (TypesInTier > Capacity)
      return std::nullopt;
    for (size_t J = 0; J < TypesInTier; ++J) {
      Result[I + J].Value = EscapePrefix | (uintptr_t(J) << PrevBits);
      Result[I + J].Mask = (uintptr_t(1) << TierBits) - 1;
    }
    uintptr_t EscapeCode = (uintptr_t(1) << NewBits) - 1;
    EscapePrefix |= EscapeCode << PrevBits;
```

新しく使えるビットは 2 ビットで、4 通りの符号があります。最後の段ではないので、**一番大きい符号 `11` を「次の段へ進め」という合図（エスケープ）として取っておきます**。使えるのは 3 個です。
3 つの型に `00`, `01`, `10` を割り当てます。

### 3. 第 2 段: 3 ビット

前の段までのエスケープ `11` の上に、新しく 1 ビットを足します。1 ビットは 2 通りですが、エスケープ用に 1 つ取っておくので使えるのは 1 個です。
この型には `011` を割り当て、`111` が次へのエスケープになります。

### 4. 第 3 段: 5 ビット（最後）

`111` の上に 2 ビットを足します。最後の段なのでエスケープは要らず、4 通り全部を使えます。
`00111`, `01111`, `10111`, `11111` を割り当てます。

### 5. 入りきらなければ諦める

```cpp:line-numbers=105
    if (TierBits < PrevBits)
      return std::nullopt;
```

```cpp:line-numbers=115
    if (TypesInTier > Capacity)
      return std::nullopt;
```

並び順が崩れていたり、段の型が多すぎたりしたら `std::nullopt` を返します。使う側（`PointerUnion` の `getTagTable`）は `static_assert` でこれを確かめ、「型が多すぎる」というコンパイルエラーにします。なお、全型に同じ幅のタグが入るときは、こちらではなく固定幅の `computeFixedTags` が使われます。

### 6. 判定に使う Mask

```cpp:line-numbers=117
    for (size_t J = 0; J < TypesInTier; ++J) {
      Result[I + J].Value = EscapePrefix | (uintptr_t(J) << PrevBits);
      Result[I + J].Mask = (uintptr_t(1) << TierBits) - 1;
    }
```

各型の `Mask` は「その型の段までのビット幅」です。値と `Mask` の AND が `Value` と一致するかで、どの型かを判定できます。

## ここがすごい

- **固定幅では入らない組み合わせを救う**: 例の 8 型を固定幅で表すには 3 ビット必要ですが、2 ビットしか空いていない型があるので不可能です。可変長にすると、空きの少ない型には短い符号を、多い型には長い符号を割り当てて全部収まります。
- **接頭符号の考え方**: どの符号も、別の符号の先頭部分になっていません（`00` と `011` と `00111` は、下位から読むと区別がつく）。これは圧縮で使われるハフマン符号などと同じ「接頭符号」の考え方です。
- **すべてコンパイル時**: 表は `constexpr` で計算され、実行時には定数として使われるだけです。複雑な計算でも実行時のコストはありません。
- **できないことは型エラーにする**: 収まらない組み合わせは `std::nullopt` で表し、黙って壊れたポインタを作ることはしません。

## まとめ

- ポインタの空きビットには型のタグを書き込める。
- 空きビット数が型ごとに違うなら、エスケープ付きの可変長タグで多くの型を詰め込める。
- 「段の最大値を次の段への合図に予約する」と、接頭符号が作れる。
- `constexpr` 関数を使えば、複雑な表もコンパイル時に作れる。

