---
title: 多重継承の順番を決める C3 アルゴリズムを 20 行で
description: singledispatch の内部で使われる、C3 線形化の Python 実装。Python がクラスのメソッドを探す順番（MRO）を決めるのと同じ考え方を、素朴なループで表している。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/functools.py
lines: [738, 763]
function: _c3_merge
difficulty: 3
format: 2
tags: [アルゴリズム, 型システム, 標準ライブラリ]
---

## ひとことで

`_c3_merge` は、複数の「親クラスの並び」を 1 本の並びに合流させる関数です。これは **C3 線形化** と呼ばれるアルゴリズムで、Python が多重継承のときに「どの親クラスのメソッドから先に探すか」（MRO: Method Resolution Order）を決めるのと同じ方法です。
`functools.singledispatch` が、型に応じて呼び分ける関数を選ぶときに使っています。

## コード

::: code-group

```python:line-numbers=738 [日本語訳]
def _c3_merge(sequences):
    """C3 アルゴリズムで、*sequences* の MRO を 1 つの MRO にまとめる。

    公式の MRO 解説（https://docs.python.org/3/howto/mro.html）をもとにしている。

    """
    result = []
    while True:
        sequences = [s for s in sequences if s]   # 空の並びを取り除く
        if not sequences:
            return result
        for s1 in sequences:   # 各並びの先頭から候補を探す
            candidate = s1[0]
            for s2 in sequences:
                if candidate in s2[1:]:
                    candidate = None
                    break      # この先頭は後ろに出てくるので却下
            else:
                break
        if candidate is None:
            raise RuntimeError("Inconsistent hierarchy")
        result.append(candidate)
        # 選んだ候補を取り除く
        for seq in sequences:
            if seq[0] == candidate:
                del seq[0]
```

```python:line-numbers=738 [原文]
def _c3_merge(sequences):
    """Merges MROs in *sequences* to a single MRO using the C3 algorithm.

    Adapted from https://docs.python.org/3/howto/mro.html.

    """
    result = []
    while True:
        sequences = [s for s in sequences if s]   # purge empty sequences
        if not sequences:
            return result
        for s1 in sequences:   # find merge candidates among seq heads
            candidate = s1[0]
            for s2 in sequences:
                if candidate in s2[1:]:
                    candidate = None
                    break      # reject the current head, it appears later
            else:
                break
        if candidate is None:
            raise RuntimeError("Inconsistent hierarchy")
        result.append(candidate)
        # remove the chosen candidate
        for seq in sequences:
            if seq[0] == candidate:
                del seq[0]
```

:::

## 前提知識

- **継承と多重継承**: クラスは親クラスの機能を引き継げます。Python では `class C(A, B)` のように親を複数持てます。
- **MRO**: メソッドを探す順番のリストです。`C.__mro__` で見られます。`class C(A, B)` なら、だいたい `C → A → B → object` の順です。
- **リスト内包表記**: `[s for s in sequences if s]` は「`sequences` のうち空でないものだけを集めたリスト」を作ります。空のリストは偽として扱われます。
- **`s[0]` と `s[1:]`**: リストの先頭要素と、先頭以外の残りです。
- **`for ... else`**: Python 独特の構文で、`for` ループが `break` されずに最後まで回ったときだけ `else` の中が実行されます。
- **`del seq[0]`**: リストの先頭要素を削除します（リストそのものが書き換わります）。

## 何をしているか

ひし形の継承を例にします。`class A`, `class B(A)`, `class C(A)`, `class D(B, C)` のとき、`D` の MRO を作るために次の 3 本を合流させます（`object` は省略）。

- `[B, A]`（B の MRO）
- `[C, A]`（C の MRO）
- `[B, C]`（D の親の並び）

### 1. 空の並びを捨てて、終わりを判定する

```python:line-numbers=745
    while True:
        sequences = [s for s in sequences if s]   # 空の並びを取り除く
        if not sequences:
            return result
```

全部空になったら完成なので `result` を返します。

### 2. 先頭の候補を探す

```python:line-numbers=749
        for s1 in sequences:   # 各並びの先頭から候補を探す
            candidate = s1[0]
            for s2 in sequences:
                if candidate in s2[1:]:
                    candidate = None
                    break      # この先頭は後ろに出てくるので却下
            else:
                break
```

各並びの **先頭** を候補にして、「その候補が、どの並びでも 2 番目以降に出てこないか」を調べます。2 番目以降に出てくるなら、まだ前に来てはいけないクラスなので却下（`candidate = None` で `break`）し、次の並びの先頭を試します。
内側のループが最後まで回った（どこにも 2 番目以降に出てこなかった）ら、`else: break` で外側のループも抜けて、候補が確定します。

1 回目: 候補 `B` は、どの並びでも 2 番目以降にない → 採用。

### 3. 採用して取り除く

```python:line-numbers=759
        result.append(candidate)
        # 選んだ候補を取り除く
        for seq in sequences:
            if seq[0] == candidate:
                del seq[0]
```

`result` に `B` を追加し、先頭が `B` の並びから `B` を削除します。残りは `[A]`, `[C, A]`, `[C]` です。

2 回目: 候補 `A` は `[C, A]` の 2 番目に出てくる → 却下。次の候補 `C` → 採用。→ `[A]`, `[A]`, `[]`
3 回目: 候補 `A` → 採用。最終結果は `[B, C, A]` で、`D` を頭に付ければ `D → B → C → A` です。

### 4. 候補が見つからなければエラー

```python:line-numbers=757
        if candidate is None:
            raise RuntimeError("Inconsistent hierarchy")
```

どの先頭も却下されたら、矛盾した継承なので `RuntimeError` を出します。

## ここがすごい

### 「先頭にしか来られない」という単純なルール

C3 の考え方は「**ある並びの途中にあるクラスは、まだ先に出してはいけない**」という一点だけです。これだけで、

- 子は必ず親より前に来る
- `class D(B, C)` と書いた順番（B が C より前）が守られる
- 親の MRO の順番も崩れない

という性質がすべて保証されます。ひし形継承で `A` が `B` と `C` の両方より後ろに来るのも、このルールの自然な結果です。

### `for ... else` で「全部調べて問題なかった」を表す

「内側のループで一度も却下されなかった」という条件を、フラグ変数なしで `for ... else` で書いています。ここでの `else` は「break しなかったら」という意味で、二重ループからの脱出にもなっています。

### 公式ドキュメントの説明をそのままコードに

コメント `Adapted from https://docs.python.org/3/howto/mro.html.` が示すとおり、この実装は Python 公式の MRO 解説文書のアルゴリズムを素直に写したものです。インタプリタ本体は C で同じことをしていますが、`singledispatch` は「抽象基底クラス」も含めた独自の並びを作る必要があるため、Python 版を持っています。

## まとめ

- 多重継承の探索順は、C3 線形化という「先頭にしか来られない」ルールで決まる。
- `for ... else` は「最後まで break しなかった」ことを表せる。
- 有名なアルゴリズムでも、ルールが明確なら短いループで書ける。
