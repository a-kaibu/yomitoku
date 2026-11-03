---
title: "ロックの取得と解放の間に、割り込みを入れさせない"
description: "MonitorMixin#mon_synchronize は、ブロックの前後のロック操作を Thread.handle_interrupt で守り、タイムアウトなどの例外でロックの状態が壊れないようにする。"
language: ruby
project: "Ruby monitor (標準ライブラリ)"
repo: https://github.com/ruby/monitor
license: "BSD-2-Clause"
copyright: "Copyright (C) 2001 Shugo Maeda <shugo@ruby-lang.org>; Copyright (C) 1993-2013 Yukihiro Matsumoto. All rights reserved."
commit: "b635f1c1df567f65515fac40d423e89d6599a7e6"
file: lib/monitor.rb
lines: [230, 235]
function: "MonitorMixin#mon_synchronize"
difficulty: 3
format: 2
tags: ["並行処理", "ロック不要", "防御的プログラミング"]
---
## ひとことで

`mon_synchronize` は、ブロックを排他的に実行するメソッドです。ロックを取り、ブロックを実行し、最後にロックを外します。
`synchronize` という別名でも呼べます。
ロックの取得と解放の部分を、`Thread.handle_interrupt` で守っているのが、この実装の特徴です。

## コード

```ruby:line-numbers=230
    Thread.handle_interrupt(Exception => :never){ mon_enter }
    begin
      yield
    ensure
      Thread.handle_interrupt(Exception => :never){ mon_exit }
    end
```

## 前提知識

- **排他制御（ロック）**: 同時に 1 つのスレッドだけが、ある処理を実行できるようにする仕組みです。
- **モニター**: ロックと、その持ち主（どのスレッドが持っているか）をまとめた仕組みです。同じスレッドは、ロックを何度取っても待たされません。
- **`yield`**: `synchronize` に渡されたブロックを実行します。
- **`Thread.handle_interrupt`**: スレッドに届く割り込み（`Thread#raise` や `Timeout` による例外）を、指定した範囲だけ遅らせる仕組みです。
- **`ensure`**: 正常終了でも例外でも、必ず最後に実行される節です。

## 何をしているか

### 1. ロックを取る間は、例外を受け付けない

```ruby:line-numbers=230
    Thread.handle_interrupt(Exception => :never){ mon_enter }
```

`mon_enter` の途中で `Timeout` などの例外が届くと、ロックを取ったつもりが取れていない、という状態になります。
`:never` を指定すると、この `mon_enter` の間だけは例外が遅らされます。`mon_enter` が終わると、遅らされた例外は、次の安全な場所で届きます。

### 2. ブロックは、普通に実行する

```ruby:line-numbers=231
    begin
      yield
```

ロックを持った状態で、利用者のブロックを実行します。ブロックの中の例外は、普通に外へ伝わります。

### 3. 最後に、ロックを必ず外す

```ruby:line-numbers=233
    ensure
      Thread.handle_interrupt(Exception => :never){ mon_exit }
```

`ensure` の中でも同じように、解放の間は例外を遅らせます。
解放の途中で割り込みが入ると、ロックが外れないまま残ってしまうからです。

## ここがすごい

### ロックの状態を、割り込みから守る

ロックは、取る処理と外す処理が、必ず対になっている必要があります。
途中で例外が入ると、どちらかが抜けて、ロックが永久に残るか、持っていないロックを外そうとします。
`handle_interrupt` で、その間だけ例外を遅らせると、この 2 つの食い違いを防げます。

### 同じスレッドが、何度でも入れる

`mon_enter` は、すでに持っているスレッドが再び呼んでも、待たされません。カウントを増やすだけです。
そのため、`synchronize` の中で別の `synchronize` を呼んでも、デッドロックになりません。

### `synchronize` という名前で、ほかのライブラリと揃える

`alias synchronize mon_synchronize` によって、`Mutex#synchronize` と同じ名前で呼べます。
ロックの使い方を、Ruby の標準的な書き方に合わせています。

## まとめ

- `mon_synchronize` は、ブロックをロックの中で実行します。
- ロックの取得と解放を `Thread.handle_interrupt` で守り、割り込みによる食い違いを防ぎます。
- 解放は `ensure` の中で必ず行われるので、例外が起きてもロックは残りません。
- 同じスレッドは再入できるので、入れ子の `synchronize` も安全です。
