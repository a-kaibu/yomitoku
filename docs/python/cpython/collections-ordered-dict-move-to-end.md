---
title: 要素を末尾へ O(1) で移す、双方向リストのつなぎ替え
description: OrderedDict.move_to_end は、指定したキーを順番の最後（または最初）へ移動する。リストの付け替えだけで済むので、要素数に関係なく一瞬で終わる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/collections/__init__.py
lines: [194, 217]
function: OrderedDict.move_to_end
difficulty: 2
format: 2
tags: [データ構造, キャッシュ, 標準ライブラリ]
---

## ひとことで

`move_to_end(key)` は、`OrderedDict` の中のキーを **順番の最後へ移動** するメソッドです。`last=False` を渡すと最初へ移動します。
「最近使ったものを末尾へ送る」ことで、LRU キャッシュ（いちばん長く使っていないものから捨てるキャッシュ）を簡単に作れます。
要素が 100 万個あっても、ポインタ（参照）を数本付け替えるだけで終わります。

## コード

::: code-group

```python:line-numbers=194 [日本語訳]
    def move_to_end(self, key, last=True):
        '''既存の要素を末尾（last が偽なら先頭）へ移動する。

        要素が存在しない場合は KeyError を送出する。
        '''
        link = self.__map[key]
        link_prev = link.prev
        link_next = link.next
        soft_link = link_next.prev
        link_prev.next = link_next
        link_next.prev = link_prev
        root = self.__root
        if last:
            last = root.prev
            link.prev = last
            link.next = root
            root.prev = soft_link
            last.next = link
        else:
            first = root.next
            link.prev = root
            link.next = first
            first.prev = soft_link
            root.next = link
```

```python:line-numbers=194 [原文]
    def move_to_end(self, key, last=True):
        '''Move an existing element to the end (or beginning if last is false).

        Raise KeyError if the element does not exist.
        '''
        link = self.__map[key]
        link_prev = link.prev
        link_next = link.next
        soft_link = link_next.prev
        link_prev.next = link_next
        link_next.prev = link_prev
        root = self.__root
        if last:
            last = root.prev
            link.prev = last
            link.next = root
            root.prev = soft_link
            last.next = link
        else:
            first = root.next
            link.prev = root
            link.next = first
            first.prev = soft_link
            root.next = link
```

:::

## 前提知識

- **双方向連結リスト**: 各要素が `prev`（前）と `next`（次）への参照を持つリストです。`OrderedDict` はこれでキーの順番を管理しています。
- **番兵 `root`**: リストの端を表すダミー要素です。リストは輪になっていて、`root.next` が最初の要素、`root.prev` が最後の要素です。
- **`self.__map`**: キーから、そのキーのリンク（リストの要素）を探すための辞書です。
- **弱参照（proxy）**: 相手が消えるのを妨げない参照です。`OrderedDict` では循環参照を避けるため、後ろ向き（`prev`）の参照に弱参照を使っています。
- **引数 `last=True`**: 省略すると `True`。`False` のときだけ先頭への移動になります。

## 何をしているか

`root ⇄ a ⇄ b ⇄ c ⇄ (root)` の状態で `move_to_end("a")` を実行します。

### 1. 移動するリンクを見つけて、前後を覚える

```python:line-numbers=199
        link = self.__map[key]
        link_prev = link.prev
        link_next = link.next
        soft_link = link_next.prev
```

`self.__map["a"]` からリンクを取り出し、前（`root`）と次（`b`）を覚えます。
`soft_link = link_next.prev` は「`b` が `a` を指している参照」、つまり **`a` への弱参照** です。あとで使います。

### 2. リストから外す

```python:line-numbers=203
        link_prev.next = link_next
        link_next.prev = link_prev
```

`root.next = b`、`b.prev = root` とすると、`a` を飛ばしてつながります。リストは `root ⇄ b ⇄ c ⇄ (root)` です。

### 3. 末尾につなぐ

```python:line-numbers=205
        root = self.__root
        if last:
            last = root.prev
            link.prev = last
            link.next = root
            root.prev = soft_link
            last.next = link
```

今の末尾 `c`（`root.prev`）の後ろに `a` を置きます。`a.prev = c`、`a.next = root`、`root.prev = soft_link`（a への弱参照）、`c.next = a`。
結果は `root ⇄ b ⇄ c ⇄ a ⇄ (root)` です。

### 4. 先頭へ移す場合

```python:line-numbers=212
        else:
            first = root.next
            link.prev = root
            link.next = first
            first.prev = soft_link
            root.next = link
```

`last=False` なら、`root` と今の先頭の間に入れます。考え方は同じです。

## ここがすごい

### 辞書とリストの合わせ技で O(1)

ふつうのリストで「ある要素を末尾へ移す」と、要素を探すのに O(n)、取り除いて詰めるのにも O(n) かかります。
`OrderedDict` は、キーからリンクを辞書で一発で見つけ（`self.__map[key]`）、双方向リストの付け替えで移動するので、要素数に関係なく一定の時間で済みます。LRU キャッシュでは「使うたびに末尾へ移す」が大量に起きるので、この差は決定的です。

### 弱参照を「作り直さず使い回す」

`OrderedDict` では `prev` 側に弱参照を使う約束になっています。リンクを末尾につなぎ直すとき、本来は `root.prev = proxy(link)` と弱参照を新しく作る必要があります。
`soft_link = link_next.prev` の行では、すでに `b.prev` に入っていた **`a` への弱参照を取っておき**、それを `root.prev`（または `first.prev`）にそのまま付け替えています。新しいオブジェクトを作らずに済み、余計なメモリ確保もありません。

### 値には一切触れない

移動するのは順番を表すリンクだけで、キーと値を保存している親の辞書は変更しません。辞書の再ハッシュなども起きません。

## まとめ

- 「キーで探す」は辞書、「順番を変える」は双方向リスト、と役割を分けると、移動も O(1) になる。
- 連結リストの操作は「外す → つなぐ」の 2 段階で考えるとわかりやすい。
- すでにあるオブジェクト（ここでは弱参照）を使い回すと、小さな無駄も省ける。
