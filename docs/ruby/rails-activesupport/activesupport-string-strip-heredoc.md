---
title: "いちばん浅いインデントを探して、全行から同じだけ削る"
description: "ヒアドキュメントの字下げを取り除く strip_heredoc。StringScanner で各行の先頭の空白を数え、最小値だけを全行から削る。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/string/strip.rb
lines: [32, 60]
function: "String#strip_heredoc"
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

`strip_heredoc` は、複数行の文字列から **共通の字下げ（インデント）を取り除く** メソッドです。
"    a\n      b\n" なら、いちばん浅い 4 文字分の空白を全行から削り、"a\n  b\n" にします。
ソースコードの中で字下げして書いた長い文字列を、左端にそろえて表示したいときに使います。

## コード

```ruby:line-numbers=32
  def strip_heredoc
    scanner = StringScanner.new("")

    min_indent_len = nil
    lines = self.lines

    lines.each do |line|
      scanner.string = line
      indent_len = scanner.skip(/[ \t]*/)

      next unless scanner.match?(/[^\r\n]/)

      min_indent_len = indent_len if indent_len < (min_indent_len || Float::INFINITY)
    end


    if min_indent_len.nil? || min_indent_len.zero?
      return frozen? ? self : dup
    end

    lines.each do |line|
      line[0, min_indent_len] = "" unless line == "\n"
    end

    result = lines.join

    result.freeze if frozen?
    result
  end
```

## 前提知識

- **ヒアドキュメント**: `<<-TEXT ... TEXT` のように書く、複数行の文字列リテラルです。コードの字下げに合わせて書くと、文字列にも空白が入ってしまいます（Ruby 2.3 以降は `<<~` で自動的に取り除けますが、それ以前のためにこのメソッドがありました）。
- **`StringScanner`**: 標準ライブラリ `strscan` のクラスで、文字列の先頭から正規表現で少しずつ読み進めるための道具です。`skip(正規表現)` はマッチした部分を読み飛ばして **その長さ** を返し、`match?(正規表現)` は今の位置でマッチするかを調べます（位置は進めません）。
- **`self.lines`**: 文字列を改行ごとに区切った配列を返します。各要素は末尾の改行を含みます。
- **`next unless 条件`**: 条件が偽なら、ループのこの回を飛ばして次へ進みます。
- **`Float::INFINITY`**: 無限大です。どんな数よりも大きいので、最小値探しの初期値に使えます。
- **`frozen?` / `freeze`**: 凍結（変更禁止）された文字列かどうか / 凍結する、です。
- **`line[0, n] = ""`**: 文字列の先頭 n 文字を空文字に置き換える、つまり削除します。

## 何をしているか

### 1. 各行の字下げを測る

```ruby:line-numbers=33
    scanner = StringScanner.new("")

    min_indent_len = nil
    lines = self.lines

    lines.each do |line|
      scanner.string = line
      indent_len = scanner.skip(/[ \t]*/)

      next unless scanner.match?(/[^\r\n]/)

      min_indent_len = indent_len if indent_len < (min_indent_len || Float::INFINITY)
    end
```
1 つの `StringScanner` を使い回し、行ごとに `scanner.string = line` で中身を差し替えます。`skip(/[ \t]*/)` で先頭のスペースとタブを読み飛ばし、その文字数を `indent_len` に入れます。

`next unless scanner.match?(/[^\r\n]/)` では、空白のあとに改行以外の文字があるかを確認します。**空行や空白だけの行は、字下げの計算に入れません。** 空行の字下げは 0 とみなされてしまうからです。

続く行で、これまでの最小値より小さければ更新します。`min_indent_len` は最初 `nil` なので、`|| Float::INFINITY` で「無限大と比べる」ことにしています。

### 2. 削る必要がなければそのまま返す

```ruby:line-numbers=48
    if min_indent_len.nil? || min_indent_len.zero?
      return frozen? ? self : dup
    end
```
字下げが 0、または中身のある行が 1 つもない場合は何もしません。凍結されていれば自分自身を、そうでなければコピーを返します。

### 3. 全行から削ってつなぐ

```ruby:line-numbers=52
    lines.each do |line|
      line[0, min_indent_len] = "" unless line == "\n"
    end

    result = lines.join

    result.freeze if frozen?
    result
```
改行だけの行以外から、先頭 `min_indent_len` 文字を削除し、`join` で 1 つの文字列に戻します。元の文字列が凍結されていれば、結果も凍結して性質をそろえます。

## ここがすごい

### スキャナを 1 つだけ作って使い回す

行ごとに `StringScanner.new(line)` を作ってもよいのですが、オブジェクトを作るコストが行数分かかります。`scanner.string = line` で中身だけ入れ替えれば、作るのは 1 回で済みます。

### 「長さ」を返す skip をうまく使う

`skip` が「読み飛ばした文字数」を返すので、字下げの数え上げが 1 行で済んでいます。正規表現で `line[/\A[ \t]*/].size` と書くと、一時的な文字列が作られます。

### nil と無限大の組み合わせ

「まだ一度も値が入っていない」状態を `nil` で表しつつ、比較のときだけ `Float::INFINITY` に読み替えています。最初の 1 回だけ特別扱いする `if` を書かずに済む、最小値探しの定番テクニックです。

## まとめ

- 共通の字下げは「中身のある行の、字下げの最小値」で求められます。空行は除外するのがポイントです。
- `StringScanner` は、文字列を少しずつ読み進める処理に向いています。使い回すと効率的です。
- 最小値探しの初期値には `nil || Float::INFINITY` のような書き方が便利です。
- 入力が凍結されていたら出力も凍結する、のように元の性質を保つ配慮があります。
