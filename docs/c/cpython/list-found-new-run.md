---
title: "「パワー」の大小だけでマージの順番を決める Powersort の心臓部"
description: "Python のソートで新しい並び（ラン）を見つけたときに呼ばれる関数。スタックの上にある境目のパワーを比べ、大きいものから順にマージしていく。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2747, 2776]
function: "found_new_run"
difficulty: 3
format: 2
tags: [アルゴリズム, ソート, データ構造]
---

## ひとことで

`found_new_run` は、Python の `list.sort()` が新しいラン（すでに昇順に並んだ区間）を見つけるたびに呼ばれる関数です。
直前のランとの境目の「パワー」を計算し、スタックに積まれている古い境目のうち **パワーがより大きいものを先にマージ** します。これだけの規則で、マージの順番がほぼ最適になります（Powersort と呼ばれる戦略）。

## コード

::: code-group

```c:line-numbers=2747 [日本語訳]
/* 長さ n2 の次のランが見つかった。
 * スタックにすでにランがあれば、"powersort" のマージ戦略を適用する:
 * 一番上のランの「パワー」（概念上の二分マージ木での深さ）を計算し、
 * それより大きなパワーを持つスタック上の隣接ランをマージする。詳しくは
 * listsort.txt を参照。
 *
 * この関数が戻ったあと、新しいランをスタックに積むのは
 * 呼び出し側の責任である。
 *
 * 成功なら 0、エラーなら -1 を返す。
 */
static int
found_new_run(MergeState *ms, Py_ssize_t n2)
{
    assert(ms);
    if (ms->n) {
        assert(ms->n > 0);
        struct s_slice *p = ms->pending;
        Py_ssize_t s1 = p[ms->n - 1].base.keys - ms->basekeys; /* 開始位置 */
        Py_ssize_t n1 = p[ms->n - 1].len;
        int power = powerloop(s1, n1, n2, ms->listlen);
        while (ms->n > 1 && p[ms->n - 2].power > power) {
            if (merge_at(ms, ms->n - 2) < 0)
                return -1;
        }
        assert(ms->n < 2 || p[ms->n - 2].power < power);
        p[ms->n - 1].power = power;
    }
    return 0;
}
```

```c:line-numbers=2747 [原文]
/* The next run has been identified, of length n2.
 * If there's already a run on the stack, apply the "powersort" merge strategy:
 * compute the topmost run's "power" (depth in a conceptual binary merge tree)
 * and merge adjacent runs on the stack with greater power. See listsort.txt
 * for more info.
 *
 * It's the caller's responsibility to push the new run on the stack when this
 * returns.
 *
 * Returns 0 on success, -1 on error.
 */
static int
found_new_run(MergeState *ms, Py_ssize_t n2)
{
    assert(ms);
    if (ms->n) {
        assert(ms->n > 0);
        struct s_slice *p = ms->pending;
        Py_ssize_t s1 = p[ms->n - 1].base.keys - ms->basekeys; /* start index */
        Py_ssize_t n1 = p[ms->n - 1].len;
        int power = powerloop(s1, n1, n2, ms->listlen);
        while (ms->n > 1 && p[ms->n - 2].power > power) {
            if (merge_at(ms, ms->n - 2) < 0)
                return -1;
        }
        assert(ms->n < 2 || p[ms->n - 2].power < power);
        p[ms->n - 1].power = power;
    }
    return 0;
}
```

:::

## 前提知識

- **ラン**: 昇順に並んでいる連続区間です。Timsort は配列を左から順にランに切り分けます。
- **マージ**: 2 つの昇順の並びを 1 つの昇順の並びにまとめる操作です。長さが大きく違うものどうしをマージすると無駄が出るので、順番が大切です。
- **スタック**: 後から入れたものを先に取り出すデータ構造です。ここでは「まだマージされていないラン」の一覧を配列 `ms->pending` に積んでいます。`ms->n` が積まれている個数です。
- **パワー**: 隣り合う 2 つのランの境目が、仮想的な二分木の何段目にあたるかを表す数です。`powerloop` 関数で計算します。値が大きいほど「木の深いところ」、つまり先にまとめるべき小さな境目です。
- **`struct` と `->`**: `struct` は複数の値をまとめた型です。`ms->n` は「ポインタ `ms` が指す構造体のメンバ `n`」を読みます。`p[i].len` は配列の `i` 番目の構造体のメンバ `len` です。
- **ポインタの引き算**: 同じ配列を指すポインタどうしを引くと、その間の要素数（位置の差）になります。

## 何をしているか

### 1. スタックが空なら何もしない

```c:line-numbers=2762
    if (ms->n) {
```
`ms->n` が 0、つまり最初のランなら、比べる相手がいないので何もせず `0` を返します。新しいランをスタックに積むのは呼び出し側の仕事です（直前のコメントに書かれています）。

### 2. 直前のランの位置と長さを得る

```c:line-numbers=2764
        struct s_slice *p = ms->pending;
        Py_ssize_t s1 = p[ms->n - 1].base.keys - ms->basekeys; /* start index */
        Py_ssize_t n1 = p[ms->n - 1].len;
```
スタックの一番上 `p[ms->n - 1]` が直前のランです。

```c:line-numbers=2765
        Py_ssize_t s1 = p[ms->n - 1].base.keys - ms->basekeys; /* start index */
```

ここでは、そのランの先頭ポインタから配列全体の先頭 `ms->basekeys` を引いて、開始位置 `s1` を求めています。`n1` はその長さ、`n2` は新しいランの長さです。

### 3. 境目のパワーを計算

```c:line-numbers=2767
        int power = powerloop(s1, n1, n2, ms->listlen);
```
`powerloop(s1, n1, n2, ms->listlen)` で、直前のランと新しいランの境目のパワーを求めます。

### 4. パワーの大きい境目を先にマージ

```c:line-numbers=2768
        while (ms->n > 1 && p[ms->n - 2].power > power) {
            if (merge_at(ms, ms->n - 2) < 0)
                return -1;
        }
```
スタックの上から 2 番目 `p[ms->n - 2]` には、その 1 つ前の境目のパワーが記録されています。それが今回のパワーより大きい間、`merge_at(ms, ms->n - 2)` で上の 2 つのランをマージします。マージするとスタックが 1 つ縮むので、また次を比べます。

### 5. パワーを記録

```c:line-numbers=2773
        p[ms->n - 1].power = power;
```
ループを抜けたら、スタックの一番上のランに今回のパワーを記録します。`assert(ms->n < 2 || ...)` は「スタック上のパワーは下から上へ増えていく」という性質が保たれていることを確かめています。

### 具体例

スタックに A, B が積まれていて、A と B の境目のパワーが 3 だとします。新しいラン C を見つけ、B と C の境目のパワーが 2 になったとします。`3 > 2` なので、先に A と B をマージして AB にします。その後スタックは AB だけになり、AB に「パワー 2」を記録してから、呼び出し側が C を積みます。

## ここがすごい

- **規則が 1 行**: 「上にある境目のパワーが今回より大きければマージ」という単純な比較だけです。昔の Timsort は、スタック上のランの長さどうしについて複数の不等式を保つ複雑な規則を使っていました。
- **ほぼ最適なマージ順**: パワーは「全体を半分、さらに半分…と切ったとき、その境目が何回目の切れ目に当たるか」を表します。深い（小さい）境目から順にまとめれば、全体として長さのバランスがとれたマージになります。
- **スタックが小さくて済む**: スタック上のパワーは単調に増えるので、積まれるランの個数は配列長の対数程度に抑えられます。
- **エラーの伝播**: 比較で例外が起きると `merge_at` が負の値を返し、ただちに `-1` を返して処理を打ち切ります。

## まとめ

- Powersort は、ランの境目ごとに計算した「パワー」の大小だけでマージ順を決める。
- スタック上のパワーが新しい境目より大きい限り、上の 2 つをマージする。
- スタック上のパワーは単調増加に保たれ、スタックの深さは対数で抑えられる。
- 複雑な不変条件を 1 つの数の比較に置き換えると、コードも検証も簡単になる。
