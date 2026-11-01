---
title: 「残りの前提の数」を数えるだけで依存関係を順に解く
description: graphlib の TopologicalSorter.done は、処理し終えたノードを印として付け、その後続ノードの「残りの前提の数」を 1 つ減らす。0 になったノードを準備完了として集めるので、依存関係の順に並べられる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/graphlib.py
lines: [155, 200]
function: TopologicalSorter.done
difficulty: 2
format: 2
tags: [アルゴリズム, データ構造, 並行処理]
---

## ひとことで

`done(*nodes)` は、**`get_ready` で返されたノードの処理が終わったことを知らせ、その後続ノードの待ちを 1 つ減らす** メソッドです。
A が B に依存しているとき、A の処理が終わると B の待ちが減ります。待ちがなくなった B が、次に `get_ready` で返されます。

## コード

::: code-group

```python:line-numbers=155 [日本語訳]
    def done(self, *nodes):
        """get_ready が返したノードの集合を、処理済みとして印を付ける。

        このメソッドは、*nodes* の各ノードの後続のノードについて、
        将来 "get_ready" で返せるように、待ちを解除する。

        *nodes* のどれかのノードが、すでにこのメソッドで処理済みになっていたり、
        "add" で追加されていなかったり、
        "prepare" を先に呼んでいなかったり、
        "get_ready" でまだ返されていなければ、ValueError を出す。
        """

        if self._ready_nodes is None:
            raise ValueError("prepare() must be called first")

        n2i = self._node2info

        for node in nodes:

            # このノードが add() で追加されているかを確かめる
            if (nodeinfo := n2i.get(node)) is None:
                raise ValueError(f"node {node!r} was not added using add()")

            # ノードが準備完了として返されていなければ、利用者に知らせる。
            stat = nodeinfo.npredecessors
            if stat != _NODE_OUT:
                if stat >= 0:
                    raise ValueError(
                        f"node {node!r} was not passed out (still not ready)"
                    )
                elif stat == _NODE_DONE:
                    raise ValueError(f"node {node!r} was already marked done")
                else:
                    assert False, f"node {node!r}: unknown status {stat}"

            # ノードを処理済みとして印を付ける
            nodeinfo.npredecessors = _NODE_DONE

            # 後続のすべてに進み、先行ノードの数を 1 つ減らす。準備ができたものを集めるため、
            # 次の get_ready() 呼び出しで返せるものを集める。
            for successor in nodeinfo.successors:
                successor_info = n2i[successor]
                successor_info.npredecessors -= 1
                if successor_info.npredecessors == 0:
                    self._ready_nodes.append(successor)
            self._nfinished += 1
```

```python:line-numbers=155 [原文]
    def done(self, *nodes):
        """Marks a set of nodes returned by "get_ready" as processed.

        This method unblocks any successor of each node in *nodes* for being returned
        in the future by a call to "get_ready".

        Raises ValueError if any node in *nodes* has already been marked as
        processed by a previous call to this method, if a node was not added to the
        graph by using "add" or if called without calling "prepare" previously or if
        node has not yet been returned by "get_ready".
        """

        if self._ready_nodes is None:
            raise ValueError("prepare() must be called first")

        n2i = self._node2info

        for node in nodes:

            # Check if we know about this node (it was added previously using add()
            if (nodeinfo := n2i.get(node)) is None:
                raise ValueError(f"node {node!r} was not added using add()")

            # If the node has not being returned (marked as ready) previously, inform the user.
            stat = nodeinfo.npredecessors
            if stat != _NODE_OUT:
                if stat >= 0:
                    raise ValueError(
                        f"node {node!r} was not passed out (still not ready)"
                    )
                elif stat == _NODE_DONE:
                    raise ValueError(f"node {node!r} was already marked done")
                else:
                    assert False, f"node {node!r}: unknown status {stat}"

            # Mark the node as processed
            nodeinfo.npredecessors = _NODE_DONE

            # Go to all the successors and reduce the number of predecessors, collecting all the ones
            # that are ready to be returned in the next get_ready() call.
            for successor in nodeinfo.successors:
                successor_info = n2i[successor]
                successor_info.npredecessors -= 1
                if successor_info.npredecessors == 0:
                    self._ready_nodes.append(successor)
            self._nfinished += 1
```

:::

## 前提知識

- **トポロジカルソート**: 依存関係のある項目を、前提が先に来るように並べる方法です。
- **先行ノード（predecessor）と後続ノード（successor）**: 先に処理されるべきノードと、その後に処理されるノードです。
- **`npredecessors`**: まだ処理されていない先行ノードの数です。0 になると、そのノードは処理できます。
- **`get_ready`**: 今、前提がすべて済んでいて処理できるノードを返すメソッドです。

## 何をしているか

### 1. 準備ができているかを確かめる

```python:line-numbers=167
        if self._ready_nodes is None:
            raise ValueError("prepare() must be called first")
```

`prepare()` が呼ばれていなければ、`ValueError` で止めます。`prepare` で、処理可能なノードの集まりが作られるためです。

### 2. 渡されたノードを確かめる

```python:line-numbers=170
        n2i = self._node2info

        for node in nodes:
```

ノードの情報をまとめた辞書を用意し、渡された各ノードについて処理を行います。

```python:line-numbers=175
            if (nodeinfo := n2i.get(node)) is None:
                raise ValueError(f"node {node!r} was not added using add()")
```

まだ追加されていないノードなら、`ValueError` で止めます。

### 3. 状態が正しいかを確かめる

```python:line-numbers=179
            stat = nodeinfo.npredecessors
            if stat != _NODE_OUT:
                if stat >= 0:
                    raise ValueError(
                        f"node {node!r} was not passed out (still not ready)"
                    )
                elif stat == _NODE_DONE:
                    raise ValueError(f"node {node!r} was already marked done")
                else:
                    assert False, f"node {node!r}: unknown status {stat}"
```

ノードが `get_ready` で返されていなければ、処理済みとして印を付けることはできません。すでに処理済みなら、二重処理として `ValueError` を出します。

### 4. 印を付けて、後続の待ちを減らす

```python:line-numbers=191
            nodeinfo.npredecessors = _NODE_DONE
```

ノードの状態を「処理済み」に変えます。

```python:line-numbers=195
            for successor in nodeinfo.successors:
                successor_info = n2i[successor]
                successor_info.npredecessors -= 1
                if successor_info.npredecessors == 0:
                    self._ready_nodes.append(successor)
```

このノードを待っていた後続ノードの待ちを 1 つ減らします。待ちが 0 になったものは、準備完了のリストに加えます。最後に、処理済みの数を 1 増やします。

## ここがすごい

### 数を数えるだけで順序が決まる

「まだ待っている前提の数」を、ノードごとに 1 つの数で持っています。処理が終わるたびに数を減らし、0 になったものだけを次に回す、という単純な仕組みです。

### 全体を並べ直さない

依存関係の順序を、最初に一度だけ決めるのではありません。処理が終わるたびに、次に進めるものを少しずつ増やしていきます。並行して動く処理にも向いています。

### 不正な使い方を、状態で見つける

同じノードを 2 回処理する、準備していない、追加していないといった誤りを、状態の値で見分けます。間違った順序で処理が進むのを防ぎます。

## まとめ

- 各ノードに「残りの前提の数」を持たせると、依存関係の順番を数えるだけで決められる。
- 処理が終わるたびに後続の数を減らし、0 になったものを準備完了にする。
- 状態を確かめてから処理すると、二重処理や準備不足の誤りを防げる。
