---
title: 似ている単語を、類似度の高い順に最大 n 個選ぶ
description: difflib.get_close_matches は、候補の中から、指定した単語に似ているものを類似度の高い順に返す。計算を軽くする簡易チェックで、早い段階で候補を捨てる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/difflib.py
lines: [667, 715]
function: get_close_matches
difficulty: 3
format: 2
tags: [文字列処理, 探索, アルゴリズム]
---

## ひとことで

`get_close_matches(word, possibilities)` は、**候補の中から `word` に似ているものを、似ている順に最大 3 個（既定値）返す** 関数です。
`get_close_matches("appel", ["ape", "apple", "peach", "puppy"])` は `['apple', 'ape']` を返します。タイプミスの候補を出すときに便利です。

## コード

::: code-group

```python:line-numbers=667 [日本語訳]
def get_close_matches(word, possibilities, n=3, cutoff=0.6, *, autojunk=True):
    """SequenceMatcher を使い、「十分に近い」一致のうち最良のものを返す。

    word is a sequence for which close matches are desired (typically a
    string).

    possibilities is a list of sequences against which to match word
    (typically a list of strings).

    Optional arg n (default 3) is the maximum number of close matches to
    return.  n must be > 0.

    Optional arg cutoff (default 0.6) is a float in [0, 1].  Possibilities
    that don't score at least that similar to word are ignored.

    The best (no more than n) matches among the possibilities are returned
    in a list, sorted by similarity score, most similar first.

    >>> get_close_matches("appel", ["ape", "apple", "peach", "puppy"])
    ['apple', 'ape']
    >>> import keyword as _keyword
    >>> get_close_matches("wheel", _keyword.kwlist)
    ['while']
    >>> get_close_matches("Apple", _keyword.kwlist)
    []
    >>> get_close_matches("accept", _keyword.kwlist)
    ['except']
    """

    if not n >  0:
        raise ValueError("n must be > 0: %r" % (n,))
    if not 0.0 <= cutoff <= 1.0:
        raise ValueError("cutoff must be in [0.0, 1.0]: %r" % (cutoff,))
    result = []
    s = SequenceMatcher(autojunk=autojunk)
    s.set_seq2(word)
    for x in possibilities:
        s.set_seq1(x)
        if s.real_quick_ratio() < cutoff or s.quick_ratio() < cutoff:
            continue

        ratio = s.ratio()
        if ratio >= cutoff:
            result.append((ratio, x))

    # 点数の高いものを先頭へ移す
    result = _nlargest(n, result)
    # 上位 n 個の点数を取り除く
    return [x for score, x in result]
```

```python:line-numbers=667 [原文]
def get_close_matches(word, possibilities, n=3, cutoff=0.6, *, autojunk=True):
    """Use SequenceMatcher to return list of the best "good enough" matches.

    word is a sequence for which close matches are desired (typically a
    string).

    possibilities is a list of sequences against which to match word
    (typically a list of strings).

    Optional arg n (default 3) is the maximum number of close matches to
    return.  n must be > 0.

    Optional arg cutoff (default 0.6) is a float in [0, 1].  Possibilities
    that don't score at least that similar to word are ignored.

    The best (no more than n) matches among the possibilities are returned
    in a list, sorted by similarity score, most similar first.

    >>> get_close_matches("appel", ["ape", "apple", "peach", "puppy"])
    ['apple', 'ape']
    >>> import keyword as _keyword
    >>> get_close_matches("wheel", _keyword.kwlist)
    ['while']
    >>> get_close_matches("Apple", _keyword.kwlist)
    []
    >>> get_close_matches("accept", _keyword.kwlist)
    ['except']
    """

    if not n >  0:
        raise ValueError("n must be > 0: %r" % (n,))
    if not 0.0 <= cutoff <= 1.0:
        raise ValueError("cutoff must be in [0.0, 1.0]: %r" % (cutoff,))
    result = []
    s = SequenceMatcher(autojunk=autojunk)
    s.set_seq2(word)
    for x in possibilities:
        s.set_seq1(x)
        if s.real_quick_ratio() < cutoff or s.quick_ratio() < cutoff:
            continue

        ratio = s.ratio()
        if ratio >= cutoff:
            result.append((ratio, x))

    # Move the best scorers to head of list
    result = _nlargest(n, result)
    # Strip scores for the best n matches
    return [x for score, x in result]
```

:::

`SequenceMatcher` は、2 つの文字列の似ている度合いを計算するクラスです。`_nlargest` は、`heapq.nlargest` と同じ働きをする関数です。

## 前提知識

- **類似度（ratio）**: 0 から 1 までの値で、1 に近いほど似ています。`SequenceMatcher` が、一致する部分の長さから計算します。
- **`cutoff`**: 類似度がこの値未満の候補を、捨てるための基準です。既定値は 0.6 です。
- **`set_seq2`**: 比べる基準の文字列を、先に登録しておく関数です。何度も同じ文字列と比べるときに、準備の時間を節約できます。
- **`nlargest`**: 大きいほうから n 個を取り出す関数です。

## 何をしているか

### 1. 引数を確かめる

```python:line-numbers=696
    if not n >  0:
        raise ValueError("n must be > 0: %r" % (n,))
    if not 0.0 <= cutoff <= 1.0:
        raise ValueError("cutoff must be in [0.0, 1.0]: %r" % (cutoff,))
```

`n` は 1 以上、`cutoff` は 0 から 1 の間でなければなりません。範囲外ならエラーにします。

### 2. 基準の文字列を登録する

```python:line-numbers=700
    result = []
    s = SequenceMatcher(autojunk=autojunk)
    s.set_seq2(word)
```

`SequenceMatcher` を作り、`word` を `set_seq2` で登録します。候補ごとに比べるとき、基準側の準備を何度もしなくて済みます。

### 3. 候補を安く除外してから、正確に比べる

```python:line-numbers=703
    for x in possibilities:
        s.set_seq1(x)
        if s.real_quick_ratio() < cutoff or s.quick_ratio() < cutoff:
            continue

        ratio = s.ratio()
        if ratio >= cutoff:
            result.append((ratio, x))
```

候補ごとに `real_quick_ratio` と `quick_ratio` で、類似度の上限を素早く調べます。上限が `cutoff` に届かなければ、正確な `ratio` は求めずに捨てます。残った候補だけ、正確な類似度を計算します。

### 4. 上位 n 個を選ぶ

```python:line-numbers=711

    # 点数の高いものを先頭へ移す
    result = _nlargest(n, result)
    # 上位 n 個の点数を取り除く
    return [x for score, x in result]
```

`(類似度, 候補)` の組を、`_nlargest` で大きいほうから n 個取り出します。最後に、類似度を捨てて候補だけを返します。

## ここがすごい

### 重い計算の前に、軽い計算で捨てる

正確な類似度は、計算に時間がかかります。上限の計算は軽いので、先に調べて明らかに無理な候補を捨てています。上限は、実際の類似度を超えないことが保証されています。そのため、上限で捨てた候補は、正確に比べても `cutoff` に届かないので、結果は変わりません。

### 基準の文字列を 1 回だけ準備する

`set_seq2` で基準を先に登録すると、候補を変えるたびに基準の情報を作り直さずに済みます。

### 点数で並べて、点数を捨てる

内部では `(点数, 候補)` の組として扱い、最後に候補だけを返します。並べ替えの仕組みと、結果の形を、きれいに分けています。

## まとめ

- 似ているものを探すには、軽い上限チェックで候補を減らしてから、正確な比較をする。
- 基準を先に登録しておくと、何度も比べるときに無駄が減る。
- 内部の点数は、並べ替えが終わったら取り除くと、結果の形が分かりやすい。
