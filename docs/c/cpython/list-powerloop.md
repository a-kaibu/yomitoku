---
title: "割り算を 1 ビットずつ真似て「マージの深さ」を求める"
description: "Python のソート（Powersort 戦略）で、隣り合う 2 つの並びの「パワー」を計算する関数。2 つの商の 2 進展開を同時に作り、最初に食い違う桁を探す。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2706, 2745]
function: "powerloop"
difficulty: 3
format: 2
tags: [アルゴリズム, ソート, ビット演算, 数値計算]
---

## ひとことで

`powerloop` は、Python の `list.sort()` がどの順番で並び（ラン）をマージするかを決めるための数を計算する関数です。この数は「パワー」と呼ばれ、仮想的な二分木の中でその境目がどの深さにあるかを表します。
具体的には、2 つのランの中央の位置を全体の長さ `n` で割った 2 つの分数を考え、**2 進数で書いたときに何桁目で初めて違うか** を返します。浮動小数点数を使わず、整数の比較と引き算とシフトだけで計算しているのが見どころです。

## コード

::: code-group

```c:line-numbers=2706 [日本語訳]
/* 隣り合う 2 つのランが位置 s1 から始まる。1 つ目のランの長さは n1、
 * 2 つ目（位置 s1+n1 から）の長さは n2。リスト全体の長さは
 * n。
 * 1 つ目のランの「パワー」を計算する。詳しくは listsort.txt を参照。
 */
static int
powerloop(Py_ssize_t s1, Py_ssize_t n1, Py_ssize_t n2, Py_ssize_t n)
{
    int result = 0;
    assert(s1 >= 0);
    assert(n1 > 0 && n2 > 0);
    assert(s1 + n1 + n2 <= n);
    /* 中央の位置 a と b:
     * a = s1 + n1/2
     * b = s1 + n1 + n2/2 = a + (n1 + n2)/2
     *
     * "/2" があるので整数とは限らない。そこで 2*a と 2*b を使う。
     * こちらは必ず整数になる。結果は変わらない。(2*i)/n の 2 進展開は
     * i/n の展開を 1 桁ずらしただけ
     * だからだ。
     */
    Py_ssize_t a = 2 * s1 + n1;  /* 2*a */
    Py_ssize_t b = a + n1 + n2;  /* 2*b */
    /* a/n と b/n を 1 ビットずつ再現し、ビットが食い違うまで続ける。 */
    for (;;) {
        ++result;
        if (a >= n) {  /* 両方の商のビットが 1 */
            assert(b >= a);
            a -= n;
            b -= n;
        }
        else if (b >= n) {  /* a/n のビットは 0、b/n のビットは 1 */
            break;
        } /* それ以外は両方の商のビットが 0 */
        assert(a < b && b < n);
        a <<= 1;
        b <<= 1;
    }
    return result;
}
```

```c:line-numbers=2706 [原文]
/* Two adjacent runs begin at index s1. The first run has length n1, and
 * the second run (starting at index s1+n1) has length n2. The list has total
 * length n.
 * Compute the "power" of the first run. See listsort.txt for details.
 */
static int
powerloop(Py_ssize_t s1, Py_ssize_t n1, Py_ssize_t n2, Py_ssize_t n)
{
    int result = 0;
    assert(s1 >= 0);
    assert(n1 > 0 && n2 > 0);
    assert(s1 + n1 + n2 <= n);
    /* midpoints a and b:
     * a = s1 + n1/2
     * b = s1 + n1 + n2/2 = a + (n1 + n2)/2
     *
     * Those may not be integers, though, because of the "/2". So we work with
     * 2*a and 2*b instead, which are necessarily integers. It makes no
     * difference to the outcome, since the bits in the expansion of (2*i)/n
     * are merely shifted one position from those of i/n.
     */
    Py_ssize_t a = 2 * s1 + n1;  /* 2*a */
    Py_ssize_t b = a + n1 + n2;  /* 2*b */
    /* Emulate a/n and b/n one bit a time, until bits differ. */
    for (;;) {
        ++result;
        if (a >= n) {  /* both quotient bits are 1 */
            assert(b >= a);
            a -= n;
            b -= n;
        }
        else if (b >= n) {  /* a/n bit is 0, b/n bit is 1 */
            break;
        } /* else both quotient bits are 0 */
        assert(a < b && b < n);
        a <<= 1;
        b <<= 1;
    }
    return result;
}
```

:::

## 前提知識

- **ラン（run）**: すでに昇順に並んでいる連続した区間です。Timsort は配列をランに分け、それらをマージ（併合）してソートします。
- **Powersort**: どのランをどの順でマージするかを決める戦略の 1 つです。境目ごとに「パワー」を計算し、パワーの大きい境目から先にマージすると、バランスのよいマージ順になります。
- **2 進小数**: `0.101`（2 進）は `1/2 + 0/4 + 1/8 = 0.625` です。`x / n` の 2 進展開は、「`x` を 2 倍して `n` 以上なら桁は 1 で `n` を引く、未満なら桁は 0」を繰り返すと 1 桁ずつ求められます。筆算の割り算と同じ考え方です。
- **`<<=`**: 左シフトしてから代入します。`a <<= 1` は `a = a * 2` と同じです。
- **`for (;;)`**: 条件のない無限ループです。中の `break` で抜けます。
- **`Py_ssize_t`**: CPython が長さや位置に使う符号付き整数型です。

## 何をしているか

### 1. 中央の位置を 2 倍して整数にする

```c:line-numbers=2727
    Py_ssize_t a = 2 * s1 + n1;  /* 2*a */
    Py_ssize_t b = a + n1 + n2;  /* 2*b */
```
1 つ目のランは位置 `s1` から長さ `n1`、2 つ目はその直後から長さ `n2` です。それぞれの中央は `s1 + n1/2` と `s1 + n1 + n2/2` ですが、`/2` で小数になるかもしれません。
そこで 2 倍した値 `a = 2*s1 + n1`、`b = a + n1 + n2` を使います。2 倍しても 2 進展開が 1 桁ずれるだけなので、「何桁目で違うか」の答えは変わりません。

### 2. 2 つの商を 1 桁ずつ作る

```c:line-numbers=2730
    for (;;) {
        ++result;
        if (a >= n) {  /* both quotient bits are 1 */
            assert(b >= a);
            a -= n;
            b -= n;
        }
        else if (b >= n) {  /* a/n bit is 0, b/n bit is 1 */
            break;
        } /* else both quotient bits are 0 */
        assert(a < b && b < n);
        a <<= 1;
        b <<= 1;
    }
```
ループのたびに `result` を 1 増やし、`a/n` と `b/n` の次の桁を同時に調べます。

- `a >= n` なら、両方の桁が 1 です（`a <= b` なので `b >= n` も成り立つ）。両方から `n` を引きます。
- `a < n` かつ `b >= n` なら、`a` の桁は 0、`b` の桁は 1 で、ここで初めて違います。ループを抜けます。
- どちらも `n` 未満なら、両方の桁が 0 です。

最後に両方を 2 倍して次の桁へ進みます。

### 3. 具体例

全体 `n = 8`、`s1 = 0`、`n1 = 2`、`n2 = 2` とします。`a = 2`、`b = 6` です。

- 1 回目: `result = 1`。`a=2 < 8`、`b=6 < 8` なので両方 0。シフトして `a = 4`、`b = 12`。
- 2 回目: `result = 2`。`a=4 < 8`、`b=12 >= 8` なので食い違い。終了し、`2` を返します。

実際、2 つの中央を全体で割ると `1/8 = 0.001`、`3/8 = 0.011`（2 進）で、小数点以下 2 桁目で初めて違います。

## ここがすごい

- **浮動小数点を使わない**: `a/n` を `double` で計算して比べる方法もありますが、丸め誤差で答えがずれる恐れがあります。この関数は整数だけで正確に求めます。
- **割り算をしない**: 1 桁ごとに比較・引き算・シフトしかしないので、遅い割り算命令を使いません。ループ回数はパワーの値そのもので、ふつうは小さな数です。
- **オーバーフローしない**: ループ中は `a < b < n` が保たれるので、2 倍しても `2n` 未満に収まります。
- **コメントによる正当化**: 「2 倍しても結果が変わらない理由」がコメントで丁寧に説明されており、トリックの安全性を読者が確かめられます。詳細は CPython の `Objects/listsort.txt` に書かれています。

## まとめ

- Powersort は、ランの境目ごとに「パワー」（二分木での深さ）を計算してマージ順を決める。
- パワーは、2 つの中央位置を全体の長さで割った値の 2 進展開が、最初に食い違う桁の番号。
- 2 進展開は「2 倍して n 以上なら 1、引く」を繰り返せば整数だけで求められる。
- 小数が出る値は 2 倍して整数にすると、正確な計算に持ち込めることがある。
