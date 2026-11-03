---
title: "条件が成り立つ間だけ待ち続ける、ループの書き方"
description: "MonitorMixin::ConditionVariable#wait_while は、ブロックが真を返している間だけ wait を繰り返し、条件が偽になったら抜ける。起こされた理由を毎回確かめ直す。"
language: ruby
project: "Ruby monitor (標準ライブラリ)"
repo: https://github.com/ruby/monitor
license: "BSD-2-Clause"
copyright: "Copyright (C) 2001 Shugo Maeda <shugo@ruby-lang.org>; Copyright (C) 1993-2013 Yukihiro Matsumoto. All rights reserved."
commit: "b635f1c1df567f65515fac40d423e89d6599a7e6"
file: lib/monitor.rb
lines: [123, 127]
function: "MonitorMixin::ConditionVariable#wait_while"
difficulty: 2
format: 2
tags: ["並行処理", "イテレータ", "ロック不要"]
---
## ひとことで

`wait_while` は、「条件が真である間は待つ」という処理を、ブロックを使って書けるようにしたメソッドです。
ブロックが `true` を返す間、`wait` を繰り返します。`false` を返したら、待つのをやめて先に進みます。
条件を毎回確かめ直すので、起こされた理由が本当に条件を満たしているかを、必ず確認できます。

## コード

```ruby:line-numbers=123
    def wait_while
      while yield
        wait
      end
    end
```

## 前提知識

- **条件変数（ConditionVariable）**: 「ある条件になるまで寝て、条件が変わったら起こす」ための道具です。`wait` で寝て、`signal` や `broadcast` で起こします。
- **`while` と `yield`**: `while` は条件が真の間、同じ処理を繰り返します。`yield` は、`wait_while` に渡されたブロックを実行し、その結果（真か偽か）を条件に使います。
- **真と偽（truthy / falsy）**: Ruby では `nil` と `false` だけが偽で、それ以外はすべて真です。
- **モニターとの関係**: `wait` は、モニターのロックを一度手放して寝て、起きたときにロックを取り直します。
- **スプリアスウェイクアップ**: 条件が変わっていないのに、スレッドが起こされてしまうことです。OS や実装の都合で起こり得ます。

## 何をしているか

### 1. ブロックの結果を、条件として調べる

```ruby:line-numbers=124
      while yield
```

`yield` で、呼び出し側が渡したブロックを実行します。例えば `q.wait_while { queue.empty? }` のように書くと、キューが空の間は真になります。
真なら、ループの中へ進み、待ちます。

### 2. 条件が真の間は、寝て待つ

```ruby:line-numbers=125
        wait
```

`wait` で、モニターのロックを手放して寝ます。ほかのスレッドが `signal` か `broadcast` で起こすと、ロックを取り直して、ここから続きを実行します。
続きは、ループの先頭に戻り、もう一度 `yield` で条件を調べます。

### 3. 条件が偽になったら、抜ける

`yield` が `false` か `nil` を返すと、`while` の条件が偽になり、ループを抜けます。
戻り値は `while` のものなので、`wait_while` 全体の結果は使われません。呼び出し側は、「条件が偽になった」という事実だけを受け取ります。

## ここがすごい

### 起こされたあとに、条件を確かめ直す

`wait` の後は、「起こされたから条件を満たしたはずだ」と決めつけず、必ず `yield` で確かめ直します。
起こした側が条件を変えていない場合や、ほかのスレッドが先に処理してしまった場合でも、正しく待ち続けられます。
これは、条件変数を正しく使うときの、基本の作り方です。

### 「待つ」と「確かめる」を、1 つの形にまとめる

利用者は、`wait` を毎回手で書かずに済みます。条件だけをブロックで書けば、ループと待ちの処理は `wait_while` が引き受けます。
うっかり確かめ直しを忘れる、というミスも起きにくくなります。

### `wait_until` との対称性

同じ作りの `wait_until` は、条件が偽の間待ちます。`while` と `until` を使い分けることで、読みやすい 2 つの形になっています。
条件を「真の間」と「偽の間」のどちらで書きたいかで、選べます。

## まとめ

- `wait_while` は、ブロックが真を返す間だけ `wait` を繰り返します。
- 起こされるたびに条件を確かめ直すので、偽の起こされ方にも耐えられます。
- 待ちと確認を 1 つの形にまとめ、確かめ直しを忘れにくくしています。
- `wait_until` と対になっていて、条件の書き方を選べます。
