---
title: 比較メソッドを 1 つ書けば残りを全部作ってくれるデコレータ
description: functools.total_ordering は、< などの比較演算を 1 つ定義したクラスに、残りの比較演算を自動で追加する。集合の内包表記と max() で「どれを基準にするか」を選んでいる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [188, 199]
function: total_ordering
difficulty: 2
tags: [メタプログラミング, 設計パターン, 標準ライブラリ]
---
## ひとことで

`@total_ordering` をクラスに付けると、`__lt__`（`<`）など比較メソッドを **1 つ定義するだけで、残りの `<=`・`>`・`>=` を自動で追加** してくれます。
たとえば「`<` と `==` だけ書いたバージョン番号クラス」でも、`>=` で比べられるようになります。

## コード

```python:line-numbers=188
def total_ordering(cls):
    """Class decorator that fills in missing ordering methods"""
    # Find user-defined comparisons (not those inherited from object).
    roots = {op for op in _convert if getattr(cls, op, None) is not getattr(object, op, None)}
    if not roots:
        raise ValueError('must define at least one ordering operation: < > <= >=')
    root = max(roots)       # prefer __lt__ to __le__ to __gt__ to __ge__
    for opname, opfunc in _convert[root]:
        if opname not in roots:
            opfunc.__name__ = opname
            setattr(cls, opname, opfunc)
    return cls
```

`_convert` は同じファイルの 173 行目にある辞書（`frozendict` は書き換えできない辞書）で、「基準にする演算子」ごとに「残りの演算子の作り方」が登録されています。

```python
_convert = frozendict({
    '__lt__': [('__gt__', _gt_from_lt),
               ('__le__', _le_from_lt),
               ('__ge__', _ge_from_lt)],
    '__le__': [...],
    '__gt__': [...],
    '__ge__': [...]
})
```

たとえば `_le_from_lt` は「`a <= b` は `a < b or a == b`」として `<=` を作る関数です。

## 前提知識

- **デコレータ**: `@total_ordering` を `class` の上に書くと、クラスを作った直後に `cls = total_ordering(cls)` が実行されます。クラスを受け取って加工し、返す関数です。
- **比較の特殊メソッド**: `__lt__`（`<`）、`__le__`（`<=`）、`__gt__`（`>`）、`__ge__`（`>=`）。
- **`getattr(obj, name, default)`**: 名前（文字列）で属性を取り出します。なければ `default` を返します。
- **`setattr(obj, name, value)`**: 名前（文字列）で属性を設定します。
- **集合の内包表記**: `{op for op in ... if 条件}` は条件を満たす要素の集合を作ります。
- **`is`**: 2 つが「同じオブジェクトか」を調べます（値が等しいかではない）。
- **文字列の大小**: `max()` を文字列に使うと辞書順で最大のものを返します。

## 何をしているか

```python
@total_ordering
class Version:
    def __init__(self, n): self.n = n
    def __eq__(self, o): return self.n == o.n
    def __lt__(self, o): return self.n < o.n
```

### 1. 自分で定義した比較を探す（191 行目）

`_convert` のキー（4 つの演算子名）それぞれについて、`getattr(cls, op)` が `object` の同名メソッドと **別物** なら「利用者が定義した」と判断します。`Version` では `roots = {'__lt__'}` です。

### 2. 1 つもなければエラー（192〜193 行目）

### 3. 基準を 1 つ選ぶ（194 行目）

`max(roots)` で 1 つ選びます。4 つの名前を辞書順に並べると `__ge__ < __gt__ < __le__ < __lt__` なので、`max` は `__lt__ → __le__ → __gt__ → __ge__` の優先順になります。

### 4. 足りないものだけ追加する（195〜198 行目）

基準 `__lt__` に対応する作り方の一覧から、まだ定義されていない `__gt__`, `__le__`, `__ge__` を `setattr` でクラスに追加します。すでに定義されているものは上書きしません。

## ここがすごい

### 「object と同じかどうか」で自作を見分ける

Python のクラスはすべて `object` を継承していて、`object` も `__lt__` などを持っています（中身は「比較できない」を返すだけ）。そのため「`__lt__` を持っているか」では判定できません。
191 行目は「`object` のものと **同一か**」を `is` で比べることで、利用者（や親クラス）が実際に定義したものだけを見つけています。

### `max()` に優先順位を任せる

「`__lt__` があればそれ、なければ `__le__`……」という if の連鎖を書く代わりに、名前の辞書順がちょうど望む優先順になることを利用して `max()` 1 回で済ませています。194 行目のコメントがその意図を説明しています。

### 表で振る舞いを決める（テーブル駆動）

「何から何を作るか」を関数の中に書かず、`_convert` という表にまとめています。本体のコードは表を引いて `setattr` するだけなので、ほとんど分岐がありません。ロジックとデータを分けると、コードが短く、間違いにくくなります。

### `__name__` を付け直す

197 行目で、追加する関数の `__name__` を `__gt__` などに設定しています。エラー表示やデバッグのときに、正しいメソッド名が出るようにするための気配りです。

## まとめ

- クラスデコレータを使えば、クラスを作ったあとでメソッドを足せる。
- 「自分で定義したか」は、基底クラスのものと `is` で比べると判定できる。
- 分岐をデータ（表）に移すと、コードがシンプルになる。
- 自動生成する関数にも名前を付けておくと、デバッグしやすい。
