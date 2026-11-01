---
title: "1, 3, 7, 15…と跳ねてから二分探索する「ギャロップ」"
description: "Timsort のマージで使われる探索関数。ヒントの位置から歩幅を倍々に広げて範囲を絞り、最後に二分探索する。答えが近いほど速い。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2120, 2193]
function: "gallop_left"
difficulty: 3
format: 2
tags: [アルゴリズム, 探索, ソート, 最適化]
---

## ひとことで

`gallop_left` は、ソート済みの配列 `a` の中で、値 `key` を挿入すべき位置を探す関数です。Python の `list.sort()`（Timsort というアルゴリズム）がマージ処理の中で使います。
ふつうの二分探索と違い、**ヒント（`hint`）の位置から 1, 3, 7, 15… と倍々に跳ねて範囲を見つけ、その範囲だけを二分探索** します。答えがヒントの近くにあれば、比較はごくわずかで済みます。

## コード

::: code-group

```c:line-numbers=2120 [日本語訳]
static Py_ssize_t
gallop_left(MergeState *ms, PyObject *key, PyObject **a, Py_ssize_t n, Py_ssize_t hint)
{
    Py_ssize_t ofs;
    Py_ssize_t lastofs;
    Py_ssize_t k;

    assert(key && a && n > 0 && hint >= 0 && hint < n);

    a += hint;
    lastofs = 0;
    ofs = 1;
    IFLT(*a, key) {
        /* a[hint] < key -- 右へギャロップする。次が成り立つまで:
         * a[hint + lastofs] < key <= a[hint + ofs]
         */
        const Py_ssize_t maxofs = n - hint;             /* &a[n-1] が最大 */
        while (ofs < maxofs) {
            IFLT(a[ofs], key) {
                lastofs = ofs;
                assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
                ofs = (ofs << 1) + 1;
            }
            else                /* key <= a[hint + ofs] */
                break;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* &a[0] 基準のオフセットに戻す。 */
        lastofs += hint;
        ofs += hint;
    }
    else {
        /* key <= a[hint] -- 左へギャロップする。次が成り立つまで:
         * a[hint - ofs] < key <= a[hint - lastofs]
         */
        const Py_ssize_t maxofs = hint + 1;             /* &a[0] が最小 */
        while (ofs < maxofs) {
            IFLT(*(a-ofs), key)
                break;
            /* key <= a[hint - ofs] */
            lastofs = ofs;
            assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
            ofs = (ofs << 1) + 1;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* &a[0] 基準の正のオフセットに戻す。 */
        k = lastofs;
        lastofs = hint - ofs;
        ofs = hint - k;
    }
    a -= hint;

    assert(-1 <= lastofs && lastofs < ofs && ofs <= n);
    /* これで a[lastofs] < key <= a[ofs]。key の居場所は lastofs より
     * 右で、ofs より右ではない。不変条件 a[lastofs-1] < key <= a[ofs] を
     * 保ちながら二分探索する。
     */
    ++lastofs;
    while (lastofs < ofs) {
        Py_ssize_t m = lastofs + ((ofs - lastofs) >> 1);

        IFLT(a[m], key)
            lastofs = m+1;              /* a[m] < key */
        else
            ofs = m;                    /* key <= a[m] */
    }
    assert(lastofs == ofs);             /* よって a[ofs-1] < key <= a[ofs] */
    return ofs;

fail:
    return -1;
}
```

```c:line-numbers=2120 [原文]
static Py_ssize_t
gallop_left(MergeState *ms, PyObject *key, PyObject **a, Py_ssize_t n, Py_ssize_t hint)
{
    Py_ssize_t ofs;
    Py_ssize_t lastofs;
    Py_ssize_t k;

    assert(key && a && n > 0 && hint >= 0 && hint < n);

    a += hint;
    lastofs = 0;
    ofs = 1;
    IFLT(*a, key) {
        /* a[hint] < key -- gallop right, until
         * a[hint + lastofs] < key <= a[hint + ofs]
         */
        const Py_ssize_t maxofs = n - hint;             /* &a[n-1] is highest */
        while (ofs < maxofs) {
            IFLT(a[ofs], key) {
                lastofs = ofs;
                assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
                ofs = (ofs << 1) + 1;
            }
            else                /* key <= a[hint + ofs] */
                break;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* Translate back to offsets relative to &a[0]. */
        lastofs += hint;
        ofs += hint;
    }
    else {
        /* key <= a[hint] -- gallop left, until
         * a[hint - ofs] < key <= a[hint - lastofs]
         */
        const Py_ssize_t maxofs = hint + 1;             /* &a[0] is lowest */
        while (ofs < maxofs) {
            IFLT(*(a-ofs), key)
                break;
            /* key <= a[hint - ofs] */
            lastofs = ofs;
            assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
            ofs = (ofs << 1) + 1;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* Translate back to positive offsets relative to &a[0]. */
        k = lastofs;
        lastofs = hint - ofs;
        ofs = hint - k;
    }
    a -= hint;

    assert(-1 <= lastofs && lastofs < ofs && ofs <= n);
    /* Now a[lastofs] < key <= a[ofs], so key belongs somewhere to the
     * right of lastofs but no farther right than ofs.  Do a binary
     * search, with invariant a[lastofs-1] < key <= a[ofs].
     */
    ++lastofs;
    while (lastofs < ofs) {
        Py_ssize_t m = lastofs + ((ofs - lastofs) >> 1);

        IFLT(a[m], key)
            lastofs = m+1;              /* a[m] < key */
        else
            ofs = m;                    /* key <= a[m] */
    }
    assert(lastofs == ofs);             /* so a[ofs-1] < key <= a[ofs] */
    return ofs;

fail:
    return -1;
}
```

:::

`IFLT` は同じファイルで次のように定義されています。

```c:line-numbers=1769
#define IFLT(X, Y) if ((k = ISLT(X, Y)) < 0) goto fail;  \
           if (k)
```

## 前提知識

- **ソート済み配列での探索**: `a = [10, 20, 30, 40]` に `25` を入れるなら、位置 2（`20` と `30` の間）が答えです。`gallop_left` は等しい要素があればその **左端** を返します（Python の `bisect_left` と同じ）。
- **ポインタ演算**: `PyObject **a` はオブジェクトへのポインタの配列です。`a += hint` は「配列の先頭を `hint` 個ぶん後ろにずらす」操作で、以後 `a[0]` が元の `a[hint]` を指します。`*(a-ofs)` は「今の位置から `ofs` 個前の要素」です。
- **`IFLT(X, Y)` マクロ**: 同じファイルで定義されたマクロで、「`X < Y` を比較し、例外が起きたら `fail` ラベルへ飛ぶ。比較結果が真なら直後のブロックを実行する」という意味です（下の補足）。
- **`goto fail`**: 指定したラベル（`fail:`）へ処理を飛ばす文です。C では例外がないので、エラー時の後始末を 1 か所にまとめるのによく使われます。
- **`<<` 演算子**: 左シフトです。`ofs << 1` は `ofs * 2` と同じです。
- **`>> 1`**: 右シフトで、2 で割って切り捨てるのと同じです。

## 何をしているか

### 1. ヒントの位置へ移動

```c:line-numbers=2129
    a += hint;
    lastofs = 0;
    ofs = 1;
```
`a += hint` で基準をヒントの位置にずらし、`lastofs = 0`、`ofs = 1` を準備します。ここから先は「ヒントからの距離」で考えます。

### 2. 右へギャロップ

```c:line-numbers=2132
    IFLT(*a, key) {
        /* a[hint] < key -- gallop right, until
         * a[hint + lastofs] < key <= a[hint + ofs]
         */
        const Py_ssize_t maxofs = n - hint;             /* &a[n-1] is highest */
        while (ofs < maxofs) {
            IFLT(a[ofs], key) {
                lastofs = ofs;
                assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
                ofs = (ofs << 1) + 1;
            }
            else                /* key <= a[hint + ofs] */
                break;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* Translate back to offsets relative to &a[0]. */
        lastofs += hint;
        ofs += hint;
    }
```
`a[hint] < key` なら、答えはヒントより右にあります。`a[ofs] < key` の間、`lastofs = ofs`、`ofs = ofs*2 + 1` と歩幅を広げます。`ofs` は 1, 3, 7, 15, 31… と増えます。
`key <= a[ofs]` になった時点で、答えは `lastofs` と `ofs` の間にあるとわかります。配列の端を越えないよう `maxofs` で上限を抑え、最後にヒントを足して先頭基準の位置に戻します。

### 3. 左へギャロップ

```c:line-numbers=2152
    else {
        /* key <= a[hint] -- gallop left, until
         * a[hint - ofs] < key <= a[hint - lastofs]
         */
        const Py_ssize_t maxofs = hint + 1;             /* &a[0] is lowest */
        while (ofs < maxofs) {
            IFLT(*(a-ofs), key)
                break;
            /* key <= a[hint - ofs] */
            lastofs = ofs;
            assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2);
            ofs = (ofs << 1) + 1;
        }
        if (ofs > maxofs)
            ofs = maxofs;
        /* Translate back to positive offsets relative to &a[0]. */
        k = lastofs;
        lastofs = hint - ofs;
        ofs = hint - k;
    }
```
逆に `key <= a[hint]` なら、答えはヒント以左です。今度は `*(a-ofs)` を見ながら左へ倍々に進み、`a[hint-ofs] < key` になったら止まります。最後の 3 行で、左向きの距離を先頭基準の位置に変換しています。

### 4. 絞った範囲を二分探索

```c:line-numbers=2179
    ++lastofs;
    while (lastofs < ofs) {
        Py_ssize_t m = lastofs + ((ofs - lastofs) >> 1);

        IFLT(a[m], key)
            lastofs = m+1;              /* a[m] < key */
        else
            ofs = m;                    /* key <= a[m] */
    }
```
この時点で `a[lastofs] < key <= a[ofs]` が成り立っています。`m` を中央に取り、`a[m] < key` なら左端を `m+1` に、そうでなければ右端を `m` にします。範囲が 1 点になった位置が答えです。

### 具体例

`a = [1, 2, 3, ..., 100]`（1 から 100）、`hint = 0`、`key = 6.5` とします。
`a[0]=1 < 6.5` なので右へ。`a[1]=2`、`a[3]=4` は小さく、`a[7]=8` で `6.5 <= 8` となり止まります。範囲は位置 4〜7 に絞られ、二分探索 2 回ほどで答え 6 が見つかります。配列全体（100 要素）を二分探索するより比較が少なくて済みます。

## ここがすごい

- **答えが近いほど速い**: 二分探索は常に log₂(n) 回ほど比較します。ギャロップは、答えがヒントから距離 d にあれば約 2·log₂(d) 回で済みます。マージ中は「片方の並びから連続して何個も勝つ」ことがよくあり、そのときに一気に読み飛ばせます。
- **最悪でも二分探索と大差ない**: 倍々に広げるので、どんなに遠くても範囲を見つけるまでの回数は対数で抑えられます。
- **`<` だけで書く**: Python のソートは `__lt__`（小なり）だけを使う約束です。そのため「等しいか」は `<` の組み合わせで判断しています。左右どちらの端を返すかで比較の向きが変わるので、作者はあえてほぼ同じ形の `gallop_right` を別関数として書いています（直後のコメントにその理由があります）。
- **オーバーフローへの配慮**: `ofs*2+1` が整数の上限を超えないことを `assert(ofs <= (PY_SSIZE_T_MAX - 1) / 2)` で確かめています。
- **エラー処理の一本化**: 比較で例外が起きれば `IFLT` が `goto fail` で飛び、`-1` を返します。どの比較で失敗しても後始末が 1 か所にまとまっています。

## まとめ

- 歩幅を 1, 3, 7, 15… と倍々に広げると、答えのある範囲を対数回で見つけられる（指数探索）。
- 範囲が見つかったら、その中だけを二分探索すればよい。
- ヒントが当たっているほど比較が減るので、データに偏りがあるマージで特に効く。
- C では `goto` とマクロでエラー処理を簡潔にまとめる書き方がよく使われる。
