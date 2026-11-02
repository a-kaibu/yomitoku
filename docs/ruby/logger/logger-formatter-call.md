---
title: "ログの 1 行を、決まった書式で組み立てる"
description: "Logger::Formatter#call は、重要度、時刻、プロセス番号、プログラム名、メッセージを 1 つの書式にはめ込んで、ログの 1 行を作る。"
language: ruby
project: "Ruby logger (標準ライブラリ)"
repo: https://github.com/ruby/logger
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "c3ab8bce09eb074205aa2c4b2828d6804fc3bdd0"
file: lib/logger/formatter.rb
lines: [15, 17]
function: "Logger::Formatter#call"
difficulty: 1
format: 2
tags: ["ログ", "文字列処理", "API設計"]
---
## ひとことで

`Logger::Formatter#call` は、ログの **1 行分の文字列を、決まった書式で組み立てる** メソッドです。
重要度（`INFO` など）、時刻、プロセス番号、プログラム名、メッセージを、書式の中にはめ込みます。
Logger は、ログを書くたびに、このメソッドを呼び出します。

## コード

```ruby:line-numbers=15
    def call(severity, time, progname, msg)
      sprintf(Format, severity, format_datetime(time), Process.pid, severity, progname, msg2str(msg))
    end
```

## 前提知識

- **ログの重要度（severity）**: `DEBUG`、`INFO`、`WARN`、`ERROR` などの段階です。
- **`sprintf`**: 書式の文字列の中に、値を順番に埋め込んで、文字列を作ります。`%s` は文字列、`%d` は整数の位置を表します。
- **`Process.pid`**: 今のプロセスの番号です。複数のプロセスが同じログに書き込んでも、どれが書いたかが分かります。
- **`msg2str`**: メッセージを文字列にする内部メソッドです。文字列、例外、その他の値を、それぞれ読める形にします。
- **`format_datetime`**: 時刻を、決まった形の文字列にします。

## 何をしているか

### 1. 書式に、必要な値を順番に入れる

```ruby:line-numbers=16
      sprintf(Format, severity, format_datetime(time), Process.pid, severity, progname, msg2str(msg))
```

`Format` という書式の文字列に、重要度、時刻、プロセス番号、重要度（再度）、プログラム名、メッセージを順番に入れて、1 行の文字列を作ります。

この関数の戻り値が、そのままログファイルの 1 行になります。

## ここがすごい

### 書式を、定数に分けておく

`Format` を定数にしておくと、どんな並びでログが出るかを、1 か所で変えられます。
呼び出す側は、書式を知らなくても、同じ形のログを作れます。

### 値の変換を、専用のメソッドに任せる

時刻やメッセージは、そのままでは読みにくい形です。
`format_datetime` と `msg2str` に変換を任せることで、このメソッドは、並べるだけに集中できます。

### 書き換えやすい部品として作る

Logger の書式は、`Formatter` を差し替えることで、自由に変えられます。
この `call` が、差し替えの単位として、同じ形で呼ばれます。

## まとめ

- ログの 1 行は、書式の定数に値を入れると、一定の形を保てます。
- 変換の細かい処理は専用のメソッドに分けると、組み立ての部分が読みやすくなります。
- 書式を部品として切り離すと、利用者が出力の形を自由に変えられます。
