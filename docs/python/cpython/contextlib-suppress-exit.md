---
title: True を返すだけで例外を握りつぶせる、with 文の仕組み
description: contextlib.suppress は、指定した例外を無視する with 文を作る。__exit__ が True を返すと例外が消える、という with 文の約束を使い、例外グループにも対応している。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/contextlib.py
lines: [510, 529]
function: suppress.__exit__
difficulty: 2
tags: [エラー処理, 設計パターン, 標準ライブラリ]
---
## ひとことで

`contextlib.suppress` は、**指定した種類の例外が起きても無視する** ための道具です。

```python
with suppress(FileNotFoundError):
    os.remove("tmp.txt")
```

と書けば、ファイルがなくてもエラーにならずに先へ進みます。`__exit__` は `with` ブロックを抜けるときに呼ばれるメソッドで、ここで「この例外を無視するか」を決めています。

## コード

```python:line-numbers=510
    def __exit__(self, exctype, excinst, exctb):
        # Unlike isinstance and issubclass, CPython exception handling
        # currently only looks at the concrete type hierarchy (ignoring
        # the instance and subclass checking hooks). While Guido considers
        # that a bug rather than a feature, it's a fairly hard one to fix
        # due to various internal implementation details. suppress provides
        # the simpler issubclass based semantics, rather than trying to
        # exactly reproduce the limitations of the CPython interpreter.
        #
        # See http://bugs.python.org/issue12029 for more details
        if exctype is None:
            return
        if issubclass(exctype, self._exceptions):
            return True
        if issubclass(exctype, BaseExceptionGroup):
            match, rest = excinst.split(self._exceptions)
            if rest is None:
                return True
            raise rest
        return False
```

`self._exceptions` には、`suppress(...)` に渡した例外クラスのタプルが入っています。

## 前提知識

- **例外**: エラーが起きたことを表すオブジェクトです。`raise` で発生し、`try`/`except` で捕まえなければ、プログラムが止まります。
- **`with` 文とコンテキストマネージャ**: `with X:` と書くと、ブロックに入るときに `X.__enter__()`、出るときに `X.__exit__(...)` が呼ばれます。ファイルを必ず閉じる、などの後片付けに使われます。
- **`__exit__` の引数**: ブロック内で例外が起きた場合は、例外の型・例外そのもの・トレースバック（どこで起きたかの記録）が渡されます。例外がなければ 3 つとも `None` です。
- **`__exit__` の戻り値**: **真の値を返すと、その例外は「処理済み」として消えます**。偽（`None` や `False`）を返すと、例外はそのまま外へ伝わります。
- **`issubclass(A, B)`**: クラス A が B の子孫（または B 自身）なら真です。
- **例外グループ（`BaseExceptionGroup`）**: 複数の例外をまとめて 1 つにしたものです。並行処理で同時に複数のエラーが起きたときなどに使われます。`split()` で、条件に合う部分と合わない部分に分けられます。

## 何をしているか

### 1. 例外がなければ何もしない（520〜521 行目）

`exctype is None` なら、ブロックは正常に終わったので何もしません。

### 2. 対象の例外なら握りつぶす（522〜523 行目）

`FileNotFoundError` を指定していて、`FileNotFoundError`（またはその子クラス）が起きたら `True` を返します。Python はこれを見て、例外を消して `with` の後ろへ処理を進めます。

### 3. 例外グループなら、対象の部分だけ取り除く（524〜528 行目）

`ExceptionGroup("errors", [FileNotFoundError(), ValueError()])` が起きた場合、`split` で「指定した例外の部分」と「それ以外（`rest`）」に分けます。

- `rest` が `None`（全部が対象だった）なら、`True` を返して全部消します。
- 対象外の例外が残っていれば、残りだけを `raise` します。

### 4. それ以外は伝える（529 行目）

`False` を返して、例外をそのまま外へ伝えます。

## ここがすごい

### `with` 文の約束を使って try/except を部品にする

同じことは `try: ... except FileNotFoundError: pass` でも書けますが、`suppress` を使うと「無視する」という意図が 1 行で明確になります。仕組みは「`__exit__` が真を返すと例外が消える」という `with` 文の約束だけです。ブロックの中のコードには何も手を加えずに、例外の扱いだけを外から差し込めます。

### 例外グループの一部だけを消す

例外グループの中に対象の例外とそうでないものが混ざっていたとき、全部を消すと大事なエラーを見逃し、全部を伝えると `suppress` の意味がなくなります。`split` で **対象の部分だけを取り除いて、残りは投げ直す** ことで、どちらの問題も避けています。

### `issubclass` による素直な判定

511〜519 行目のコメントは、CPython 本体の `except` 節が実は一部の判定フック（`__subclasscheck__` など）を無視していることに触れ、`suppress` はあえて素直な `issubclass` を使うと説明しています。インタプリタの細かい制限まで真似せず、わかりやすい仕様を選んでいます。

## まとめ

- `__exit__` が真を返すと、`with` ブロックの例外は消える。
- 例外の扱いを部品にすると、意図がはっきりしたコードになる。
- 複数の例外がまとまっている場合は、対象の部分だけを処理して残りを伝える。
