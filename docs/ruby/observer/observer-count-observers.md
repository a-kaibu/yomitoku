---
title: "登録されている相手の数を数える"
description: "Observable#count_observers は、登録済みの相手の数を返す。まだ一度も登録していなければ、登録表を作らずに 0 を返す。"
language: ruby
project: "Ruby observer (標準ライブラリ)"
repo: https://github.com/ruby/observer
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "5c871444fd184e1c55af38c7c3b70b769698c891"
file: lib/observer.rb
lines: [180, 186]
function: "Observable#count_observers"
difficulty: 1
format: 2
tags: ["設計パターン", "データ構造", "防御的プログラミング"]
---
## ひとことで

`Observable#count_observers` は、このオブジェクトに登録されている相手（オブザーバー）の数を返すメソッドです。
相手が 1 つも登録されていないときは `0` を返します。

## コード

```ruby:line-numbers=180
  def count_observers
    if defined? @observer_peers
      @observer_peers.size
    else
      0
    end
  end
```

## 前提知識

- **オブザーバー**: 変化の通知を受け取る相手です。`add_observer` で登録します。
- **`@observer_peers`**: 登録済みの相手と、通知に呼ぶメソッド名を入れておくインスタンス変数です。
- **`defined? 変数`**: 変数が一度でも代入されていれば真になる式です。値が `nil` でも、代入されていれば真です。
- **`size`**: ハッシュや配列の要素数を返します。

## 何をしているか

### 1. 登録表がまだ作られていないかを調べる

```ruby:line-numbers=181
    if defined? @observer_peers
```

`if defined? @observer_peers` で、`@observer_peers` が存在するかを確かめます。
相手を一度も登録していなければ、この変数は作られていません。その場合に `@observer_peers.size` を呼ぶと、存在しない変数を参照してエラーになります。

### 2. 作られていれば、件数を返す

```ruby:line-numbers=182
      @observer_peers.size
```

登録表が存在すれば `@observer_peers.size` で、登録されている相手の数を返します。

### 3. 作られていなければ 0 を返す

```ruby:line-numbers=184
      0
```

`else` の側では、単に `0` を返します。相手が 0 件であることを、登録表を作らずに表します。

このように、登録表を遅延して（必要になるまで）作る設計では、「まだ何もない」状態を `defined?` で判定します。

## ここがすごい

このメソッドの短さの中に、二つの工夫があります。

一つ目は、`defined?` で存在を確かめてから参照する点です。`@observer_peers ||= {}` のように最初に作っておく方法もありますが、そうすると `count_observers` を呼ぶだけでも空の登録表が作られます。この実装は、読むだけの操作で状態を変えません。

二つ目は、戻り値の型を揃えている点です。どちらの分岐でも整数を返すので、呼び出し側は「登録がないかどうか」を気にせず、そのまま数として比較したり表示したりできます。`nil` を返すと、呼び出し側で `nil` の処理が必要になります。

`Observable` は、通知を送る前に相手が居るかを確かめたいときに使えます。件数が 0 なら、通知の処理を丸ごと省けます。

## まとめ

`count_observers` は、登録表がまだないことを `defined?` で確かめてから件数を返します。登録がなければ `0` を返すので、呼び出し側は `nil` を気にせず数として使えます。
