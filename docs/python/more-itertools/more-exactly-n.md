---
title: 「ちょうど n 個」を、n 個目と n+1 個目だけ見て判定する
description: more_itertools.exactly_n は、条件を満たす要素がちょうど n 個かを調べる。全部数えずに n 個目まで飛ばし、その次があるかだけを確かめるので、途中で答えが出る。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3206, 3234]
function: exactly_n
difficulty: 2
tags: [イテレータ, 最適化, イディオム]
---
## ひとことで

`exactly_n(iterable, n, predicate)` は、**条件を満たす要素がちょうど n 個あるか** を調べる関数です。
`exactly_n([True, True, False], 2)` は `True`、`exactly_n(range(10), 3, lambda x: x < 3)` も `True` です。
全部を数えるのではなく、「n 個目があるか」と「n+1 個目がないか」の 2 点だけを確かめるので、条件を満たすものが大量にあっても、n+1 個目を見つけた時点で `False` を返せます。

## コード

```python:line-numbers=3206
def exactly_n(iterable, n, predicate=bool):
    """Return ``True`` if exactly ``n`` items in the iterable are ``True``
    according to the *predicate* function.

        >>> exactly_n([True, True, False], 2)
        True
        >>> exactly_n([True, True, False], 1)
        False
        >>> exactly_n([0, 1, 2, 3, 4, 5], 3, lambda x: x < 3)
        True

    The iterable will be advanced until ``n + 1`` truthy items are encountered,
    so avoid calling it on infinite iterables.

    """
    iterator = filter(predicate, iterable)
    if n <= 0:
        if n < 0:
            return False
        for _ in iterator:
            return False
        return True

    iterator = islice(iterator, n - 1, None)
    for _ in iterator:
        for _ in iterator:
            return False
        return True
    return False
```

## 前提知識

- **`filter(predicate, iterable)`**: 条件を満たす要素だけを出すイテレータです。デフォルトの `predicate=bool` は「真とみなせる値」だけを残します。
- **`islice(iterator, n - 1, None)`**: 先頭から n-1 個を飛ばして、残りを出します。
- **同じイテレータを二重の `for` で回す**: 内側の `for` は外側の続きを読みます。
- **`for` の中の `return`**: 1 つ取り出せた時点で関数を終えられます。

## 何をしているか

### 1. 条件を満たすものだけにする（3221 行目）

`filter` を通すと、以降は「条件を満たす要素」だけを数えればよくなります。

### 2. n が 0 以下の場合（3222〜3227 行目）

n が負なら、ちょうど負の個数はありえないので `False`。n が 0 なら、1 つでも条件を満たすものがあれば `False`、なければ `True` です。

### 3. n - 1 個を飛ばす（3229 行目）

`n = 3` なら、条件を満たす要素の先頭 2 個を飛ばします。

### 4. n 個目と n+1 個目を確かめる（3230〜3234 行目）

- 外側の `for` で 1 つ取れた → n 個目がある
  - 内側の `for` でもう 1 つ取れた → n+1 個目もあるので `False`
  - 取れなかった → ちょうど n 個なので `True`
- 外側の `for` で取れなかった → n 個に足りないので `False`

## ここがすごい

### 全部数えなくてよい

素直に書くと `sum(map(predicate, iterable)) == n` ですが、これは最後まで数え切ります。100 万個の要素がすべて条件を満たしていて n = 3 なら、99 万 9996 個を無駄に数えることになります。
`exactly_n` は n+1 個目を見つけた時点で答えが出るので、読むのは最大で「n+1 個目の位置」までです。

### 飛ばす部分も C に任せる

n-1 個を飛ばす処理は `islice` が C の中で行うので、Python のループで 1 つずつ数えるより速くなります。条件判定も `filter` の中なので、Python で書いているのは最後の 2 つの確認だけです。

### 二重の `for` で「次があるか」を表す

`next()` と `try`/`except StopIteration` を使う代わりに、`for` を「1 つ取り出せるか」の確認に使っています。外側と内側の 2 段で「n 個目」「n+1 個目」を表しているので、条件分岐が読みやすい形にまとまっています。

### 境界の値も正しく扱う

n = 0 では `islice(iterator, -1, None)` が作れないので、先に別扱いしています。負の n も含めて、利用者がどんな値を渡しても正しい答えを返します。

## まとめ

- 「ちょうど n 個か」は、「n 個目がある」かつ「n+1 個目がない」で判定できる。
- 答えが確定した時点で読むのをやめると、大きな入力でも速い。
- 飛ばす処理は `islice` に任せると、C の速さで行える。
