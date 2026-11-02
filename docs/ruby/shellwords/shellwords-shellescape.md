---
title: "空白や記号を「\\」で守るだけの、シェル用エスケープ"
description: "文字列をシェルのコマンドにそのまま埋め込めるよう、特別な記号の前に「\\」を付ける。空文字を '' にし、改行だけは別の書き方にする。"
language: ruby
project: "Ruby shellwords (標準ライブラリ)"
repo: https://github.com/ruby/shellwords
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "6002cd56950572c5923af5db7b99047b025d14cc"
file: lib/shellwords.rb
lines: [158, 178]
function: "Shellwords.shellescape"
difficulty: 2
format: 2
tags: [文字列処理, セキュリティ, イディオム]
---

## ひとことで

`Shellwords.shellescape` は、文字列を **シェル（コマンドを入力する場所）で 1 つの引数として正しく読まれる形** に変えるメソッドです。
`"my file.txt"` は `"my\ file.txt"` になり、シェルはこれを 1 つのファイル名として扱います。
ユーザーの入力をコマンドに組み立てるとき、空白や `;` で勝手にコマンドを分割されないようにするために使います。

## コード

::: code-group

```ruby:line-numbers=158 [日本語訳]
  def shellescape(str)
    str = str.to_s

    # # 空の引数は読み飛ばされてしまうので、空のクォートを返す。
    return "''".dup if str.empty?

    # # Shellwords は NUL 文字を含めない。
    raise ArgumentError, "NUL character" if str.index("\0")

    str = str.dup

    # # マルチバイト文字はそのまま扱う。
    # # 文字列を、使うシェル環境に合ったエンコーディングにするのは呼び出し側の責任。
    # # 環境に合わせて。
    str.gsub!(/[^A-Za-z0-9_\-.,:+\/@\n]/, "\\\\\\&")

    # # 改行（LF）は、バックスラッシュ + 改行の組み合わせが行の続きとみなされて、
    # # 無視されてしまうので、バックスラッシュでは守れない。
    str.gsub!(/\n/, "'\n'")

    return str
```

```ruby:line-numbers=158 [原文]
  def shellescape(str)
    str = str.to_s

    # An empty argument will be skipped, so return empty quotes.
    return "''".dup if str.empty?

    # Shellwords cannot contain NUL characters.
    raise ArgumentError, "NUL character" if str.index("\0")

    str = str.dup

    # Treat multibyte characters as is.  It is the caller's responsibility
    # to encode the string in the right encoding for the shell
    # environment.
    str.gsub!(/[^A-Za-z0-9_\-.,:+\/@\n]/, "\\\\\\&")

    # A LF cannot be escaped with a backslash because a backslash + LF
    # combo is regarded as a line continuation and simply ignored.
    str.gsub!(/\n/, "'\n'")

    return str
```

:::


## 前提知識

- **シェルの引数**: `ls my file.txt` は、`my` と `file.txt` の 2 つの引数に分かれます。空白で区切られるからです。
- **バックスラッシュ `\`**: シェルでは、直後の 1 文字の特別な意味を消します。`\ `（バックスラッシュと空白）は「空白 1 文字」になります。
- **シングルクォート `''`**: シェルで囲んだ中身はすべてそのまま扱われます。空の `''` は「空の引数」を表します。
- **`str.gsub!(正規表現) { ... }` と置換文字列**: マッチした部分を別の文字列に置き換えます。`"\\\\\\&"` は「バックスラッシュ + マッチした文字そのもの」を表す置換文字列です。
- **`str.index("\0")`**: 文字列の中の NUL 文字（値 0 の文字）の位置を探します。見つからなければ `nil` です。
- **`str.dup`**: 元の文字列を変えないよう、コピーを作ります。

## 何をしているか

### 1. 空文字と NUL を先に片付ける

`shellescape("")` は、何も書かないと「引数なし」と扱われてしまいます。そこで `"''"` という空のクォートを返します。

```ruby:line-numbers=161
    # An empty argument will be skipped, so return empty quotes.
    return "''".dup if str.empty?
```

NUL 文字はシェルの引数に入れられないので、エラーにします。

```ruby:line-numbers=164
    # Shellwords cannot contain NUL characters.
    raise ArgumentError, "NUL character" if str.index("\0")
```

### 2. 英数字などの「安全な文字」以外の前に `\` を付ける

`/[^A-Za-z0-9_\-.,:+\/@\n]/` は「英数字や `_-.,:+/@` と改行以外のすべての文字」にマッチします。その文字の前に `\` を付けます。

`"a b;c"` の場合、空白と `;` の前に `\` が付いて `"a\ b\;c"` になります。

```ruby:line-numbers=172
    str.gsub!(/[^A-Za-z0-9_\-.,:+\/@\n]/, "\\\\\\&")
```

### 3. 改行だけは別の方法で

```ruby:line-numbers=174
    # A LF cannot be escaped with a backslash because a backslash + LF
    # combo is regarded as a line continuation and simply ignored.
    str.gsub!(/\n/, "'\n'")
```

`\` の後ろの改行は「行の続き」とみなされて無視されてしまいます。そこで改行を、シングルクォートで囲んだ `'\n'` に置き換えます。

## ここがすごい

### 「何でも守る」より「安全な文字だけ残す」

「危ない文字だけ `\` を付ける」方法は、危ない文字の一覧を作って漏れを探すことになります。このコードは反対に、**安全な文字の一覧**（英数字と少しの記号）を作り、それ以外はすべて守ります。一覧にない文字が来ても、守る側に倒れるので、漏れにくくなります。

### 改行は特別扱い

`\` + 改行は、シェルでは「次の行に続く」という意味です。そのため、単純に `\` を付けるとコマンドの一部が消えてしまいます。コメントの説明どおり、改行だけ別の書き方にしています。

### 空文字の注意

`"''"` を返す理由は、空の引数を黙って消されないようにするためです。`rm ""` と `rm` は別の結果になるので、この 1 行はコマンドの意味を守る大事な処理です。

## まとめ

- シェルに文字列を渡すときは、安全な文字の一覧を作って、それ以外を守るのが確実です。
- 「`\` の後の改行」のように、特殊な組み合わせは別に扱います。
- 空の値は、消えないように明示的な書き方（`''`）にします。
