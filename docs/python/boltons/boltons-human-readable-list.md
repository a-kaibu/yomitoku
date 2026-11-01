---
title: 項目を「A, B, and C」のように、自然な英語の並びにする
description: boltons.strutils.human_readable_list は、文字列のリストを、区切り文字と接続語（and など）を使って読みやすい 1 文にする。要素が 1 つ、2 つ、3 つ以上で形を変え、オックスフォードコンマの有無も選べる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [1317, 1344]
function: human_readable_list
difficulty: 2
format: 2
tags: [文字列処理, 可読性, イディオム]
---

## ひとことで

`human_readable_list(items)` は、**文字列のリストを、人が読みやすい 1 つの文にする** 関数です。
`human_readable_list(['apples', 'pears', 'plums'])` は `'apples, pears, and plums'` を返します。要素の数に応じて、区切りの形を変えます。

## コード

::: code-group

```python:line-numbers=1317 [日本語訳]
def human_readable_list(items: typing.Sequence[str], delimiter: str = ',', conjunction: str = 'and', *, oxford: bool = True) -> str:
    """
    文字列のリストを、区切り文字と接続語を付けた読みやすい文字列にして返す。
    appropriate delimiters and the conjunction word.

    Args:
        items: The list of strings to join.
        delimiter (optional): The delimiter to use between items.
        conjunction (optional): The word to use before the last item.
        oxford (optional): Whether to use the Oxford comma/delimiter before
            the conjunction in lists of 3+ items.

    Returns:
        str: The human readable string.
    """
    if not items:
        return ''

    delimiter = delimiter and delimiter.strip() + ' '
    conjunction = conjunction.strip()

    if len(items) == 1:
        return items[0]

    if len(items) == 2:
        return f'{items[0]} {conjunction} {items[1]}'

    return f'{delimiter.join(items[:-1])}{delimiter if oxford else " "}{conjunction} {items[-1]}'
```

```python:line-numbers=1317 [原文]
def human_readable_list(items: typing.Sequence[str], delimiter: str = ',', conjunction: str = 'and', *, oxford: bool = True) -> str:
    """
    Given a list of strings, return a human readable string with
    appropriate delimiters and the conjunction word.

    Args:
        items: The list of strings to join.
        delimiter (optional): The delimiter to use between items.
        conjunction (optional): The word to use before the last item.
        oxford (optional): Whether to use the Oxford comma/delimiter before
            the conjunction in lists of 3+ items.

    Returns:
        str: The human readable string.
    """
    if not items:
        return ''

    delimiter = delimiter and delimiter.strip() + ' '
    conjunction = conjunction.strip()

    if len(items) == 1:
        return items[0]

    if len(items) == 2:
        return f'{items[0]} {conjunction} {items[1]}'

    return f'{delimiter.join(items[:-1])}{delimiter if oxford else " "}{conjunction} {items[-1]}'
```

:::

## 前提知識

- **オックスフォードコンマ**: 3 つ以上を並べるとき、最後の接続語の前にも区切り（`,`）を付ける書き方です。`a, b, and c` のように書きます。
- **接続語（conjunction）**: `and` や `or` など、最後の要素の前に置く言葉です。
- **区切り文字（delimiter）**: 要素どうしを分ける記号です。既定は `,` です。
- **`strip()`**: 前後の空白を取り除きます。

## 何をしているか

### 1. 空と 1 つの場合

```python:line-numbers=1332
    if not items:
        return ''

    delimiter = delimiter and delimiter.strip() + ' '
    conjunction = conjunction.strip()

    if len(items) == 1:
        return items[0]
```

空なら空文字列を返します。要素が 1 つなら、その要素だけを返します。

### 2. 2 つの場合

```python:line-numbers=1341
    if len(items) == 2:
        return f'{items[0]} {conjunction} {items[1]}'
```

2 つのときは、区切りを使わず、`A and B` の形にします。英語では `A, and B` とはしないからです。

### 3. 3 つ以上の場合

```python:line-numbers=1344
    return f'{delimiter.join(items[:-1])}{delimiter if oxford else " "}{conjunction} {items[-1]}'
```

最後の 1 つ以外を区切りでつなぎ、そのあとに区切り（オックスフォードコンマ）か空白を入れ、接続語と最後の要素を続けます。`oxford=False` なら、区切りを使わずに空白だけになります。

## ここがすごい

### 要素の数で形を変える

1 つ、2 つ、3 つ以上で、英語として自然な形が違います。その違いを 3 つの `if` で表しています。呼ぶ側は、リストの長さを気にしなくて済みます。

### 好みに合わせて区切りを変えられる

オックスフォードコンマを使うかどうか、区切り文字は何か、接続語は何か、を引数で選べます。日本語の `、` や `または` のように、別の言語の書き方にも近づけられます。

### 空白の扱いを先に整える

`delimiter.strip() + ' '` で、区切り文字に空白を 1 つ付けた形を作っておきます。結果の空白が、いつも同じ形になるように工夫しています。

## まとめ

- 項目の並びを自然な文にするには、要素の数によって形を分ける。
- 英語らしい書き方（オックスフォードコンマなど）は、引数で選べるようにすると便利。
- 区切り文字は、先に空白を整えておくと、出力の形がそろう。
