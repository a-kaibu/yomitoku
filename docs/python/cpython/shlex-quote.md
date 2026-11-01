---
title: シングルクォートの中にシングルクォートを入れる、シェルの抜け道
description: shlex.quote は、文字列をシェルのコマンドに安全に埋め込める形に変換する。' を '"'"' に置き換えるという、シェルの規則を突いた書き方がおもしろい。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/shlex.py
lines: [320, 344]
function: quote
difficulty: 2
format: 2
tags: [文字列処理, セキュリティ, ハック, 標準ライブラリ]
---

## ひとことで

`shlex.quote(s)` は、文字列 `s` を **シェル（コマンドを解釈するプログラム）に安全に渡せる形** に変換する関数です。
`quote("my file.txt")` は `'my file.txt'` に、`quote("it's")` は `'it'"'"'s'` になります。
ファイル名などをコマンド文字列に埋め込むとき、空白や記号のせいで意図しないコマンドが実行される事故（コマンドインジェクション）を防ぎます。

## コード

::: code-group

```python:line-numbers=320 [日本語訳]
def quote(s, *, force=False):
    """シェルで安全にエスケープした文字列 *s* を返す。

    *force* が *True* のときは、*s* を
    シェルでそのまま使える安全な文字列であっても無条件にクォートする。
    """
    if not s:
        return "''"

    if not isinstance(s, str):
        raise TypeError(f"expected string object, got {type(s).__name__!r}")

    # 速度のため bytes.translate() を使う
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
    # force でないなら、クォートが必要かどうかを確かめる
    # `s` が ASCII 文字だけで、`safe_chars` の文字だけからなるなら
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s

    # シングルクォートで囲み、中の `'` はダブルクォートで囲んで表す
    # たとえば $'b という文字列は '$'"'"'b' とクォートされる
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

```python:line-numbers=320 [原文]
def quote(s, *, force=False):
    """Return a shell-escaped version of the string *s*.

    If *force* is *True*, then *s* is unconditionally quoted,
    even if it is already safe for a shell without being quoted.
    """
    if not s:
        return "''"

    if not isinstance(s, str):
        raise TypeError(f"expected string object, got {type(s).__name__!r}")

    # Use bytes.translate() for performance
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
    # No quoting is needed if we are not forcing quoting
    # and `s` is an ASCII string consisting only of `safe_chars`.
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s

    # use single quotes, and put single quotes into double quotes
    # the string $'b is then quoted as '$'"'"'b'
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

:::

## 前提知識

- **シェルの特殊文字**: シェルでは空白で引数が区切られ、`;`、`|`、`$`、`*` などが特別な意味を持ちます。`rm $file` の `file` が `a; rm -rf ~` だったら大変です。
- **シングルクォート**: シェルでは `'...'` で囲んだ中身は、**どんな文字もそのまま** の文字として扱われます。ただし、中に `'` 自体を書くことはできません。
- **ダブルクォート**: `"..."` の中では `$` などが展開されますが、`'` はただの文字として書けます。
- **シェルの文字列の連結**: シェルでは、クォートした部分どうしを空白なしで並べると 1 つの引数につながります。`'ab'"cd"` は `abcd` です。
- **`s.encode()`**: 文字列をバイト列に変換します。
- **`bytes.translate(None, delete=...)`**: バイト列から、指定した文字を削除したものを返します。

## 何をしているか

### 1. 空文字列を扱う

```python:line-numbers=326
    if not s:
        return "''"
```

空文字列をそのまま埋め込むと引数ごと消えてしまうので、`''`（空のクォート）を返します。

### 2. クォート不要か確認する

```python:line-numbers=333
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
    # force でないなら、クォートが必要かどうかを確かめる
    # `s` が ASCII 文字だけで、`safe_chars` の文字だけからなるなら
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s
```

`safe_chars` は、シェルで特別な意味を持たない文字（英数字と `%+,-./:=@_`）です。`s` が ASCII 文字だけで、`safe_chars` を全部削除したら何も残らない、つまり **安全な文字だけでできている** なら、そのまま返します。`quote("file.txt")` は `file.txt` のままです。

### 3. シングルクォートで囲む

```python:line-numbers=342
    # シングルクォートで囲み、中の `'` はダブルクォートで囲んで表す
    # たとえば $'b という文字列は '$'"'"'b' とクォートされる
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

それ以外は全体を `'...'` で囲みます。中に `'` がある場合は `'"'"'` に置き換えます。`it's` なら、

```
'it'  "'"  's'
```

と 3 つの部分に分かれます。1 つ目でクォートを閉じ、2 つ目でダブルクォートの中に `'` を入れ、3 つ目で再びシングルクォートを開きます。シェルはこれらを空白なしで連結し、1 つの引数 `it's` として受け取ります。

## ここがすごい

### 「何もかもそのまま」なシングルクォートを使う

シェルのエスケープ規則は複雑で、ダブルクォートの中でも `$`、`` ` ``、`\` などは特別扱いされます。それぞれに `\` を付ける方式だと、漏れがあれば即座に事故につながります。
シングルクォートの中では **例外なくすべての文字が文字どおり** なので、気にすべき文字は `'` ただ 1 つになります。安全性を「規則の少なさ」で確保している設計です。

### `'` だけは「いったん外に出る」

シングルクォートの中に `'` を書く方法はありません。そこで、クォートを閉じ、`"'"` で `'` だけを別に書き、またクォートを開く、という連結のトリックを使っています。ほかの記号はすべてシングルクォートの中に入ったままです。

### 速い判定に `bytes.translate` を使う

「安全な文字だけか」は、正規表現や 1 文字ずつのループでも判定できます。ここでは C で実装された `bytes.translate` で安全な文字を一括削除し、「何か残ったか」で判定しています。`isascii()` で先にふるい落としているので、`encode()` の結果は元の文字列と 1 対 1 に対応します。

### 不要なクォートを付けない

安全な文字列はそのまま返すので、生成されたコマンドが読みやすくなります。`force=True` を渡せば常にクォートすることもできます。

## まとめ

- シェルに文字列を渡すときは、規則が単純なシングルクォートで囲むのが安全。
- シングルクォート自体は `'"'"'` で「外に出て入り直す」ことで表せる。
- 「安全な文字だけか」の判定は、許可リストの文字を削除して空になるかで調べられる。
