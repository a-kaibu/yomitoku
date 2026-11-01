---
title: 文字列や UUID が正しいか、バージョンも含めて確かめる
description: boltons.strutils.is_uuid は、引数が正しい UUID の文字列か、UUID オブジェクトかを調べる。uuid.UUID に渡して例外が出なければ有効とみなし、version を指定すると、そのバージョンかも確かめる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [720, 741]
function: is_uuid
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, 標準ライブラリ]
---

## ひとことで

`is_uuid(obj, version=4)` は、**引数が有効な UUID（オブジェクトまたは文字列）かどうかを調べる** 関数です。
`is_uuid('e682ccca-5a4c-4ef2-9711-73f9ad1e15ea')` は `True` を返します。`version` を指定すると、そのバージョンの UUID かどうかも確かめます。

## コード

::: code-group

```python:line-numbers=720 [日本語訳]
def is_uuid(obj, version=4):
    """引数が、正しい UUID オブジェクトか、正しい UUID の文字列かを調べる。

    Args:
        obj (object): The test target. Strings and UUID objects supported.
        version (int): The target UUID version, set to 0 to skip version check.

    >>> is_uuid('e682ccca-5a4c-4ef2-9711-73f9ad1e15ea')
    True
    >>> is_uuid('0221f0d9-d4b9-11e5-a478-10ddb1c2feb9')
    False
    >>> is_uuid('0221f0d9-d4b9-11e5-a478-10ddb1c2feb9', version=1)
    True
    """
    if not isinstance(obj, uuid.UUID):
        try:
            obj = uuid.UUID(obj)
        except (TypeError, ValueError, AttributeError):
            return False
    if version and obj.version != int(version):
        return False
    return True
```

```python:line-numbers=720 [原文]
def is_uuid(obj, version=4):
    """Check the argument is either a valid UUID object or string.

    Args:
        obj (object): The test target. Strings and UUID objects supported.
        version (int): The target UUID version, set to 0 to skip version check.

    >>> is_uuid('e682ccca-5a4c-4ef2-9711-73f9ad1e15ea')
    True
    >>> is_uuid('0221f0d9-d4b9-11e5-a478-10ddb1c2feb9')
    False
    >>> is_uuid('0221f0d9-d4b9-11e5-a478-10ddb1c2feb9', version=1)
    True
    """
    if not isinstance(obj, uuid.UUID):
        try:
            obj = uuid.UUID(obj)
        except (TypeError, ValueError, AttributeError):
            return False
    if version and obj.version != int(version):
        return False
    return True
```

:::

`uuid.UUID` は、UUID を表す標準ライブラリのクラスです。文字列を渡すと、正しい形かどうかを確かめて、UUID のオブジェクトを作ります。

## 前提知識

- **UUID**: 世界中で重ならないように作られる、128 ビットの識別子です。`8-4-4-4-12` の 16 進数の文字列で書かれることが多いです。
- **バージョン**: UUID の作り方の種類です。`4` は乱数から作られるものです。
- **`version=0`**: バージョンを確かめないことを表す値です。
- **例外による判定**: 変換を試して、失敗したら例外を捕まえる書き方です。

## 何をしているか

### 1. UUID でなければ、変換を試す

```python:line-numbers=734
    if not isinstance(obj, uuid.UUID):
        try:
            obj = uuid.UUID(obj)
        except (TypeError, ValueError, AttributeError):
            return False
```

すでに `uuid.UUID` のオブジェクトなら、そのまま使います。違うなら、`uuid.UUID(obj)` で変換を試します。変換に失敗する型や形なら、`False` を返します。

### 2. バージョンを確かめる

```python:line-numbers=739
    if version and obj.version != int(version):
        return False
```

`version` が指定されていて（0 ではなく）、UUID のバージョンが違えば、`False` を返します。

### 3. どちらも通れば有効

```python:line-numbers=741
    return True
```

変換ができて、バージョンも合っていれば、`True` を返します。

## ここがすごい

### 変換を試すのが、最も確かな判定

UUID の正しい形を正規表現で書くこともできますが、標準ライブラリの変換に任せるほうが、規則の変化にも強くなります。失敗したら、その入力は有効でないと判断します。

### 例外の種類を絞る

`TypeError`、`ValueError`、`AttributeError` だけを捕まえています。想定外のエラーは隠さずに、そのまま投げます。

### 0 でバージョンを無視できる

`version=0` にすると、バージョンの確認を飛ばします。どのバージョンでもよい場合に、呼ぶ側は 1 つの引数で済ませられます。

## まとめ

- 形式の確認は、標準の変換を試して失敗したら無効とするのが確実。
- 捕まえる例外は、想定される種類に絞ると、バグを隠さずに済む。
- 特別な値（0）で「確認しない」を表すと、関数の使い方が広がる。
