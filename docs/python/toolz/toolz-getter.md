---
title: 添字を 1 つ決めて、何度でも同じ位置の値を取り出す関数を作る
description: toolz.getter は、添字（または添字のリスト）を受け取り、後から渡された列からその位置の値を取り出す関数を返す。operator.itemgetter を使い、リストの長さによって返す形を変える。
language: python
project: toolz
repo: https://github.com/pytoolz/toolz
license: BSD-3-Clause
copyright: Copyright (c) 2013 Matthew Rocklin
commit: "451af60dec590a6010e2babdbf391ea8f815122f"
file: toolz/itertoolz.py
lines: [804, 814]
function: getter
difficulty: 2
format: 2
tags: [イディオム, 関数型, 可読性]
---

## ひとことで

`getter(index)` は、**添字を覚えておき、列から同じ位置の値を取り出す関数を返す** 関数です。
`getter(1)` は、`getter(1)([10, 20, 30])` で `20` を返す関数になります。`map` や `sorted` の `key` に、そのまま渡せます。

## コード

```python:line-numbers=804
def getter(index):
    if isinstance(index, list):
        if len(index) == 1:
            index = index[0]
            return lambda x: (x[index],)
        elif index:
            return operator.itemgetter(*index)
        else:
            return lambda x: ()
    else:
        return operator.itemgetter(index)
```

## 前提知識

- **関数を返す関数**: 関数を作って、その関数そのものを値として返す仕組みです。`getter` の戻り値は、新しい関数です。
- **添字（index）**: 列の中の位置を表す数です。Python では `0` から数えます。
- **`operator.itemgetter`**: 添字を渡すと、列からその値を取り出す関数を作る標準ライブラリの関数です。
- **`isinstance`**: 値が特定の型かどうかを確かめる組み込み関数です。

## 何をしているか

### 1. 添字が list かどうかを確かめる

```python:line-numbers=805
    if isinstance(index, list):
```

添字が 1 つの数なら、そのまま `itemgetter` に渡します。添字がリストなら、複数の値をまとめて取り出す場合に分けて考えます。

### 2. リストが 1 つだけの場合

```python:line-numbers=806
        if len(index) == 1:
            index = index[0]
            return lambda x: (x[index],)
```

添字が 1 つだけのリストなら、取り出す値も 1 つです。その値を `index` に入れ直し、結果を 1 つだけの組（タプル）で返す関数にします。

### 3. 複数の添字や、空のリストの場合

```python:line-numbers=809
        elif index:
            return operator.itemgetter(*index)
        else:
            return lambda x: ()
```

添字が 2 つ以上なら、`itemgetter(*index)` で、まとめて取り出します。空のリストなら、何も取り出さないので、常に空のタプルを返す関数にします。

### 4. 1 つの添字の場合

```python:line-numbers=813
    else:
        return operator.itemgetter(index)
```

リストでなければ、単純に `itemgetter(index)` を返します。この場合の戻り値は、値そのものになります。

## ここがすごい

### 同じ書き方で、列の位置を指定できる

`map(getter(1), rows)` のように書くと、どの列を取り出すかを、関数の引数で決められます。関数を作る手間を、呼び出す側で省けます。

### 戻り値の形を、添字の書き方で決める

添字が 1 つの数なら値そのもの、1 つだけのリストならタプル、というように、書き方で戻り値の形が変わります。呼び出す側は、添字の書き方を見れば、受け取る形が分かります。

### 空の添字を特別扱いする

空のリストを渡すと、どの位置も取り出さないので、空のタプルを返します。`itemgetter()` は引数がないとエラーになるため、この分岐が必要です。

## まとめ

- 添字を覚えた関数を返すと、同じ取り出し方を何度でも使い回せる。
- 添字の書き方で、戻り値の形を変えられる。
- 空の入力を特別扱いすると、`itemgetter` のエラーを避けられる。
