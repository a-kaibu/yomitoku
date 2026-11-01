---
title: 英単語を、綴りの規則で単数形から複数形にする
description: boltons の pluralize は、英単語を単数形から複数形に変える。不規則な変化の表を先に調べ、語尾が子音 + y なら ies、s・x・z・ch・sh なら es、それ以外は s を付ける。元の大文字小文字の形も保つ。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [242, 265]
function: pluralize
difficulty: 3
format: 2
tags: [文字列処理, アルゴリズム]
---

## ひとことで

`pluralize(word)` は、**英単語の単数形を、綴りの規則に従って複数形にする** 関数です。
`pluralize('friend')` は `friends`、`pluralize('enemy')` は `enemies` を返します。英語の辞書を持たなくても、多くの単語を正しく変えられます。

## コード

::: code-group

```python:line-numbers=242 [日本語訳]
def pluralize(word):
    """英単語 *word* を、単数形から複数形に、ある程度賢く変換する。
    大文字小文字の形を保つ。

    >>> pluralize('friend')
    'friends'
    >>> pluralize('enemy')
    'enemies'
    >>> pluralize('Sheep')
    'Sheep'
    """
    orig_word, word = word, word.strip().lower()
    if not word or word in _IRR_P2S:
        return orig_word
    irr_plural = _IRR_S2P.get(word)
    if irr_plural:
        plural = irr_plural
    elif word.endswith('y') and word[-2:-1] not in 'aeiou':
        plural = word[:-1] + 'ies'
    elif word[-1] in 'sxz' or word.endswith('ch') or word.endswith('sh'):
        plural = word if word.endswith('es') else word + 'es'
    else:
        plural = word + 's'
    return _match_case(orig_word, plural)
```

```python:line-numbers=242 [原文]
def pluralize(word):
    """Semi-intelligently converts an English *word* from singular form to
    plural, preserving case pattern.

    >>> pluralize('friend')
    'friends'
    >>> pluralize('enemy')
    'enemies'
    >>> pluralize('Sheep')
    'Sheep'
    """
    orig_word, word = word, word.strip().lower()
    if not word or word in _IRR_P2S:
        return orig_word
    irr_plural = _IRR_S2P.get(word)
    if irr_plural:
        plural = irr_plural
    elif word.endswith('y') and word[-2:-1] not in 'aeiou':
        plural = word[:-1] + 'ies'
    elif word[-1] in 'sxz' or word.endswith('ch') or word.endswith('sh'):
        plural = word if word.endswith('es') else word + 'es'
    else:
        plural = word + 's'
    return _match_case(orig_word, plural)
```

:::

## 前提知識

- **複数形**: 2 つ以上を表す単語の形です。英語では多くの場合、語尾に `s` や `es` を付けます。
- **不規則変化**: `person` → `people` のように、規則では作れない形です。表で持つ必要があります。
- **子音と母音**: `a`、`e`、`i`、`o`、`u` が母音で、それ以外が子音です。`y` の前が子音かどうかで変化が変わります。
- **大文字小文字の形**: 元の単語が大文字なら、答えも大文字にそろえる必要があります。

## 何をしているか

### 1. 元の形を覚えて、小文字にそろえる

```python:line-numbers=253
    orig_word, word = word, word.strip().lower()
```

元の単語を `orig_word` に残し、判定には小文字の `word` を使います。最後に大文字小文字を元に戻すので、この 2 つを分けて持っています。

### 2. 変化しない語と、不規則な語を調べる

```python:line-numbers=254
    if not word or word in _IRR_P2S:
        return orig_word
    irr_plural = _IRR_S2P.get(word)
    if irr_plural:
        plural = irr_plural
```

空の語や、複数形と同じ形の語（`sheep` など）は、そのまま返します。不規則な語は、表から正しい形を取り出します。

### 3. 規則で変化させる

```python:line-numbers=259
    elif word.endswith('y') and word[-2:-1] not in 'aeiou':
        plural = word[:-1] + 'ies'
    elif word[-1] in 'sxz' or word.endswith('ch') or word.endswith('sh'):
        plural = word if word.endswith('es') else word + 'es'
    else:
        plural = word + 's'
```

語尾が子音と `y` なら `ies` に、`s`・`x`・`z`・`ch`・`sh` なら `es` に変えます。それ以外は `s` を付けます。`word[-2:-1] not in 'aeiou'` で、`y` の前が子音かを確かめています。

### 4. 大文字小文字の形を戻す

```python:line-numbers=265
    return _match_case(orig_word, plural)
```

`_match_case` で、元の単語と同じ大文字小文字の形に直します。`SHEEP` なら `SHEEP` のまま、`Friend` なら `Friends` になります。

## ここがすごい

### 規則と例外を分けている

ほとんどの単語は、語尾を見る 3 つの規則で変えられます。例外だけを表にまとめるので、規則を増やしても表は短く済みます。

### 元の形を覚えて、最後に戻す

判定を小文字で行い、最後に大文字小文字を戻します。大文字の単語も、判定の条件を書き直さずに扱えます。

### 変化しない語を先に返す

`sheep` や `series` のように、単数形と複数形が同じ語は、最初の分岐で返します。規則を当てると誤った形になるので、先に除く設計になっています。

## まとめ

- 英単語の複数形は、語尾の綴りを見る規則と、不規則な表で決められる。
- 判定は小文字で行い、大文字小文字は最後に元の形へ戻す。
- 変化しない語は、規則より先に除くと誤変換を防げる。
