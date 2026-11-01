---
title: "append を速くする「少し多めに確保する」リストの伸ばし方"
description: "Python のリストが大きくなるときに、次の容量を決める計算部分。新しい長さの 1/8 程度を余分に確保し、4 の倍数にそろえる。一括で大きく伸ばすときは余分を付けない。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [131, 156]
function: "py_list_resize"
difficulty: 2
format: 2
tags: [メモリ管理, データ構造, ビット演算, 最適化]
---

## ひとことで

`py_list_resize` は、Python のリストの要素数が確保済みの容量を超えたときに、メモリを確保し直す関数です。ここで取り上げるのは、その冒頭の **新しい容量を決める計算** の部分です（関数全体は約 85 行あり、続きは実際のメモリ確保です）。
新しい長さ `newsize` に対して、およそ `newsize + newsize/8 + 6` を 4 の倍数に切り下げた値を容量にします。たとえば要素数が 0 → 1 になるときは容量 4、5 になるときは 8 を確保します。

## コード

::: code-group

```c:line-numbers=131 [日本語訳]
/* list_resize() の遅い経路: ob_item を確保または再確保する。 */
static int
py_list_resize(PyListObject *self, Py_ssize_t newsize)
{
    size_t new_allocated, target_bytes;
    Py_ssize_t allocated = self->allocated;

    /* リストの大きさに比例して多めに確保し、今後の伸びに備える。
     * 多めの量は控えめだが、性能の悪いシステムの realloc() でも、
     * 長く続く append() の並びに対して償却線形時間を保つには
     * 十分である。
     * （ここまでが方針）
     * 確保する大きさが 4 の倍数になるよう詰め物をする。
     * 増え方は次のとおり:  0, 4, 8, 16, 24, 32, 40, 52, 64, 76, ...
     * 注: new_allocated はあふれない。最大でも
     *       PY_SSIZE_T_MAX * (9 / 8) + 6 で、これは必ず size_t に収まる。
     */
    new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;
    /* 新しい大きさが、旧サイズよりも多めに確保した大きさに近いなら、
     * 多めには確保しない。
     */
    if (newsize - Py_SIZE(self) > (Py_ssize_t)(new_allocated - newsize))
        new_allocated = ((size_t)newsize + 3) & ~(size_t)3;

    if (newsize == 0)
        new_allocated = 0;
```

```c:line-numbers=131 [原文]
/* Slow path of list_resize(): allocate or reallocate ob_item. */
static int
py_list_resize(PyListObject *self, Py_ssize_t newsize)
{
    size_t new_allocated, target_bytes;
    Py_ssize_t allocated = self->allocated;

    /* This over-allocates proportional to the list size, making room
     * for additional growth.  The over-allocation is mild, but is
     * enough to give linear-time amortized behavior over a long
     * sequence of appends() in the presence of a poorly-performing
     * system realloc().
     * Add padding to make the allocated size multiple of 4.
     * The growth pattern is:  0, 4, 8, 16, 24, 32, 40, 52, 64, 76, ...
     * Note: new_allocated won't overflow because the largest possible value
     *       is PY_SSIZE_T_MAX * (9 / 8) + 6 which always fits in a size_t.
     */
    new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;
    /* Do not overallocate if the new size is closer to overallocated size
     * than to the old size.
     */
    if (newsize - Py_SIZE(self) > (Py_ssize_t)(new_allocated - newsize))
        new_allocated = ((size_t)newsize + 3) & ~(size_t)3;

    if (newsize == 0)
        new_allocated = 0;
```

:::

## 前提知識

- **長さと容量**: Python のリストは、内部に「要素へのポインタの配列」を持ちます。実際の要素数（長さ）とは別に、配列として確保済みの大きさ（容量、`allocated`）があり、容量に余裕があれば `append` はメモリを確保し直さずに済みます。
- **`Py_SIZE(self)`**: 現在の要素数を返すマクロです。
- **`size_t` とキャスト**: `size_t` は符号なし整数型です。`(size_t)newsize` は符号付きの値を符号なしとして扱い直します。
- **`>>`（右シフト）**: `newsize >> 3` は `newsize / 8` の切り捨てと同じです。
- **`& ~(size_t)3`**: `~3` は下位 2 ビットだけが 0 で残りがすべて 1 の値です。これと AND を取ると下位 2 ビットが 0 になり、**4 の倍数に切り下げ** られます。`7 & ~3` は `4`、`11 & ~3` は `8` です。
- **償却計算量**: 1 回 1 回の処理はときどき重くても、たくさん繰り返したときの平均が軽ければよい、という考え方です。

## 何をしているか

### 1. 方針を説明するコメント

```c:line-numbers=138
    /* This over-allocates proportional to the list size, making room
     * for additional growth.  The over-allocation is mild, but is
     * enough to give linear-time amortized behavior over a long
     * sequence of appends() in the presence of a poorly-performing
     * system realloc().
     * Add padding to make the allocated size multiple of 4.
     * The growth pattern is:  0, 4, 8, 16, 24, 32, 40, 52, 64, 76, ...
     * Note: new_allocated won't overflow because the largest possible value
     *       is PY_SSIZE_T_MAX * (9 / 8) + 6 which always fits in a size_t.
     */
```
「長さに比例して少し多めに確保すれば、`append` を何度も繰り返しても平均して一定時間で済む」と書かれています。容量の増え方の例として `0, 4, 8, 16, 24, 32, 40, 52, 64, 76, ...` が挙げられ、計算途中で `size_t` があふれないことも説明されています。

### 2. 基本の計算

```c:line-numbers=148
    new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;
```
`new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;` で容量を決めます。いくつか計算してみます。

- `newsize = 1`: `1 + 0 + 6 = 7` → 4 の倍数に切り下げて `4`
- `newsize = 5`: `5 + 0 + 6 = 11` → `8`
- `newsize = 9`: `9 + 1 + 6 = 16` → `16`
- `newsize = 17`: `17 + 2 + 6 = 25` → `24`

コメントの増え方と一致します。

### 3. 一気に伸ばすときは余分を付けない

```c:line-numbers=149
    /* Do not overallocate if the new size is closer to overallocated size
     * than to the old size.
     */
    if (newsize - Py_SIZE(self) > (Py_ssize_t)(new_allocated - newsize))
        new_allocated = ((size_t)newsize + 3) & ~(size_t)3;
```
`extend` などで一度に大きく伸ばす場合、「増やす量」が「余分に確保する量」より大きければ、余分は付けずに `newsize` を 4 の倍数に切り上げた値にします（`+ 3` してから切り下げると切り上げになります）。
空のリストに 100 要素を一度に追加すると、基本の式では `100 + 12 + 6 = 118` → `116` ですが、増える量 100 は余分 16 より大きいので、条件の中の式で `103 & ~3 = 100` になります。

### 4. 長さ 0 なら容量も 0

```c:line-numbers=155
    if (newsize == 0)
        new_allocated = 0;
```
リストを空にするときは、配列を持たないようにします。

## ここがすごい

- **平均すると append が定数時間**: 1 個ずつ伸ばすたびに確保し直すと、n 回の `append` で合計 n² に比例するコピーが起きます。長さに比例した余分（約 12.5%）を持てば、確保し直しの回数は対数的に減り、平均コストは一定になります。
- **控えめな余分**: 2 倍に伸ばす実装も多いですが、CPython は 1/8 程度にとどめています。リストは数が多く寿命の短いものも多いので、無駄なメモリを抑える選択です。コメントにある通り、性能の悪い `realloc` でも線形時間を保てる程度には多めにしています。
- **4 の倍数にそろえる**: 小さいリストでも最低 4 要素分を確保し、細かい再確保を避けています。`+ 6` は、長さが小さいときにも余裕を持たせるための値です。
- **一括追加への配慮**: 大きな `extend` のあとに余分を付けると、もう伸びないかもしれないのに大量のメモリを抱えます。この条件はそれを避けます。
- **ビット演算で丸める**: 4 の倍数への丸めを割り算ではなく `& ~3` で行っています。

## まとめ

- 動的配列は、容量に余裕を持たせることで `append` の平均コストを一定にできる。
- CPython のリストは「新しい長さの 1/8 + 6」程度を余分に確保し、4 の倍数にそろえる。
- 一度に大きく伸ばすときは、余分を付けずに必要な分だけ確保する。
- `x & ~3` は 4 の倍数への切り下げ、`(x + 3) & ~3` は切り上げ。
