---
title: "変化があったという印を立てる"
description: "Observable#changed は、変化があったという印を引数の値で設定する。通知は送らず、印を読んだ notify_observers に任せる。"
language: ruby
project: "Ruby observer (標準ライブラリ)"
repo: https://github.com/ruby/observer
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "5c871444fd184e1c55af38c7c3b70b769698c891"
file: lib/observer.rb
lines: [194, 196]
function: "Observable#changed"
difficulty: 1
format: 2
tags: ["設計パターン", "API設計", "イディオム"]
---
## ひとことで

`Observable#changed` は、オブジェクトの「変化があった」という印を立てたり消したりするメソッドです。
印が立っているあいだに `notify_observers` を呼ぶと、登録された相手に通知が送られます。

## コード

```ruby:line-numbers=194
  def changed(state=true)
    @observer_state = state
  end
```

## 前提知識

- **デフォルト引数（`state=true`）**: 引数を省略したとき、その値が使われます。`changed` だけを呼べば、印は立ちます。
- **インスタンス変数（`@observer_state`）**: オブジェクトごとに持つ変数です。ここに印の状態を保存します。
- **真偽値**: `true` は印が立っていることを、`false` は印がないことを表します。

## 何をしているか

### 1. 引数の値を印として保存する

```ruby:line-numbers=195
    @observer_state = state
```

`@observer_state = state` で、引数を変数に入れます。引数が省略されれば `true` が入るので、印が立ちます。`changed(false)` と呼べば、印を消せます。

### 2. 通知を送る側が、この印を読む

このメソッド自身は、通知を送りません。通知を送るかどうかは、後で呼ばれる `notify_observers` が `changed?` で印を読んで判断します。

## ここがすごい

このメソッドは、印を立てる役割だけに絞られています。通知の送信と分けておくと、何度変化があっても、通知は必要なときに一回だけ送れます。

また、引数に既定値を与えているので、`changed` と書くだけで「変わった」を表せます。呼び出し側は真偽値を意識せずに済みます。

## まとめ

`changed` は、引数を `@observer_state` に保存するだけの短いメソッドです。印の書き込みを一か所にまとめ、通知の送信は `notify_observers` に任せる分担になっています。
