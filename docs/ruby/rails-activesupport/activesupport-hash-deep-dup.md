---
title: "キーまでコピーするかを型で見分ける Hash#deep_dup"
description: "入れ子になったハッシュを丸ごと複製する deep_dup。文字列やシンボルのキーはそのまま使い、それ以外のキーだけを複製し直す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/deep_dup.rb
lines: [50, 61]
function: "Hash#deep_dup"
difficulty: 2
format: 2
tags: [データ構造, 再帰, ハッシュ]
---

## ひとことで

`deep_dup` は、入れ子になったハッシュを **中身まで丸ごと複製する** メソッドです。
`hash = { a: { b: "b" } }` をふつうの `dup` でコピーすると、内側の `{ b: "b" }` は元と共有されたままです。`deep_dup` なら内側も別物になるので、コピーを変更しても元に影響しません。
設定のハッシュを少し変えて使いたい、といった場面で役立ちます。

## コード

```ruby:line-numbers=50
  def deep_dup
    hash = dup
    each_pair do |key, value|
      if ::String === key || ::Symbol === key
        hash[key] = value.deep_dup
      else
        hash.delete(key)
        hash[key.deep_dup] = value.deep_dup
      end
    end
    hash
  end
```

## 前提知識

- **浅いコピーと深いコピー**: `dup` は外側の入れ物だけを新しく作り、中に入っているオブジェクトは元と同じものを指します（浅いコピー）。中身まで再帰的に新しく作るのが深いコピーです。
- **`each_pair do |key, value|`**: ハッシュのキーと値を 1 組ずつ取り出します。
- **`::String === key`**: `===` はクラスに対して使うと「そのクラスのオブジェクトか」を調べます。先頭の `::` は「いちばん外側（トップレベル）の String」という意味で、同じ名前の別のクラスと取り違えないようにしています。
- **`value.deep_dup`**: 値の側でも `deep_dup` を呼びます。Rails はすべてのオブジェクトに `deep_dup` を定義しており、配列なら各要素を、ハッシュならこのメソッドを、それ以外は `dup` を使います。
- **ハッシュのキーの扱い**: Ruby のハッシュは、文字列をキーにすると自動で **凍結されたコピー** をキーとして保存します。

## 何をしているか

### 1. まず外側をコピー

```ruby:line-numbers=51
    hash = dup
```
`hash = dup` で、キーと値の組が同じ新しいハッシュを作ります。この時点では値は元と共有されています。

### 2. 組ごとに中身を複製し直す

```ruby:line-numbers=52
    each_pair do |key, value|
      if ::String === key || ::Symbol === key
        hash[key] = value.deep_dup
      else
        hash.delete(key)
        hash[key.deep_dup] = value.deep_dup
      end
    end
```
- キーが文字列かシンボルなら、値だけを `deep_dup` して上書きします。
- それ以外のキー（配列やハッシュなどがキーになっている場合）は、いったんその組を削除し、キーも値も `deep_dup` して入れ直します。

`{ a: { b: "b" } }` では、キー `:a` はシンボルなので、値の `{ b: "b" }` だけが再帰的に複製されます。

### 3. 新しいハッシュを返す

```ruby:line-numbers=60
    hash
```
## ここがすごい

### キーを複製する必要があるかを見分ける

キーも全部 `deep_dup` すれば単純ですが、それだと無駄が出ます。
シンボルは変更できない値なので複製する意味がありません。文字列のキーも、前提知識に書いたとおり Ruby が最初から凍結済みのコピーを持っているので、変更される心配がありません。
一方、配列をキーにしている場合は、その配列を後から変更されるとハッシュが壊れる（キーで引けなくなる）おそれがあるので、きちんと複製します。
**よくあるキー（文字列・シンボル）は速い道、珍しいキーだけ丁寧な道** という分け方です。

### 削除してから入れ直す

キーを複製する場合、新しいキーで値を入れるだけでは、元のキーの組が残ってしまいます。`hash.delete(key)` で先に削除しているのはそのためです。

### 再帰はメソッドの呼び分けで実現

このメソッドの中には「値が配列ならこう、ハッシュならこう」という分岐がありません。値の側の `deep_dup` を呼ぶだけで、それぞれのクラスに定義された `deep_dup` が適切に動きます。入れ子が何段あっても、自然に再帰的に複製されます。

## まとめ

- `dup` は浅いコピーです。入れ子のデータを安全に変更したいなら深いコピーが必要です。
- 変更できない（凍結された）オブジェクトは、複製しなくても共有して問題ありません。
- クラスごとに同じ名前のメソッドを用意すれば、分岐を書かずに再帰的な処理ができます。
