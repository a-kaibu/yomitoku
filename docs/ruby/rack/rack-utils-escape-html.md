---
title: "HTML に埋め込む前に、記号を無害な形に変える"
description: "Rack::Utils.escape_html は、< や > などの記号を HTML の文字参照に変える。ユーザーの入力をそのまま画面に出すと起きる攻撃を防ぐ。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [249, 251]
function: "Rack::Utils.escape_html"
difficulty: 1
format: 2
tags: ["セキュリティ", "文字列処理", "防御的プログラミング"]
---
## ひとことで

`Rack::Utils.escape_html` は、文字列に含まれる `<`、`>`、`&`、`"`、`'` などの記号を、HTML の **文字参照**（`&lt;` など）に変えるメソッドです。
`<script>` という入力は `&lt;script&gt;` になり、ブラウザはそれをタグではなく、ただの文字として表示します。
画面に出す値を HTML に埋め込むときに、必ず通す処理です。

## コード

```ruby:line-numbers=249
      def escape_html(string)
        CGI.escapeHTML(string.to_s)
      end
```

## 前提知識

- **HTML のタグ**: `<p>` や `<script>` のように、`<` と `>` で囲まれた命令です。ブラウザはこれを見ると、文字ではなく構造や動作として解釈します。
- **文字参照（エスケープ）**: 記号を `&lt;` のような綴りに置き換えると、ブラウザはそれを記号そのものとして表示します。
- **クロスサイトスクリプティング（XSS）**: 利用者の入力に悪意のあるスクリプトが混ざり、他の人のブラウザで実行されてしまう攻撃です。
- **`CGI.escapeHTML`**: Ruby の標準ライブラリにあり、HTML の危険な記号を文字参照に変えてくれます。
- **`to_s`**: 値を文字列に変換します。`nil` は空文字列になります。

## 何をしているか

### 1. 値を文字列にそろえる

```ruby:line-numbers=250
        CGI.escapeHTML(string.to_s)
```

引数が数値や `nil` でも、文字列として扱えるように `to_s` で変換してから、記号を置き換えます。

### 2. 危険な記号を文字参照に変える

`CGI.escapeHTML` は、HTML の意味を持つ記号を、対応する文字参照に変えます。
例えば `Tom & Jerry` は `Tom &amp; Jerry` になり、画面には元どおり `Tom & Jerry` と表示されます。

## ここがすごい

### 出力の直前で変換する

入力を受け取った時点で変換すると、データベースや別の用途に送る値まで壊れてしまいます。
このメソッドは HTML に出す瞬間だけ使うので、元の値はそのまま残せます。
「どこで変換するか」を決めるのが、安全な設計の大切な点です。

### 自分で書かず、実績のある部品を使う

記号の変換は、一見単純ですが、「`&` を最初に変換する」「引用符も変換する」など、抜けがあると危険です。
標準ライブラリの `CGI.escapeHTML` に任せることで、そうした間違いを避けられます。

### 文字列にそろえてから処理する

`to_s` を先に呼ぶので、数値や `nil` が渡されても例外にならず、安全な文字列になります。

## まとめ

- ユーザーの入力を HTML に埋め込むときは、必ず文字参照に変換します。
- 変換は出力する直前に行い、元の値は保存しておきます。
- 自作の置換よりも、標準の部品を使うほうが抜けを防げます。
