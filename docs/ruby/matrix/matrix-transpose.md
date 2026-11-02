---
title: "行と列を入れ替えた行列を作る"
description: "Matrix#transpose は、行列の行と列を入れ替えた新しい行列を返す。行が 0 個の行列は、列数を入れ替えた空の行列にする。"
language: ruby
project: "Ruby matrix (標準ライブラリ)"
repo: https://github.com/ruby/matrix
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "f8143363a7e9f721e66e4562ac7883e5ee5c8a36"
file: lib/matrix.rb
lines: [1521, 1524]
function: "Matrix#transpose"
difficulty: 1
format: 2
tags: ["数値計算", "データ構造", "イディオム"]
---
## ひとことで

`Matrix#transpose` は、行列の **行と列を入れ替えた新しい行列** を返すメソッドです。
縦に並んでいた数が横に、横に並んでいた数が縦になります。
元の行列は変わりません。行が 0 個の行列は、列数と行数を入れ替えた空の行列になります。

## コード

```ruby:line-numbers=1521
  def transpose
    return self.class.empty(column_count, 0) if row_count.zero?
    new_matrix @rows.transpose, row_count
  end
```

## 前提知識

- **行列（Matrix）**: 数を縦と横に並べた表です。`m × n` の行列は、`m` 行 `n` 列です。
- **転置（transpose）**: 行と列を入れ替える操作です。`(i, j)` の要素が `(j, i)` の位置に移ります。
- **`@rows`**: 行列の中身を、行ごとの配列として保存しているインスタンス変数です。
- **`zero?`**: 数が 0 かを調べます。
- **`self.class.empty(行数, 列数)`**: 指定した大きさの、要素が無い行列を作るメソッドです。

## 何をしているか

### 1. 空の行列だったら、大きさだけ入れ替えた空の行列を作る

```ruby:line-numbers=522
  # * :strict_lower: yields only elements below the diagonal
```

行が 0 個のとき、`@rows.transpose` では意味のある結果になりません。そこで、列数を行数として、空の行列を作って返します。

### 2. 行の配列を転置して、新しい行列にする

```ruby:line-numbers=523
  # * :strict_upper: yields only elements above the diagonal
```

`@rows.transpose` は、行の配列を入れ替えた配列を返します。`new_matrix` が、その配列から行列を作ります。行数も引数として渡します。

## ここがすごい

### 配列の機能に任せる

行列は、内部では行ごとの配列です。その配列の `transpose` を使うので、入れ替えの処理を新しく書く必要がありません。

### 空の行列を特別扱いする

行が無い行列は、そのまま配列の転置をすると、大きさの情報が消えてしまいます。
先に特別扱いすることで、列数の情報を残しています。

### 元を変えない

転置の結果は、新しい行列です。元の行列は、他の計算で使い続けられます。

## まとめ

- 行列の転置は、内部の配列の転置に任せると、簡潔に書けます。
- 空の入力は、特別扱いしないと、大きさの情報が失われることがあります。
- 変換の結果を新しいオブジェクトにすると、元のデータを安全に使い続けられます。
