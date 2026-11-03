---
title: "中身を比べる前に、サイズで違いを見分ける"
description: "FileUtils.compare_file は、ファイルのサイズが違えば即座に false を返し、同じときだけ中身を少しずつ読んで比べる。"
language: ruby
project: "Ruby fileutils (標準ライブラリ)"
repo: https://github.com/ruby/fileutils
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "445150507c580806e66dc58a066a5dea1e2361ba"
file: lib/fileutils.rb
lines: [1534, 1541]
function: "FileUtils.compare_file"
difficulty: 1
format: 2
tags: ["ファイル", "アルゴリズム"]
---
## ひとことで

`FileUtils.compare_file` は、2 つのファイルの中身が同じかを調べる関数です。
同じ内容なら `true`、違えば `false` を返します。
まずサイズを比べ、サイズが同じときだけ、中身を比べに行きます。

## コード

```ruby:line-numbers=1534
  def compare_file(a, b)
    return false unless File.size(a) == File.size(b)
    File.open(a, 'rb') {|fa|
      File.open(b, 'rb') {|fb|
        return compare_stream(fa, fb)
      }
    }
  end
```

## 前提知識

- **ファイルのサイズ**: ファイルのバイト数です。`File.size` で、ファイルを開かずに調べられます。
- **`'rb'` モード**: ファイルをバイナリとして開く指定です。改行の変換などが行われず、中身がそのまま読めます。
- **ブロック付きの `File.open`**: ブロックの終わりで、ファイルを自動的に閉じてくれる書き方です。
- **`compare_stream`**: 2 つのストリームを、少しずつ読みながら比べる内部の関数です。
- **`return` とブロック**: ブロックの中で `return` すると、そのブロックを呼んでいるメソッドから抜けられます。

## 何をしているか

### 1. サイズが違えば、すぐに false を返す

```ruby:line-numbers=1535
    return false unless File.size(a) == File.size(b)
```

サイズが違えば、中身が同じになることはありえません。
ここで `false` を返せば、ファイル全体を読む必要がなくなります。大きなファイルほど、この判断の効果が大きいです。

### 2. 両方を、バイナリとして開く

```ruby:line-numbers=1536
    File.open(a, 'rb') {|fa|
      File.open(b, 'rb') {|fb|
```

2 つのファイルを、`'rb'` で開きます。文字コードの解釈や改行の変換を避けて、バイト単位で比べるためです。
ブロックを使うので、比べ終わったら、ファイルは自動的に閉じられます。

### 3. 中身を、ストリームとして比べる

```ruby:line-numbers=1538
        return compare_stream(fa, fb)
```

`compare_stream` に 2 つのファイルを渡します。`return` によって、結果はそのまま `compare_file` の戻り値になります。
中身は、一度に全部読むのではなく、決まった大きさのブロックを順に読んで比べます。

## ここがすごい

### 安い確認で、高い確認を省く

サイズを比べるのは、ファイルの内容を読まずにできる、とても安い操作です。
違いが分かれば、中身の比較という重い処理を、丸ごと省けます。
「安い確認を先に置く」という、性能のよくある工夫です。

### 大きなファイルを、メモリに載せない

中身を比べるのは、`compare_stream` が少しずつ読むからです。
1 GB のファイルでも、2 つのファイルを丸ごとメモリに入れる必要はありません。
この関数は、ファイルの大きさに関係なく、使うメモリが一定に保たれます。

### 比べる順番が、そのまま読みやすい

「サイズが違う → false」「同じなら中身を比べる」という順番で、判断の流れがそのまま書かれています。
短いコードですが、何を先に確かめるかが、一目で分かります。

## まとめ

- `compare_file` は、まずサイズを比べ、違えば `false` を返します。
- 同じサイズのときだけ、両方を `'rb'` で開いて中身を比べます。
- 中身の比較は、ストリームとして少しずつ行うので、大きなファイルでもメモリを使いすぎません。
- 安い確認を先に置くことで、必要のない重い処理を省いています。
