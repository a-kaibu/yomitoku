---
title: "出力先の幅を調べて、pp の折り返し位置を決める"
description: "PP.width_for は、出力先の端末の幅を調べ、取れなければ環境変数 COLUMNS か 80 を使う。1 を引いて、行末の余白を残す。"
language: ruby
project: "Ruby pp (標準ライブラリ)"
repo: https://github.com/ruby/pp
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "ddff8fe31cd47c2c6d0e8f49b4974b3f355c4f04"
file: lib/pp.rb
lines: [79, 86]
function: "PP.width_for"
difficulty: 2
format: 2
tags: ["入出力", "移植性", "イディオム"]
---
## ひとことで

`PP.width_for` は、`pp` で整形した結果を、何文字で折り返すかを決める関数です。
出力先が端末なら、その画面の幅を使います。端末でなければ、環境変数の `COLUMNS` か、既定の 80 を使います。
最後に 1 を引くのは、行の右端に少し余白を残すためです。

## コード

```ruby:line-numbers=79
  def PP.width_for(out)
    begin
      require 'io/console'
      _, width = out.winsize
    rescue LoadError, NoMethodError, SystemCallError
    end
    (width || ENV['COLUMNS']&.to_i&.nonzero? || 80) - 1
  end
```

## 前提知識

- **端末（ターミナル）の幅**: 画面に一度に表示できる文字数です。`winsize` で、行と列の数を取得できます。
- **`require 'io/console'`**: 端末の情報を調べるための、標準ライブラリを読み込みます。
- **環境変数 `COLUMNS`**: シェルが、端末の幅を入れておく変数です。多くの場合、数字の文字列です。
- **`&.`（セーフナビゲーション）**: 値が `nil` のときは、そこで止めて `nil` を返す演算子です。
- **`||`**: 左の値が `nil` か `false` なら、右の値を使います。

## 何をしているか

### 1. 端末の幅を、取れるなら取る

```ruby:line-numbers=81
      require 'io/console'
      _, width = out.winsize
```

`io/console` を読み込み、出力先の `winsize` を呼びます。端末なら、高さと幅が返ります。
`_` は、使わない値を受け取るための慣用的な名前です。ここでは高さを捨てています。

### 2. 取れなかったときの例外を、無視する

```ruby:line-numbers=83
    rescue LoadError, NoMethodError, SystemCallError
```

ファイルへの出力や、パイプへの出力では、`winsize` がありません。`NoMethodError` や `SystemCallError` が起きます。
`io/console` が無い環境では `LoadError` になります。それらの例外は、ここで握りつぶして、次の選択に進みます。

### 3. 順番に、既定の幅を選ぶ

```ruby:line-numbers=85
    (width || ENV['COLUMNS']&.to_i&.nonzero? || 80) - 1
```

最初に、端末から取れた `width` を使います。なければ、`COLUMNS` を整数にして、0 でなければ使います。
それもなければ、80 を使います。最後に `- 1` で、1 文字分だけ短くします。

## ここがすごい

### 失敗を例外で握りつぶし、そのまま進める

幅が分からないのは、エラーではなく、普通の状態です。
この関数は、取れないことを例外として扱い、代わりの値に切り替えています。呼び出し側は、幅が取れたかを気にしなくてよいです。

### 「ふつうの幅」の候補を、順に並べている

`||` の並びが、そのまま優先順位になっています。
端末の幅、環境変数、既定値の順で、あとの候補ほど大ざっぱになります。読むだけで、選び方が分かります。

### 1 を引く理由は、行末の余白

画面の右端ぎりぎりまで文字を置くと、端末によっては、次の行に折り返されてしまいます。
1 を引くことで、その余白を確保し、表示が崩れないようにしています。小さな数字ですが、とても実用的な工夫です。

## まとめ

- `width_for` は、出力先の端末の幅を、取れるなら使います。
- 取れなければ、環境変数 `COLUMNS` か、既定の 80 を使います。
- 取得の失敗は例外として握りつぶし、代わりの値に切り替えます。
- 1 を引いて、行末に余白を残し、表示が崩れないようにしています。
