---
title: 参照した瞬間に次へ進む「早送り」イテレータで、ループ中の削除を安全に
description: make_early_inc_range は、要素を取り出す瞬間にイテレータを次へ進めます。そのため、範囲 for の中で今の要素をリストから消しても、ループが壊れません。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/STLExtras.h
lines: [592, 633]
function: early_inc_iterator_impl
difficulty: 3
format: 2
tags: [イテレータ, 設計パターン, 防御的プログラミング]
---

## ひとことで

リストを先頭から順に見ながら、条件に合う要素を消したい、というのはよくある処理です。しかし普通に書くと、今の要素を消した時点で「次へ進む」ためのイテレータが壊れます。
`early_inc_iterator_impl` は、**要素を取り出す（`*it`）と同時に次へ進んでおく** イテレータです。`make_early_inc_range`と組み合わせて、次のように書けます。

```cpp
for (Instruction &I : make_early_inc_range(BB))
  if (isDead(I))
    I.eraseFromParent();   // 今の要素を消しても OK
```

## コード

```cpp:line-numbers=592
template <typename WrappedIteratorT>
class early_inc_iterator_impl
    : public iterator_adaptor_base<early_inc_iterator_impl<WrappedIteratorT>,
                                   WrappedIteratorT, std::input_iterator_tag> {
  using BaseT = typename early_inc_iterator_impl::iterator_adaptor_base;

  using PointerT = typename std::iterator_traits<WrappedIteratorT>::pointer;

protected:
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
  bool IsEarlyIncremented = false;
#endif

public:
  early_inc_iterator_impl(WrappedIteratorT I) : BaseT(I) {}

  using BaseT::operator*;
  decltype(*std::declval<WrappedIteratorT>()) operator*() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(!IsEarlyIncremented && "Cannot dereference twice!");
    IsEarlyIncremented = true;
#endif
    return *(this->I)++;
  }

  using BaseT::operator++;
  early_inc_iterator_impl &operator++() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(IsEarlyIncremented && "Cannot increment before dereferencing!");
    IsEarlyIncremented = false;
#endif
    return *this;
  }

  friend bool operator==(const early_inc_iterator_impl &LHS,
                         const early_inc_iterator_impl &RHS) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(!LHS.IsEarlyIncremented && "Cannot compare after dereferencing!");
#endif
    return (const BaseT &)LHS == (const BaseT &)RHS;
  }
};
```

## 前提知識

- **イテレータ**: コンテナの中の位置を表すオブジェクトです。`*it` で要素を取り出し、`++it` で次へ進みます。
- **範囲 for `for (x : range)`**: 内部では「`*it` で取り出す → 本体を実行 → `++it` → 終わりと比べる」を繰り返します。
- **後置インクリメント `I++`**: 今の値を返してから進めます。`*(I)++` は「今の位置の要素を取り出し、I は次へ進める」です。
- **CRTP と `iterator_adaptor_base`**: 既存のイテレータを包んで、一部の動作だけ変える基底クラスです。`this->I` が包まれた元のイテレータです。
- **`using BaseT::operator*;`**: 基底クラスの同名関数も使えるように残します。
- **`decltype(*std::declval<WrappedIteratorT>())`**: 「元のイテレータを `*` したときの型」をコンパイル時に求める書き方です。
- **`#if LLVM_ENABLE_ABI_BREAKING_CHECKS`**: 検査用のビルドでだけ有効になる部分です。

## 何をしているか

### 1. 取り出すときに進める

```cpp:line-numbers=609
  decltype(*std::declval<WrappedIteratorT>()) operator*() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(!IsEarlyIncremented && "Cannot dereference twice!");
    IsEarlyIncremented = true;
#endif
    return *(this->I)++;
  }
```

`operator*` は `return *(this->I)++;` です。要素への参照を返すのと同時に、中のイテレータはもう次の要素を指しています。

### 2. `++` は何もしない

```cpp:line-numbers=618
  early_inc_iterator_impl &operator++() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(IsEarlyIncremented && "Cannot increment before dereferencing!");
    IsEarlyIncremented = false;
#endif
    return *this;
  }
```

すでに進んでいるので、`operator++` は自分を返すだけです。

### 3. 範囲 for での動き

```cpp:line-numbers=614
    return *(this->I)++;
```

リスト `[a, b, c]` で `b` を消す場合を追います。

1. `*it` → `a` を返し、中は `b` へ。本体は何もしない。`++it` は何もしない。
2. `*it` → `b` を返し、中は `c` へ。本体で `b` を消す。中のイテレータは `c` を指しているので無事。
3. `*it` → `c` を返し、中は終わりへ。
4. 終わりと比べて終了。

### 4. 使い方の誤りを検出

```cpp:line-numbers=601
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
  bool IsEarlyIncremented = false;
#endif
```

```cpp:line-numbers=610
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(!IsEarlyIncremented && "Cannot dereference twice!");
    IsEarlyIncremented = true;
#endif
    return *(this->I)++;
  }

  using BaseT::operator++;
  early_inc_iterator_impl &operator++() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(IsEarlyIncremented && "Cannot increment before dereferencing!");
    IsEarlyIncremented = false;
#endif
    return *this;
  }

  friend bool operator==(const early_inc_iterator_impl &LHS,
                         const early_inc_iterator_impl &RHS) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    assert(!LHS.IsEarlyIncremented && "Cannot compare after dereferencing!");
#endif
    return (const BaseT &)LHS == (const BaseT &)RHS;
```

このイテレータは「1 回取り出したら 1 回進める」という使い方しか想定していません。検査ビルドでは `IsEarlyIncremented` という旗で状態を追い、

- 2 回続けて取り出した
- 取り出さずに進めた
- 取り出したあとに比べた

という誤用を `assert` で止めます。

## ここがすごい

- **よくあるバグを道具で防ぐ**: 削除しながらのループは、`auto Next = std::next(It);` を毎回書く必要があり、忘れるとバグになります。この部品を使えば、範囲 for のまま安全に書けます。
- **普通のイテレータではないと明記**: クラスの前のコメントで、「これは普通のイテレータではない」「範囲 for 向け」と制約をはっきり書いています。入力イテレータ（`std::input_iterator_tag`）と名乗っているのも、一度しか読めない性質に合わせたものです。
- **制約の検査はビルド設定で切り替え**: 旗は検査ビルドのときだけメンバとして存在します。通常のビルドでは、元のイテレータと同じ大きさ・速さです。
- **既存イテレータの再利用**: `iterator_adaptor_base` を使うので、変えたい 2 つの演算子（`*` と `++`）と比較だけを書けば済んでいます。

## まとめ

- 削除しながら走査するときは、消す前に次の位置を確保しておく必要がある。
- 「取り出すと同時に進む」イテレータにすれば、範囲 for のまま安全に削除できる。
- 普通と違う使い方を要求する部品は、コメントと検査用 assert で制約を伝える。
- 既存のイテレータを包むアダプタを使うと、変えたい部分だけを書けばよい。
