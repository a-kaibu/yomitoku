---
title: 「最初の値があるかないか」をセンチネルで見分ける reduce
description: functools.reduce の Python 版。値を 1 つにたたみ込む処理を、イテレータと専用の目印オブジェクトを使ってすっきり書いている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [237, 265]
function: reduce
difficulty: 1
tags: [関数型, イテレータ, イディオム, 標準ライブラリ]
---
## ひとことで

`reduce` は、リストなどの要素を左から順に 2 つずつ関数に通し、最後に 1 つの値にまとめる（たたみ込む）関数です。
`reduce(lambda x, y: x + y, [1, 2, 3, 4, 5])` は `((((1 + 2) + 3) + 4) + 5)`、つまり `15` を返します。
短い関数ですが、「引数が省略されたか」の判定と、イテレータの使い方にお手本になる工夫があります。

## コード

```python:line-numbers=237
def reduce(function, sequence, /, initial=_initial_missing):
    """
    reduce(function, iterable, /[, initial]) -> value

    Apply a function of two arguments cumulatively to the items of an iterable, from left to right.

    This effectively reduces the iterable to a single value.  If initial is present,
    it is placed before the items of the iterable in the calculation, and serves as
    a default when the iterable is empty.

    For example, reduce(lambda x, y: x+y, [1, 2, 3, 4, 5])
    calculates ((((1 + 2) + 3) + 4) + 5).
    """

    it = iter(sequence)

    if initial is _initial_missing:
        try:
            value = next(it)
        except StopIteration:
            raise TypeError(
                "reduce() of empty iterable with no initial value") from None
    else:
        value = initial

    for element in it:
        value = function(value, element)

    return value
```

`_initial_missing` は、この関数の直前（235 行目）で `_initial_missing = sentinel('_initial_missing')` として作られている「目印専用」のオブジェクトです。`sentinel()` は新しい Python に入った組み込み関数で、ほかのどの値とも区別できる名前付きの目印を作ります（古い版では `object()` が使われていました）。

## 前提知識

- **関数を引数に渡す**: Python では関数も値なので、`function` という引数で受け取って `function(a, b)` のように呼べます。
- **`lambda`**: `lambda x, y: x + y` は「x と y を受け取って x + y を返す」小さな関数をその場で作る書き方です。
- **イテレータ**: `iter(sequence)` は「次の要素を 1 つずつ取り出せるもの」を作ります。`next(it)` で 1 つ取り出し、もう要素がなければ `StopIteration` という例外が起きます。
- **`for element in it`**: イテレータから残りの要素を順に取り出して繰り返します。すでに `next()` で取り出した要素は出てきません。
- **引数リストの `/`**: `/` より前の引数は「位置でしか渡せない」（`function=...` のように名前を付けて渡せない）という指定です。
- **`raise ... from None`**: 例外を投げ直すときに、元の例外（ここでは `StopIteration`）をエラー表示に含めないようにする書き方です。

## 何をしているか

### 1. イテレータを作る（251 行目）

`it = iter(sequence)` で、リストでもジェネレータでも同じように 1 つずつ取り出せるようにします。

### 2. 初期値を決める（253〜260 行目）

`initial` が渡されなかったとき（`_initial_missing` のまま）は、**イテレータから最初の 1 個を取り出して初期値にします**。空だったら取り出せないので、`TypeError` を出します。
`initial` が渡されたときは、それを初期値にします。

### 3. 残りを順番にたたみ込む（262〜265 行目）

`[1, 2, 3, 4, 5]` を足し算で追うと、`value` は次のように変わります。

| 取り出した要素 | 計算 | value |
| --- | --- | --- |
| （初期値） | `next(it)` | 1 |
| 2 | `1 + 2` | 3 |
| 3 | `3 + 3` | 6 |
| 4 | `6 + 4` | 10 |
| 5 | `10 + 5` | 15 |

## ここがすごい

### `None` ではなく専用のセンチネルを使う

「引数が省略されたか」を調べるとき、`initial=None` をデフォルトにする書き方がよく使われます。しかしそれだと、**利用者が本当に `None` を初期値にしたい場合** と区別できません。
`sentinel()` や `object()` で作った、ほかのどこにも存在しないオブジェクトをデフォルト値にし、`is` で同一性を比べれば、どんな値が渡されても誤判定しません。このような「目印専用の値」をセンチネル（番兵）と呼びます。

### 先頭だけを `next()` で取り出す

リストなら `sequence[0]` と `sequence[1:]` で分けられますが、それではジェネレータのような「添字でアクセスできないもの」に使えません。また `[1:]` はリストのコピーを作ってしまいます。
イテレータを 1 回だけ作り、**最初の 1 個を `next()` で取り出してから残りを `for` で回す** ことで、どんな入力にもコピーなしで対応しています。

### エラーメッセージを利用者向けに整える

空のリストで呼ばれたとき、そのままだと内部の都合である `StopIteration` が見えてしまいます。`from None` で隠し、「空のイテラブルで初期値もない」という原因がわかるメッセージだけを出しています。

## まとめ

- 「省略された」を表すには、`None` ではなく専用のセンチネル（`sentinel()` や `object()`）が安全。
- イテレータを作って `next()` と `for` を組み合わせると、先頭とそれ以外を分けて処理できる。
- 内部の例外は、利用者にわかりやすい例外に置き換えて投げる。
