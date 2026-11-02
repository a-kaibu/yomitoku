---
title: "入れ子のハッシュのキーをその場で一括変換する再帰関数"
description: "deep_symbolize_keys! などの土台になる非公開メソッド。keys で一覧を先に取ってから delete と代入でキーを差し替え、配列の中まで再帰する。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/hash/keys.rb
lines: [143, 156]
function: "Hash#_deep_transform_keys_in_object!"
difficulty: 2
format: 2
tags: [再帰, ハッシュ, データ構造]
---

## ひとことで

`_deep_transform_keys_in_object!` は、ハッシュの **すべてのキーを、入れ子の奥まで変換する** 内部用のメソッドです。
`deep_symbolize_keys!`（キーを全部シンボルにする）や `deep_stringify_keys!`（全部文字列にする）は、このメソッドに変換のブロックを渡すだけで作られています。
`{ "user" => { "name" => "a" } }` を `{ user: { name: "a" } }` に、**新しいハッシュを作らずにその場で** 書き換えます。

## コード

```ruby:line-numbers=143
    def _deep_transform_keys_in_object!(object, &block)
      case object
      when Hash
        object.keys.each do |key|
          value = object.delete(key)
          object[yield(key)] = _deep_transform_keys_in_object!(value, &block)
        end
        object
      when Array
        object.map! { |e| _deep_transform_keys_in_object!(e, &block) }
      else
        object
      end
    end
```

## 前提知識

- **`private`**: これ以降のメソッドは外から直接呼べない、内部用のメソッドになります。名前の先頭の `_` も「内部用」の目印です。
- **`case object when Hash`**: `object` がハッシュなら、という分岐です。`when Array` は配列なら、です。
- **`&block` と `yield`**: 渡されたブロックを変数 `block` として受け取りつつ、`yield(key)` でそのブロックを実行しています。再帰呼び出しでは `&block` で同じブロックを次に渡します。
- **`object.keys`**: ハッシュのキーの一覧を **新しい配列として** 返します。
- **`delete(key)`**: ハッシュからその組を取り除き、値を返します。
- **`map!`**: 配列の各要素をブロックの結果で **置き換えます**（新しい配列を作らない破壊的な版）。

## 何をしているか

### 1. ハッシュのとき

```ruby:line-numbers=145
      when Hash
        object.keys.each do |key|
          value = object.delete(key)
          object[yield(key)] = _deep_transform_keys_in_object!(value, &block)
        end
        object
```
`{ "user" => { "name" => "a" } }` にシンボル化のブロックを渡す場合、

1. `keys` で `["user"]` を取り出す
2. `delete("user")` で組を取り除き、値 `{ "name" => "a" }` を受け取る
3. その値に対して自分自身を再帰的に呼び、`{ name: "a" }` にする
4. `object[:user] = { name: "a" }` で入れ直す

最後に書き換えたハッシュを返します。

### 2. 配列のとき

```ruby:line-numbers=151
      when Array
        object.map! { |e| _deep_transform_keys_in_object!(e, &block) }
```
`{ "items" => [{ "id" => 1 }] }` のように、配列の中にハッシュがある場合も、各要素に再帰することで変換されます。

### 3. それ以外

```ruby:line-numbers=153
      else
        object
```
文字列や数値などはキーを持たないので、そのまま返します。

## ここがすごい

### 一覧を先に取ってからループする

ハッシュを `each` で回しながら、その中でキーを追加・削除すると、Ruby では「繰り返し中にハッシュにキーを追加できない」というエラーになります。
`object.keys` は **その時点のキーのコピー（配列）** なので、それを回しながら元のハッシュを自由に書き換えられます。

### delete と代入で「キーの付け替え」

ハッシュにはキーの名前だけを変える操作がありません。そこで「取り除いて、新しいキーで入れ直す」という 2 段階で付け替えています。`delete` が値を返してくれるので、一時変数 1 つで済みます。

### 変換の内容を外から受け取る

このメソッド自体は「キーをどう変えるか」を知りません。ブロックで受け取ることで、シンボル化、文字列化、任意の変換（`deep_transform_keys!`）のすべてを、この 1 つの再帰で実現しています。

### 配列にも潜る

JSON から作ったデータには、ハッシュの中の配列の中のハッシュ、という構造がよくあります。配列の場合も再帰することで、どんな形の入れ子でも漏れなく変換できます。

## まとめ

- 繰り返し中にハッシュを変更したいときは、`keys` で一覧のコピーを先に取ります。
- キーの名前を変えるには「`delete` して新しいキーで入れ直す」のが定番です。
- 処理の中身をブロックで受け取ると、1 つの再帰関数をいろいろな用途に使い回せます。
- ハッシュと配列の両方に再帰すると、JSON のような入れ子データ全体を扱えます。
