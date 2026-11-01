---
title: ワイルドカードの記号を、角かっこで囲んで文字として扱う
description: glob.escape は、パスに含まれる * ? [ を、角かっこで囲んで普通の文字に変える。ドライブ文字の部分は対象外にする。検索パターンに、ユーザーの入力をそのまま使うときに役立つ。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/glob.py
lines: [261, 271]
function: escape
difficulty: 2
format: 2
tags: [ファイル, 文字列処理, 正規表現]
---

## ひとことで

`glob.escape(pathname)` は、パスの中の **ワイルドカードの記号（`*`、`?`、`[`）を、普通の文字として扱えるように変える** 関数です。
`glob.escape('report[2026]*.txt')` は `'report[[]2026]][*].txt'` のように、記号を角かっこで囲んだ文字列を返します。

## コード

::: code-group

```python:line-numbers=261 [日本語訳]
def escape(pathname):
    """すべての特殊文字をエスケープする。
    """
    # エスケープは、"*?[" のいずれかを角かっこ [] で囲んで行う。
    # ドライブ部分ではメタ文字は働かないので、エスケープしない。
    drive, pathname = os.path.splitdrive(pathname)
    if isinstance(pathname, bytes):
        pathname = magic_check_bytes.sub(br'[\1]', pathname)
    else:
        pathname = magic_check.sub(r'[\1]', pathname)
    return drive + pathname
```

```python:line-numbers=261 [原文]
def escape(pathname):
    """Escape all special characters.
    """
    # Escaping is done by wrapping any of "*?[" between square brackets.
    # Metacharacters do not work in the drive part and shouldn't be escaped.
    drive, pathname = os.path.splitdrive(pathname)
    if isinstance(pathname, bytes):
        pathname = magic_check_bytes.sub(br'[\1]', pathname)
    else:
        pathname = magic_check.sub(r'[\1]', pathname)
    return drive + pathname
```

:::

`magic_check` は、ワイルドカードの記号を探す正規表現です。`splitdrive` は、Windows のドライブ文字（`C:` など）とそれ以外の部分を分ける関数です。

## 前提知識

- **ワイルドカード**: `*` は任意の文字列、`?` は任意の 1 文字、`[...]` は括弧内のどれか 1 文字を表します。
- **角かっこでの囲み**: `[*]` は「`*` という文字 1 つ」を表します。記号を囲むと、ワイルドカードの働きが消えます。
- **ドライブ部分**: Windows では `C:` のような部分が先頭に付きます。ここにはワイルドカードが働かないので、触りません。
- **`glob`**: パターンに合うファイル名を探す関数です。

## 何をしているか

### 1. ドライブ部分と残りを分ける

```python:line-numbers=266
    drive, pathname = os.path.splitdrive(pathname)
```

`os.path.splitdrive` で、先頭のドライブ部分と、残りのパスに分けます。Unix 系では、ドライブ部分は空になります。

### 2. 記号を角かっこで囲む

```python:line-numbers=267
    if isinstance(pathname, bytes):
        pathname = magic_check_bytes.sub(br'[\1]', pathname)
    else:
        pathname = magic_check.sub(r'[\1]', pathname)
```

バイト列と文字列で、それぞれの記号検索を使い分けます。見つけた `*`、`?`、`[` を `[\1]` の形で囲みます。`\1` は、見つけた記号そのものを表します。

### 3. ドライブ部分を戻す

```python:line-numbers=271
    return drive + pathname
```

エスケープしたパスの前に、最初に分けておいたドライブ部分をつなげて返します。

## ここがすごい

### 検索パターンを安全に作れる

ユーザーが入力した文字列を、そのままパターンに使うと、意図しない範囲のファイルが一致することがあります。エスケープしておけば、入力どおりの名前だけを探せます。

### 記号だけを正確に狙う

`magic_check` の正規表現は、記号だけを探します。文字列全体を作り直す必要がないので、通常の文字はそのまま残ります。

### ドライブを例外にする理由

コメントにあるとおり、ドライブ部分ではワイルドカードが働きません。働かない場所を囲んでも意味がなく、結果が分かりにくくなるので、先に分けて除いています。

## まとめ

- ワイルドカードの記号は、角かっこで囲むと普通の文字になる。
- 外から入ってきたパスは、検索に使う前にエスケープすると安全。
- 働かない部分（ドライブ）は、処理の対象から除くと読みやすい。
