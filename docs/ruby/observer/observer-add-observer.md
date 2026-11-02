---
title: "通知を受ける相手と、呼ぶメソッド名を登録する"
description: "Observable#add_observer は、相手と通知時に呼ぶメソッド名を対応表に登録する。相手がそのメソッドを持たなければ、登録の時点で NoMethodError にする。"
language: ruby
project: "Ruby observer (標準ライブラリ)"
repo: https://github.com/ruby/observer
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "5c871444fd184e1c55af38c7c3b70b769698c891"
file: lib/observer.rb
lines: [153, 159]
function: "Observable#add_observer"
difficulty: 2
format: 2
tags: ["設計パターン", "API設計", "防御的プログラミング"]
---
## ひとことで

`Observable#add_observer` は、変化を知らせてほしい相手（オブザーバー）と、**通知されたときに呼ぶメソッドの名前** を登録するメソッドです。
登録の時点で、相手がそのメソッドを持っているかを確かめ、持っていなければ `NoMethodError` を出します。
`func` の既定値は `:update` です。

## コード

```ruby:line-numbers=153
  def add_observer(observer, func=:update)
    @observer_peers = {} unless defined? @observer_peers
    unless observer.respond_to? func
      raise NoMethodError, "observer does not respond to `#{func}'"
    end
    @observer_peers[observer] = func
  end
```

## 前提知識

- **オブザーバー**: 変化の通知を受けたい相手です。
- **`respond_to?`**: オブジェクトが、そのメソッドを持っているかを調べます。
- **`defined? @observer_peers`**: インスタンス変数が、まだ作られていないかを調べます。
- **ハッシュの鍵と値**: 鍵は相手のオブジェクト、値は呼ぶメソッドの名前です。
- **`raise NoMethodError`**: 例外を発生させます。メソッドが無いことを示す種類の例外です。

## 何をしているか

### 1. 登録表がなければ、作る

```ruby:line-numbers=154
    @observer_peers = {} unless defined? @observer_peers
```

`@observer_peers` は、初めて登録されるときに作ります。すでにあれば、そのまま使います。

### 2. 相手がメソッドを持つかを確かめる

```ruby:line-numbers=155
    unless observer.respond_to? func
      raise NoMethodError, "observer does not respond to `#{func}'"
    end
```

`respond_to?` で、相手が `func` のメソッドを持っているか確かめます。持っていなければ、登録しないで例外を出します。

### 3. 対応を登録する

```ruby:line-numbers=158
    @observer_peers[observer] = func
```

相手をハッシュの鍵、メソッドの名前を値にして登録します。同じ相手を 2 回登録すると、後の値で上書きされます。

## ここがすごい

### 間違いを、登録の時点で見つける

通知のたびに、相手のメソッドが無いと分かるのは遅すぎます。
登録のときに確かめると、設定ミスがその場で分かり、原因の場所も近くなります。

### 呼ぶ名前を、利用者が選べる

既定値は `:update` ですが、別の名前を指定できます。相手ごとに違うメソッドを使えるので、型の違う相手をまとめて扱えます。

### 登録表を、必要になったら作る

使わない限り、表を作らないので、オブザーバーを持たないオブジェクトは余計なものを持ちません。

## まとめ

- 通知の仕組みは、登録のときに相手を確かめると、間違いを早く見つけられます。
- 呼ぶメソッドの名前を登録できるようにすると、相手の型を柔軟に扱えます。
- 使われないかもしれない表は、必要になったときに作ると、無駄がありません。
