---
title: True を返すだけで例外を握りつぶせる、with 文の仕組み
description: contextlib.suppress の __exit__ は、with 文の中で指定した例外が起きたとき、True を返して例外を握りつぶす。例外を型で判定し、ExceptionGroup のときは一部だけを外に投げ直す。
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
format: 2
tags: [エラー処理, 設計パターン, 標準ライブラリ]
---

## ひとことで

`suppress` の `__exit__` は、**`with` 文の中で指定した種類の例外が起きたとき、`True` を返して例外を握りつぶす** 処理です。
`with suppress(FileNotFoundError):` の中で、そのエラーが出ても、プログラムは止まらずに次へ進みます。

## コード

::: code-group

```python:line-numbers=510 [日本語訳]
    def __exit__(self, exctype, excinst, exctb):
        # isinstance や issubclass と違い、CPython の例外処理は
        # 今のところ、具体的な型の階層だけを見る（インスタンスや
        # サブクラス判定のフックは無視する）。Guido はこれを
        # 機能ではなくバグと見なしているが、直すのは難しい。
        # 内部実装のさまざまな理由があるため。suppress は
        # 単純な issubclass に基づく判定を提供し、
        # CPython の制限を正確に再現しようとはしない。
        #
        # 詳しくは http://bugs.python.org/issue12029 を参照。
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

```python:line-numbers=510 [原文]
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

:::

## 前提知識

- **`with` 文とコンテキストマネージャ**: 入るときと出るときに、決まった処理を自動で行う仕組みです。
- **`__exit__`**: `with` 文を出るときに呼ばれるメソッドです。例外が起きていれば、その型と値を受け取ります。
- **戻り値の `True`**: `__exit__` が `True` を返すと、例外は外に伝わらず、無視されます。
- **`ExceptionGroup`**: 複数の例外をまとめて 1 つにした例外です。

## 何をしているか

### 1. 例外がなければ、何もしない

```python:line-numbers=520
        if exctype is None:
            return
```

`exctype` が `None` なら、例外は起きていません。何も返さず、普通に `with` を抜けます。

### 2. 指定した種類の例外なら、握りつぶす

```python:line-numbers=522
        if issubclass(exctype, self._exceptions):
            return True
```

起きた例外の型が、`suppress` に渡された種類のどれかと一致すれば、`True` を返します。`issubclass` で、サブクラスも含めて判定します。

### 3. 例外グループなら、一部だけを外に投げ直す

```python:line-numbers=524
        if issubclass(exctype, BaseExceptionGroup):
            match, rest = excinst.split(self._exceptions)
            if rest is None:
                return True
            raise rest
```

`ExceptionGroup` の場合は、指定の種類に合う部分と、残りの部分に分けます。残りがなければ握りつぶし、残りがあればその残りだけを `raise` します。

### 4. それ以外は、そのまま伝える

```python:line-numbers=529
        return False
```

指定に合わない例外は、`False` を返して、外側へ伝えます。

## ここがすごい

### 戻り値だけで、例外の扱いを決める

`__exit__` は、`True` か `False` を返すだけで、例外を捕まえるか伝えるかを決めます。`try` と `except` を書かなくても、同じ効果が得られます。

### 判定に `issubclass` を使う

型が完全に一致するかではなく、継承の関係で判定します。親の種類を指定すれば、子の例外もまとめて握りつぶせます。

### 例外グループを壊さずに分ける

`ExceptionGroup` では、握りつぶす部分だけを取り除き、残りを投げ直します。一部だけ無視したいときに、ほかの例外を失わずに済みます。

## まとめ

- `__exit__` が `True` を返すと、`with` 文の中の例外を握りつぶせる。
- 型の判定は `issubclass` で行い、継承の関係も含める。
- 例外グループでは、無視する部分だけを外して、残りは投げ直す。
