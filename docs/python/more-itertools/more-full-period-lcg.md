---
title: メモリを使わずに 0〜n-1 をランダムな順で 1 回ずつ出す
description: more_itertools の内部関数。線形合同法という簡単な乱数の式を「全部の値を 1 回ずつ通る」ように設定し、XOR でかき混ぜて、シャッフルした順番をリストなしで作る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [5619, 5640]
function: _full_period_lcg
difficulty: 3
format: 2
tags: [乱数, ビット演算, アルゴリズム, メモリ管理]
---

## ひとことで

`_full_period_lcg(n)` は、**0 から n-1 までの整数を、ランダムな順番で、それぞれちょうど 1 回ずつ出す** ジェネレータです。
`list(range(n))` を作ってシャッフルすれば同じことができますが、n が 10 億だとそのリストだけで大量のメモリを使います。この関数はリストを作らず、**数個の変数だけ** で同じことを実現します。

## コード

::: code-group

```python:line-numbers=5619 [日本語訳]
def _full_period_lcg(n):
    "Returns values from range(n) in randomly shuffled order."

    # このアルゴリズムは、フラックス付きの全周期線形合同法である。
    # 大きさ *m* は 2 のべき乗。*mask* により剰余の計算が速くなる。
    # 乗数 *a* と加数 *c* は Hull–Dobell の定数である。参照:
    # https://jackgiffin.com/main/pdfs/Random-Number-Generators-T-E-Hull-and-A-R-Dobell.pdf
    # 値 *x* はランダムな開始位置である。
    # *flux* のビット列は、LCG の規則的なパターンを崩す。

    m = 1 << n.bit_length()
    mask = m - 1
    a = randrange(5, m, 4) if m > 4 else 1
    c = randrange(1, m, 2) if m > 1 else 1
    x = randrange(m)
    flux = randrange(m)

    for _ in repeat(None, m):
        index = x ^ flux
        if index < n:
            yield index
        x = (a * x + c) & mask
```

```python:line-numbers=5619 [原文]
def _full_period_lcg(n):
    "Returns values from range(n) in randomly shuffled order."

    # The algorithm is a fluxed, full period linear congruential generator.
    # Size *m* is a power of two.  The *mask* speeds-up modulo calculations.
    # The multiplier *a* and addend *c* are Hull-Dobell constants.  See:
    # https://jackgiffin.com/main/pdfs/Random-Number-Generators-T-E-Hull-and-A-R-Dobell.pdf
    # The value *x* is a random starting point.
    # The *flux* bitfield breaks-up patterns in the LCG.

    m = 1 << n.bit_length()
    mask = m - 1
    a = randrange(5, m, 4) if m > 4 else 1
    c = randrange(1, m, 2) if m > 1 else 1
    x = randrange(m)
    flux = randrange(m)

    for _ in repeat(None, m):
        index = x ^ flux
        if index < n:
            yield index
        x = (a * x + c) & mask
```

:::

`randrange` は `random.randrange`、`repeat` は `itertools.repeat` です。

## 前提知識

- **線形合同法（LCG）**: `x = (a * x + c) % m` を繰り返して数の列を作る、昔からある簡単な乱数の作り方です。
- **全周期**: LCG の列が、0〜m-1 の **すべての値をちょうど 1 回ずつ** 通ってから最初に戻ることです。`m` が 2 のべき乗なら、「`c` が奇数」かつ「`a - 1` が 4 の倍数」のとき全周期になることが知られています（Hull–Dobell の定理）。
- **`1 << k`**: 1 を k ビット左にずらした数、つまり 2^k です。
- **`& mask`**: `mask = m - 1`（2 進数で 1 が並んだ数）との AND は、`% m` と同じ結果を、割り算なしで求めます。
- **`^`（XOR）**: ビットごとの排他的論理和です。同じ値 `flux` との XOR は、0〜m-1 の値を 0〜m-1 の別の値に **1 対 1 で** 入れ替えます。
- **`randrange(5, m, 4)`**: 5, 9, 13, ... の中からランダムに 1 つ選びます。どれも「4 で割ると 1 余る」数です。

## 何をしているか

`n = 5` で考えます。

### 1. n 以上の 2 のべき乗を選ぶ

```python:line-numbers=5629
    m = 1 << n.bit_length()
    mask = m - 1
```

`5.bit_length()` は 3 なので、`m = 8`、`mask = 7` です。

### 2. 全周期になる係数を選ぶ

```python:line-numbers=5631
    a = randrange(5, m, 4) if m > 4 else 1
    c = randrange(1, m, 2) if m > 1 else 1
    x = randrange(m)
    flux = randrange(m)
```

- `a`: 5, 9, 13, ... から選ぶので、`a - 1` は必ず 4 の倍数
- `c`: 1, 3, 5, ... から選ぶので、必ず奇数
- `x`: 開始位置（ランダム）
- `flux`: かき混ぜ用の値（ランダム）

これで、Hull–Dobell の条件がいつも満たされます。

### 3. m 回まわして、n 未満のものだけ出す

```python:line-numbers=5636
    for _ in repeat(None, m):
        index = x ^ flux
        if index < n:
            yield index
        x = (a * x + c) & mask
```

`x` は 0〜7 をすべて 1 回ずつ通ります。`x ^ flux` も 0〜7 を 1 回ずつ通ります（XOR は 1 対 1 の入れ替えだから）。そのうち 5 未満のもの（0〜4）だけを出せば、0〜4 がちょうど 1 回ずつ、ランダムな順番で出てきます。

## ここがすごい

### 「全部を 1 回ずつ通る乱数」を作る

ふつうの乱数は同じ値が何度も出ますが、全周期の LCG は **重複なく全部を通る** ことが数学的に保証されています。これを使えば、「シャッフルした順番」をリストなしで作れます。必要なメモリは `m`、`mask`、`a`、`c`、`x`、`flux` の 6 つの整数だけです。

### 2 のべき乗にして割り算を消す

`m` を 2 のべき乗にすると、全周期の条件が単純になる上に、`% m` を `& mask` で計算できます。ビット演算は割り算より速いです。

### 無駄は最大で半分

`m` は n 以上の最小の 2 のべき乗なので、`m < 2n` です。n 以上の値は捨てますが、捨てるのは全体の半分未満で済みます。

### XOR で単調さを消す

LCG の列は、下位のビットが規則的に変わるなどのくせがあります。`flux` との XOR はそうしたパターンを崩すための工夫です。XOR は 1 対 1 なので、全周期の性質を壊さずにかき混ぜられます。

## まとめ

- 条件を満たした線形合同法は、0〜m-1 を重複なく 1 回ずつ通る。
- `m` を 2 のべき乗にすると、条件が簡単になり、割り算もビット演算で置き換えられる。
- 1 対 1 の変換（XOR）なら、全部を 1 回ずつ通る性質を保ったままかき混ぜられる。
