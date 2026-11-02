---
title: "例外の「原因」をたどってハンドラを探す rescue_with_handler"
description: "rescue_from で登録したハンドラを探し、見つからなければ exception.cause をたどって再帰する。循環する原因で無限ループしないよう訪問済みを記録する。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/rescuable.rb
lines: [100, 113]
function: "ActiveSupport::Rescuable#rescue_with_handler"
difficulty: 2
format: 2
tags: [エラー処理, 再帰, 防御的プログラミング]
---

## ひとことで

`rescue_with_handler` は、Rails の `rescue_from`（「この例外が起きたらこのメソッドで処理する」という登録）に従って、**例外を処理するハンドラを探して実行する** メソッドです。
コントローラで `rescue_from ActiveRecord::RecordNotFound, with: :not_found` と書くと、その例外が起きたときに `not_found` が呼ばれるのは、このメソッドのおかげです。
例外がほかの例外を原因として起きた場合は、その **原因の例外** に対するハンドラも探します。

## コード

```ruby:line-numbers=100
      def rescue_with_handler(exception, object: self, visited_exceptions: [])
        visited_exceptions << exception

        if handler = handler_for_rescue(exception, object: object)
          handler.call exception
          exception
        elsif exception
          if visited_exceptions.include?(exception.cause)
            nil
          else
            rescue_with_handler(exception.cause, object: object, visited_exceptions: visited_exceptions)
          end
        end
      end
```

## 前提知識

- **例外の原因 `cause`**: `rescue` の中で別の例外を `raise` すると、新しい例外の `cause` に元の例外が自動で記録されます。例外が「鎖」のようにつながります。
- **`if handler = ...`**: 代入した値が `nil` でなければ真、という書き方です。ハンドラが見つかったかを判定しつつ、変数に入れています。
- **`handler.call exception`**: 見つかったハンドラ（Proc やメソッドのオブジェクト）を、例外を引数にして実行します。
- **キーワード引数の既定値 `object: self`**: 省略されたら自分自身を使う、という意味です。`visited_exceptions: []` は呼ばれるたびに新しい空の配列になります。
- **`include?`**: 配列にその値が含まれるかを返します。

## 何をしているか

### 1. 訪問済みとして記録する

```ruby:line-numbers=101
        visited_exceptions << exception
```
今調べている例外を `visited_exceptions` に追加します。

### 2. ハンドラが見つかれば実行

```ruby:line-numbers=103
        if handler = handler_for_rescue(exception, object: object)
          handler.call exception
          exception
```
`handler_for_rescue` で、この例外に対するハンドラを探します。見つかれば実行し、処理した例外を返します。

### 3. 見つからなければ原因をたどる

```ruby:line-numbers=106
        elsif exception
          if visited_exceptions.include?(exception.cause)
            nil
          else
            rescue_with_handler(exception.cause, object: object, visited_exceptions: visited_exceptions)
          end
```
例えば、データベースのエラー `PG::ConnectionBad` が起き、それを包んで `MyApp::ServiceError` が投げられたとします。`ServiceError` 用のハンドラがなくても、`cause` の `PG::ConnectionBad` 用のハンドラがあれば、それが実行されます。

原因がすでに訪問済みなら、`nil` を返してあきらめます。そうでなければ、原因の例外で自分自身を再帰的に呼びます。

`exception.cause` が `nil`（原因がない）のときも再帰しますが、次の呼び出しでは `exception` が `nil` なので、`handler_for_rescue` も見つからず、`elsif exception` も偽になり、全体が `nil` を返して終わります。

## ここがすごい

### 包まれた例外でも処理できる

ライブラリはよく、内部で起きた低レベルな例外を、自分のライブラリ用の例外に包み直して投げます。外側の例外だけを見ていると、ハンドラが見つからないことがあります。`cause` をたどることで、**例外の鎖のどこかにハンドラがあれば処理できる** ようになっています。

### 循環しても止まる

通常、例外の原因の鎖は一方向ですが、`raise e, cause: e2` のように手で原因を指定すると、`A → B → A` のような循環を作れてしまいます。その場合、素直に再帰すると無限ループになります。
訪問済みの例外を配列に記録し、同じ例外が出てきたら止めることで、どんな鎖でも必ず終わるようにしています。

### 戻り値で「処理したか」がわかる

処理できれば例外を、できなければ `nil` を返すので、呼び出し側は `rescue_with_handler(exception) || raise` と書けます。コード中のコメントにある使い方です。ハンドラがなければ、元の例外をそのまま投げ直せます。

## まとめ

- Ruby の例外には `cause` があり、包み直された例外の元をたどれます。
- 鎖や木をたどる再帰では、訪問済みを記録すると循環しても止まれます。
- 「処理できたら値、できなければ nil」を返すと、`|| raise` のような書き方ができます。
