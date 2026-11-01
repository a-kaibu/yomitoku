---
title: ハッシュできるものは集合で、できないものはリストで重複を探す
description: more_itertools.all_unique は、すべての要素が異なるかを調べる。基本は高速な集合で調べ、辞書やリストのように集合に入れられない要素だけをリストで調べる二段構え。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [4269, 4301]
function: all_unique
difficulty: 2
tags: [ハッシュ, データ構造, エラー処理]
---
## ひとことで

`all_unique(iterable)` は、**すべての要素が互いに異なるか**（重複がないか）を調べる関数です。
`all_unique('ABCB')` は `False`、`all_unique([1, [2], {3: 4}])` は `True` です。
ふつうなら集合（`set`）を使うところですが、リストや辞書のように **集合に入れられない値** が混ざっていても動くように工夫されています。

## コード

```python:line-numbers=4269
def all_unique(iterable, key=None):
    """
    Returns ``True`` if all the elements of *iterable* are unique (no two
    elements are equal).

        >>> all_unique('ABCB')
        False

    If a *key* function is specified, it will be used to make comparisons.

        >>> all_unique('ABCb')
        True
        >>> all_unique('ABCb', str.lower)
        False

    The function returns as soon as the first non-unique element is
    encountered. Iterables with a mix of hashable and unhashable items can
    be used, but the function will be slower for unhashable items.
    """
    seenset = set()
    seenset_add = seenset.add
    seenlist = []
    seenlist_add = seenlist.append
    for element in map(key, iterable) if key else iterable:
        try:
            if element in seenset:
                return False
            seenset_add(element)
        except TypeError:
            if element in seenlist:
                return False
            seenlist_add(element)
    return True
```

## 前提知識

- **集合（`set`）**: 重複しない値の集まりです。`x in s` で値があるかを、要素数に関係なくほぼ一瞬で調べられます。
- **ハッシュ可能**: 集合や辞書のキーにできる値のことです。数値・文字列・タプルなどはハッシュ可能ですが、**リストや辞書はハッシュできません**。集合に入れようとすると `TypeError` になります。
- **リストの `in`**: `x in lst` は、先頭から 1 つずつ比べるので、要素数に比例した時間がかかります。ただし、ハッシュできない値でも使えます。
- **`map(key, iterable) if key else iterable`**: `key` が指定されていれば変換し、なければそのまま使う、という条件式です。
- **`try` / `except TypeError`**: ハッシュできない値で `TypeError` が起きたときだけ、別の処理に切り替えます。

## 何をしているか

`[1, [2], 1]` で追います。

### 1. 準備（4288〜4291 行目）

集合 `seenset` とリスト `seenlist` を用意し、それぞれの「追加する」メソッドを変数に取り出しておきます。

### 2. 1 つずつ調べる（4292〜4300 行目）

- `1`: 集合にはないので集合に追加。
- `[2]`: `[2] in seenset` を調べようとした時点で `TypeError`（リストはハッシュできない）。`except` に進み、リストで調べて、リストに追加。
- `1`: 集合にあるので、すぐに `False` を返します。

### 3. 最後まで重複がなければ `True`（4301 行目）

## ここがすごい

### 速い道と遅い道を自動で切り替える

素直な書き方は `len(set(data)) == len(data)` ですが、これは

- ハッシュできない値が 1 つでもあると `TypeError` で止まる
- 重複が先頭にあっても、全部を集合にし終えるまで答えが出ない
- ジェネレータには `len()` が使えない

という問題があります。`all_unique` は、ハッシュできる値は **集合で O(1)** に調べ、できない値だけを **リストで O(n)** に調べます。ほとんどの値はハッシュ可能なので、実際にはほぼ集合の速さで動きつつ、どんな値でも受け付けます。

### エラーを「切り替えの合図」に使う

「この値はハッシュできるか」を事前に調べる方法はありますが、`try` で実際に集合を使ってみて、失敗したらリストへ、という方が短く確実です。Python では「事前に確認するより、やってみて失敗したら対処する」（EAFP）書き方がよく使われます。

### 重複を見つけた瞬間に終わる

1 つずつ調べながら追加していくので、重複が見つかった時点で `False` を返します。最初の 2 つが同じなら、残りを読む必要はありません。

### メソッドを変数に取り出して高速化

`seenset.add` を `seenset_add` に取り出しておくと、ループのたびに「`seenset` の `add` 属性を探す」処理が省けます。何百万回も回るループで効く、Python の定番の高速化です。

## まとめ

- 重複チェックは集合が速いが、ハッシュできない値には使えない。
- 速い方法を基本にして、例外が起きたときだけ遅い方法に切り替えると、速さと汎用性を両立できる。
- 調べながら追加すると、重複が見つかった時点で答えが出る。
