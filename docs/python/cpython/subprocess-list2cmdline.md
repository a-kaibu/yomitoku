---
title: Windows のコマンドライン規則に合わせて、引数を正しくクォートする
description: subprocess.list2cmdline は、引数のリストを Windows 用の 1 本のコマンド文字列に変換する。バックスラッシュを「あとで倍にするか決める」ためにためておく工夫がある。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/subprocess.py
lines: [697, 764]
function: list2cmdline
difficulty: 3
format: 2
tags: [文字列処理, 状態機械, 標準ライブラリ]
---

## ひとことで

`list2cmdline` は、`["python", "my file.py", 'say "hi"']` のような引数のリストを、Windows のプログラムに渡す **1 本のコマンドライン文字列** に変換する関数です。
Windows では、引数を分ける作業を各プログラム（の C ランタイム）が独自の規則で行います。その規則で読み直したときに、元のリストに正しく戻るようにクォート（`"` で囲むこと）とエスケープを付けます。

## コード

::: code-group

```python:line-numbers=697 [日本語訳]
def list2cmdline(seq):
    """
    Translate a sequence of arguments into a command line
    string, using the same rules as the MS C runtime:

    1) Arguments are delimited by white space, which is either a
       space or a tab.

    2) A string surrounded by double quotation marks is
       interpreted as a single argument, regardless of white space
       contained within.  A quoted string can be embedded in an
       argument.

    3) A double quotation mark preceded by a backslash is
       interpreted as a literal double quotation mark.

    4) Backslashes are interpreted literally, unless they
       immediately precede a double quotation mark.

    5) If backslashes immediately precede a double quotation mark,
       every pair of backslashes is interpreted as a literal
       backslash.  If the number of backslashes is odd, the last
       backslash escapes the next double quotation mark as
       described in rule 3.
    """

    # 参照元:
    # http://msdn.microsoft.com/en-us/library/17w5ykft.aspx
    # または http://msdn.microsoft.com で次を検索:
    # "Parsing C++ Command-Line Arguments"
    result = []
    needquote = False
    for arg in map(os.fsdecode, seq):
        bs_buf = []

        # 引数どうしを区切るため、この引数の前に空白を入れる
        if result:
            result.append(' ')

        needquote = (" " in arg) or ("\t" in arg) or not arg
        if needquote:
            result.append('"')

        for c in arg:
            if c == '\\':
                # まだ 2 倍にするかどうか決められないので、覚えておく
                bs_buf.append(c)
            elif c == '"':
                # 直前の \ をすべて 2 倍にする
                result.append('\\' * len(bs_buf)*2)
                bs_buf = []
                result.append('\\"')
            else:
                # ふつうの文字
                if bs_buf:
                    result.extend(bs_buf)
                    bs_buf = []
                result.append(c)

        # Add remaining backslashes, if any.
        if bs_buf:
            result.extend(bs_buf)

        if needquote:
            result.extend(bs_buf)
            result.append('"')

    return ''.join(result)
```

```python:line-numbers=697 [原文]
def list2cmdline(seq):
    """
    Translate a sequence of arguments into a command line
    string, using the same rules as the MS C runtime:

    1) Arguments are delimited by white space, which is either a
       space or a tab.

    2) A string surrounded by double quotation marks is
       interpreted as a single argument, regardless of white space
       contained within.  A quoted string can be embedded in an
       argument.

    3) A double quotation mark preceded by a backslash is
       interpreted as a literal double quotation mark.

    4) Backslashes are interpreted literally, unless they
       immediately precede a double quotation mark.

    5) If backslashes immediately precede a double quotation mark,
       every pair of backslashes is interpreted as a literal
       backslash.  If the number of backslashes is odd, the last
       backslash escapes the next double quotation mark as
       described in rule 3.
    """

    # See
    # http://msdn.microsoft.com/en-us/library/17w5ykft.aspx
    # or search http://msdn.microsoft.com for
    # "Parsing C++ Command-Line Arguments"
    result = []
    needquote = False
    for arg in map(os.fsdecode, seq):
        bs_buf = []

        # Add a space to separate this argument from the others
        if result:
            result.append(' ')

        needquote = (" " in arg) or ("\t" in arg) or not arg
        if needquote:
            result.append('"')

        for c in arg:
            if c == '\\':
                # Don't know if we need to double yet.
                bs_buf.append(c)
            elif c == '"':
                # Double backslashes.
                result.append('\\' * len(bs_buf)*2)
                bs_buf = []
                result.append('\\"')
            else:
                # Normal char
                if bs_buf:
                    result.extend(bs_buf)
                    bs_buf = []
                result.append(c)

        # Add remaining backslashes, if any.
        if bs_buf:
            result.extend(bs_buf)

        if needquote:
            result.extend(bs_buf)
            result.append('"')

    return ''.join(result)
```

:::

## 前提知識

- **コマンドライン引数**: プログラムに渡す設定や入力です。Windows では OS が 1 本の文字列としてプログラムに渡し、プログラム側が空白で分けて解釈します。
- **クォートとエスケープ**: 空白を含む引数は `"my file.py"` のように `"` で囲みます。引数の中に `"` そのものを入れたいときは `\"` と書きます（エスケープ）。
- **`'\\'`**: Python の文字列で、バックスラッシュ 1 文字を表します（`\` 自体がエスケープ記号なので 2 つ重ねて書きます）。
- **`'\\' * 3`**: 文字列の掛け算で、`\` を 3 個並べた文字列になります。
- **`result.append` と `''.join(result)`**: 部品をリストにためておき、最後に一度だけ連結するのは、文字列を何度も `+` するより速い定番の書き方です。
- **`os.fsdecode`**: バイト列で渡された引数をファイルシステムの文字コードで文字列にします。

## 何をしているか

docstring にある 5 つの規則が仕様です。特に「`\` は `"` の直前にあるときだけ特別な意味を持つ」という規則 4・5 がやっかいです。

### 1. 引数ごとの準備

```python:line-numbers=729
    for arg in map(os.fsdecode, seq):
        bs_buf = []

        # 引数どうしを区切るため、この引数の前に空白を入れる
        if result:
            result.append(' ')

        needquote = (" " in arg) or ("\t" in arg) or not arg
        if needquote:
            result.append('"')
```

2 つ目以降の引数の前には空白を入れます。空白やタブを含む引数、または空の引数は、`"` で囲む必要があります（`needquote`）。

### 2. 1 文字ずつ見る

```python:line-numbers=740
        for c in arg:
            if c == '\\':
                # まだ 2 倍にするかどうか決められないので、覚えておく
                bs_buf.append(c)
            elif c == '"':
                # 直前の \ をすべて 2 倍にする
                result.append('\\' * len(bs_buf)*2)
                bs_buf = []
                result.append('\\"')
            else:
                # ふつうの文字
                if bs_buf:
                    result.extend(bs_buf)
                    bs_buf = []
                result.append(c)
```

- `\` が来たら、すぐには出力せず **`bs_buf` にためる**。
- `"` が来たら、ためていた `\` を **2 倍の数** 出力し、続けて `\"` を出力する。規則 5 に従い、`"` の直前にある `\` は 2 倍にしてから `\"` を出すからです。
- ふつうの文字が来たら、ためていた `\` はそのまま出力する（規則 4: `"` の前でなければ文字どおり）。

### 3. 引数の終わり

```python:line-numbers=756
        # Add remaining backslashes, if any.
        if bs_buf:
            result.extend(bs_buf)

        if needquote:
            result.extend(bs_buf)
            result.append('"')
```

最後に残った `\` を出力します。さらにクォートで囲んでいる場合は、残った `\` を **もう一度** 出力（つまり 2 倍に）してから閉じの `"` を付けます。閉じの `"` の直前に来る `\` も、規則 5 の対象になるからです。

例: 引数 `C:\dir\`（末尾が `\`）は空白がないのでそのまま、`C:\my dir\` は `"C:\my dir\\"` になります。

## ここがすごい

### 「あとで決める」ためのバッファ

`\` を何個出力すべきかは、**その後ろに `"` が来るかどうか** で変わります。でも 1 文字ずつ読んでいる時点では、まだ後ろがわかりません。
そこで `\` だけを `bs_buf` にためておき、次に来た文字（`"`、ふつうの文字、引数の終わり）を見てから、そのまま出すか 2 倍にするかを決めています。これは「状態を 1 つ持つ小さな状態機械」で、先読みをせずに 1 回の走査で変換を終えられます。

### 閉じクォートの直前まで考えている

クォートで囲んだ引数が `\` で終わると、閉じの `"` が「エスケープされた `"`」と誤解されてしまいます。引数の終わりで 2 回目の `extend` を行うのは、この落とし穴を防ぐためです。こうした細かいケースまで、規則から素直に導かれた処理で対応しています。

### 空の引数も忘れない

`not arg` のときもクォートするので、空文字列の引数は `""` として渡されます。何も書かないと引数そのものが消えてしまうためです。

## まとめ

- 出力の仕方が「後ろの文字」で決まるときは、決まるまでバッファにためておく。
- エスケープの規則は、閉じ記号の直前などの境界で特に注意が必要。
- 部品をリストにためて最後に `join` すると、文字列の連結が速い。
