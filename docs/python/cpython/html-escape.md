---
title: 「& を最初に置き換える」順番がすべての HTML エスケープ
description: html.escape は、文字列を HTML に安全に埋め込めるよう、< や & を &lt; や &amp; に置き換える。わずか数行だが、置き換える順番に大事な意味がある。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/html/__init__.py
lines: [12, 25]
function: escape
difficulty: 1
format: 2
tags: [文字列処理, セキュリティ, 標準ライブラリ]
---

## ひとことで

`html.escape(s)` は、文字列を **HTML の中に安全に埋め込めるように変換する** 関数です。
`escape("<b>Tom & Jerry</b>")` は `&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;` になります。
ブラウザに表示される見た目は元の文字のままで、タグとしては解釈されなくなります。

## コード

::: code-group

```python:line-numbers=12 [日本語訳]
def escape(s, quote=True):
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.
    If the optional flag quote is true (the default), the quotation mark
    characters, both double quote (") and single quote (') characters are also
    translated.
    """
    s = s.replace("&", "&amp;") # 必ず最初に行うこと！
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
    return s
```

```python:line-numbers=12 [原文]
def escape(s, quote=True):
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.
    If the optional flag quote is true (the default), the quotation mark
    characters, both double quote (") and single quote (') characters are also
    translated.
    """
    s = s.replace("&", "&amp;") # Must be done first!
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
    return s
```

:::

## 前提知識

- **HTML の特殊文字**: `<` と `>` はタグの始まりと終わり、`&` は「文字参照」（`&lt;` のような書き方）の始まり、`"` と `'` は属性値の区切りです。
- **文字参照**: `&lt;` は `<`、`&gt;` は `>`、`&amp;` は `&`、`&quot;` は `"`、`&#x27;` は `'` を表す HTML の書き方です。
- **`s.replace(a, b)`**: 文字列の中の `a` をすべて `b` に置き換えた **新しい文字列** を返します（元の文字列は変わりません）。
- **デフォルト引数 `quote=True`**: 省略すると引用符も置き換えます。
- **XSS（クロスサイトスクリプティング）**: 利用者が入力した文字列をそのまま HTML に出すと、`<script>` などを埋め込まれて、他人のブラウザで悪意あるプログラムが動いてしまう攻撃です。

## 何をしているか

`s = 'a < b & "c"'` で追います。

### 1. `&` を最初に置き換える

```python:line-numbers=19
    s = s.replace("&", "&amp;") # 必ず最初に行うこと！
```

`'a < b &amp; "c"'` になります。

### 2. `<` と `>` を置き換える

```python:line-numbers=20
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
```

`'a &lt; b &amp; "c"'` になります。

### 3. 引用符を置き換える

```python:line-numbers=22
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
```

`quote=True` なので、`'a &lt; b &amp; &quot;c&quot;'` になります。

## ここがすごい

### 順番を間違えると壊れる

最初の置き換えのコメント「必ず最初に行うこと！」がこの関数の要です。もし `<` を先に置き換えると、

1. `'a < b'` → `'a &lt; b'`
2. `&` を置き換える → `'a &amp;lt; b'`

となり、ブラウザには `&lt;` という文字列がそのまま表示されてしまいます。置き換えで **新しく作った `&`** まで、あとの置き換えの対象になってしまうからです。
`&` を最初に置き換えれば、その後に作られる `&lt;` などの `&` が再び置き換えられることはありません。「置き換えの結果に、置き換え前の文字が含まれる」場合は、その文字を最初に処理する、という一般的な教訓です。

### `'` は `&#x27;` にする

`'` には `&apos;` という名前もありますが、古い HTML（HTML 4）では定義されていませんでした。数値で書く `&#x27;` なら、どの HTML でも確実に解釈されます。

### 属性値にも使える

`quote=True` がデフォルトなので、`<a title="...">` のような属性値の中に埋め込んでも、`"` で属性を閉じられて別の属性を追加される、といった攻撃を防げます。安全な方をデフォルトにしているのは、セキュリティに関わる関数らしい設計です。

### `replace` の連続は意外と速い

1 文字ずつ見て辞書で変換する方法もありますが、`str.replace` は C で書かれていて非常に速いので、5 回呼んでも Python のループより速いことがほとんどです。読みやすさと速さを両立しています。

## まとめ

- HTML に文字列を埋め込むときは、`& < > " '` をエスケープする。
- 置き換え結果に置き換え対象の文字が含まれるなら、その文字を最初に置き換える。
- セキュリティに関わる関数は、安全な挙動をデフォルトにする。
