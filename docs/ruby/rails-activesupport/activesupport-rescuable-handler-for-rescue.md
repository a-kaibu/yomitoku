---
title: "新しく登録したハンドラを優先し、引数の数に合わせて包む"
description: "rescue_from の登録を後ろから探して最初に一致したものを選び、メソッド名でもブロックでも、引数の有無に関係なく同じ形で呼べる lambda にそろえる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/rescuable.rb
lines: [115, 147]
function: "ActiveSupport::Rescuable#handler_for_rescue"
difficulty: 3
format: 2
tags: [エラー処理, クロージャ, メタプログラミング]
---

## ひとことで

`handler_for_rescue` は、例外に対応する **ハンドラを探し、呼びやすい形にそろえて返す** メソッドです。
`rescue_from` には、メソッド名（`with: :not_found`）でもブロック（`do |e| ... end`）でもハンドラを登録できます。また、例外を引数で受け取るかどうかも自由です。
どんな登録のされ方でも、戻り値は「例外を 1 つ受け取って呼べるもの」になります。

## コード

::: code-group

```ruby:line-numbers=115 [日本語訳]
      def handler_for_rescue(exception, object: self) # 内部用（:nodoc:）
        case rescuer = find_rescue_handler(exception)
        when Symbol
          method = object.method(rescuer)
          if method.arity == 0
            -> e { method.call }
          else
            method
          end
        when Proc
          if rescuer.arity == 0
            -> e { object.instance_exec(&rescuer) }
          else
            -> e { object.instance_exec(e, &rescuer) }
          end
        end
      end

      private
        def find_rescue_handler(exception)
          if exception
            # ハンドラは宣言の順に並んでいますが、もっとも新しく宣言されたものが
            # 最優先になるので、一致するハンドラを
            # 後ろから探します。
            _, handler = rescue_handlers.reverse_each.detect do |class_or_name, _|
              if klass = constantize_rescue_handler_class(class_or_name)
                klass === exception
              end
            end

            handler
          end
        end
```

```ruby:line-numbers=115 [原文]
      def handler_for_rescue(exception, object: self) # :nodoc:
        case rescuer = find_rescue_handler(exception)
        when Symbol
          method = object.method(rescuer)
          if method.arity == 0
            -> e { method.call }
          else
            method
          end
        when Proc
          if rescuer.arity == 0
            -> e { object.instance_exec(&rescuer) }
          else
            -> e { object.instance_exec(e, &rescuer) }
          end
        end
      end

      private
        def find_rescue_handler(exception)
          if exception
            # Handlers are in order of declaration but the most recently declared
            # is the highest priority match, so we search for matching handlers
            # in reverse.
            _, handler = rescue_handlers.reverse_each.detect do |class_or_name, _|
              if klass = constantize_rescue_handler_class(class_or_name)
                klass === exception
              end
            end

            handler
          end
        end
```

:::

## 前提知識

- **`rescue_handlers`**: `rescue_from` で登録された `[例外クラス名, ハンドラ]` の組が、登録順に並んだ配列です。
- **`case 値 when Symbol / when Proc`**: 値の種類で分岐します。シンボルはメソッド名、Proc はブロックです。
- **`object.method(名前)`**: メソッドを名前で取り出して、あとで呼べるオブジェクトにします。
- **`arity`**: メソッドやブロックが受け取る引数の数です。`def not_found` なら 0、`def not_found(e)` なら 1 です。
- **`-> e { ... }`**: 引数を 1 つ受け取る lambda（無名関数）です。
- **`instance_exec(引数, &ブロック)`**: ブロックを `object` を `self` にして実行し、引数も渡します。ブロックの中でコントローラのメソッドが使えるようになります。
- **`reverse_each.detect`**: 配列を後ろから順に見て、ブロックが真を返した最初の要素を返します。
- **`klass === exception`**: クラスの `===` は「そのクラス（またはサブクラス）のオブジェクトか」を調べます。
- **`_, handler = [a, b]`**: 配列を分けて受け取ります。`_` は「使わない値」の慣習的な名前です。

## 何をしているか

### 1. 後ろから探す

```ruby:line-numbers=134
        def find_rescue_handler(exception)
          if exception
            # Handlers are in order of declaration but the most recently declared
            # is the highest priority match, so we search for matching handlers
            # in reverse.
            _, handler = rescue_handlers.reverse_each.detect do |class_or_name, _|
              if klass = constantize_rescue_handler_class(class_or_name)
                klass === exception
              end
            end

            handler
          end
        end
```
`rescue_handlers` を後ろから見て、例外がそのクラスに当てはまる最初の組を探します。
`rescue_from StandardError, with: :generic` の後に `rescue_from RecordNotFound, with: :not_found` と登録したとします。`RecordNotFound` は `StandardError` の一種なので両方に当てはまりますが、後ろから探すので `not_found` が選ばれます。

クラス名が文字列で登録されている場合は、`constantize_rescue_handler_class` で実際のクラスに変換してから比べます。

### 2. メソッド名だった場合

```ruby:line-numbers=117
        when Symbol
          method = object.method(rescuer)
          if method.arity == 0
            -> e { method.call }
          else
            method
          end
```
`object.method(:not_found)` で取り出します。引数を受け取らないメソッドなら、「例外を受け取るが無視して呼ぶ」lambda に包みます。受け取るメソッドなら、そのまま返します。

### 3. ブロックだった場合

```ruby:line-numbers=124
        when Proc
          if rescuer.arity == 0
            -> e { object.instance_exec(&rescuer) }
          else
            -> e { object.instance_exec(e, &rescuer) }
          end
```
引数の数を見て、`instance_exec` でコントローラ（`object`）の中で実行する lambda に包みます。引数ありなら例外を渡します。

## ここがすごい

### 「後から書いたものが優先」を逆順の探索で

コード中のコメントのとおり、ハンドラは登録順に並んでいますが、優先されるのは **最後に登録したもの** です。親クラスのコントローラで一般的なハンドラを登録し、子クラスで特定の例外のハンドラを追加する、という使い方では、より具体的な後者が優先されるべきだからです。並べ替えずに `reverse_each` で後ろから探すだけで実現しています。

### 呼び出し側の分岐をなくす

ハンドラは 4 種類（メソッド名・ブロック × 引数あり・なし）ありえますが、このメソッドがすべて「`call(exception)` で呼べるもの」に変換します。呼び出し側（`rescue_with_handler`）は `handler.call exception` の 1 行で済みます。**違いを吸収する層** を 1 か所に作るのは、よい設計です。

### 文字列のクラス名を許す

`rescue_from "MyGem::Error"` のように文字列で登録できるので、その例外クラスを定義したファイルを、登録の時点で読み込んでおく必要がありません。実際に例外が起きて探すときに、初めてクラスに変換します。

## まとめ

- 「後から登録したものを優先」は、配列を後ろから探すだけで実現できます。
- `arity` を見て lambda で包むと、引数の数が違う関数を同じ形で呼べるようになります。
- いろいろな形の入力を 1 つの形にそろえる層を作ると、使う側のコードが単純になります。
