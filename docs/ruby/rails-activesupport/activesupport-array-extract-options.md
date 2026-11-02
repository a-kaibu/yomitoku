---
title: "可変長引数の最後のハッシュを取り出す extract_options!"
description: "Rails の多くの API が使う「最後の引数がハッシュならオプション」という約束を支える小さなメソッド。サブクラスを除外する工夫がある。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/extract_options.rb
lines: [3, 35]
function: "Array#extract_options!"
difficulty: 1
format: 2
tags: [API設計, イディオム, 型システム]
---

## ひとことで

`extract_options!` は、配列の **最後の要素がハッシュなら取り除いて返し、そうでなければ空のハッシュを返す** メソッドです。
`[1, 2, {a: :b}].extract_options!` は `{a: :b}` を返し、配列は `[1, 2]` になります。
`validates :name, :email, presence: true` のように「名前をいくつか並べて、最後にオプション」という Rails でおなじみの書き方を支えています。

## コード

::: code-group

```ruby:line-numbers=3 [日本語訳]
class Hash
  # 既定では、Hash そのもののインスタンスだけが取り出し対象です。
  # Hash のサブクラスは、このメソッドを実装して
  # true を返すことで取り出し対象だと宣言できます。Hash が
  # 取り出し対象なら、`Array#extract_options!` は
  # 配列の最後の要素である場合にそれを取り除きます。
  #: () -> bool  # 真偽値を返す
  def extractable_options?
    instance_of?(Hash)
  end
end

class Array
  # 引数の集まりからオプションを取り出します。配列の最後の要素が
  # ハッシュなら取り除いて返し、そうでなければ空のハッシュを返します。
  #
  # ```
  # def options(*args)
  #   args.extract_options!
  # end
  #
  # options(1, 2)        # => {}
  # options(1, 2, a: :b) # => {:a=>:b}
  # ```
  #: () -> Hash[untyped, untyped]
  def extract_options!
    if last.is_a?(Hash) && last.extractable_options?
      pop
    else
      {}
    end
  end
end
```

```ruby:line-numbers=3 [原文]
class Hash
  # By default, only instances of Hash itself are extractable.
  # Subclasses of Hash may implement this method and return
  # true to declare themselves as extractable. If a Hash
  # is extractable, `Array#extract_options!` pops it from
  # the Array when it is the last element of the Array.
  #: () -> bool
  def extractable_options?
    instance_of?(Hash)
  end
end

class Array
  # Extracts options from a set of arguments. Removes and returns the last
  # element in the array if it's a hash, otherwise returns a blank hash.
  #
  # ```
  # def options(*args)
  #   args.extract_options!
  # end
  #
  # options(1, 2)        # => {}
  # options(1, 2, a: :b) # => {:a=>:b}
  # ```
  #: () -> Hash[untyped, untyped]
  def extract_options!
    if last.is_a?(Hash) && last.extractable_options?
      pop
    else
      {}
    end
  end
end
```

:::

## 前提知識

- **可変長引数 `*args`**: `def options(*args)` と書くと、渡された引数がすべて配列 `args` に入ります。`options(1, 2, a: :b)` なら `args` は `[1, 2, {a: :b}]` です（キーワード引数を受け取らないメソッドでは、末尾の `a: :b` はハッシュとして入ります）。
- **ハッシュ**: `{キー => 値}` の組を集めたものです。`{a: :b}` は「キー `:a` に値 `:b`」です。
- **`last` と `pop`**: `last` は最後の要素を見るだけ、`pop` は最後の要素を **取り除いて** 返します。
- **`!` で終わるメソッド名**: Ruby では「呼ぶと自分自身を変更する（破壊的）」など、注意が必要なメソッドに `!` を付ける習慣があります。
- **`is_a?` と `instance_of?`**: `x.is_a?(Hash)` は x が Hash **またはそのサブクラス** なら真、`x.instance_of?(Hash)` は **ちょうど Hash クラス** のときだけ真です。
- **`#: () -> bool`**: RBS という型注釈をコメントで書いたものです。動作には影響しません。

## 何をしているか

### 1. ハッシュ側に「オプションとして扱ってよいか」を聞く

```ruby:line-numbers=3
class Hash
  # By default, only instances of Hash itself are extractable.
  # Subclasses of Hash may implement this method and return
  # true to declare themselves as extractable. If a Hash
  # is extractable, `Array#extract_options!` pops it from
  # the Array when it is the last element of the Array.
  #: () -> bool
  def extractable_options?
    instance_of?(Hash)
  end
end
```
`Hash#extractable_options?` は、自分が **ちょうど Hash クラスのオブジェクト** なら `true` を返します。

### 2. 配列の最後を調べる

```ruby:line-numbers=28
  def extract_options!
    if last.is_a?(Hash) && last.extractable_options?
      pop
    else
      {}
    end
  end
```
`[:name, :email, {presence: true}]` の場合で追うと、

1. `last` は `{presence: true}` で、ハッシュです。
2. `extractable_options?` も `true` です。
3. `pop` で取り除いて返すので、戻り値は `{presence: true}`、配列は `[:name, :email]` になります。

最後がハッシュでなければ `{}` を返します。呼び出し側は「オプションは必ずハッシュ」として扱えるので、`nil` チェックが要りません。

## ここがすごい

### サブクラスはオプション扱いしない

なぜ `is_a?(Hash)` だけで済ませず、`extractable_options?` という別のメソッドを用意しているのでしょうか。
Hash を継承したクラスには、「オプション」ではなく **データとして渡したい** ものがあります。たとえば Rails のリクエストパラメータなどがそうです。それを最後の引数に渡したとき、勝手にオプションとして抜き取られては困ります。
そこで既定では `instance_of?(Hash)` で「ふつうのハッシュだけ」をオプションとみなし、サブクラス側では必要に応じてこのメソッドを上書きして `true` を返せるようにしています。Rails の `HashWithIndifferentAccess` はこれを上書きしてオプションとして扱えるようにしています。

### 判断をオブジェクト自身に任せる

「これはオプションか？」を配列側の `if` で全部判定するのではなく、ハッシュ側のメソッドに聞く形にしたことで、新しいハッシュの仲間を作った人が自分で振る舞いを決められます。オブジェクト指向らしい拡張のしかたです。

### 戻り値をハッシュにそろえる

見つからないとき `nil` ではなく `{}` を返すので、`options[:presence]` のようにすぐ使えます。

## まとめ

- 「最後の引数がハッシュならオプション」は、キーワード引数が広まる前から Ruby で使われてきた定番パターンです。
- `is_a?` はサブクラスも含み、`instance_of?` はちょうどそのクラスだけを判定します。
- 判定をオブジェクト側のメソッドにしておくと、あとから振る舞いを変えられます。
- 「ない」ときも空のハッシュを返すと、呼び出し側のチェックが減ります。
