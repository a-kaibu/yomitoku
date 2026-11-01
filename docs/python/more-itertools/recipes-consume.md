---
title: 長さ 0 の deque に流し込んで、イテレータを C の速さで読み捨てる
description: more_itertools.consume は、イテレータを指定した数だけ（または最後まで）進める。値を保存しない deque と、空のスライスを使ったトリックで、Python のループを使わずに済ませている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [163, 200]
function: consume
difficulty: 2
tags: [イテレータ, 最適化, ハック]
---
## ひとことで

`consume(iterator, n)` は、イテレータを **n 個ぶん先へ進める**（読み捨てる）関数です。`n` を省略すると最後まで進めます。
戻り値はありません。値には興味がなく、「進めること」だけが目的です。
たとえば、ファイルの先頭のヘッダ行を 3 行読み飛ばしたいときなどに使えます。

## コード

```python:line-numbers=163
def consume(iterator, n=None):
    """Advance *iterable* by *n* steps. If *n* is ``None``, consume it
    entirely.

    Efficiently exhausts an iterator without returning values. Defaults to
    consuming the whole iterator, but an optional second argument may be
    provided to limit consumption.

        >>> i = (x for x in range(10))
        >>> next(i)
        0
        >>> consume(i, 3)
        >>> next(i)
        4
        >>> consume(i)
        >>> next(i)
        Traceback (most recent call last):
          File "<stdin>", line 1, in <module>
        StopIteration

    If the iterator has fewer items remaining than the provided limit, the
    whole iterator will be consumed.

        >>> i = (x for x in range(3))
        >>> consume(i, 5)
        >>> next(i)
        Traceback (most recent call last):
          File "<stdin>", line 1, in <module>
        StopIteration

    """
    # Use functions that consume iterators at C speed.
    if n is None:
        # feed the entire iterator into a zero-length deque
        deque(iterator, maxlen=0)
    else:
        # advance to the empty slice starting at position n
        next(islice(iterator, n, n), None)
```

## 前提知識

- **イテレータ**: 値を 1 つずつ取り出せるもので、一度取り出した値は戻りません。取り出すたびに「現在位置」が進みます。
- **`deque(iterator, maxlen=0)`**: 最大長 0 の deque に値を流し込むと、入れた瞬間に捨てられます。結果的に、イテレータを最後まで取り出すだけになります。
- **`islice(iterator, n, n)`**: `n` 番目から `n` 番目まで、つまり **空の範囲** を取り出すイテレータです。空の範囲を取り出すためには、その手前の n 個を読み飛ばす必要があります。
- **`next(it, None)`**: イテレータから 1 つ取り出します。もう値がなければ、エラーにせず `None` を返します。

## 何をしているか

`it = iter(range(10))` で考えます。

### 1. 最後まで進める場合（195〜197 行目）

`deque(it, maxlen=0)` で、0 から 9 までがすべて取り出されて捨てられます。

### 2. n 個だけ進める場合（198〜200 行目）

`consume(it, 3)` なら、`islice(it, 3, 3)` を作り、`next()` で 1 つ取り出そうとします。
`islice` は「3 番目から始める」ために 0, 1, 2 を読み飛ばし、そこで「3 番目まで」という終わりに達するので、何も返さずに終わります。`next(..., None)` なので、エラーにならずに `None` が返ります。
これで `it` は 3 個進んでおり、次に `next(it)` すると `3` が出てきます。

## ここがすごい

### Python のループを書かない

素直に書くとこうなります。

```python
for _ in range(n):
    next(iterator)
```

これでも動きますが、1 回ごとに Python のバイトコードが実行されます。194 行目のコメントにある通り、`deque` と `islice` は **C で実装されている** ので、読み捨ての繰り返しがすべて C の中で行われ、ずっと速くなります。

### 「保存しない deque」と「空のスライス」という見立て

`deque` は本来データをためる道具、`islice` は本来データを切り出す道具です。それを「長さ 0 なら何もためずに全部流すだけ」「空の範囲なら手前を飛ばすだけ」と、**副作用（イテレータが進むこと）だけを利用する** 使い方に見立てています。標準の部品の性質をよく知っているからこそ思いつく技です。

### 足りなくても困らない

残りが n 個より少ない場合、`islice` は途中で尽き、`next(..., None)` が `None` を返すだけです。例外を捕まえる処理を書かなくても、安全に最後まで進められます。

この関数はもともと Python 公式ドキュメントの「itertools レシピ」に載っていたもので、more-itertools はそうしたレシピを実際に使える形で提供しています。

## まとめ

- `deque(it, maxlen=0)` はイテレータを最速で最後まで進める定番の書き方。
- `islice(it, n, n)` は「n 個読み飛ばす」ために使える。
- C で書かれた部品に繰り返しを任せると、Python のループより速い。
