---
title: bytearray のスライス代入で倍数を一気に消す、エラトステネスのふるい
description: more_itertools.sieve は、n 未満の素数を順に出す。奇数だけを bytearray で表し、倍数の消去をスライス代入 1 回で行い、確定した素数はすぐに出す。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [911, 929]
function: sieve
difficulty: 3
tags: [アルゴリズム, 数値計算, 最適化, ハック]
---
## ひとことで

`sieve(n)` は、**n 未満の素数を小さい順に出す** 関数です。`list(sieve(30))` は `[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]` です。
アルゴリズムは「エラトステネスのふるい」（素数の倍数を順に消していき、残ったものが素数）ですが、Python で速く動くように、倍数を消す処理をループではなく **スライス代入 1 回** で行っています。

## コード

```python:line-numbers=911
def sieve(n):
    """Yield the primes less than n.

    >>> list(sieve(30))
    [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

    """
    # This implementation comes from an older version of the itertools
    # documentation.  The newer implementation is easier to read but is
    # less lazy.
    if n > 2:
        yield 2
    start = 3
    data = bytearray((0, 1)) * (n // 2)
    for p in iter_index(data, 1, start, stop=isqrt(n) + 1):
        yield from iter_index(data, 1, start, p * p)
        data[p * p : n : p + p] = bytes(len(range(p * p, n, p + p)))
        start = p * p
    yield from iter_index(data, 1, start)
```

`isqrt(n)` は n の平方根の整数部分です。`iter_index(data, 1, start, stop)` は、同じファイルの 865 行目にある関数で、`data` の中で値が `1` の位置を、`start` 以上 `stop` 未満の範囲で順に出します。

## 前提知識

- **素数**: 1 と自分自身でしか割り切れない 2 以上の整数です。
- **エラトステネスのふるい**: 2 から順に、まだ消えていない数を素数と認め、その倍数をすべて消していく方法です。√n までの素数で消せば十分です。
- **`bytearray`**: 0〜255 の数を並べた、書き換えできる配列です。`bytearray((0, 1)) * 3` は `[0, 1, 0, 1, 0, 1]` になります。
- **スライス代入**: `data[a:b:c] = 値の並び` で、a から b の手前まで c おきの位置をまとめて書き換えます。
- **`bytes(k)`**: 0 が k 個並んだバイト列です。
- **`len(range(a, b, c))`**: a から b の手前まで c おきに数えた個数です。実際に数を並べずに計算できます。

## 何をしているか

### 1. 2 は特別扱い、奇数だけを候補にする（921〜924 行目）

偶数で素数なのは 2 だけなので、先に出します。`data` は「位置 i が奇数なら 1、偶数なら 0」の配列で、最初から偶数は候補から外れています。

### 2. 素数 p ごとに倍数を消す（925〜928 行目）

n = 30 で追います。`stop = isqrt(30) + 1 = 6` までの範囲で、値が 1 の位置を探します。

- **p = 3**: まず `start`（3）から `p*p`（9）の手前までの素数 `3, 5, 7` を出します（926 行目）。9 未満の数で消えていないものは、もう素数と確定しているからです。次に `data[9:30:6]` に 0 を書き込み、9, 15, 21, 27 を消します（927 行目）。
- **p = 5**: 9 から 25 の手前までで残っている `11, 13, 17, 19, 23` を出し、`data[25:30:10]` で 25 を消します。

### 3. 残りを出す（929 行目）

25 以降で残っている `29` を出します。

## ここがすごい

### 倍数の消去をスライス代入 1 回で

素直に書くと、

```python
for m in range(p * p, n, p):
    data[m] = 0
```

という Python のループになります。927 行目は、0 を並べたバイト列をスライスに代入するだけなので、書き換えはすべて C の中で一気に行われます。

### `p*p` から、`2p` おきに

- p の倍数のうち p×p より小さいもの（3×5 など）は、もっと小さい素数ですでに消えています。だから **p×p から** 消せば十分です。
- p×p は奇数で、そこから p を足すと偶数になります。偶数は最初から候補外なので、**2p おきに** 奇数の倍数だけを消せば半分の手間で済みます。

### 確定した素数はすぐに出す

918〜920 行目のコメントの通り、この実装は「より怠惰（lazy）」な版です。p×p 未満の数は p で消す前に素数と確定するので、ふるいを最後まで終える前に、確定した分から順に `yield` しています。`sieve(10**8)` でも、最初の素数はすぐに手に入ります。

### 値の探索も `iter_index` で速く

`iter_index` は、内部で `bytearray.index` を使って値 1 の位置を探すので、ここでも 1 つずつ調べる Python のループを避けています。

## まとめ

- エラトステネスのふるいは、p×p から始めて、奇数だけを対象にすると効率がよい。
- 配列の一括書き換えはスライス代入で、C の速さで行える。
- 確定した結果から順に出すと、全体の計算が終わる前に使い始められる。
