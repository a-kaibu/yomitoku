---
title: "ブロックに制限時間を付けて、途中で打ち切る"
description: "Timeout.timeout は、指定した秒数を超えたら、ブロックの実行に例外を送って止める。Fiber のスケジューラがあれば、その仕組みに任せる。"
language: ruby
project: "Ruby timeout (標準ライブラリ)"
repo: https://github.com/ruby/timeout
license: "BSD-2-Clause OR Ruby"
copyright: "== Copyright"
commit: "c30d55b9e441cb6768afef576f6476e25371222e"
file: lib/timeout.rb
lines: [278, 308]
function: "Timeout.timeout"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理", "API設計"]
---
## ひとことで

`Timeout.timeout` は、ブロックの実行に **制限時間** を付けるメソッドです。
指定した秒数を超えると、ブロックの中に例外（`Timeout::Error`）を送って、処理を途中で打ち切ります。
`Timeout.timeout(5) { slow_task }` は、5 秒を超えたら止まります。

## コード

::: code-group

```ruby:line-numbers=278 [日本語訳]
  def self.timeout(sec, klass = nil, message = nil, &block)   # 秒数 sec を渡して実行されるブロック
    return yield(sec) if sec == nil or sec.zero?
    raise ArgumentError, "Timeout sec must be a non-negative number" if 0 > sec

    message ||= "execution expired"

    if Fiber.respond_to?(:current_scheduler) && (scheduler = Fiber.current_scheduler)&.respond_to?(:timeout_after)
      perform = Proc.new do |exc|
        scheduler.timeout_after(sec, exc, message, &block)
      end
    else
      state = State.instance
      state.ensure_timeout_thread_created

      perform = Proc.new do |exc|
        request = Request.new(Thread.current, sec, exc, message)
        state.add_request(request)
        begin
          return yield(sec)
        ensure
          request.finished
        end
      end
    end

    if klass
      perform.call(klass)
    else
      Error.handle_timeout(message, &perform)
    end
  end
```

```ruby:line-numbers=278 [原文]
  def self.timeout(sec, klass = nil, message = nil, &block)   #:yield: +sec+
    return yield(sec) if sec == nil or sec.zero?
    raise ArgumentError, "Timeout sec must be a non-negative number" if 0 > sec

    message ||= "execution expired"

    if Fiber.respond_to?(:current_scheduler) && (scheduler = Fiber.current_scheduler)&.respond_to?(:timeout_after)
      perform = Proc.new do |exc|
        scheduler.timeout_after(sec, exc, message, &block)
      end
    else
      state = State.instance
      state.ensure_timeout_thread_created

      perform = Proc.new do |exc|
        request = Request.new(Thread.current, sec, exc, message)
        state.add_request(request)
        begin
          return yield(sec)
        ensure
          request.finished
        end
      end
    end

    if klass
      perform.call(klass)
    else
      Error.handle_timeout(message, &perform)
    end
  end
```

:::

## 前提知識

- **スレッド**: 同時に動く処理の流れです。タイムアウトの監視は、別のスレッドで行われます。
- **Fiber**: スレッドより軽い、協調的な処理の流れです。Fiber のスケジューラは、非同期処理の仕組みを管理します。
- **`ensure`**: 処理の終わり方に関係なく、必ず行う後始末です。
- **`Proc.new`**: 手続きを、後で呼べるオブジェクトにします。
- **`return yield(sec)`**: ブロックを実行して、その結果を、このメソッドの戻り値として返します。
- **`Error.handle_timeout`**: タイムアウトを例外として発生させ、必要なら呼び出し側に伝える内部の処理です。

## 何をしているか

### 1. 時間を 0 にする場合は、制限なしで実行する

```ruby:line-numbers=279
    return yield(sec) if sec == nil or sec.zero?
    raise ArgumentError, "Timeout sec must be a non-negative number" if 0 > sec
```

秒数が `nil` か 0 なら、制限なしでブロックを実行します。負の値は、引数の誤りとして例外にします。

### 2. 監視の仕組みを選ぶ

```ruby:line-numbers=284
    if Fiber.respond_to?(:current_scheduler) && (scheduler = Fiber.current_scheduler)&.respond_to?(:timeout_after)
      perform = Proc.new do |exc|
        scheduler.timeout_after(sec, exc, message, &block)
      end
    else
      state = State.instance
      state.ensure_timeout_thread_created

      perform = Proc.new do |exc|
        request = Request.new(Thread.current, sec, exc, message)
        state.add_request(request)
        begin
          return yield(sec)
        ensure
          request.finished
        end
      end
    end
```

Fiber のスケジューラがあれば、その `timeout_after` に任せます。なければ、タイムアウトを監視するスレッドを用意して、要求（`Request`）を登録します。どちらも、実行の中で制限時間を超えたときの処理（`perform`）を作ります。

### 3. 例外を発生させるか、ブロックを実行する

```ruby:line-numbers=303
    if klass
      perform.call(klass)
    else
      Error.handle_timeout(message, &perform)
    end
```

`klass` が指定されていれば、その例外の種類で `perform` を呼びます。指定がなければ、`Error.handle_timeout` を通して、標準の `Timeout::Error` を発生させます。

## ここがすごい

### 別の流れから、処理を止める

制限時間は、ブロックの中の処理とは別の流れで監視されます。
処理の中に時間の確認を書かなくても、外から止められます。

### 監視の仕組みを、実行環境に合わせて切り替える

非同期処理のスケジューラがあれば、その仕組みを使うので、スレッドを増やさずに済みます。
利用者の書き方は同じままで、裏の仕組みが変わります。

### 後始末を `ensure` に任せる

ブロックが終わったら、要求を `finished` にして監視から外します。
途中で例外が起きても、この後始末が行われるので、監視の登録が残りません。

## まとめ

- 制限時間を付けるときは、処理の外から止める仕組みを使うと、処理の中に確認を書かずに済みます。
- 実行環境の仕組みがあれば、それに任せると、資源を無駄にしません。
- 後始末は `ensure` で行うと、どの終わり方でも登録が残りません。
