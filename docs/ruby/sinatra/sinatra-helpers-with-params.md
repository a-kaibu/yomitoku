---
title: "一時的に params を差し替えて、必ず元へ戻す"
description: "Sinatra の with_params は、ブロックの間だけ params を別のものに差し替える。ensure で、例外が起きても元の params に戻す。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [715, 721]
function: "Sinatra::Helpers#with_params"
difficulty: 2
format: 2
tags: ["エラー処理", "API設計", "防御的プログラミング"]
---
## ひとことで

`Sinatra::Helpers#with_params` は、**ブロックを実行する間だけ `params` を別の値に差し替え**、終わったら必ず元に戻すメソッドです。
内部で別のリクエストのように振る舞わせたいときに使われます。
ブロックの中で例外が起きても、`ensure` によって元の `params` は戻されます。

## コード

```ruby:line-numbers=715
    def with_params(temp_params)
      original = @params
      @params = temp_params
      yield
    ensure
      @params = original if original
    end
```

## 前提知識

- **`params`**: リクエストで送られた値（URL の `?` の後ろや、フォームの値）をまとめたハッシュです。
- **`ensure`**: 例外が起きても、起きなくても、必ず実行される後始末の節です。
- **`yield`**: メソッドに渡されたブロックを実行します。
- **インスタンス変数 `@params`**: オブジェクトの中に保存された値です。
- **`if original`**: 元の値が `nil` や偽でなければ、その値に戻します。

## 何をしているか

### 1. 元の `params` を覚えておく

```ruby:line-numbers=716
      original = @params
```

差し替える前の値を、ローカル変数 `original` に保存します。

### 2. 別の `params` にして、ブロックを実行する

```ruby:line-numbers=717
      @params = temp_params
      yield
```

`@params` を `temp_params` に入れ替えて、`yield` でブロックを実行します。ブロックの中では、差し替えた値が見えます。

### 3. 必ず元に戻す

```ruby:line-numbers=719
    ensure
      @params = original if original
```

`ensure` の中で、元の値を戻します。ブロックが正常に終わっても、例外で止まっても、この処理は実行されます。

## ここがすごい

### 後始末を `ensure` に任せる

値を戻す処理を、ブロックの後に普通に書くと、途中で例外が起きたときに戻し忘れます。
`ensure` に書くことで、どんな終わり方をしても元に戻ります。

### 差し替えを、ブロックの範囲に閉じる

差し替えの効果は、ブロックの中だけで有効です。
外の処理には、いつもの `params` が見えるので、別の部分が影響を受けません。

### 小さな「範囲つきの変更」の型

「一時的に値を変えて、終わったら戻す」は、`with_` という名前で、よく使われる形です。
ブロックを使う書き方にすると、変更の範囲が見た目でわかります。

## まとめ

- 一時的な値の差し替えは、`ensure` で戻すと、例外があっても状態が壊れません。
- ブロックで範囲を区切ると、変更の影響がどこまで及ぶかが明確になります。
- 元の値を変数に覚えておく、という単純な手順が、安全な後始末の鍵になります。
