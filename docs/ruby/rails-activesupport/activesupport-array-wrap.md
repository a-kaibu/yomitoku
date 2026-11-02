---
title: "何を渡しても配列にしてくれる Array.wrap の気配り"
description: "nil は空配列に、配列はそのまま、それ以外は要素 1 つの配列に。Kernel#Array との微妙な違いまで考えて作られた小さなメソッド。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/wrap.rb
lines: [5, 50]
function: "Array.wrap"
difficulty: 1
format: 2
tags: [イディオム, API設計, 防御的プログラミング]
---

## ひとことで

`Array.wrap` は、受け取った値を **必ず配列にして返す** メソッドです。
`Array.wrap(nil)` は `[]`、`Array.wrap([1, 2])` は `[1, 2]`、`Array.wrap(0)` は `[0]` になります。
「1 個でも複数でも受け付ける引数」を扱うときに、呼び出し側の分岐をなくしてくれます。

## コード

::: code-group

```ruby:line-numbers=5 [日本語訳]
class Array
  # 引数が配列（配列のようなもの）でなければ、配列で包みます。
  #
  # 具体的には次のとおりです。
  #
  # * 引数が +nil+ なら空の配列を返します。
  # * それ以外で +to_ary+ に応答するなら、それを呼んで結果を返します。
  # * それ以外は、引数を 1 要素だけ持つ配列を返します。
  #
  #     Array.wrap(nil)       # => []  （nil は空）
  #     Array.wrap([1, 2, 3]) # => [1, 2, 3]  （配列はそのまま）
  #     Array.wrap(0)         # => [0]  （それ以外は 1 要素の配列）
  #
  # このメソッドは <tt>Kernel#Array</tt> と目的は似ていますが、次の違いがあります：
  #
  # * 引数が +to_ary+ に応答すると、そのメソッドを呼びます。<tt>Kernel#Array</tt>
  #   は戻り値が +nil+ なら +to_a+ を試しますが、<tt>Array.wrap</tt> は返します
  #   引数を 1 要素とする配列をすぐ返します。
  # * +to_ary+ の戻り値が +nil+ でも +Array+ でもなければ、<tt>Kernel#Array</tt> は
  #   例外を出しますが、<tt>Array.wrap</tt> は例外を出さず、その値を返すだけです。
  # * 引数が +to_ary+ に応答しない場合、+to_a+ は呼びません
  #   引数を 1 要素とする配列を返します。
  #
  # 最後の点は、列挙可能なオブジェクトで説明するとわかりやすいです：
  #
  #   Array(foo: :bar)      # => [[:foo, :bar]]  （キーと値に分解される）
  #   Array.wrap(foo: :bar) # => [{:foo=>:bar}]  （ハッシュ 1 個のまま）
  #
  # スプラット演算子を使った関連する書き方もあります：
  #
  #   [*object]  （配列に展開する書き方）
  #
  # これは +nil+ なら <tt>[]</tt> を返し、それ以外は <tt>Array(object)</tt> を呼びます。
  #
  # <tt>Kernel#Array</tt> との違いは上で説明したとおりで、
  # ほかの <tt>object</tt> にも当てはまります。
  def self.wrap(object)
    if object.nil?
      []
    elsif object.respond_to?(:to_ary)
      object.to_ary || [object]
    else
      [object]
    end
  end
end
```

```ruby:line-numbers=5 [原文]
class Array
  # Wraps its argument in an array unless it is already an array (or array-like).
  #
  # Specifically:
  #
  # * If the argument is +nil+ an empty array is returned.
  # * Otherwise, if the argument responds to +to_ary+ it is invoked, and its result returned.
  # * Otherwise, returns an array with the argument as its single element.
  #
  #     Array.wrap(nil)       # => []
  #     Array.wrap([1, 2, 3]) # => [1, 2, 3]
  #     Array.wrap(0)         # => [0]
  #
  # This method is similar in purpose to <tt>Kernel#Array</tt>, but there are some differences:
  #
  # * If the argument responds to +to_ary+ the method is invoked. <tt>Kernel#Array</tt>
  #   moves on to try +to_a+ if the returned value is +nil+, but <tt>Array.wrap</tt> returns
  #   an array with the argument as its single element right away.
  # * If the returned value from +to_ary+ is neither +nil+ nor an +Array+ object, <tt>Kernel#Array</tt>
  #   raises an exception, while <tt>Array.wrap</tt> does not, it just returns the value.
  # * It does not call +to_a+ on the argument, if the argument does not respond to +to_ary+
  #   it returns an array with the argument as its single element.
  #
  # The last point is easily explained with some enumerables:
  #
  #   Array(foo: :bar)      # => [[:foo, :bar]]
  #   Array.wrap(foo: :bar) # => [{:foo=>:bar}]
  #
  # There's also a related idiom that uses the splat operator:
  #
  #   [*object]
  #
  # which returns <tt>[]</tt> for +nil+, but calls to <tt>Array(object)</tt> otherwise.
  #
  # The differences with <tt>Kernel#Array</tt> explained above
  # apply to the rest of <tt>object</tt>s.
  def self.wrap(object)
    if object.nil?
      []
    elsif object.respond_to?(:to_ary)
      object.to_ary || [object]
    else
      [object]
    end
  end
end
```

:::

## 前提知識

- **`class Array ... end` で既存クラスに追加**: Ruby は組み込みクラスを後から開いてメソッドを足せます。
- **`def self.wrap`**: `self.` を付けて定義すると、インスタンスではなくクラスそのものから呼ぶメソッド（クラスメソッド）になります。`Array.wrap(x)` のように使います。
- **`nil`**: 「値がない」ことを表す特別な値です。
- **`respond_to?(:to_ary)`**: そのオブジェクトが `to_ary` というメソッドを持っているかを調べます。`:to_ary` はシンボル（名前を表す軽量な値）です。
- **`to_ary` と `to_a`**: どちらも配列に変換するメソッドですが意味が違います。`to_ary` は「私は配列そのものとして扱われてよい」という **強い** 変換、`to_a` は「配列に変換することもできる」という **弱い** 変換です。ハッシュは `to_a` を持ちますが `to_ary` は持ちません。
- **`a || b`**: `a` が `nil` か `false` なら `b` を、そうでなければ `a` を返します。
- **ドキュメントコメント**: `#` から始まる行はコメントです。ここではメソッドの使い方と、似たメソッドとの違いが丁寧に書かれています。

## 何をしているか

### 1. nil なら空配列

```ruby:line-numbers=42
    if object.nil?
      []
```
「値がない」は「要素が 0 個」と同じとみなして `[]` を返します。

### 2. 配列のようなものは、その中身を使う

```ruby:line-numbers=44
    elsif object.respond_to?(:to_ary)
      object.to_ary || [object]
```
`to_ary` を持つオブジェクト（配列そのものや、配列のふりをするクラス）なら、`to_ary` の結果を返します。
`[1, 2, 3]` を渡すと `[1, 2, 3]` が返り、`[[1, 2, 3]]` のように二重に包まれることはありません。
もし `to_ary` が `nil` を返す変わったオブジェクトなら、`|| [object]` によってそのオブジェクトを 1 要素の配列にします。

### 3. それ以外は 1 要素の配列

```ruby:line-numbers=46
    else
      [object]
```
数値や文字列、ハッシュなどは `[object]` で包みます。`Array.wrap(foo: :bar)` は `[{foo: :bar}]` です。

## ここがすごい

### Kernel#Array との違いを意識して作られている

Ruby には最初から `Array(x)` という似た関数があります。しかし `Array(x)` は `to_a` も試すため、ハッシュを渡すと `Array(foo: :bar) # => [[:foo, :bar]]` のように **キーと値のペアの配列に分解されてしまいます**。
「ハッシュ 1 個を渡したつもりが、バラバラになった」というのはよくある事故です。`Array.wrap` は `to_a` を使わないことで、これを防いでいます（コード中のコメント）。

### 例外を出さない

`Array(x)` は `to_ary` が配列以外を返すと例外を出しますが、`Array.wrap` はそのまま返します。オプション引数のように「なんでも来うる値」を扱う場面では、落ちないことが大事です。

### 呼び出し側がシンプルになる

たとえば `before_action :a` と `before_action [:a, :b]` の両方を受け付けたいとき、受け取った側は `Array.wrap(options).each { ... }` と 1 行で書けます。`if x.is_a?(Array)` のような分岐を毎回書かずに済みます。

## まとめ

- 「1 個でも複数でも nil でも OK」な引数は、最初に配列へそろえると後の処理が単純になります。
- Ruby の `to_ary`（強い変換）と `to_a`（弱い変換）の違いは、変換の意図を表しています。
- 既存の関数があっても、困る挙動（ハッシュの分解など）があるなら、意図に合わせた小さなメソッドを作る価値があります。
- ドキュメントで「似たものとの違い」を書いておくと、使う人が迷いません。
