---
title: "「引用符なし」を配列の代わりに表す、空の番兵"
description: "引用符の有無を表す配列の代わりに、どの添字でも false を返す特別な空の配列を使う。毎回配列を作らずに済む小さな工夫。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/fields_converter.rb
lines: [8, 12]
function: "CSV::FieldsConverter::NO_QUOTED_FIELDS"
difficulty: 3
format: 2
tags: ["データ構造", "ハック", "最適化"]
---
## ひとことで

`CSV::FieldsConverter::NO_QUOTED_FIELDS` は、「どのフィールドも引用符で囲まれていない」ことを表す **空の配列** です。
ふつうの空の配列は、添字で調べると `nil` を返しますが、この配列は **どの添字で調べても `false` を返す** ように作ってあります。
毎回、引用符の情報を入れる配列を作らずに済むようにするための工夫です。

## コード

::: code-group

```ruby:line-numbers=8 [日本語訳]
    NO_QUOTED_FIELDS = [] # 内部用（ドキュメントには載せない）
    def NO_QUOTED_FIELDS.[](_index)
      false
    end
    NO_QUOTED_FIELDS.freeze
```

```ruby:line-numbers=8 [原文]
    NO_QUOTED_FIELDS = [] # :nodoc:
    def NO_QUOTED_FIELDS.[](_index)
      false
    end
    NO_QUOTED_FIELDS.freeze
```

:::

## 前提知識

- **配列の添字**: `配列[番号]` で、その位置の要素を取り出します。
- **特異メソッド（シングルトンメソッド）**: 1 つのオブジェクトだけに付けるメソッドです。`def NO_QUOTED_FIELDS.[](_index)` は、この配列だけに `[]` の動きを付けます。
- **`freeze`**: オブジェクトを変更できないようにします。
- **`_index`**: 先頭に `_` を付けた引数名は、使わないことを表します。
- **番兵（sentinel）**: 特別な場合を表すために置く、固定の値やオブジェクトのことです。

## 何をしているか

### 1. 空の配列を作る

::: code-group

```ruby:line-numbers=8 [日本語訳]
    NO_QUOTED_FIELDS = [] # 内部用（ドキュメントには載せない）
```

```ruby:line-numbers=8 [原文]
    NO_QUOTED_FIELDS = [] # :nodoc:
```

:::

まず、中身が空の配列を作ります。

### 2. 添字で調べたら、いつも false

```ruby:line-numbers=9
    def NO_QUOTED_FIELDS.[](_index)
      false
    end
```

この配列だけに `[]` を定義し直して、引数が何であっても `false` を返すようにします。
「その列は引用符で囲まれていない」という答えを、どの列についても返せるわけです。

### 3. 変更できないように固定する

```ruby:line-numbers=12
    NO_QUOTED_FIELDS.freeze
```

`freeze` で、後から要素を入れたり、`[]` の定義を書き換えたりできないようにします。

## ここがすごい

### 行ごとに配列を作らない

CSV を読むとき、行ごとに「どの列が引用符つきか」を入れる配列を作ると、行数が多いほど無駄なメモリを使います。
引用符がない通常の場合は、この 1 つの番兵を全行で共有できます。

### 添字の形を変えずに済む

呼び出し側は、普通の配列と同じ `quoted_fields[index]` の書き方で値を取り出せます。
特別な場合だけ別の書き方をする必要がなく、コードが分かれません。

### 番兵の代わりに `nil` を使わない理由

`nil` を返すと、「引用符なし」と「値がない」の区別があいまいになります。
`false` を返すことで、「引用符で囲まれていない」という答えを明確に表しています。

## まとめ

- 特殊な場合には、同じ形で振る舞う番兵オブジェクトを用意すると、呼び出し側の分岐を減らせます。
- 特異メソッドを使うと、1 つのオブジェクトだけに振る舞いを付けられます。
- 共有する値は `freeze` で変更できないようにすると、思わぬ書き換えを防げます。
