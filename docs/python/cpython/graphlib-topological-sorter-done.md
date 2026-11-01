---
title: 「残りの前提の数」を数えるだけで依存関係を順に解く
description: graphlib.TopologicalSorter.done は、作業の完了を伝えると、それを待っていた次の作業を「準備完了」にする。前提の数を 1 ずつ減らす Kahn のアルゴリズムの中心部分。
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
tags: [アルゴリズム, データ構造, 並行処理, 標準ライブラリ]
---
## ひとことで

`TopologicalSorter` は、「B は A が終わってから」「C は A と B が終わってから」のような **依存関係** を受け取り、実行できる順番を教えてくれるクラスです（トポロジカルソート）。
`done(*nodes)` は「これらの作業が終わった」と伝えるメソッドで、終わった作業を待っていた次の作業のうち、**前提がすべてそろったものを「準備完了」リストに加えます**。
`get_ready()` で準備完了の作業を受け取り、並列に実行し、終わったら `done()` を呼ぶ、という使い方ができます。

## コード

```python:line-numbers=155
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

`_NODE_OUT`（-1）と `_NODE_DONE`（-2）は、ファイル冒頭の 5〜6 行目で定義された定数です。`n2i`（`self._node2info`）は、各ノード（作業）について `npredecessors`（まだ終わっていない前提の数）と `successors`（自分を待っている作業の一覧）を持つ辞書です。

## 前提知識

- **依存関係のグラフ**: 作業を点（ノード）、「A の後に B」を矢印で表した図です。矢印の根元を前提（predecessor）、先を後続（successor）と呼びます。
- **トポロジカルソート**: 矢印の向きに逆らわないように、ノードを一列に並べることです。
- **`*nodes`**: 引数をいくつでも受け取り、タプルとしてまとめる書き方です。`done("a", "b")` なら `nodes` は `("a", "b")` です。
- **セイウチ演算子 `:=`**: `(x := 式) is None` のように、式の値を変数に入れながら、その値を条件にも使えます。
- **`f"...{node!r}"`**: f 文字列で、`!r` は値を `repr()`（引用符付きなどの開発者向け表示）で埋め込みます。
- **`assert False, ...`**: 「ここには絶対に来ないはず」という場所に置く確認です。

## 何をしているか

`A → B`、`A → C`、`B → C` という依存関係で考えます。準備（`prepare()`）の時点で、前提の数は A: 0、B: 1、C: 2 です。`get_ready()` は A を返し、A の値を `_NODE_OUT`（-1、「渡し済み」）にします。

### 1. ノードの確認（172〜188 行目）

`done("A")` を呼ぶと、まず A が登録済みか確かめます。次に `npredecessors` を見て、

- 0 以上なら、まだ `get_ready()` で渡していないのでエラー
- `_NODE_DONE` なら、すでに完了済みなのでエラー

と、使い方の間違いを細かく見分けています。

### 2. 完了にする（191 行目）

A の `npredecessors` を `_NODE_DONE`（-2）にします。

### 3. 後続の前提の数を減らす（195〜199 行目）

A の後続 B と C について、前提の数を 1 ずつ減らします。B は 1 → 0 になったので準備完了リストに追加。C は 2 → 1 なのでまだです。
次に B が `done` されると C が 1 → 0 になり、準備完了になります。

## ここがすごい

### 数を数えるだけで「全部そろったか」がわかる

「C の前提である A と B がどちらも終わったか」を毎回調べると、前提の数だけ確認が必要です。この実装は **残りの前提の数** だけを持っておき、前提が終わるたびに 1 減らします。0 になった瞬間が「全部そろった」瞬間なので、確認は不要です。これは **Kahn（カーン）のアルゴリズム** と呼ばれる方法で、全体の計算量はノード数と矢印の数の合計に比例します。

### 1 つの数に状態をまとめる

`npredecessors` は、0 以上なら「残りの前提の数」、-1 なら「渡し済み」、-2 なら「完了」を表します。状態を別の変数で持たずに 1 つの整数に詰め込んでいるので、メモリが少なく、チェックも 1 か所で済みます。

### 並列実行にそのまま使える

一般的なトポロジカルソートは「一列に並べた結果」を返すだけですが、このクラスは `get_ready()` と `done()` に分けているので、**同時に実行できる作業をまとめて受け取り、終わった順に報告する** ことができます。ビルドシステムやタスク実行器のように、作業を並列に進めたい場面にそのまま使えます。

### 誤用にていねいなエラーを返す

「まだ渡していない」「もう完了している」「登録されていない」を区別してメッセージを出します。状態の値を決めておいたことで、こうした判定が簡単に書けています。

## まとめ

- 依存関係の解決は「残りの前提の数」を数えて 0 になったら実行、で効率よくできる（Kahn のアルゴリズム）。
- 負の値など、使わない範囲の数を状態の目印にすると、1 つの変数で複数の状態を表せる。
- 「取り出す」と「完了を伝える」を分けると、並列処理に使いやすい API になる。
