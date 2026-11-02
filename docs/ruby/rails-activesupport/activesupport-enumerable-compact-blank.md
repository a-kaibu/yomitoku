---
title: "空の値を、まとめて取り除く"
description: "Enumerable#compact_blank は、nil・空文字列・空の配列などの blank な要素を除いた配列を返す。blank? の定義に従うので、値の種類を問わない。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [204, 206]
function: "Enumerable#compact_blank"
difficulty: 1
format: 2
tags: ["データ構造", "イディオム", "防御的プログラミング"]
---
## ひとことで

`Enumerable#compact_blank` は、配列やハッシュから **空（blank）の要素を取り除いた新しいもの** を返すメソッドです。
`nil`、空文字列、空白だけの文字列、空の配列などが取り除かれます。
`[1, nil, "", "a"].compact_blank` は `[1, "a"]` になります。

## コード

```ruby:line-numbers=204
  def compact_blank
    reject(&:blank?)
  end
```

## 前提知識

- **`nil.compact`**: Ruby の標準のメソッドで、`nil` だけを取り除きます。空文字列は残ります。
- **`blank?`**: 空かどうかを判定するメソッドです。`nil`、空文字列、空白だけの文字列、空のコレクションが該当します。
- **`reject`**: ブロックが真を返した要素を取り除いた、新しい配列を作ります。
- **`&:blank?`**: `{ |x| x.blank? }` の省略形です。

## 何をしているか

### 1. 空の要素を取り除く

```ruby:line-numbers=205
    reject(&:blank?)
```

`reject(&:blank?)` は、各要素に `blank?` を呼び、真になったもの（空のもの）を取り除きます。残った要素だけが、新しい配列になります。

### 2. ハッシュにも同じ規則を当てる

ハッシュでは、同じ名前のメソッドが、値が空かどうかで要素を取り除きます。鍵ではなく値を見る点に注意してください。

## ここがすごい

### 「空」の定義を 1 か所に任せる

どの値が空かを、このメソッドは決めていません。`blank?` の定義に従うので、型を増やしても、このメソッドを直す必要はありません。
ほかの場所の `blank?` の定義と、常に一致します。

### 標準の `compact` より、範囲が広い

Ruby の `compact` は `nil` だけを取り除きます。
フォームの入力のように、空文字列を「入力なし」とみなしたい場合は、`compact_blank` のほうが、実際の意図に近い結果になります。

### 元を変えない

通常の版は、新しい配列を返します。元のデータはそのまま残るので、後で別の処理に使うときにも安全です。

## まとめ

- 空の要素をまとめて除くには、`blank?` を基準にすると、型を問わず統一できます。
- `nil` だけを取り除く `compact` と、空を取り除く `compact_blank` は、目的によって使い分けます。
- 元のデータを変えずに、新しいコレクションを返すと、安全に扱えます。
