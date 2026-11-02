---
title: "前回の通知から状態が変わったかを答える"
description: "Observable#changed? は、変更の印が立っているかを真偽値で返す。印が未設定の状態でも安全に false を返すよう、defined? で確かめる。"
language: ruby
project: "Ruby observer (標準ライブラリ)"
repo: https://github.com/ruby/observer
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "5c871444fd184e1c55af38c7c3b70b769698c891"
file: lib/observer.rb
lines: [202, 208]
function: "Observable#changed?"
difficulty: 1
format: 2
tags: ["設計パターン", "イディオム", "防御的プログラミング"]
---
## ひとことで

`Observable#changed?` は、前回の通知以降にオブジェクトの状態が変わったかどうかを、真偽値で返すメソッドです。
`changed(true)` で立てた印を読み取るための、読み取り専用の窓口です。

## コード

```ruby:line-numbers=202
  def changed?
    if defined? @observer_state and @observer_state
      true
    else
      false
    end
  end
```

## 前提知識

- **真偽値（`true` / `false`）**: 条件が成り立つかどうかを表す値です。Ruby では `nil` と `false` だけが偽として扱われます。
- **`defined? 変数`**: 変数が代入済みかを調べる式です。
- **`and`**: 左の式が真のときだけ、右の式を評価します。
- **`@observer_state`**: 変化があったかを記録する印です。`changed` メソッドで書き換えます。

## 何をしているか

### 1. 印がまだ作られていないかを調べる

```ruby:line-numbers=203
    if defined? @observer_state and @observer_state
```

`defined? @observer_state` で、変数が代入されているかを確かめます。
まだ `changed` を一度も呼んでいなければ、この変数は存在しません。

### 2. 印の値を確かめる

```ruby:line-numbers=203
    if defined? @observer_state and @observer_state
```

`and @observer_state` で、変数が存在し、かつ値が真であるかを調べます。
`and` は左が偽なら右を評価しないので、変数が存在しないときに値を読むことはありません。

### 3. 真偽値として答える

```ruby:line-numbers=204
      true
    else
      false
```

条件が成り立てば `true`、そうでなければ `false` を返します。
中の条件式をそのまま返さず、わざわざ `if` で `true` と `false` に変換しています。

## ここがすごい

このメソッドで面白いのは、印の値を変換して返す点です。`@observer_state` に `nil` が入っていても、`false` が入っていても、呼び出し側には必ず `true` か `false` が届きます。

もし `defined? @observer_state and @observer_state` の結果をそのまま返すと、`nil` や変数の値が漏れてしまいます。`if` で囲むことで、戻り値の型を真偽値に限定しています。

また、`defined?` と `and` の組み合わせで、初期化されていない状態にも安全に答えられます。`Observable` を include するクラスは、`changed` を一度も呼ばなくても `changed?` を呼べます。そのとき `false` が返るので、通知は送られません。

## まとめ

`changed?` は、印が立っているかを `defined?` と `and` で安全に確かめ、必ず `true` か `false` で答えます。印の書き込みは `changed` が担当し、読み取りはこのメソッドが担当する、という役割の分担になっています。
