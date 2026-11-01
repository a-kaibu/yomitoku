---
title: 共通のインデントを、最小と最大の 2 行だけ比べて取り除く
description: textwrap.dedent は、複数行の文字列からすべての行に共通する先頭の空白を取り除く。全行を比べず、辞書順の最小と最大の行だけで共通部分を求めている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [416, 444]
function: dedent
difficulty: 2
tags: [文字列処理, アルゴリズム, 標準ライブラリ]
---
## ひとことで

`dedent` は、複数行の文字列の **すべての行に共通している先頭の空白（インデント）を取り除く** 関数です。
コードの中で三重引用符の文字列を字下げして書いたときに、その字下げを消すのによく使われます。
`"    a\n      b\n    c"` は `"a\n  b\nc"` になります。

## コード

```python:line-numbers=416
def dedent(text):
    """Remove any common leading whitespace from every line in `text`.

    This can be used to make triple-quoted strings line up with the left
    edge of the display, while still presenting them in the source code
    in indented form.

    Note that tabs and spaces are both treated as whitespace, but they
    are not equal: the lines "  hello" and "\\thello" are
    considered to have no common leading whitespace.

    Entirely blank lines are normalized to a newline character.
    """
    try:
        lines = text.split('\n')
    except (AttributeError, TypeError):
        msg = f'expected str object, not {type(text).__qualname__!r}'
        raise TypeError(msg) from None

    # Get length of leading whitespace, inspired by ``os.path.commonprefix()``.
    non_blank_lines = [l for l in lines if l and not l.isspace()]
    l1 = min(non_blank_lines, default='')
    l2 = max(non_blank_lines, default='')
    margin = 0
    for margin, c in enumerate(l1):
        if c != l2[margin] or c not in ' \t':
            break

    return '\n'.join([l[margin:] if not l.isspace() else '' for l in lines])
```

## 前提知識

- **`text.split('\n')`**: 文字列を改行で区切って、行のリストにします。
- **`l.isspace()`**: 文字列がすべて空白文字ならば真です。空文字列 `''` では偽になります。
- **`min(..., default='')`**: 最小のものを返します。並びが空なら `default` の値を返します。
- **文字列の大小比較**: 文字列は先頭の文字から順に比べられます（辞書順）。空白（`' '`、文字コード 32）やタブ（`'\t'`、9）は、英数字より小さい文字です。
- **`enumerate(l1)`**: 文字列の各文字を、その位置の番号と一緒に取り出します。
- **`l[margin:]`**: 文字列の `margin` 文字目以降を取り出します。
- **ループ変数はループ後も残る**: Python では、`for` を抜けたあとも、ループ変数は最後の値のまま使えます。

## 何をしているか

```
text = "    def f():\n        return 1\n\n    # end"
```

### 1. 行に分ける（429〜433 行目）

`split` できない（文字列でない）ものが渡されたら、型名を入れたエラーにします。

### 2. 空白だけの行を除いて、最小と最大を選ぶ（436〜438 行目）

空行を除くと `"    def f():"`, `"        return 1"`, `"    # end"` の 3 行です。辞書順で比べると、

- 最小 `l1`: `"        return 1"`（5 文字目が空白で、`d` や `#` より小さい）
- 最大 `l2`: `"    def f():"`

### 3. 2 行の共通の先頭空白を数える（439〜442 行目）

先頭から 1 文字ずつ比べ、「違う文字が出た」か「空白・タブ以外の文字が出た」ところで止めます。4 文字目（`margin = 4`）で `' '` と `'d'` が違うので止まり、共通のインデントは 4 文字です。

### 4. 各行から取り除く（444 行目）

すべての行から先頭 4 文字を取り除きます。空白だけの行は `''` にそろえます。結果は `"def f():\n    return 1\n\n# end"` です。

## ここがすごい

### 両端の 2 行だけで十分

全行に共通する先頭部分は、**辞書順の最小の行と最大の行の共通先頭部分に等しい** という性質を使っています（435 行目のコメントにある通り、`os.path.commonprefix()` と同じ発想）。辞書順で間に挟まれた行は、両端が共有する先頭を必ず持っているからです。
そのため、n 行の文字列でも、`min` と `max`（どちらも C で書かれていて速い）で 2 行を選び、その 2 行を 1 回比べるだけで済みます。

### 「空白でなくなったら止める」条件も同時に

2 行の共通先頭部分には、インデントだけでなく文字が含まれることもあります（例: どの行も `"  # "` で始まる）。441 行目の `c not in ' \t'` で、空白・タブ以外が出たらそこで止めるので、インデントより先は削りません。

### タブと空白を勝手に同一視しない

docstring（423〜425 行目）にある通り、タブと空白は別の文字として比べます。見た目の幅で揃えようとすると、タブの幅（4 か 8 か）という決めごとが必要になってしまいます。文字そのものを比べるので、結果が環境によって変わりません。

### ループ変数の値をそのまま使う

`margin = 0` で初期化してからループに入り、`break` した時点の `margin` を使います。1 文字も一致しない場合や `l1` が空の場合も、`margin` は 0 のまま正しく動きます。

## まとめ

- 「全体の共通先頭部分」は、辞書順の最小と最大の 2 つを比べれば求まる。
- 組み込みの `min`・`max` は速いので、比較の総当たりを避ける道具になる。
- 空白とタブのような「似ているが違うもの」を、勝手に同じ扱いにしない設計も大事。
