---
title: 比較回数をほぼ半分にするヒープの「ふるい落とし」
description: 優先度付きキュー heapq の内部関数。教科書どおりの書き方をあえて捨てて、比較の回数を大きく減らしている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "ed9cb4b5e90065d04cb6fb6c774f9f53628d65bf"
file: Lib/heapq.py
lines: [274, 292]
function: _siftup
difficulty: 2
tags: [データ構造, アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

`_siftup` は、Python 標準ライブラリ `heapq`（ヒープ ＝ 「いちばん小さい値をすぐ取り出せる」データ構造）の内部で使われる関数です。
ヒープのある位置に置かれた値を **正しい場所まで移動させて、ヒープのルールを守り直す** 役目を持ちます。
`heappop()`（最小値の取り出し）や `heapify()`（リストをヒープに変える）の中心で動いています。

## コード

```python:line-numbers=274
def _siftup(heap, pos):
    endpos = len(heap)
    startpos = pos
    newitem = heap[pos]
    # Bubble up the smaller child until hitting a leaf.
    childpos = 2*pos + 1    # leftmost child position
    while childpos < endpos:
        # Set childpos to index of smaller child.
        rightpos = childpos + 1
        if rightpos < endpos and not heap[childpos] < heap[rightpos]:
            childpos = rightpos
        # Move the smaller child up.
        heap[pos] = heap[childpos]
        pos = childpos
        childpos = 2*pos + 1
    # The leaf at pos is empty now.  Put newitem there, and bubble it up
    # to its final resting place (by sifting its parents down).
    heap[pos] = newitem
    _siftdown(heap, startpos, pos)
```

最後に呼んでいる `_siftdown` は同じファイルの 221 行目にある関数で、値を **親の方向（上）へ** 移動させます。

## 前提知識

- **リストとインデックス**: Python の `heap` はふつうのリスト（配列）です。`heap[0]` が先頭、`len(heap)` が要素数です。
- **配列で表す木（二分ヒープ）**: ヒープは木の形をしていますが、リストに詰めて保存します。位置 `i` の要素の **子は `2*i+1` と `2*i+2`**、親は `(i-1)//2` です。ポインタを使わず、計算だけで親子をたどれます。
- **ヒープのルール**: 「どの親も、自分の子以下の値である」。このルールのおかげで、`heap[0]` が常に最小値になります。
- **名前の先頭の `_`**: 「内部用なので外から直接呼ばないでね」という Python の慣習です。
- **`not a < b`**: 「a が b より小さくない」、つまり `a >= b` とほぼ同じ意味です（なぜわざわざこう書くかは後述）。
- **比較とは**: `a < b` は Python では `a.__lt__(b)` というメソッド呼び出しになります。自分で作ったクラスやタプルの比較は、意外と時間がかかることがあります。

## 何をしているか

前提として、`pos` の位置の **左右の子から下は、すでにヒープのルールを満たしている** 状態で呼ばれます。崩れているかもしれないのは `pos` に置かれた `newitem` 1 つだけです。

### 1. 下準備（275〜279 行目）

`newitem` を退避しておき、`childpos` に左の子の位置（`2*pos + 1`）を入れます。`startpos` には最初の位置を覚えておきます（あとで使います）。

### 2. 小さい方の子を、葉まで引き上げ続ける（280〜288 行目）

ループの中では次のことだけをします。

1. 左右の子のうち **小さい方** を選ぶ（283 行目、比較 1 回）
2. その子を 1 つ上（`pos`）に引き上げる（286 行目）
3. 引き上げた子がいた場所へ移動し、また下へ進む

ポイントは、**`newitem` とは一度も比較していない** ことです。「`newitem` がここに収まるか？」を確かめずに、とにかく木のいちばん下（葉）まで穴を下ろしていきます。

### 3. 葉に置いてから、上へ戻す（291〜292 行目）

葉まで来たら、空いた穴に `newitem` を置きます。このままだとルール違反かもしれないので、`_siftdown(heap, startpos, pos)` で **親より小さい間だけ上へ** 移動させます。`startpos` より上には行かないので、関係ない部分は壊しません。

## ここがすごい

### 教科書の書き方を「あえて」やめている

多くの教科書では、下へ進むたびに「左の子と右の子を比べる」「小さい方と `newitem` を比べる」の **2 回比較** し、`newitem` の方が小さければすぐ止めます。早く止まれるので効率がよさそうに見えます。

ところが `heappop()` では、リストの **最後の要素**（たいてい大きな値）を先頭に持ってきてから `_siftup` を呼びます。大きな値はどうせ下のほうまで沈むので、「早く止まれるかも」という比較はほとんど無駄になります。

そこでこの実装は、

- 下りでは「子どうしの比較」の **1 回だけ** で葉まで一気に進み、
- 最後に上へ少しだけ戻す（大きな値なので、たいてい 1〜2 段で止まる）

という 2 段構えにしています。235〜273 行目のコメントによると、1000 要素のランダムなリストを全部 `heappop()` したとき、**比較回数が約 15,000 回から約 8,700 回へ** 減ったそうです。この考え方は Knuth の『The Art of Computer Programming』第 3 巻の演習問題でも扱われています。

### 「比較は高い」という前提で設計している

ヒープの要素は数値とは限らず、`(優先度, データ)` のタプルや、自分で `__lt__` を定義したオブジェクトかもしれません。そうした比較は重くなりがちなので、**代入（コピー）を少し増やしてでも比較を減らす** 方が得になります。

### `<` だけで書かれている

283 行目は `heap[childpos] >= heap[rightpos]` ではなく `not heap[childpos] < heap[rightpos]` と書かれています。こうしておけば、ヒープに入れるオブジェクトは **`__lt__`（`<`）だけを定義すれば動きます**。使う側への要求を最小限にする、ライブラリらしい気配りです。

なお CPython では、このファイルの最後で C 言語で書かれた高速版（`_heapq` モジュール）を読み込んで置き換えますが、C 版も同じアルゴリズムを使っています。

## まとめ

- ヒープは配列だけで木を表せる（子は `2*i+1`, `2*i+2`）。
- 「早く止まれるかも」という比較が、実際のデータでは無駄になることがある。データの性質を見て設計しよう。
- 比較が高価になりうるなら、比較の回数そのものを減らす工夫が効く。
- 要求するインターフェース（ここでは `<` だけ）を小さくすると、使う側が楽になる。
