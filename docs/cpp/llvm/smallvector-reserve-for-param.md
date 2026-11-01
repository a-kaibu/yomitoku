---
title: 「自分の要素を自分に push_back」でも壊れない SmallVector の工夫
description: v.push_back(v[0]) のように、配列自身の要素を追加すると、拡張時に参照が無効になる危険があります。SmallVector はそれを添字で覚え直して回避します。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/SmallVector.h
lines: [237, 256]
function: SmallVectorTemplateCommon::reserveForParamAndGetAddressImpl
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング, データ構造]
---

## ひとことで

`SmallVector`（LLVM の「小さいうちはヒープを使わない可変長配列」）に要素を 1 つ追加する前に、**空きが足りなければ領域を広げ、追加する値の「新しい住所」を返す** 関数です。
`v.push_back(v[0])` のように、配列の中の要素を同じ配列に追加しても安全に動くようにするための仕掛けです。

## コード

::: code-group

```cpp:line-numbers=237 [日本語訳]
  /// 要素を 1 つ追加できるだけの領域を確保し、要素がこの配列の中を指していた
  /// 場合に備えて、更新した要素のポインタを返す。
  template <class U>
  static const T *reserveForParamAndGetAddressImpl(U *This, const T &Elt,
                                                   size_t N) {
    size_t NewSize = This->size() + N;
    if (LLVM_LIKELY(NewSize <= This->capacity()))
      return &Elt;

    bool ReferencesStorage = false;
    int64_t Index = -1;
    if (!U::TakesParamByValue) {
      if (LLVM_UNLIKELY(This->isReferenceToStorage(&Elt))) {
        ReferencesStorage = true;
        Index = &Elt - This->begin();
      }
    }
    This->grow(NewSize);
    return ReferencesStorage ? This->begin() + Index : &Elt;
  }
```

```cpp:line-numbers=237 [原文]
  /// Reserve enough space to add one element, and return the updated element
  /// pointer in case it was a reference to the storage.
  template <class U>
  static const T *reserveForParamAndGetAddressImpl(U *This, const T &Elt,
                                                   size_t N) {
    size_t NewSize = This->size() + N;
    if (LLVM_LIKELY(NewSize <= This->capacity()))
      return &Elt;

    bool ReferencesStorage = false;
    int64_t Index = -1;
    if (!U::TakesParamByValue) {
      if (LLVM_UNLIKELY(This->isReferenceToStorage(&Elt))) {
        ReferencesStorage = true;
        Index = &Elt - This->begin();
      }
    }
    This->grow(NewSize);
    return ReferencesStorage ? This->begin() + Index : &Elt;
  }
```

:::

## 前提知識

- **ポインタ `T *`**: メモリ上の住所を入れる変数です。`&Elt` は「`Elt` の住所」を表します。
- **参照 `const T &Elt`**: 値をコピーせず、元の変数そのものを別名で受け取る書き方です。中身は実質的にポインタなので、元の場所が消えると参照も壊れます（ダングリング参照）。
- **テンプレート `template <class U>`**: 型を引数にして、同じコードを色々な型で使い回す仕組みです。ここでは `U` に「実際の SmallVector の型」が入ります。
- **`static` メンバ関数**: オブジェクトに属さない関数です。そのため `this` の代わりに `This` という引数でオブジェクトを受け取っています。
- **`LLVM_LIKELY` / `LLVM_UNLIKELY`**: 「この条件はたいてい真（偽）」とコンパイラに伝えるマクロです。よく通る道を速くする配置にしてもらえます。
- **ポインタの引き算**: `&Elt - This->begin()` は、2 つの住所が要素何個ぶん離れているか（添字）になります。

## 何をしているか

### 1. 空きがあれば何もしない

```cpp:line-numbers=242
    size_t NewSize = This->size() + N;
    if (LLVM_LIKELY(NewSize <= This->capacity()))
      return &Elt;
```

追加後の大きさ `NewSize` を計算し、今の容量（`capacity()`）に収まるなら、領域は動きません。
だから受け取った `Elt` の住所をそのまま返します。ほとんどの呼び出しはここで終わります。

### 2. 要素が自分の中を指しているか調べる

```cpp:line-numbers=246
    bool ReferencesStorage = false;
    int64_t Index = -1;
    if (!U::TakesParamByValue) {
      if (LLVM_UNLIKELY(This->isReferenceToStorage(&Elt))) {
        ReferencesStorage = true;
        Index = &Elt - This->begin();
      }
    }
```

容量が足りないときは、`grow` で新しいメモリを確保して中身を引っ越します。古いメモリは解放されます。
もし `Elt` が古いメモリの中の要素だったら、引っ越し後は解放済みの場所を指すことになってしまいます。

そこで、`isReferenceToStorage(&Elt)` で「`Elt` はこの配列の中にあるか」を調べます。中にあれば、**住所ではなく添字 `Index` を覚えておきます**。

例: 要素 4 個・容量 4 の配列 `v` で `v.push_back(v[1])` を呼ぶと、`&Elt - begin()` は `1` です。

### 3. 広げてから住所を計算し直す

```cpp:line-numbers=254
    This->grow(NewSize);
    return ReferencesStorage ? This->begin() + Index : &Elt;
```

`grow(NewSize)` で引っ越したあと、`begin() + Index` で **新しいメモリでの `v[1]` の住所** を作って返します。
呼び出し側（`push_back`）は、この戻り値を使ってコピーするので、正しい値が追加されます。

### 4. 値渡しの型は最初から心配しない

```cpp:line-numbers=248
    if (!U::TakesParamByValue) {
```

`U::TakesParamByValue` は、ポインタ 2 個ぶん以下の小さくて単純な型のときに真になる定数です。
その場合、引数はもともとコピーで受け取っているので、自分の中を指す心配がありません。`if` ごと飛ばせます。

## ここがすごい

- **よくある落とし穴を API 側で吸収**: `std::vector` でも `v.push_back(v[0])` は動くよう標準で求められていますが、自作の配列では忘れがちです。SmallVector は「住所 → 添字 → 新しい住所」と変換するだけで、余計なコピーをせずに解決しています。
- **速い道を汚さない**: 判定は容量が足りないときにしか行いません。普段の `push_back` は比較 1 回で終わります。
- **型によって判定自体を消す**: `TakesParamByValue` はコンパイル時に決まる定数なので、小さい型では判定のコードが丸ごと消えます。
- **比較に `std::less` を使う**: `isReferenceToStorage`は、無関係なポインタ同士を `<` で比べると未定義動作になるという C++ の規則を避けるため、`std::less<>` で比べています。細かいですが堅実です。

## まとめ

- 配列が引っ越す可能性があるときは、中の要素を指す住所は「添字」で持つと安全。
- 「よく通る道」は最短にして、珍しいケースだけ追加の判定をする。
- コンパイル時に決まる条件を使えば、不要な分岐をコードごと消せる。
- 自分自身の要素を引数に取る操作は、コンテナ実装の典型的なバグの元になる。

