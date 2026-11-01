---
title: 辞書と双方向リストを組み合わせて「順番を覚える辞書」を作る
description: collections.OrderedDict の Python 版で、キーを追加するメソッド。ふつうの辞書に、番兵つきの循環双方向リストを重ねて順番を管理している。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/collections/__init__.py
lines: [119, 131]
function: OrderedDict.__setitem__
difficulty: 3
format: 2
tags: [データ構造, メモリ管理, 標準ライブラリ]
---

## ひとことで

`OrderedDict` は「キーを入れた順番を覚えている辞書」です。`__setitem__` は `od[key] = value` と書いたときに呼ばれるメソッドで、**新しいキーなら、順番を記録するリストの末尾にそのキーを追加** します。
値そのものは親クラスのふつうの辞書に保存し、順番だけを別の **双方向連結リスト** で管理する、という二重構造になっています。

## コード

::: code-group

```python:line-numbers=119 [日本語訳]
    def __setitem__(self, key, value,
                    dict_setitem=dict.__setitem__, proxy=_proxy, Link=_Link):
        'od.__setitem__(i, y) <==> od[i]=y'
        # 新しい要素を入れると、連結リストの末尾に新しいリンクを作る。
        # そして、継承した辞書に新しいキーと値の組を書き込む。
        if key not in self:
            self.__map[key] = link = Link()
            root = self.__root
            last = root.prev
            link.prev, link.next, link.key = last, root, key
            last.next = link
            root.prev = proxy(link)
        dict_setitem(self, key, value)
```

```python:line-numbers=119 [原文]
    def __setitem__(self, key, value,
                    dict_setitem=dict.__setitem__, proxy=_proxy, Link=_Link):
        'od.__setitem__(i, y) <==> od[i]=y'
        # Setting a new item creates a new link at the end of the linked list,
        # and the inherited dictionary is updated with the new key/value pair.
        if key not in self:
            self.__map[key] = link = Link()
            root = self.__root
            last = root.prev
            link.prev, link.next, link.key = last, root, key
            last.next = link
            root.prev = proxy(link)
        dict_setitem(self, key, value)
```

:::

`_Link` は同じファイルで定義されている小さなクラスで、`prev`（前）、`next`（次）、`key`（キー）の 3 つの属性だけを持ちます。`self.__root` はリストの端を表す番兵（ダミーの要素）です。

## 前提知識

- **`od[key] = value` と `__setitem__`**: 角かっこで代入すると、Python は `od.__setitem__(key, value)` を呼びます。
- **継承**: `class OrderedDict(dict)` なので、`OrderedDict` はふつうの辞書（`dict`）の機能をすべて引き継いでいます。
- **双方向連結リスト**: 各要素が「前の要素」と「次の要素」への参照を持つリストです。途中の要素の追加・削除が、ほかの要素を動かさずにできます。
- **循環リストと番兵**: リストの最後の次を最初に戻して輪にし、さらに「データを持たない番兵」を 1 つ置く作り方です。空のリストでも番兵があるので、「先頭がない」「末尾がない」といった特別扱いが不要になります。
- **`self.__map`**: 名前の先頭に `__` が 2 つ付いた属性は、クラスの外から触りにくくなる（名前が自動で書き換えられる）仕組みがあります。
- **弱参照（`weakref.proxy`）**: 参照しても、相手のオブジェクトが消えるのを妨げない特殊な参照です。

## 何をしているか

キー `a`, `b` が入っている状態で `od["c"] = 3` を実行するとします。リストは `root ⇄ a ⇄ b ⇄ (root に戻る)` という輪になっています。

### 1. 新しいキーか確認する

```python:line-numbers=124
        if key not in self:
```

`"c" not in self` なので、リストへの追加に進みます。すでにあるキーなら、順番は変えずに値だけを更新します。

### 2. リンクを作って対応表に登録する

```python:line-numbers=125
            self.__map[key] = link = Link()
```

`Link()` で新しい要素を作り、`self.__map["c"]` に登録します。この対応表のおかげで、あとで「キー c のリンクはどれか」を一瞬で探せます。

### 3. 末尾につなぐ

```python:line-numbers=126
            root = self.__root
            last = root.prev
            link.prev, link.next, link.key = last, root, key
            last.next = link
            root.prev = proxy(link)
```

番兵の `root.prev` が今の末尾 `b` です。新しいリンクの前を `b`、次を `root` にし、`b.next` と `root.prev` を新しいリンクに付け替えます。結果は `root ⇄ a ⇄ b ⇄ c ⇄ (root)` です。

### 4. 値は親の辞書に保存する

```python:line-numbers=131
        dict_setitem(self, key, value)
```

最後に `dict.__setitem__` で、値をふつうの辞書として保存します。

## ここがすごい

### 速さは辞書、順番はリストに任せる

値の検索はふつうの辞書が得意（O(1)）なので、そのまま親クラスを使います。順番の管理は双方向リストが得意で、末尾への追加も、途中の削除も O(1) でできます。2 つのデータ構造の **得意なところだけを組み合わせて**、どの操作も遅くならないようにしています。

### 番兵で条件分岐を消す

番兵 `root` があるので、「リストが空なら先頭を設定する」といった if 文がありません。空のときは `root.prev` が `root` 自身なので、同じ 4 行のつなぎ替えで正しく動きます。

### 弱参照で循環参照を避ける

`root.prev = proxy(link)` では、リンクそのものではなく弱参照を入れています。双方向リストは「前 → 次」「次 → 前」とお互いを参照し合うため、ふつうに作ると参照が輪になり、Python の参照カウントだけでは片付けられなくなります。後ろ向きの参照を弱参照にしておけば、不要になったリンクがすぐに解放されます（クラス冒頭のコメントを参照）。

### デフォルト引数で高速化

`dict_setitem=dict.__setitem__` などは、よく使うものをローカル変数として取り込むための書き方です。毎回グローバルや属性をたどらずに済むので、呼び出し回数の多いメソッドで効きます。

## まとめ

- 2 種類のデータ構造を組み合わせると、それぞれの得意な操作をすべて速くできる。
- 番兵を置いた循環リストは、空や端の特別扱いをなくしてくれる。
- 双方向の参照は循環参照になりやすい。弱参照で片方向を弱くするのが定番の対策。
