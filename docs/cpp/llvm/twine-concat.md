---
title: 文字列を連結せずに「連結の予定」だけを持つ Twine の concat
description: Twine は連結結果を作らず、左右の部品へのポインタだけを持つ二分木です。concat は null・空を特別扱いし、子が 1 つだけの Twine は親に畳み込んで木を浅く保ちます。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/Twine.h
lines: [497, 524]
function: Twine::concat
difficulty: 3
format: 2
tags: [文字列処理, 遅延評価, データ構造]
---

## ひとことで

`Twine` は、`"foo" + Name + ".tmp"` のような **文字列の連結を、実際には行わずに表す** LLVM の型です。連結した結果の文字列を作る代わりに、左右の部品へのポインタだけを持ちます。
本当に文字列が必要になったときに、まとめて 1 回だけ書き出します。
`concat` は Twine 同士をつなぐ関数で、`+` 演算子の中身です。

## コード

::: code-group

```cpp:line-numbers=497 [日本語訳]
inline Twine Twine::concat(const Twine &Suffix) const {
  // null との連結は null。
  if (isNull() || Suffix.isNull())
    return Twine(NullKind);

  // 空との連結はもう一方になる。
  if (isEmpty())
    return Suffix;
  if (Suffix.isEmpty())
    return *this;

  // それ以外は新しい節を作る必要がある。そのとき、単項の
  // Twine は畳み込むよう気をつける。
  Child NewLHS, NewRHS;
  NewLHS.twine = this;
  NewRHS.twine = &Suffix;
  NodeKind NewLHSKind = TwineKind, NewRHSKind = TwineKind;
  if (isUnary()) {
    NewLHS = LHS;
    NewLHSKind = getLHSKind();
  }
  if (Suffix.isUnary()) {
    NewRHS = Suffix.LHS;
    NewRHSKind = Suffix.getLHSKind();
  }

  return Twine(NewLHS, NewLHSKind, NewRHS, NewRHSKind);
}
```

```cpp:line-numbers=497 [原文]
inline Twine Twine::concat(const Twine &Suffix) const {
  // Concatenation with null is null.
  if (isNull() || Suffix.isNull())
    return Twine(NullKind);

  // Concatenation with empty yields the other side.
  if (isEmpty())
    return Suffix;
  if (Suffix.isEmpty())
    return *this;

  // Otherwise we need to create a new node, taking care to fold in unary
  // twines.
  Child NewLHS, NewRHS;
  NewLHS.twine = this;
  NewRHS.twine = &Suffix;
  NodeKind NewLHSKind = TwineKind, NewRHSKind = TwineKind;
  if (isUnary()) {
    NewLHS = LHS;
    NewLHSKind = getLHSKind();
  }
  if (Suffix.isUnary()) {
    NewRHS = Suffix.LHS;
    NewRHSKind = Suffix.getLHSKind();
  }

  return Twine(NewLHS, NewLHSKind, NewRHS, NewRHSKind);
}
```

:::

## 前提知識

- **一時オブジェクト**: `a + b` の結果のように、名前のない値です。その文（`;` まで）が終わると消えます。Twine はこれへのポインタを持つため、変数に保存してはいけません。
- **`union Child`**: Twine の子は、C 文字列・`std::string`・StringRef・数値・別の Twine など色々な型になりえます。共用体で同じ場所に入れ、どの型かは `NodeKind`で区別します。
- **`inline`**: ヘッダに関数の本体を書く指定です。ここでは、コンパイラが呼び出し元に展開して最適化しやすくする狙いもあります。
- **`const` メンバ関数**: `concat` は自分を変更せず、新しい Twine を返します。
- **子の数**: Twine は子を 0 個（nullary）、1 個（unary）、2 個（binary）持てます。

## 何をしているか

### 1. null は伝染する

```cpp:line-numbers=498
  // null との連結は null。
  if (isNull() || Suffix.isNull())
    return Twine(NullKind);
```

`NullKind` は「無効な文字列」を表す特別な値です。どちらかが null なら、結果も null にします。エラーを返したい関数が null を返すと、その後の連結もすべて null になり、無効だと伝わります。

### 2. 空ならもう一方を返す

```cpp:line-numbers=503
  if (isEmpty())
    return Suffix;
  if (Suffix.isEmpty())
    return *this;
```

`"" + x` は `x` と同じです。新しい節を作らず、相手をそのまま返します。

### 3. 新しい節を作る

```cpp:line-numbers=510
  Child NewLHS, NewRHS;
  NewLHS.twine = this;
  NewRHS.twine = &Suffix;
  NodeKind NewLHSKind = TwineKind, NewRHSKind = TwineKind;
```

まず、左右の子を「`this` への Twine ポインタ」「`Suffix` への Twine ポインタ」にします。

### 4. 子が 1 つの Twine は畳み込む

```cpp:line-numbers=514
  if (isUnary()) {
    NewLHS = LHS;
    NewLHSKind = getLHSKind();
  }
  if (Suffix.isUnary()) {
    NewRHS = Suffix.LHS;
    NewRHSKind = Suffix.getLHSKind();
  }
```

`Twine("foo")` は、左に C 文字列を 1 つ持つだけの unary な Twine です。これを指すポインタを子にすると、木が無駄に深くなります。
そこで、unary なら **その中身（`LHS` とその種類）を直接自分の子にします**。

例: `Twine("a") + Twine("b")`
- 左右とも unary なので、結果は「左: C 文字列 "a"、右: C 文字列 "b"」の 1 節だけになります。

さらに `+ Twine("c")` すると、左は binary なので Twine ポインタのまま、右は "c" を直接持ちます。

```
      [・ , "c"]
       |
   ["a", "b"]
```

### 5. 返す

```cpp:line-numbers=523
  return Twine(NewLHS, NewLHSKind, NewRHS, NewRHSKind);
```

4 つの値から、新しい Twine を値として作って返します。

## ここがすごい

- **途中の文字列を作らない**: `std::string` で `a + b + c` とすると、`a + b` の一時文字列を作ってから `c` を足します。Twine は最後に 1 回だけ書き出すので、メモリ確保とコピーが減ります。結果が使われなければ、何も作りません。
- **ヒープを使わない**: 節はすべてスタック上の一時オブジェクトで、連結の過程で `new` は一度も呼ばれません。
- **木を浅く保つ規則**: 「子が Twine なら、その子は必ず binary」という不変条件を、この畳み込みで守っています。`isValid()` で検査もしています。
- **よくある場合に最適化しやすい**: `concat` を `inline` にすることで、葉どうしの連結はコンパイラが直接 1 つのスタック上のオブジェクトへの書き込みに変換できる、と、クラスの説明コメントに書かれています。

## まとめ

- 文字列の連結は「予定」だけを木として持ち、必要になったときに一度で書き出せる。
- null を伝染させると、エラーを連結の最後まで運べる。
- 子が 1 つの節は親に畳み込むと、木が浅く保てる。
- 一時オブジェクトへのポインタを持つ型は、引数として使う専用にする。

