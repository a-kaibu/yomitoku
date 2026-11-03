---
title: "キーが無いときに、例外か既定値かを選べる取り出し方"
description: "PStore#fetch は、キーが無いときに例外を投げるか、指定した既定値を返すかを、引数の比較で切り替える。"
language: ruby
project: "Ruby pstore (標準ライブラリ)"
repo: https://github.com/ruby/pstore
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4491e7119cf03283f2f299b65a8139c25653c77a"
file: lib/pstore.rb
lines: [455, 465]
function: "PStore#fetch"
difficulty: 1
format: 2
tags: ["API設計", "防御的プログラミング", "データ構造"]
---
## ひとことで

`PStore#fetch` は、保存されている値をキーで取り出します。キーが無いときは、例外を投げるか、既定値を返すかを選べます。
`Hash#fetch` と同じ使い方ができるように作られています。
既定値を指定しなければ、無いキーは必ずエラーになります。

## コード

```ruby:line-numbers=455
  def fetch(key, default=PStore::Error)
    in_transaction
    unless @table.key? key
      if PStore::Error.equal?(default)
        raise PStore::Error, format("undefined key '%s'", key)
      else
        return default
      end
    end
    @table[key]
  end
```

## 前提知識

- **`PStore`**: Ruby の値を、ファイルに保存しておくための標準ライブラリです。`[]` や `[]=` で、キーと値のように扱えます。
- **`Hash#fetch`**: 同じ名前の、ハッシュ用の取り出しメソッドです。キーが無いと `KeyError` を投げます。
- **デフォルト引数**: `default=PStore::Error` のように、引数に既定の値を入れておく書き方です。引数を省略したとき、この値が使われます。
- **`equal?`**: 2 つの値が、同じオブジェクトかを調べるメソッドです。`==` と違い、中身が似ているだけでは真になりません。
- **番兵（センチネル）の値**: 「未指定」を表すために、特別な値を使う考え方です。ここでは `PStore::Error` という例外クラスが、その役目を果たしています。

## 何をしているか

### 1. トランザクションの中かを確かめる

```ruby:line-numbers=456
    in_transaction
```

`fetch` は、`transaction` のブロックの中でだけ使えます。外で呼ばれたら、ここで例外になります。
読み取りでも、ファイルの一貫性を保つためにこの確認をします。

### 2. キーが無いかを確かめる

```ruby:line-numbers=457
    unless @table.key? key
```

`@table` は、読み込んだデータを保持するハッシュです。`key?` でキーの有無を確かめます。
キーがあれば、`return` されずに、最後の `@table[key]` で値を返します。

### 3. 既定値が「番兵」かを比べる

```ruby:line-numbers=458
      if PStore::Error.equal?(default)
```

引数を省略したときの既定値は、`PStore::Error` そのものです。
`equal?` で、同じオブジェクトかを比べます。`nil` や `""` を既定値にした場合は、違う値なので、エラーにはならず、その値が返ります。

### 4. 例外か、既定値かを決める

```ruby:line-numbers=459
        raise PStore::Error, format("undefined key '%s'", key)
```

番兵のままなら、キーが無いことを例外で知らせます。
それ以外なら、`return default` で、指定された値を返します。

## ここがすごい

### 「無い」と「nil」を区別できる

既定値に `nil` を使うと、「キーが無い」のか「値が nil として保存されている」のかが分かりません。
この実装は、キーの有無を直接確かめ、番兵との比較で例外を決めるので、2 つを正しく区別できます。

### 例外クラスを、そのまま番兵にしている

`PStore::Error` は、保存に関するエラーを表すクラスです。それを既定値に使うことで、新しい定数を作らずに「未指定」を表しています。
利用者は、`fetch("key")` と書けば例外、`fetch("key", 0)` と書けば 0 が返る、と直感的に使えます。

### `Hash#fetch` と同じ書き方に合わせている

Ruby の標準的な書き方に合わせてあるので、読み手は新しい使い方を覚えずに済みます。
`PStore` を Hash の代わりにファイルへ保存して使う場面でも、コードの見た目が変わりません。

## まとめ

- `fetch` は、キーが無いときに、例外か既定値かを選べます。
- 既定値の比較に `equal?` を使うので、`nil` などの値と「無い」を区別できます。
- 既定値の番兵に、保存用の例外クラスを使い、新しい定数を増やしていません。
- `Hash#fetch` と同じ書き方なので、そのまま置き換えて使えます。
