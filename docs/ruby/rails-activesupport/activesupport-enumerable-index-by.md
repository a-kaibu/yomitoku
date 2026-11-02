---
title: "配列を「キーで引ける辞書」に変える index_by"
description: "各要素からキーを作り、キーから要素を引けるハッシュを作る。ブロックなしで呼ばれたときの Enumerator の返し方も丁寧。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [58, 66]
function: "Enumerable#index_by"
difficulty: 1
format: 2
tags: [データ構造, ハッシュ, イテレータ]
---

## ひとことで

`index_by` は、配列などの各要素からキーを計算し、**キー → 要素** のハッシュ（辞書）を作るメソッドです。
`people.index_by(&:login)` とすると、`{ "alice" => <Person alice>, "bob" => <Person bob> }` のように、ログイン名から人を引けるようになります。
同じ人を何度も探すときに、毎回配列を最初から探し直さずに済みます。

## コード

```ruby:line-numbers=58
  def index_by
    if block_given?
      result = {}
      each { |elem| result[yield(elem)] = elem }
      result
    else
      to_enum(:index_by) { size if respond_to?(:size) }
    end
  end
```

## 前提知識

- **ハッシュ**: キーと値の組を集めたデータ構造です。`result[key] = value` で登録し、`result[key]` で取り出します。キーからの取り出しは、要素数が多くても速いのが特徴です。
- **ブロックと `yield`**: `index_by { |p| p.login }` の `{ ... }` がブロックです。`yield(elem)` は、そのブロックに `elem` を渡して実行し、結果を受け取ります。
- **`&:login`**: `{ |x| x.login }` の省略形です。
- **`each`**: 要素を 1 つずつ取り出してブロックを実行します。
- **`to_enum(:index_by) { ... }`**: ブロックなしで呼ばれたときに、あとからブロックを受け取れる Enumerator（列挙子）を返します。`{ ... }` の部分は「要素数はいくつか」を答えるブロックです。
- **`size if respond_to?(:size)`**: `size` を持っていればそれを返し、持っていなければ `nil`（不明）になります。

## 何をしているか

### 1. ブロックがあればハッシュを作る

```ruby:line-numbers=59
    if block_given?
      result = {}
      each { |elem| result[yield(elem)] = elem }
      result
```
`[alice, bob].index_by(&:login)` で追うと、

1. `alice` に対してブロックを実行し `"alice"` を得る → `result["alice"] = alice`
2. `bob` に対して `"bob"` を得る → `result["bob"] = bob`

最後に `result` を返します。同じキーの要素が複数あれば、**後から来たものが上書き** します。

### 2. ブロックがなければ Enumerator を返す

```ruby:line-numbers=63
    else
      to_enum(:index_by) { size if respond_to?(:size) }
    end
```
`people.index_by` とだけ書くと Enumerator が返ります。たとえば `people.index_by.with_index { |p, i| i }` のように、別のメソッドと組み合わせられます。

## ここがすごい

### 検索を速くする定番の変換

配列から条件に合う要素を探す `find` は、最悪の場合すべての要素を調べます。同じ配列から何度も探すなら、最初に 1 回だけ `index_by` でハッシュにしておけば、それ以降はキーで一瞬で取り出せます。
たとえば「注文の一覧それぞれに、対応する顧客を結び付ける」処理では、顧客を `index_by(&:id)` しておくのが定番です。

### 標準メソッドと同じ約束を守る

ブロックなしで Enumerator を返すのは、Ruby の `map` や `group_by` と同じ約束です。しかも `size` が分かるコレクションなら、Enumerator にも要素数を教えています。こうしておくと `enum.size` がループせずに答えられます。

### group_by との使い分け

似たメソッドに Ruby 標準の `group_by` があり、こちらは同じキーの要素を **配列にまとめて** 保持します。キーが一意（ID など）とわかっているなら `index_by` の方が、値が配列にならず扱いやすくなります。

## まとめ

- 何度も探すなら、最初にハッシュに変換しておくと速くなります。
- `index_by` は「キー → 要素 1 つ」、`group_by` は「キー → 要素の配列」です。
- ブロックなしで Enumerator を返すと、標準メソッドとの組み合わせがしやすくなります。
