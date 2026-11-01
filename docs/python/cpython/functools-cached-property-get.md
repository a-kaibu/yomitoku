---
title: 一度計算したら二度と呼ばれない cached_property の仕掛け
description: functools.cached_property の中心部分。計算結果をインスタンスの __dict__ に書き込むことで、次からはこのメソッド自体が呼ばれなくなる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [1145, 1170]
function: cached_property.__get__
difficulty: 3
tags: [キャッシュ, メタプログラミング, 遅延評価, 標準ライブラリ]
---
## ひとことで

`@cached_property` を付けたメソッドは、**最初にアクセスしたときだけ計算され、2 回目からは保存した値が返る** 属性になります。
`__get__` はその中心で、計算した値をインスタンスの属性辞書に直接書き込みます。すると次回からは Python の属性探索の仕組みによって、この `__get__` 自体が呼ばれなくなります。

## コード

```python:line-numbers=1145
    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        if self.attrname is None:
            raise TypeError(
                "Cannot use cached_property instance without calling __set_name__ on it.")
        try:
            cache = instance.__dict__
        except AttributeError:  # not all objects have __dict__ (e.g. class defines slots)
            msg = (
                f"No '__dict__' attribute on {type(instance).__name__!r} "
                f"instance to cache {self.attrname!r} property."
            )
            raise TypeError(msg) from None
        val = cache.get(self.attrname, _NOT_FOUND)
        if val is _NOT_FOUND:
            val = self.func(instance)
            try:
                cache[self.attrname] = val
            except TypeError:
                msg = (
                    f"The '__dict__' attribute on {type(instance).__name__!r} instance "
                    f"does not support item assignment for caching {self.attrname!r} property."
                )
                raise TypeError(msg) from None
        return val
```

`_NOT_FOUND` は同じファイルで `_NOT_FOUND = object()` として作られている目印です。`self.attrname` には、`__set_name__`（1136 行目）によって「この属性の名前」が入っています。

## 前提知識

- **デスクリプタ**: クラスの属性として置かれたオブジェクトが `__get__` メソッドを持っていると、`obj.attr` と書いたときに Python はその `__get__` を呼んで結果を返します。`property` もこの仕組みでできています。
- **`__get__(self, instance, owner)`**: `self` はデスクリプタ自身、`instance` は属性を読もうとしているオブジェクト、`owner` はそのクラスです。クラスから直接 `Cls.attr` と読んだときは `instance` が `None` になります。
- **`__dict__`**: ふつうのオブジェクトは、自分の属性を `__dict__` という辞書に持っています。`obj.x = 1` は `obj.__dict__["x"] = 1` とほぼ同じです。
- **属性探索の優先順位**: `__get__` だけを持つデスクリプタ（非データデスクリプタ）は、インスタンスの `__dict__` に同じ名前があると **そちらが優先** されます。
- **`try` / `except`**: エラー（例外）が起きたら `except` の中で処理します。

## 何をしているか

```python
class Data:
    @cached_property
    def total(self):
        print("計算中")
        return sum(range(10**6))
```

### 1. クラスから読まれたら自分を返す（1146〜1147 行目）

`Data.total` のようにクラスから読んだ場合は、デスクリプタ自身を返します。

### 2. 名前が決まっているか確認（1148〜1150 行目）

`__set_name__` が呼ばれていない（クラスの外で作られた）場合はエラーです。

### 3. インスタンスの辞書を取得（1151〜1158 行目）

`d = Data()` に対し `d.total` と読むと、`d.__dict__` を取り出します。`__slots__` を使ったクラスなど、`__dict__` がないオブジェクトでは使えないので、原因がわかるメッセージでエラーにします。

### 4. なければ計算して書き込む（1159〜1170 行目）

`d.__dict__` に `"total"` がなければ、元のメソッドを呼んで（ここで「計算中」と表示）、結果を `d.__dict__["total"]` に保存して返します。

### 5. 2 回目以降

もう一度 `d.total` と読むと、Python はまず `d.__dict__` を見て `"total"` を見つけます。`cached_property` は非データデスクリプタなので、**インスタンスの辞書が勝ち**、`__get__` は呼ばれません。

## ここがすごい

### 「自分を呼ばせない」キャッシュ

ふつうのキャッシュは「呼ばれるたびに、保存済みか確認する」処理が毎回走ります。この実装は、値を **属性と同じ名前で `__dict__` に置く** ことで、Python 本来の属性探索がそのまま値を返すようにしています。2 回目以降は関数呼び出しすら起きず、ふつうの属性を読むのと同じ速さです。

これは `__set__` を定義しない「非データデスクリプタ」だからこそ成り立つ技です。`property` は `__set__` を持つデータデスクリプタなので、インスタンスの辞書より優先され、毎回 getter が呼ばれます。

### `del` でキャッシュを消せる

値はただの属性なので、`del d.total` と書けば辞書から消え、次のアクセスでまた計算されます。キャッシュをクリアする専用の API がいりません。

### 失敗の理由を具体的に伝える

`__dict__` がない場合や、`__dict__` が書き込み不可の場合（`mappingproxy` など）を別々に捕まえ、クラス名と属性名を入れたメッセージにしています。`from None` で内部の例外を隠し、利用者が対処すべきことだけを示しています。

## まとめ

- デスクリプタは `obj.attr` の読み出しに処理を割り込ませる仕組み。
- 非データデスクリプタは、インスタンスの `__dict__` に同名の値があると無視される。これを使うと「一度きりの計算」が作れる。
- キャッシュの置き場所を工夫すると、確認処理そのものを消せる。
