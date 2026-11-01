---
title: 長さがわかればスライス、わからなければ「あふれる箱」で末尾を取る
description: more_itertools.tail は、データの最後の n 個を返す。長さがわかるものは位置で飛ばし、わからないものは最大長つきの deque に流し込んで、古いものを自動で捨てさせる。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/recipes.py
lines: [147, 160]
function: tail
difficulty: 1
tags: [イテレータ, データ構造, イディオム]
---
## ひとことで

`tail(n, iterable)` は、データの **最後の n 個** を取り出す関数です。`tail(3, 'ABCDEFG')` は `E, F, G` を返します。
リストのように長さがわかるものと、ジェネレータのように最後まで読まないと長さがわからないものとで、やり方を切り替えています。

## コード

```python:line-numbers=147
def tail(n, iterable):
    """Return an iterator over the last *n* items of *iterable*.

    >>> t = tail(3, 'ABCDEFG')
    >>> list(t)
    ['E', 'F', 'G']

    """
    try:
        size = len(iterable)
    except TypeError:
        return iter(deque(iterable, maxlen=n))
    else:
        return islice(iterable, max(0, size - n), None)
```

`deque` は `collections.deque`、`islice` は `itertools.islice` です。

## 前提知識

- **イテラブル**: `for` で 1 つずつ取り出せるもの全般です。リスト、文字列、ファイル、ジェネレータなどがあります。
- **`len()` が使えないもの**: ジェネレータなどは、最後まで取り出すまで要素数がわかりません。`len()` を呼ぶと `TypeError` になります。
- **`try` / `except` / `else`**: `try` の中でエラーが起きたら `except` に、起きなかったら `else` に進みます。
- **`deque(iterable, maxlen=n)`**: 両端に出し入れできるキューです。`maxlen` を指定すると、満杯のときに新しい要素を入れると **反対側の古い要素が自動で捨てられます**。
- **`islice(iterable, start, None)`**: `start` 番目から最後までを取り出すイテレータです。リストのスライス `[start:]` と似ていますが、コピーを作りません。

## 何をしているか

### 1. 長さを調べてみる（155〜156 行目）

`len(iterable)` を試します。

### 2. 長さがわからない場合（157〜158 行目）

`maxlen=3` の deque に全要素を流し込みます。`'ABCDEFG'` を 1 文字ずつ入れると、

- A → `[A]`、B → `[A, B]`、C → `[A, B, C]`
- D → `[B, C, D]`（A が押し出される）
- ……G → `[E, F, G]`

と、常に最新の 3 個だけが残ります。

### 3. 長さがわかる場合（159〜160 行目）

長さ 7 から 3 を引いた 4 番目以降を `islice` で取り出します。`max(0, ...)` は、n が長さより大きいときに負の位置にならないようにするためです。

## ここがすごい

### 「古いものを捨てる」を deque に任せる

素直に書くと、リストに追加して「長さが n を超えたら先頭を消す」というループになります。`deque` の `maxlen` を使えば、その処理は **C で書かれた deque の中で自動的に** 行われるので、Python のループは 1 行もいりません。メモリも常に n 個分だけです。

### 長さがわかるなら読まずに飛ばす

リストなら、最初から全部をたどる必要はありません。`islice` は先頭から数えて飛ばしますが、要素を保存しないぶん deque より軽く動きます。「`len()` が使えるか」を `try` で確かめるのは、型を調べるより幅広い入力（自作のクラスなど）に対応できる、Python らしい書き方です（「許可より許しを求めよ」という考え方）。

### 戻り値を「イテレータ」にそろえる

どちらの場合も、返すのはイテレータです。`iter(deque(...))` とわざわざ包んでいるのは、呼び出し側から見た振る舞いを統一するためです。

## まとめ

- `deque(maxlen=n)` は「最新の n 個だけを覚える箱」として使える。
- 入力の性質（長さがわかるか）で処理を切り替えると、無駄が減る。
- 型を調べるより、試してみてエラーなら別の方法、という書き方のほうが柔軟。
