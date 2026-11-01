---
title: 「当たるまで引き直す」で完全に公平な乱数を作る
description: random モジュールの内部関数で、0 以上 n 未満の整数を偏りなく作る。必要なビット数だけ乱数を取り、範囲外ならやり直す「棄却法」を使っている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [245, 252]
function: Random._randbelow_with_getrandbits
difficulty: 2
format: 2
tags: [乱数, ビット演算, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`_randbelow_with_getrandbits(n)` は、**0 以上 n 未満の整数を、どれも同じ確率で 1 つ選ぶ** 関数です。`randrange()`、`randint()`、`shuffle()`、`choice()` など、整数の乱数を使う多くの関数の土台になっています。
やり方は単純で、「ちょうど足りるビット数のランダムな数を作り、n 以上だったら作り直す」です。

## コード

```python:line-numbers=245
    def _randbelow_with_getrandbits(self, n):
        "Return a random int in the range [0,n).  Defined for n > 0."

        k = n.bit_length()
        r = self.getrandbits(k)  # 0 <= r < 2**k
        while r >= n:
            r = self.getrandbits(k)
        return r
```

## 前提知識

- **ビット**: コンピュータの数は 0 と 1 の並び（2 進数）で表されます。k ビットで表せる数は 0〜2^k-1 です。
- **`n.bit_length()`**: 整数 `n` を 2 進数で書いたときの桁数です。`5`（2 進数で `101`）なら 3、`8`（`1000`）なら 4 です。
- **`getrandbits(k)`**: k ビットのランダムな整数、つまり 0〜2^k-1 のどれかを等確率で返します。
- **`while` ループ**: 条件が真の間、中身を繰り返します。
- **docstring の `[0,n)`**: 数学の記法で「0 以上 n 未満」を表します。

## 何をしているか

`n = 5` で追います。

### 1. 必要なビット数を求める

```python:line-numbers=248
        k = n.bit_length()
```

`5.bit_length()` は 3 です。3 ビットなら 0〜7 の 8 通りが表せて、0〜4 の 5 通りを含むことができます。

### 2. ランダムな数を作る

```python:line-numbers=249
        r = self.getrandbits(k)  # 0 <= r < 2**k
```

`getrandbits(3)` で 0〜7 のどれかが等確率で出ます。

### 3. 範囲外なら作り直す

```python:line-numbers=250
        while r >= n:
            r = self.getrandbits(k)
```

5, 6, 7 が出たら捨てて、もう一度 `getrandbits(3)` を呼びます。0〜4 が出たらそれを返します。

各回で成功する確率は 5/8 です。何回目で成功しても、出てくる値は 0〜4 のどれかが 1/5 ずつです。

## ここがすごい

### 「余りを取る」方法の偏りを避けている

いちばん簡単な方法は `getrandbits(3) % 5` です。しかし 0〜7 を 5 で割った余りは、

- 0 → 0, 5 → 0
- 1 → 1, 6 → 1
- 2 → 2, 7 → 2
- 3 → 3
- 4 → 4

となり、0〜2 は 2/8、3〜4 は 1/8 の確率になってしまいます。**捨ててやり直す**（棄却法）なら、残った値はどれも同じ回数ずつしか出てこないので、完全に等確率です。

### やり直しは平均 2 回未満

`k = n.bit_length()` は「2^(k-1) ≤ n < 2^k」となる最小の k です。つまり n は必ず 2^k の半分以上なので、1 回で成功する確率は 1/2 以上です。ループの回数の期待値は 2 回未満で、実用上はほとんど 1 回で終わります。

### 小数を経由しない

`int(random() * n)` のように 0〜1 の小数から作る方法もありますが、小数の精度は 53 ビットしかないため、n が非常に大きいと出ない整数が生まれます。整数のビットを直接使うので、n がどれだけ大きくても（Python の整数には上限がありません）正しく動きます。

### 最小限の材料で済ませる

1 回に使う乱数は k ビットだけです。必要以上のビットを生成しないので、乱数生成器の負担も最小です。

## まとめ

- 「範囲外なら捨ててやり直す」棄却法は、偏りのない乱数を作る基本テクニック。
- `% n` で範囲に押し込むと、多くの場合わずかな偏りが出る。
- ビット数を必要最小限にすると、やり直しの回数を平均 2 回未満に抑えられる。
