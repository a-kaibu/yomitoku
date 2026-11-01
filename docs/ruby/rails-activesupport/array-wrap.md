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
tags: [イディオム, API設計, 防御的プログラミング]
---

## ひとことで

`Array.wrap` は、受け取った値を **必ず配列にして返す** メソッドです。
`Array.wrap(nil)` は `[]`、`Array.wrap([1, 2])` は `[1, 2]`、`Array.wrap(0)` は `[0]` になります。
「1 個でも複数でも受け付ける引数」を扱うときに、呼び出し側の分岐をなくしてくれます。

## コード

```ruby:line-numbers=5
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

## 前提知識

- **`class Array ... end` で既存クラスに追加**: Ruby は組み込みクラスを後から開いてメソッドを足せます。
- **`def self.wrap`**: `self.` を付けて定義すると、インスタンスではなくクラスそのものから呼ぶメソッド（クラスメソッド）になります。`Array.wrap(x)` のように使います。
- **`nil`**: 「値がない」ことを表す特別な値です。
- **`respond_to?(:to_ary)`**: そのオブジェクトが `to_ary` というメソッドを持っているかを調べます。`:to_ary` はシンボル（名前を表す軽量な値）です。
- **`to_ary` と `to_a`**: どちらも配列に変換するメソッドですが意味が違います。`to_ary` は「私は配列そのものとして扱われてよい」という **強い** 変換、`to_a` は「配列に変換することもできる」という **弱い** 変換です。ハッシュは `to_a` を持ちますが `to_ary` は持ちません。
- **`a || b`**: `a` が `nil` か `false` なら `b` を、そうでなければ `a` を返します。
- **ドキュメントコメント**: `#` から始まる行はコメントです。ここではメソッドの使い方と、似たメソッドとの違いが丁寧に書かれています。

## 何をしているか

### 1. nil なら空配列（42〜43 行目）

「値がない」は「要素が 0 個」と同じとみなして `[]` を返します。

### 2. 配列のようなものは、その中身を使う（44〜45 行目）

`to_ary` を持つオブジェクト（配列そのものや、配列のふりをするクラス）なら、`to_ary` の結果を返します。
`[1, 2, 3]` を渡すと `[1, 2, 3]` が返り、`[[1, 2, 3]]` のように二重に包まれることはありません。
もし `to_ary` が `nil` を返す変わったオブジェクトなら、`|| [object]` によってそのオブジェクトを 1 要素の配列にします。

### 3. それ以外は 1 要素の配列（46〜47 行目）

数値や文字列、ハッシュなどは `[object]` で包みます。`Array.wrap(foo: :bar)` は `[{foo: :bar}]` です。

## ここがすごい

### Kernel#Array との違いを意識して作られている

Ruby には最初から `Array(x)` という似た関数があります。しかし `Array(x)` は `to_a` も試すため、ハッシュを渡すと `Array(foo: :bar) # => [[:foo, :bar]]` のように **キーと値のペアの配列に分解されてしまいます**。
「ハッシュ 1 個を渡したつもりが、バラバラになった」というのはよくある事故です。`Array.wrap` は `to_a` を使わないことで、これを防いでいます（28〜31 行目のコメント）。

### 例外を出さない

`Array(x)` は `to_ary` が配列以外を返すと例外を出しますが、`Array.wrap` はそのまま返します（23〜24 行目）。オプション引数のように「なんでも来うる値」を扱う場面では、落ちないことが大事です。

### 呼び出し側がシンプルになる

たとえば `before_action :a` と `before_action [:a, :b]` の両方を受け付けたいとき、受け取った側は `Array.wrap(options).each { ... }` と 1 行で書けます。`if x.is_a?(Array)` のような分岐を毎回書かずに済みます。

## まとめ

- 「1 個でも複数でも nil でも OK」な引数は、最初に配列へそろえると後の処理が単純になります。
- Ruby の `to_ary`（強い変換）と `to_a`（弱い変換）の違いは、変換の意図を表しています。
- 既存の関数があっても、困る挙動（ハッシュの分解など）があるなら、意図に合わせた小さなメソッドを作る価値があります。
- ドキュメントで「似たものとの違い」を書いておくと、使う人が迷いません。
