---
title: 途中への 1 要素挿入で「自分を指す参照」を 1 つずらす SmallVector
description: SmallVector の insert は、末尾を 1 つ伸ばして要素を後ろへずらします。挿入する値が配列の中にあった場合、ずれた先を追いかけて正しい値を入れます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/SmallVector.h
lines: [817, 851]
function: SmallVectorImpl::insert_one_impl
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, 防御的プログラミング]
---

## ひとことで

`insert_one_impl` は、`SmallVector` の **位置 `I` に要素を 1 つ差し込む** 処理の本体です。
`[a, b, c]` の 1 番目に `x` を入れると `[a, x, b, c]` になります。差し込む値が配列の中の要素だった場合にも正しく動くよう、細かい手当てがされています。

## コード

::: code-group

```cpp:line-numbers=817 [日本語訳]
  template <class ArgType> iterator insert_one_impl(iterator I, ArgType &&Elt) {
    // ArgType が T 由来であることは呼び出し側が保証する。
    static_assert(
        std::is_same<std::remove_const_t<std::remove_reference_t<ArgType>>,
                     T>::value,
        "ArgType must be derived from T!");

    if (I == this->end()) {  // 空のベクタのための重要な特別扱い。
      this->push_back(::std::forward<ArgType>(Elt));
      return this->end()-1;
    }

    assert(this->isReferenceToStorage(I) && "Insertion iterator is out of bounds.");

    // 必要なら広げる。
    size_t Index = I - this->begin();
    std::remove_reference_t<ArgType> *EltPtr =
        this->reserveForParamAndGetAddress(Elt);
    I = this->begin() + Index;

    ::new ((void*) this->end()) T(::std::move(this->back()));
    // 残りを全部ずらす。
    std::move_backward(I, this->end()-1, this->end());
    this->set_size(this->size() + 1);

    // 挿入しようとしている要素自体をずらしてしまった場合は、
    // 参照を更新する（TakesParamByValue なら起こらない）。
    static_assert(!TakesParamByValue || std::is_same<ArgType, T>::value,
                  "ArgType must be 'T' when taking by value!");
    if (!TakesParamByValue && this->isReferenceToRange(EltPtr, I, this->end()))
      ++EltPtr;

    *I = ::std::forward<ArgType>(*EltPtr);
    return I;
  }
```

```cpp:line-numbers=817 [原文]
  template <class ArgType> iterator insert_one_impl(iterator I, ArgType &&Elt) {
    // Callers ensure that ArgType is derived from T.
    static_assert(
        std::is_same<std::remove_const_t<std::remove_reference_t<ArgType>>,
                     T>::value,
        "ArgType must be derived from T!");

    if (I == this->end()) {  // Important special case for empty vector.
      this->push_back(::std::forward<ArgType>(Elt));
      return this->end()-1;
    }

    assert(this->isReferenceToStorage(I) && "Insertion iterator is out of bounds.");

    // Grow if necessary.
    size_t Index = I - this->begin();
    std::remove_reference_t<ArgType> *EltPtr =
        this->reserveForParamAndGetAddress(Elt);
    I = this->begin() + Index;

    ::new ((void*) this->end()) T(::std::move(this->back()));
    // Push everything else over.
    std::move_backward(I, this->end()-1, this->end());
    this->set_size(this->size() + 1);

    // If we just moved the element we're inserting, be sure to update
    // the reference (never happens if TakesParamByValue).
    static_assert(!TakesParamByValue || std::is_same<ArgType, T>::value,
                  "ArgType must be 'T' when taking by value!");
    if (!TakesParamByValue && this->isReferenceToRange(EltPtr, I, this->end()))
      ++EltPtr;

    *I = ::std::forward<ArgType>(*EltPtr);
    return I;
  }
```

:::

## 前提知識

- **イテレータ `iterator`**: 配列の中の位置を表すものです。SmallVector では中身がただのポインタ `T *` です。
- **`ArgType &&` と `std::forward`**: 「コピー元（左辺値）」と「使い捨ての一時値（右辺値）」の両方を 1 つの関数で受け取り、受け取ったときの性質のまま次へ渡す書き方です（完全転送）。
- **`std::move`**: 「この値はもう使わないので、中身を奪って（ムーブして）よい」という印です。コピーより速いことが多いです。
- **配置 new `::new ((void*) p) T(...)`**: メモリの確保はせず、すでにある場所 `p` にオブジェクトを組み立てます。まだ何も入っていない末尾の領域に使います。
- **`std::move_backward(first, last, d_last)`**: 範囲を後ろから順に、`d_last` で終わる位置へムーブします。重なった範囲を右へずらすときに使います。
- **`static_assert`**: コンパイル時のチェックです。条件が偽ならビルドが失敗します。

## 何をしているか

### 1. 末尾への挿入は push_back に任せる

```cpp:line-numbers=824
    if (I == this->end()) {  // 空のベクタのための重要な特別扱い。
      this->push_back(::std::forward<ArgType>(Elt));
      return this->end()-1;
    }
```

`I == end()` なら、ずらす要素がありません。`push_back` を呼んで終わりです。空の配列への挿入もここを通ります。

### 2. 添字を覚えてから容量を確保

```cpp:line-numbers=832
    size_t Index = I - this->begin();
    std::remove_reference_t<ArgType> *EltPtr =
        this->reserveForParamAndGetAddress(Elt);
    I = this->begin() + Index;
```

`reserveForParamAndGetAddress(Elt)` は、足りなければ領域を広げ、`Elt` が配列の中にあれば新しい住所を返す関数です。
広げるとメモリが引っ越すので、挿入位置 `I` も無効になります。そこで先に `Index = I - begin()` と添字にしておき、あとで `I = begin() + Index` と作り直します。

### 3. 要素を 1 つずつ後ろへ

```cpp:line-numbers=837
    ::new ((void*) this->end()) T(::std::move(this->back()));
    // 残りを全部ずらす。
    std::move_backward(I, this->end()-1, this->end());
    this->set_size(this->size() + 1);
```

`[a, b, c]` の 1 番目に入れる場合で追います。

1. 末尾の外側（まだ空の場所）に、最後の要素 `c` をムーブで組み立てます → `[a, b, c, c']`
2. `move_backward` で `[I, end()-1)`、つまり `b, c` を 1 つ右へずらします → `[a, b, b, c]`
3. サイズを 1 増やします。

空の場所には代入できない（まだオブジェクトがない）ので、最初の 1 個だけ配置 new を使っているのがポイントです。

### 4. 挿入する値もずれていたら追いかける

```cpp:line-numbers=846
    if (!TakesParamByValue && this->isReferenceToRange(EltPtr, I, this->end()))
      ++EltPtr;

    *I = ::std::forward<ArgType>(*EltPtr);
```

たとえば `v.insert(v.begin(), v[1])` だと、`EltPtr` は `b` を指しています。しかし手順 3 で `b` は 1 つ右へずれました。
`isReferenceToRange(EltPtr, I, end())` で「ずらした範囲の中か」を調べ、そうなら `++EltPtr` で 1 つ右を指し直します。
最後に `*I = ...` で、空いた位置へ値を入れて完成です。

## ここがすごい

- **参照の無効化を 2 段階で処理**: 「容量拡張による引っ越し」と「要素のずらし」という、参照が壊れる 2 つの原因を別々に手当てしています。どちらも追加のコピーを作らずに済ませています。
- **値渡しの型では判定を省く**: `TakesParamByValue` が真の型（小さな単純型）では、引数はすでにコピーなので追いかけ不要です。`static_assert`でその前提が崩れていないかもコンパイル時に確かめています。
- **1 つの実装で 2 種類の insert を担当**: `insert(I, T&&)` と `insert(I, const T&)`は、どちらもこの関数を呼ぶだけです。完全転送のおかげでムーブとコピーを書き分ける必要がありません。

## まとめ

- 位置を表すポインタは、容量拡張の前に添字へ変えておくと安全。
- 末尾の「まだ何もない場所」には代入ではなく構築（配置 new）を使う。
- 挿入する値が配列の中を指していると、ずらしでも位置が変わる。
- 完全転送を使えば、コピー版とムーブ版を 1 つの実装にまとめられる。

