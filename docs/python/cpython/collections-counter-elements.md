---
title: ループを書かずに「個数ぶん繰り返す」を 1 行で組み立てる
description: collections.Counter.elements は、各要素を個数の回数だけ繰り返して並べるイテレータを返す。itertools の部品を 3 つ組み合わせ、Python のループを一切書いていない。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/collections/__init__.py
lines: [642, 661]
function: Counter.elements
difficulty: 2
format: 2
tags: [イテレータ, 関数型, 遅延評価, 標準ライブラリ]
---

## ひとことで

`Counter` は「要素ごとの個数」を数える辞書です。`elements()` は、その個数の回数だけ各要素を繰り返して取り出すイテレータを返します。
`Counter({"A": 2, "B": 1})` なら `A, A, B` が出てきます。
本体はたった 1 行で、`itertools` の部品を組み合わせて作られています。

## コード

::: code-group

```python:line-numbers=642 [日本語訳]
    def elements(self):
        '''Iterator over elements repeating each as many times as its count.

        >>> c = Counter('ABCABC')
        >>> sorted(c.elements())
        ['A', 'A', 'B', 'B', 'C', 'C']

        Knuth's example for prime factors of 1836:  2**2 * 3**3 * 17**1

        >>> import math
        >>> prime_factors = Counter({2: 2, 3: 3, 17: 1})
        >>> math.prod(prime_factors.elements())
        1836

        Note, if an element's count has been set to zero or is a negative
        number, elements() will ignore it.

        '''
        # Smalltalk の Bag.do と C++ の Multiset.begin をまねている。
        return _chain.from_iterable(_starmap(_repeat, self.items()))
```

```python:line-numbers=642 [原文]
    def elements(self):
        '''Iterator over elements repeating each as many times as its count.

        >>> c = Counter('ABCABC')
        >>> sorted(c.elements())
        ['A', 'A', 'B', 'B', 'C', 'C']

        Knuth's example for prime factors of 1836:  2**2 * 3**3 * 17**1

        >>> import math
        >>> prime_factors = Counter({2: 2, 3: 3, 17: 1})
        >>> math.prod(prime_factors.elements())
        1836

        Note, if an element's count has been set to zero or is a negative
        number, elements() will ignore it.

        '''
        # Emulate Bag.do from Smalltalk and Multiset.begin from C++.
        return _chain.from_iterable(_starmap(_repeat, self.items()))
```

:::

`_chain`、`_starmap`、`_repeat` は、このファイルの冒頭で `itertools` から読み込んだ `chain`、`starmap`、`repeat` に別名を付けたものです。

```python:line-numbers=37
from itertools import chain as _chain
from itertools import repeat as _repeat
from itertools import starmap as _starmap
```

## 前提知識

- **`Counter`**: 辞書の一種で、キーが要素、値がその個数です。`Counter("ABCABC")` は `{"A": 2, "B": 2, "C": 2}` になります。
- **`self.items()`**: 辞書の `(キー, 値)` の組を 1 つずつ取り出せます。
- **`repeat(x, n)`**: `x` を `n` 回出すイテレータです。`n` が 0 以下なら何も出しません。
- **`starmap(f, pairs)`**: `pairs` の各組 `(a, b)` を `f(a, b)` のように **展開して** 関数に渡します。
- **`chain.from_iterable(its)`**: 「イテレータの並び」を受け取り、それらを順番につないで 1 本にします。
- **遅延評価**: イテレータは、値が必要になったときに初めて計算します。`elements()` を呼んだ時点では、まだ何も並べていません。

## 何をしているか

`c = Counter({"A": 2, "B": 1, "C": 0})` で、内側から順に見ていきます。

### 1. `self.items()` で組を取り出す

```python:line-numbers=661
        return _chain.from_iterable(_starmap(_repeat, self.items()))
```

`self.items()` は `("A", 2), ("B", 1), ("C", 0)` を出します。

### 2. `_starmap(_repeat, ...)` で組を展開する

各組を `repeat` に展開して渡すので、

- `repeat("A", 2)` → `A, A`
- `repeat("B", 1)` → `B`
- `repeat("C", 0)` → （何も出さない）

という 3 つのイテレータが順に作られます。

### 3. `_chain.from_iterable(...)` でつなぐ

それらをつないで、`A, A, B` を出す 1 本のイテレータにします。個数が 0 の `C` は自然に消えます。
説明文にある「0 や負の個数は無視する」は、`repeat` が 0 以下の回数で何も出さないことから、特別な処理なしに実現されています。

## ここがすごい

### Python のループを書かない

素直に書くと次のようになります。

```python
def elements(self):
    for elem, count in self.items():
        for _ in range(count):
            yield elem
```

これでも動きますが、二重ループの 1 回 1 回が Python の命令として実行されます。
`chain`、`starmap`、`repeat` はどれも C 言語で書かれているので、組み合わせると **繰り返しの処理がすべて C の中で行われ**、ずっと速くなります。

### 部品を組み合わせて意味を作る

`repeat` は「繰り返す」、`starmap` は「組を展開して関数に渡す」、`chain` は「つなぐ」。それぞれは単純ですが、組み合わせると「各要素を個数ぶん繰り返して、つなぐ」という意味がそのまま表現できます。関数型プログラミングでよく使われる考え方です。

### 遅延評価でメモリを使わない

返り値はイテレータなので、個数が 1 億でも 1 億個のリストは作りません。必要な分だけ取り出せます。

### 名前の先頭の `_`

`_chain` のように別名で読み込んでいるのは、`collections` モジュールを `import` した人から `collections.chain` のような余計な名前が見えないようにするためです。

## まとめ

- `itertools` の小さな部品を組み合わせると、ループを書かずに複雑な繰り返しが作れる。
- C で書かれた部品に繰り返しを任せると、Python で書いたループより速い。
- 境界の扱い（0 や負の個数）を部品の性質に任せると、特別な処理が不要になる。
