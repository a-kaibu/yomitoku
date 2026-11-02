---
title: "正規表現より速い「空白だけの文字列か？」判定"
description: "Rails の String#blank? は、ASCII の文字列だけバイトを直接なめて判定し、それ以外は正規表現に任せる二段構えになっている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/blank.rb
lines: [187, 211]
function: "String#blank?"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, Unicode]
---

## ひとことで

`String#blank?` は、文字列が **空、または空白文字だけ** でできているかを調べるメソッドです。
`"".blank?`、`"   ".blank?`、`"\t\n".blank?` はどれも `true`、`" hi ".blank?` は `false` になります。
Rails ではフォームの入力チェックなどで毎日のように呼ばれるため、とても速く動くように工夫されています。

## コード

::: code-group

```ruby:line-numbers=187 [日本語訳]
  def blank?
    return true if empty?

    # ASCII だけの文字列は、バイトを見るだけで決まります。多くは
    # 表示できる文字で始まり、残りを走査する方が正規表現より速いからです。
    # YJIT のもとでは。それ以外は正規表現を使います。
    if ascii_only?
      return false if getbyte(0) > 32

      i = 0
      len = bytesize
      while i < len
        byte = getbyte(i)
        return false unless byte == 32 || (byte >= 9 && byte <= 13)
        i += 1
      end
      true
    else
      begin
        BLANK_RE.match?(self)
      rescue Encoding::CompatibilityError
        ENCODED_BLANKS[encoding].match?(self)
      end
    end
  end
```

```ruby:line-numbers=187 [原文]
  def blank?
    return true if empty?

    # ASCII-only strings are settled by looking at the bytes: most start with
    # a printable character, and scanning the rest beats the regexp engine
    # under YJIT. Everything else keeps the regexp.
    if ascii_only?
      return false if getbyte(0) > 32

      i = 0
      len = bytesize
      while i < len
        byte = getbyte(i)
        return false unless byte == 32 || (byte >= 9 && byte <= 13)
        i += 1
      end
      true
    else
      begin
        BLANK_RE.match?(self)
      rescue Encoding::CompatibilityError
        ENCODED_BLANKS[encoding].match?(self)
      end
    end
  end
```

:::

`BLANK_RE` は同じファイルの少し上で、次のように定義されている正規表現です（先頭から末尾まで空白文字だけ、という意味）。

```ruby:line-numbers=165
  BLANK_RE = /\A[[:space:]]*\z/
```

## 前提知識

- **クラスを後から開く（モンキーパッチ）**: Ruby では組み込みの `String` クラスにも、あとからメソッドを追加できます。このコードは `class String ... end` の中に書かれていて、すべての文字列で `blank?` が使えるようになります。
- **`?` で終わるメソッド名**: Ruby では true/false を返すメソッドの名前に `?` を付ける習慣があります。
- **`self` と省略**: メソッドの中で `empty?` や `bytesize` と書くと、それは「この文字列自身の」`empty?` です（`self.empty?` の省略）。
- **`return 値 if 条件`**: 条件が成り立つときだけその場で値を返す、後置 if の書き方です。
- **`ascii_only?` / `getbyte(i)` / `bytesize`**: 文字列が ASCII（英数字や記号など 0〜127 の文字）だけでできているか、`i` 番目のバイトの数値、全体のバイト数をそれぞれ返します。
- **`begin ... rescue 例外クラス ... end`**: 例外（エラー）が起きたら `rescue` 節に飛んで処理を続けます。
- **空白文字のバイト値**: スペースは 32、タブ・改行・垂直タブ・改ページ・復帰（`\t \n \v \f \r`）は 9〜13 です。

## 何をしているか

### 1. 空文字ならすぐ true

```ruby:line-numbers=188
    return true if empty?
```
`""` のような長さ 0 の文字列は、調べるまでもなく空白だけです。最初に片付けます。

### 2. ASCII だけの文字列はバイトを直接調べる

```ruby:line-numbers=193
    if ascii_only?
      return false if getbyte(0) > 32

      i = 0
      len = bytesize
      while i < len
        byte = getbyte(i)
        return false unless byte == 32 || (byte >= 9 && byte <= 13)
        i += 1
      end
      true
```
まず先頭のバイトだけを見て、32 より大きければ（＝空白ではない、ふつうの文字なら）即座に `false` を返します。
`"hello"` なら先頭の `h` は 104 なので、ここで 1 回比較しただけで終わります。

先頭が空白っぽいときだけ、`while` ループで 1 バイトずつ確認します。
たとえば `"  \tx"` では、32（スペース）、32、9（タブ）と進み、4 バイト目の `x`（120）で `false` を返します。
最後まで空白だけなら `true` です。

### 3. それ以外は正規表現に任せる

```ruby:line-numbers=204
    else
      begin
        BLANK_RE.match?(self)
      rescue Encoding::CompatibilityError
        ENCODED_BLANKS[encoding].match?(self)
      end
    end
```
日本語のような非 ASCII 文字を含む場合は、`BLANK_RE` で判定します。`[[:space:]]` は Unicode の空白にも対応しているので、全角スペースやノーブレークスペース（`" "`）も空白として扱えます。

ただし、文字列の **エンコーディング**（文字をバイトで表す方式）が UTF-8 以外だと、UTF-8 前提の正規表現と組み合わせられず `Encoding::CompatibilityError` が起きることがあります。その場合は `rescue` 節で、そのエンコーディング用に作り直した正規表現（`ENCODED_BLANKS` に保存されたもの）を使ってやり直します。

## ここがすごい

### よくあるケースを最速で片付ける

素直に書くなら `BLANK_RE.match?(self)` の 1 行で済みます。それでも正しく動きますが、正規表現エンジンを呼び出すにはそれなりの準備コストがかかります。
現実の入力のほとんどは「ふつうの文字で始まる ASCII 文字列」なので、**先頭 1 バイトを見るだけで答えが出る** 道を最初に用意しています。コード中のコメントにも、YJIT（Ruby の JIT コンパイラ）のもとではバイトを走査する方が正規表現より速いと書かれています。

### 正しさは正規表現に残している

速い道は ASCII 限定です。Unicode の空白の種類は多く、自前で全部を列挙すると間違いやすくなります。そこで「確実に速くできる部分だけ手で書き、難しい部分は信頼できる正規表現に任せる」という分担にしています。

### エラーを「キャッシュ付きの作り直し」で吸収

エンコーディングが違うときだけ正規表現を作り直し、しかも `Concurrent::Map`（複数スレッドから安全に使えるハッシュ）に保存して使い回します。めったに起きないケースのために普段の処理を遅くしない、という考え方です。

## まとめ

- 「ほとんどの入力が通る道」を特別に速くするのは、効果の大きい最適化です。
- 先頭 1 文字だけで決着がつく判定は、全体を調べる前に済ませるとよいです。
- 速さのための手書きコードは範囲を絞り、複雑な部分は正規表現などの道具に任せると安全です。
- 例外を使った「まれなケースだけの回り道」は、普段の処理を軽く保つ手段になります。
