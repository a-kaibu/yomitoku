---
title: "同じ中身のメソッドは 1 回だけ eval して使い回す CodeGenerator"
description: "属性ごとに文字列からメソッドを生成するとき、同じソースのメソッドを共有モジュールにキャッシュし、define_method で別名として貼り付ける。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/code_generator.rb
lines: [5, 38]
function: "ActiveSupport::CodeGenerator::MethodSet"
difficulty: 3
format: 2
tags: [メタプログラミング, キャッシュ, 最適化]
---

## ひとことで

`CodeGenerator::MethodSet` は、Rails が **文字列からメソッドを大量に作るとき、同じ中身のメソッドを使い回す** ための仕組みです。
たとえば Active Record は、モデルの列ごとに `name`、`name=`、`name?` などのメソッドを作ります。列名が違っても中身がほとんど同じメソッドなら、一度だけ作って共有すれば、時間もメモリも節約できます。

## コード

```ruby:line-numbers=5
    class MethodSet
      METHOD_CACHES = Hash.new { |h, k| h[k] = Module.new }

      def initialize(namespace)
        @cache = METHOD_CACHES[namespace]
        @sources = []
        @methods = {}
        @canonical_methods = {}
      end

      def define_cached_method(canonical_name, as: nil)
        canonical_name = canonical_name.to_sym
        as = (as || canonical_name).to_sym

        @methods.fetch(as) do
          unless @cache.method_defined?(canonical_name) || @canonical_methods[canonical_name]
            yield @sources
          end
          @canonical_methods[canonical_name] = true
          @methods[as] = canonical_name
        end
      end

      def apply(owner, path, line)
        unless @sources.empty?
          @cache.module_eval("# frozen_string_literal: true\n" + @sources.join(";"), path, line)
        end
        @canonical_methods.clear

        @methods.each do |as, canonical_name|
          owner.define_method(as, @cache.instance_method(canonical_name))
        end
      end
    end
```

## 前提知識

- **`Hash.new { |h, k| h[k] = Module.new }`**: 存在しないキーを読もうとしたときにブロックが呼ばれ、新しいモジュールを作って登録します。キーごとに 1 つずつ、自動でモジュールが用意されるハッシュです。
- **`module_eval(文字列, ファイル名, 行番号)`**: 文字列を Ruby のコードとして、そのモジュールの中で実行します。ファイル名と行番号を渡すと、エラーのときにその場所が表示されます。
- **`method_defined?(名前)`**: その名前のメソッドがモジュールに定義済みかを返します。
- **`instance_method(名前)`**: モジュールのメソッドを、どのオブジェクトにも結び付いていない「メソッドの部品」（UnboundMethod）として取り出します。
- **`define_method(新しい名前, メソッドの部品)`**: 取り出したメソッドを、新しい名前で別のクラスやモジュールに定義します。
- **`fetch(キー) { ... }`**: キーがあればその値を、なければブロックを実行してその結果を返します。

## 何をしているか

### 1. 名前空間ごとの共有モジュール

```ruby:line-numbers=6
      METHOD_CACHES = Hash.new { |h, k| h[k] = Module.new }

      def initialize(namespace)
        @cache = METHOD_CACHES[namespace]
        @sources = []
        @methods = {}
        @canonical_methods = {}
      end
```
`METHOD_CACHES` は、名前空間（用途ごとの区分）ごとに 1 つの共有モジュールを持ちます。このハッシュは定数なので、**すべてのクラスで共有** されます。

### 2. 作りたいメソッドを登録する

```ruby:line-numbers=15
      def define_cached_method(canonical_name, as: nil)
        canonical_name = canonical_name.to_sym
        as = (as || canonical_name).to_sym

        @methods.fetch(as) do
          unless @cache.method_defined?(canonical_name) || @canonical_methods[canonical_name]
            yield @sources
          end
          @canonical_methods[canonical_name] = true
          @methods[as] = canonical_name
        end
      end
```
`define_cached_method(:正式名, as: :付けたい名前)` を呼びます。

- 正式名のメソッドが共有モジュールにまだなく、今回も登録していなければ、ブロックに `@sources` を渡します。呼び出し側はそこにメソッドのソースコードの文字列を追加します。
- すでにあればブロックを呼ばず、ソースは追加されません。
- どちらの場合も、「`as` という名前で、正式名のメソッドを使う」ことを `@methods` に記録します。

### 3. まとめて eval し、貼り付ける

```ruby:line-numbers=28
      def apply(owner, path, line)
        unless @sources.empty?
          @cache.module_eval("# frozen_string_literal: true\n" + @sources.join(";"), path, line)
        end
        @canonical_methods.clear

        @methods.each do |as, canonical_name|
          owner.define_method(as, @cache.instance_method(canonical_name))
        end
      end
```
追加されたソースがあれば、`;` でつないで **1 回の `module_eval`** で共有モジュールに定義します。
その後、記録しておいた対応表に従って、`define_method(as, 共有モジュールのメソッド)` で実際のクラスに貼り付けます。

## ここがすごい

### 文字列の eval は 1 種類につき 1 回だけ

文字列からメソッドを作る `module_eval` は、Ruby のパーサーを動かすので比較的重い処理です。モデルが 100 個、列が 1000 個あるアプリで、同じ形のメソッドを毎回 eval していたら、起動に時間がかかります。
このクラスは、正式名が同じなら **共有モジュールで 1 回作ったメソッドを使い回す** ので、2 回目以降は eval しません。

### 別名で貼り付けても中身は 1 つ

`define_method(as, unbound_method)` は、メソッドの本体（命令列）をコピーせず共有します。たくさんのクラスに同じメソッドを付けても、メモリ上の本体は 1 つです。

### まとめて 1 回の eval

ソースを配列にためて、最後に `;` でつないで 1 回で eval しています。小さな eval を何度も呼ぶより、まとめた方がオーバーヘッドが小さくなります。

### `fetch` で重複登録を防ぐ

同じ `as` の名前で何度登録されても、`@methods.fetch(as)` によって 2 回目以降はブロックが実行されません。登録の処理全体が「最初の 1 回だけ」になっています。

## まとめ

- 文字列からのメソッド生成は重いので、同じものは 1 回だけ作って共有すると速くなります。
- `instance_method` と `define_method` を組み合わせると、1 つのメソッド本体を別の名前で何か所にも付けられます。
- 小さな eval を何度もするより、ソースをためて 1 回で eval する方が効率的です。
- デフォルト値ブロック付きのハッシュは、「キーごとに 1 つ自動で作る」キャッシュに便利です。
