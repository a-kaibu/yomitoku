---
title: "ビットマスクで、集合の部分集合を 1 つずつ取り出す"
description: "Guava の Sets.powerSet が作る部分集合 SubSet。整数のビットを要素の有無に対応させ、最も下の 1 ビットを順に取り出して要素を列挙する。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2007 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/collect/Sets.java
lines: [1681, 1723]
function: "Sets.SubSet"
difficulty: 3
format: 2
tags: [アルゴリズム, ビット演算, イテレータ]
---

## ひとことで

`Sets.powerSet(set)` は、ある集合のすべての部分集合を集めた集合を返します。たとえば `{a, b}` の部分集合は、`{}`、`{a}`、`{b}`、`{a, b}` の 4 つです。

Guava は、この部分集合の 1 つひとつを、`SubSet` という小さなクラスで表します。`SubSet` は、整数 1 つ（マスク）を持っていて、そのビットが 1 の位置の要素だけを含みます。全部の部分集合を最初から作るのではなく、取り出されるときに作ります。

## コード

```java:line-numbers=1681
  private static final class SubSet<E> extends AbstractSet<E> {
    private final ImmutableMap<E, Integer> inputSet;
    private final int mask;

    SubSet(ImmutableMap<E, Integer> inputSet, int mask) {
      this.inputSet = inputSet;
      this.mask = mask;
    }

    @Override
    public Iterator<E> iterator() {
      return new UnmodifiableIterator<E>() {
        final ImmutableList<E> elements = inputSet.keySet().asList();
        int remainingSetBits = mask;

        @Override
        public boolean hasNext() {
          return remainingSetBits != 0;
        }

        @Override
        public E next() {
          int index = Integer.numberOfTrailingZeros(remainingSetBits);
          if (index == 32) {
            throw new NoSuchElementException();
          }
          remainingSetBits &= ~(1 << index);
          return elements.get(index);
        }
      };
    }

    @Override
    public int size() {
      return Integer.bitCount(mask);
    }

    @Override
    public boolean contains(@Nullable Object o) {
      Integer index = inputSet.get(o);
      return index != null && (mask & (1 << index)) != 0;
    }
  }
```

## 前提知識

- **部分集合の数**: `n` 個の要素からは、`2^n` 個の部分集合ができます。`PowerSet` のサイズは `1 << inputSet.size()` で、これは `2^n` を意味します。
- **マスク**: 整数の各ビットを、要素の有無に対応させる考え方です。`i` ビット目が 1 なら、`i` 番目の要素を含みます。
- **`Integer.numberOfTrailingZeros(x)`**: `x` の最も下にある 1 ビットの位置を返します。`x` が 0 なら 32 を返します。
- **`&= ~(1 << index)`**: 指定したビットだけを 0 にします。取り出した要素のビットを消すために使われます。
- **`ImmutableMap` の添字**: 要素には、入力の順番に対応する番号が付いています。この番号が、マスクのビット位置になります。

## 何をしているか

### 1. 部分集合は、マスクで表される

```java:line-numbers=1677
  public static <E> Set<Set<E>> powerSet(Set<E> set) {
    return new PowerSet<>(set);
  }
```

`powerSet` は、`PowerSet` を返すだけです。`PowerSet` のサイズは `2^n` で、そのそれぞれの整数が、1 つの部分集合（`SubSet`）のマスクになります。

### 2. 最も下の 1 ビットから要素を取り出す

```java:line-numbers=1703
          int index = Integer.numberOfTrailingZeros(remainingSetBits);
          if (index == 32) {
            throw new NoSuchElementException();
          }
          remainingSetBits &= ~(1 << index);
```

`next()` は、残っているビットの中で最も下のものを探します。その位置が、次に取り出す要素の番号です。取り出したら、そのビットを 0 にして、残りを次の回で使います。

### 3. 含まれるかどうかは、ビットを見るだけ

```java:line-numbers=1721
      return index != null && (mask & (1 << index)) != 0;
```

`contains` は、要素の番号を調べて、マスクのその位置のビットが 1 かどうかを見ます。要素を列挙しなくても、所属の判定ができます。

## ここがすごい

- **列挙が 1 回の計算で済む**: 最も下の 1 ビットを探すのに、`numberOfTrailingZeros` の 1 命令を使います。要素を 1 つずつ調べる必要がありません。
- **大きさの計算がビットの個数**: `size()` は `Integer.bitCount(mask)` で、マスクの中の 1 の数です。部分集合の大きさを、ビットの数えで求めています。
- **メモリを抑える**: 部分集合は、マスク 1 個とその集合への参照しか持ちません。すべての部分集合を保持しないので、要素数が多くても、作る量は取り出した分だけです。
- **要素数の上限を決めている**: `PowerSet` のコンストラクタで、要素数が 30 を超えたら例外にします。30 という数は、`int` のマスクで扱える範囲に合わせたものと考えられます（コードには理由は書かれていません）。

## まとめ

- 部分集合は、整数のマスクで表され、各ビットが要素の有無に対応する。
- `numberOfTrailingZeros` で最も下の 1 ビットを取り出し、そのビットを消して、残りの要素へ進む。
- 部分集合はマスク 1 個で表すので、取り出すまで作らず、大量の集合でもメモリを抑えられる。
