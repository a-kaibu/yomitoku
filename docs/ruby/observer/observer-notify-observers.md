---
title: "変更があったときだけ、登録された相手へ知らせる"
description: "Observable#notify_observers は、変化を記録したあとで登録済みの相手にメッセージを送る。通知のたびに状態を戻すので、同じ変化を何度も知らせない。"
language: ruby
project: "Ruby observer (標準ライブラリ)"
repo: https://github.com/ruby/observer
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "5c871444fd184e1c55af38c7c3b70b769698c891"
file: lib/observer.rb
lines: [218, 227]
function: "Observable#notify_observers"
difficulty: 1
format: 2
tags: ["設計パターン", "イディオム", "API設計"]
---
## ひとことで

`Observable#notify_observers` は、**変化があったことを、登録された相手（オブザーバー）へまとめて知らせる** メソッドです。
ボタンが押された、という変化を、そのボタンを見ている複数の部品に伝えるような場面で使われます。
通知の前に変化の状態（`changed`）が真であることを確かめ、通知の後で状態を戻します。

## コード

```ruby:line-numbers=218
  def notify_observers(*arg)
    if defined? @observer_state and @observer_state
      if defined? @observer_peers
        @observer_peers.each do |k, v|
          k.__send__(v, *arg)
        end
      end
      @observer_state = false
    end
  end
```

## 前提知識

- **オブザーバーパターン**: ある対象の変化を、その変化を気にする相手へ自動的に伝える設計です。対象は相手を知っていますが、相手の中身は知りません。
- **`Observable`**: このモジュールを `include` すると、相手の登録や通知のメソッドが使えます。
- **`defined? @observer_state`**: インスタンス変数が定義されているかを調べます。まだ一度も設定されていなければ、通知は行いません。
- **`__send__(名前, *引数)`**: 名前で指定したメソッドを呼びます。相手ごとに違うメソッド名を使えるようにするためです。
- **`*arg`**: 引数をいくつ受け取っても、まとめて配列にします。

## 何をしているか

### 1. 変化があったときだけ通知する

```ruby:line-numbers=219
    if defined? @observer_state and @observer_state
```

`@observer_state` が真のときだけ、通知を行います。`changed` で変化を記録しておけば、変化のない呼び出しでは何もしません。

### 2. 登録された相手へ、決めたメソッドで知らせる

```ruby:line-numbers=220
      if defined? @observer_peers
        @observer_peers.each do |k, v|
          k.__send__(v, *arg)
        end
      end
```

`@observer_peers` は、「相手のオブジェクト（`k`）→ 呼ぶメソッドの名前（`v`）」の対応表です。
表の順に `k.__send__(v, *arg)` を呼び、引数をそのまま渡します。

### 3. 通知が済んだら、変化の状態を戻す

```ruby:line-numbers=225
      @observer_state = false
```

通知が終わったら `@observer_state` を `false` にします。同じ変化を、もう一度通知しないためです。

## ここがすごい

### 相手が何を受け取るかを、利用者が決められる

ここでは、どのメソッドを呼ぶかを `v` という名前で決めています。
相手ごとに `update` 以外の名前を使えるので、1 つの対象を複数の型の相手へ、別々の名前で知らせられます。

### 「変化あり」を 1 回の通知で使い切る

`changed` を真にしたあと、通知したら自動的に偽に戻ります。
通知を 2 回呼んでも、2 回目は何もしません。利用者が状態を管理し忘れても、重複通知を防げます。

### 送る中身を変えずに渡す

`*arg` で受け取った引数を、そのまま `*arg` として相手に渡しています。
通知する側は、どんな引数を送るかを相手に合わせて変える必要がありません。

## まとめ

- 変化の通知は、「変化あり」の印と「通知」を組にすると、無駄な通知を減らせます。
- 相手ごとに呼ぶメソッドの名前を登録しておくと、型の違う相手にも同じ仕組みで伝えられます。
- 通知が済んだら印を戻すと、同じ変化を繰り返し伝えずに済みます。
