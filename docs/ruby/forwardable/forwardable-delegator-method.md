---
title: "委譲メソッドを文字列から組み立てて定義する"
description: "Forwardable は、別のオブジェクトへ渡すメソッドを、文字列の Ruby コードとして組み立てて eval する。警告の出し方と行番号も合わせている。"
language: ruby
project: "Ruby forwardable (標準ライブラリ)"
repo: https://github.com/ruby/forwardable
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "e4861311de4ada4cd80e375c89a17785cfad1fd3"
file: lib/forwardable.rb
lines: [201, 234]
function: "Forwardable._delegator_method"
difficulty: 3
format: 2
tags: ["メタプログラミング", "API設計", "マクロ"]
---
## ひとことで

`Forwardable._delegator_method` は、**別のオブジェクトに仕事を渡す（委譲する）メソッドを、文字列の Ruby コードとして組み立てて定義する** 内部メソッドです。
`def_delegator :@items, :size` と書くと、`size` を呼ぶと `@items.size` の結果が返るメソッドが作られます。
ここでは、そのためのコードを作り、`eval` で実行しています。

## コード

```ruby:line-numbers=201
  def self._delegator_method(obj, accessor, method, ali)
    accessor = accessor.to_s unless Symbol === accessor

    if Module === obj ?
         obj.method_defined?(accessor) || obj.private_method_defined?(accessor) :
         obj.respond_to?(accessor, true)
      accessor = "(#{accessor}())"
    end

    args = RUBY_VERSION >= '2.7' ? '...' : '*args, &block'
    method_call = ".__send__(:#{method}, #{args})"
    if method.match?(/\A[_a-zA-Z]\w*[?!]?\z/)
      loc, = caller_locations(2,1)
      pre = "_ ="
      mesg = "#{Module === obj ? obj : obj.class}\##{ali} at #{loc.path}:#{loc.lineno} forwarding to private method "
      method_call = <<~RUBY.chomp
        if defined?(_.#{method})
          _.#{method}(#{args})
        else
          ::Kernel.warn #{mesg.dump}"\#{_.class}"'##{method}', uplevel: 1
          _#{method_call}
        end
      RUBY
    end

    eval(<<~RUBY, nil, __FILE__, __LINE__ + 1)
      proc do
        def #{ali}(#{args})
          #{pre}#{accessor}
          #{method_call}
        end
      end
    RUBY
  end
```

## 前提知識

- **委譲（delegation）**: ほかのオブジェクトに仕事を任せることです。`Forwardable` は、この転送のメソッドを簡単に定義するためのモジュールです。
- **`eval`**: 文字列を Ruby のコードとして実行します。
- **ヒアドキュメント（`<<~RUBY`）**: 複数行の文字列を書く記法です。`~` は、行頭の空白をそろえて取り除きます。
- **`__send__`**: 名前で指定したメソッドを呼びます。
- **`caller_locations`**: 呼び出し元の場所（ファイル名と行番号）を取得します。警告に使われます。
- **`Module === obj`**: `obj` がモジュールかを調べます。

## 何をしているか

### 1. 委譲先の指定を、呼べる形にする

```ruby:line-numbers=202
    accessor = accessor.to_s unless Symbol === accessor

    if Module === obj ?
         obj.method_defined?(accessor) || obj.private_method_defined?(accessor) :
         obj.respond_to?(accessor, true)
      accessor = "(#{accessor}())"
    end
```

委譲先（accessor）は、文字列にそろえます。もしそれが、そのオブジェクトのメソッドの名前なら、`(accessor())` のように、メソッドを呼ぶ形に書き換えます。
`@items` のようなインスタンス変数なら、そのまま使います。

### 2. 呼び出しの形を作る

```ruby:line-numbers=210
    args = RUBY_VERSION >= '2.7' ? '...' : '*args, &block'
    method_call = ".__send__(:#{method}, #{args})"
```

`args` は、Ruby 2.7 以降では `...` で、引数もブロックもまとめて渡します。`method_call` は、委譲先で `__send__` を呼ぶ式の文字列です。

### 3. 名前が通常の形なら、警告つきの呼び出しにする

```ruby:line-numbers=212
    if method.match?(/\A[_a-zA-Z]\w*[?!]?\z/)
      loc, = caller_locations(2,1)
      pre = "_ ="
      mesg = "#{Module === obj ? obj : obj.class}\##{ali} at #{loc.path}:#{loc.lineno} forwarding to private method "
      method_call = <<~RUBY.chomp
        if defined?(_.#{method})
          _.#{method}(#{args})
        else
          ::Kernel.warn #{mesg.dump}"\#{_.class}"'##{method}', uplevel: 1
          _#{method_call}
        end
      RUBY
    end
```

メソッド名が識別子として正しいとき、委譲先にそのメソッドが無ければ、警告を出してから `__send__` で呼びます。呼び出し元の場所を `caller_locations` で取り、警告に入れます。

### 4. 文字列を `eval` して、メソッドを定義する

```ruby:line-numbers=226
    eval(<<~RUBY, nil, __FILE__, __LINE__ + 1)
      proc do
        def #{ali}(#{args})
          #{pre}#{accessor}
          #{method_call}
        end
      end
    RUBY
```

ヒアドキュメントで作ったコードを `eval` します。`proc do ... end` の中に `def 名前` を書いて、その `proc` を返します。`__LINE__ + 1` で、コード内の行番号を実際の場所に近づけています。

## ここがすごい

### 文字列からコードを作って、定義を一度にまとめる

委譲したいメソッドが 10 個あっても、同じ形の `def` を人が書く必要はありません。
名前と委譲先を入れると、同じ形のコードが組み立てられます。

### 委譲先の変化に強い警告

委譲先の将来の変化で、メソッドが無くなることがあります。
`if defined?(_.method)` で確かめて、無ければ警告つきで従来の呼び出しを続けるという、段階的な移行の道が用意されています。

### 行番号をずらさない

`eval` に渡す行番号を `__LINE__ + 1` にして、エラーが出たときの場所が、実際のコードの位置に近くなるようにしています。
生成されたコードの場所を、利用者が追えるように工夫されています。

## まとめ

- 同じ形のメソッドを大量に作る場面では、文字列から `def` を組み立てると、定義の手間を減らせます。
- 委譲先の変化に備えて、警告を出しながら呼び出しを続けると、移行しやすくなります。
- 生成したコードの行番号を合わせると、エラーの場所を追いやすくなります。
