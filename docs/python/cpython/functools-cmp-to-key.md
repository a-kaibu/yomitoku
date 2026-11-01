---
title: 比較関数を「キー」に化けさせる、使い捨てクラスの魔法
description: functools.cmp_to_key は、古い形式の比較関数を sorted() の key= に渡せる形へ変換する。関数の中でクラスを作って返すという大胆な技を使っている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [206, 223]
function: cmp_to_key
difficulty: 2
format: 2
tags: [ソート, クロージャ, 設計パターン, 標準ライブラリ]
---

## ひとことで

`cmp_to_key` は、「2 つの値を比べて負・0・正を返す関数」（比較関数）を、`sorted()` の `key=` 引数に渡せる形に変換する関数です。
たとえば `sorted(words, key=cmp_to_key(my_cmp))` のように使います。
Python 3 では `sorted()` が比較関数を直接受け取らなくなったため、古いコードを移植するときの橋渡しとして用意されています。

## コード

::: code-group

```python:line-numbers=206 [日本語訳]
def cmp_to_key(mycmp):
    """比較関数（cmp=）をキー関数（key=）に変換する"""
    class K(object):
        __slots__ = ['obj']
        def __init__(self, obj):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        __hash__ = None
    return K
```

```python:line-numbers=206 [原文]
def cmp_to_key(mycmp):
    """Convert a cmp= function into a key= function"""
    class K(object):
        __slots__ = ['obj']
        def __init__(self, obj):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        __hash__ = None
    return K
```

:::

## 前提知識

- **関数の中でクラスを定義できる**: Python では `class` 文も実行時に動く「命令」です。関数の中に書けば、呼ぶたびに新しいクラスが作られます。
- **クロージャ**: 内側で定義したもの（ここではクラス `K` のメソッド）から、外側の関数の引数 `mycmp` を参照できる仕組みです。`cmp_to_key` が終わったあとも `mycmp` は覚えられています。
- **特殊メソッド**: `__lt__` は `<`、`__gt__` は `>`、`__eq__` は `==`、`__le__` は `<=`、`__ge__` は `>=` に対応するメソッドです。`a < b` と書くと、Python は `a.__lt__(b)` を呼びます。
- **`key=` 引数**: `sorted(data, key=f)` は、各要素 `x` を `f(x)` に変換した値どうしを比べて並べます。並ぶのは元の要素です。
- **`__slots__`**: インスタンスが持てる属性を固定し、属性を入れる辞書（`__dict__`）を作らないようにする指定です。メモリが節約できます。
- **`__hash__ = None`**: 「このオブジェクトはハッシュできない（辞書のキーや集合の要素にできない）」と宣言する書き方です。

## 何をしているか

### 1. クラス K を作る

```python:line-numbers=208
    class K(object):
        __slots__ = ['obj']
        def __init__(self, obj):
            self.obj = obj
```

`cmp_to_key(mycmp)` を呼ぶと、その場でクラス `K` が作られます。`K(x)` とすると、元の値 `x` を `self.obj` にしまった「包み紙」オブジェクトができます。

### 2. 比較演算子を mycmp に読み替える

```python:line-numbers=212
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
```

`K` の各比較メソッドは、どれも `mycmp(self.obj, other.obj)` を呼び、その結果を 0 と比べるだけです。
たとえば長さで比べる比較関数 `mycmp = lambda a, b: len(a) - len(b)` を使った場合、

- `K("apple") < K("fig")` → `mycmp("apple", "fig")` は `5 - 3 = 2` → `2 < 0` は偽
- `K("fig") < K("apple")` → `3 - 5 = -2` → `-2 < 0` は真

となり、「短い方が小さい」という順序がふつうの `<` で表現できるようになります。

### 3. クラスそのものを返す

```python:line-numbers=223
    return K
```

最後に返すのは **インスタンスではなくクラス `K`** です。クラスは「呼ぶと値を作る」ので、そのまま `key=` 関数として使えます。`sorted()` は各要素 `x` に対して `K(x)` を作り、それらを `<` で比べて並べ替えます。

## ここがすごい

### 「関数を受け取る」API に「比較のしかた」を注入している

`sorted()` が欲しいのは「要素 → 比べられる値」の変換関数です。比較関数はまったく違う形をしていますが、**比較演算子の意味を差し替えたオブジェクトを「比べられる値」として返す** ことで、形の違いを吸収しています。
素直に考えると「比較関数を受け取る別のソート関数を作る」ことになりそうですが、それでは標準のソートの高速な実装を使えません。この方法なら、既存の `sorted()` や `list.sort()`、`min()`、`heapq` などにそのまま組み込めます。

### クロージャで mycmp を閉じ込める

`K` は `cmp_to_key` を呼ぶたびに作られ、そのときの `mycmp` を覚えています。グローバル変数や設定用の引数を使わずに、比較関数ごとに専用のクラスが手に入ります。

### 細かな配慮

- `__slots__ = ['obj']` によって、何万件ものデータを並べ替えるときでも、包み紙 1 つあたりのメモリを小さくしています。
- `__hash__ = None` を明示しています。`__eq__` を独自に定義したのに、ハッシュ値が元のオブジェクト ID のままだと「等しいのにハッシュが違う」という矛盾が起きるため、ハッシュ自体を禁止しています。

なお、実際の CPython ではこの直後で C 言語版の `cmp_to_key` を読み込んで置き換えます。Python 版は仕組みを示す見本の役割も担っています。

## まとめ

- Python ではクラスも実行時に作れる値で、関数から返すことができる。
- 特殊メソッドを定義すれば、`<` などの演算子の意味を自由に決められる。
- 「形の違う API どうしをつなぐ」ときは、相手が期待するインターフェースを持つ小さな包み紙を作るとよい。
- `__eq__` を変えたら `__hash__` との整合性も考える。
