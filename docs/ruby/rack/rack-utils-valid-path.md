---
title: "NUL 文字や壊れた文字を含むパスを弾く"
description: "Rack::Utils.valid_path? は、パスの文字コードが正しく、NUL 文字を含まないかを確かめる。ファイルを開く前の安全確認に使う。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [708, 710]
function: "Rack::Utils.valid_path?"
difficulty: 1
format: 2
tags: ["セキュリティ", "防御的プログラミング", "文字列処理"]
---
## ひとことで

`Rack::Utils.valid_path?` は、ファイルのパスとして扱ってよい文字列かを、**文字コードの正しさと NUL 文字の有無** から確かめるメソッドです。
合格なら `true`、壊れた文字や NUL 文字を含むなら `false` を返します。
ファイルを開く前の、最初の安全確認として使われます。

## コード

```ruby:line-numbers=708
    def valid_path?(path)
      path.valid_encoding? && !path.include?(NULL_BYTE)
    end
```

## 前提知識

- **文字コード（エンコーディング）**: 文字をバイト列に変える決まりです。UTF-8 などがあり、決まりに合わないバイト列は「壊れた文字列」になります。
- **NUL 文字**: 値が 0 の 1 バイト（`\0`）です。C 言語の文字列では終わりを表すため、ファイル名に入っていると、別のファイルを開いてしまう原因になります。
- **`valid_encoding?`**: 文字列が、その文字コードとして正しいかを調べます。
- **`include?`**: 文字列の中に、指定した文字列が含まれるかを調べます。
- **`&&`**: 両方が真のときだけ真になる論理積です。左が偽なら右は評価されません。
- **定数 `NULL_BYTE`**: NUL 文字を表す定数です。

## 何をしているか

### 1. 文字コードが正しいかを確かめる

```ruby:line-numbers=709
      path.valid_encoding? && !path.include?(NULL_BYTE)
```

`valid_encoding?` が偽なら、そのパスは壊れています。`&&` の左側なので、偽ならすぐに結果が決まります。

### 2. NUL 文字を含まないかを確かめる

```ruby:line-numbers=709
      path.valid_encoding? && !path.include?(NULL_BYTE)
```

`include?(NULL_BYTE)` が真なら、NUL 文字があるということなので、結果は `false` になります。どちらの条件も満たしたときだけ `true` です。

## ここがすごい

### 危険な値を、ファイルを開く前に止める

NUL 文字を含むパスは、低レベルの処理で途中で切れてしまい、意図しないファイルに届くことがあります。
このメソッドは、そうした値を入り口で拒否するので、後の処理は安全な値だけを扱えます。

### 「正しい文字列か」を先に見る

壊れた文字列に対して文字の検査を行うと、例外が起きることがあります。
`valid_encoding?` を先に評価して、壊れていれば後の処理を行わない順番にしています。

### 1 行で、条件を明確に書く

2 つの条件を `&&` でつなぐだけなので、何を拒否しているかが一目で分かります。
安全確認は、読み手が一瞬で理解できる形にするのが大切です。

## まとめ

- パスを扱う前には、文字コードの正しさと、NUL 文字の有無を確認すると安全です。
- 危険な値は、使う場所ではなく入り口で止めると、後の処理が簡単になります。
- 条件は `&&` で並べ、拒否する理由がすぐ読めるように書きます。
