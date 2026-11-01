---
title: 1 つ先を読んで「最初」と「最後」に印を付ける
description: more_itertools.mark_ends は、各要素に「最初か」「最後か」の印を付けて返す。同じイテレータを二重の for で回し、1 要素遅れで出すことで最後を判定している。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [2532, 2559]
function: mark_ends
difficulty: 2
tags: [イテレータ, イディオム]
---
## ひとことで

`mark_ends(iterable)` は、各要素に **「最初の要素か」「最後の要素か」** の 2 つの印を付けて出す関数です。
`list(mark_ends('ABC'))` は `[(True, False, 'A'), (False, False, 'B'), (False, True, 'C')]` になります。
「最後の要素だけカンマを付けない」のような処理が、長さのわからないデータでも簡単に書けます。

## コード

```python:line-numbers=2532
def mark_ends(iterable):
    """Yield 3-tuples of the form ``(is_first, is_last, item)``.

    >>> list(mark_ends('ABC'))
    [(True, False, 'A'), (False, False, 'B'), (False, True, 'C')]

    Use this when looping over an iterable to take special action on its first
    and/or last items:

    >>> iterable = ['Header', 100, 200, 'Footer']
    >>> total = 0
    >>> for is_first, is_last, item in mark_ends(iterable):
    ...     if is_first:
    ...         continue  # Skip the header
    ...     if is_last:
    ...         continue  # Skip the footer
    ...     total += item
    >>> print(total)
    300
    """
    it = iter(iterable)
    for a in it:
        first = True
        for b in it:
            yield first, False, a
            a = b
            first = False
        yield first, True, a
```

## 前提知識

- **イテレータは先が見えない**: ジェネレータなどは、次の要素を読んでみるまで「これが最後か」がわかりません。
- **同じイテレータを二重の `for` で回す**: 外側と内側の `for` が同じイテレータ `it` を使うと、内側が取り出した分は外側に戻ってきません。続きを読むことになります。
- **`yield`**: ジェネレータから値を 1 つ出して一時停止します。
- **タプル**: `first, False, a` のように並べると、3 つの値の組 `(first, False, a)` になります。

## 何をしているか

`'ABC'` で追います。

### 1. 最初の要素を読む（552〜554 行目）

外側の `for` で `a = 'A'` を読み、`first = True` にします。

### 2. 次が読めたら、1 つ前を「最後ではない」として出す（555〜558 行目）

内側の `for` で `b = 'B'` が読めたので、`'A'` は最後ではありません。`(True, False, 'A')` を出し、`a = 'B'`、`first = False` にします。
次に `b = 'C'` が読めたので、`(False, False, 'B')` を出し、`a = 'C'` にします。

### 3. もう読めなければ、手元のものが最後（559 行目）

内側の `for` が終わった（もう要素がない）ので、手元の `'C'` が最後です。`(False, True, 'C')` を出します。
外側の `for` に戻りますが、`it` はもう尽きているので、すぐに終わります。

要素が 1 つだけなら、内側の `for` は 1 回も回らず、`(True, True, 'A')` が出ます。空なら何も出ません。

## ここがすごい

### 「1 つ遅れで出す」と最後がわかる

最後かどうかは、**次の要素があるかどうか** で決まります。そこで、読んだ要素をすぐには出さずに 1 つ手元に持っておき、次の要素が読めた時点で「さっきのは最後ではなかった」と確定して出します。読めなかったら、手元のものが最後です。これは「先読み（ルックアヘッド）」と呼ばれる基本テクニックです。

### 二重の `for` で状態を表す

外側の `for` は「最初の 1 つを読む」、内側の `for` は「残りを読む」役割です。外側は実質 1 回しか回りませんが、これを使うことで、

- 空のデータ（外側が回らない）
- 1 要素のデータ（内側が回らない）
- 2 要素以上

の 3 つの場合を、if 文なしで自然に扱えています。`next()` と `StopIteration` を使うより短く、例外処理も不要です。

### `enumerate` と `len` を使わない

リストなら `for i, x in enumerate(data): is_last = i == len(data) - 1` と書けますが、これは長さがわかるときしか使えません。`mark_ends` はファイルやネットワークから流れてくるデータにも使えます。

## まとめ

- 「最後かどうか」は、1 つ先を読んでみるまでわからない。手元に 1 つ持っておく先読みで判定できる。
- 同じイテレータを二重の `for` で回すと、「最初」と「残り」を分けて扱える。
- 長さに頼らない書き方は、どんな入力にも使える。
