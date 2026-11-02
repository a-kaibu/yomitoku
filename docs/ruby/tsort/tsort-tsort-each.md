---
title: "依存関係を、順番どおりに 1 つずつ取り出す"
description: "TSort.tsort_each は、依存のグラフを、先に処理すべきものから順に取り出す。循環があれば Cyclic 例外を出して、順序が決まらないと知らせる。"
language: ruby
project: "Ruby tsort (標準ライブラリ)"
repo: https://github.com/ruby/tsort
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "af67b565a5a0006a35220253d50e178bc63e7cca"
file: lib/tsort.rb
lines: [228, 238]
function: "TSort.tsort_each"
difficulty: 2
format: 2
tags: ["アルゴリズム", "データ構造", "イテレータ"]
---
## ひとことで

`TSort.tsort_each` は、依存関係のグラフを、**依存される側から順に** 1 つずつ取り出すメソッドです。
たとえば「A は B に依存し、B は C に依存する」なら、C、B、A の順に渡します。
循環（A が B に、B が A に依存するなど）があると、順序が決まらないので、`Cyclic` という例外を出します。

## コード

::: code-group

```ruby:line-numbers=228 [日本語訳]
  def self.tsort_each(each_node, each_child) # 並べ替えた順に、ノードを渡すブロック
    return to_enum(__method__, each_node, each_child) unless block_given?

    each_strongly_connected_component(each_node, each_child) {|component|
      if component.size == 1
        yield component.first
      else
        raise Cyclic.new("topological sort failed: #{component.inspect}")
      end
    }
  end
```

```ruby:line-numbers=228 [原文]
  def self.tsort_each(each_node, each_child) # :yields: node
    return to_enum(__method__, each_node, each_child) unless block_given?

    each_strongly_connected_component(each_node, each_child) {|component|
      if component.size == 1
        yield component.first
      else
        raise Cyclic.new("topological sort failed: #{component.inspect}")
      end
    }
  end
```

:::

## 前提知識

- **トポロジカルソート**: 依存関係に反しない順番に、頂点を並べることです。ビルドの順序や、パッケージのインストール順を決めるときに使われます。
- **強連結成分**: 循環でつながった頂点の集まりです。1 つだけの成分なら、循環はありません。
- **`to_enum`**: ブロックなしで呼ばれたとき、あとで繰り返せる列挙子を返します。
- **`Cyclic`**: 循環があったことを表す例外の種類です。
- **`component.first`**: 成分の配列の先頭の要素を取り出します。

## 何をしているか

### 1. ブロックがなければ、列挙子を返す

```ruby:line-numbers=229
    return to_enum(__method__, each_node, each_child) unless block_given?
```

ブロックがないときは、`to_enum` で列挙子を返します。あとからブロックを渡せば、順に取り出せます。

### 2. 強連結成分を、依存の順に取り出す

```ruby:line-numbers=231
    each_strongly_connected_component(each_node, each_child) {|component|
```

`each_strongly_connected_component` は、依存される側から順に、成分を渡します。ここで、その成分を 1 つずつ調べます。

### 3. 要素が 1 つなら、そのまま渡す。循環なら例外

```ruby:line-numbers=232
      if component.size == 1
        yield component.first
      else
        raise Cyclic.new("topological sort failed: #{component.inspect}")
      end
```

成分の要素が 1 つなら、循環のない頂点なので、そのまま `yield` で渡します。要素が複数なら、循環があるので、`Cyclic` の例外を出します。

## ここがすごい

### 成分の仕組みを、そのまま順序に使う

強連結成分は、依存の順に並んで取り出されます。
そのため、このメソッドは成分を受け取るだけで、正しい順番を得られます。

### 循環を、例外として知らせる

循環があると、順序は決まりません。無理に順番を作ると、誤った結果になります。
例外で止めることで、どの頂点が循環しているかを、メッセージに含めて伝えられます。

### 列挙子を返す形にする

`to_enum` のおかげで、`each` のように使うことも、`to_a` で一度に集めることもできます。
利用者は、必要な形で結果を取り出せます。

## まとめ

- 依存の順序は、トポロジカルソートで決まり、成分を使うと循環の検出とまとめて扱えます。
- 循環は、無理に順序を作らず、例外で知らせると、誤りを防げます。
- ブロックのない呼び出しで列挙子を返すと、利用者が結果の使い方を選べます。
