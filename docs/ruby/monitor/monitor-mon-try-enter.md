---
title: "待たずにロックを試し、取れなければ諦める"
description: "MonitorMixin#mon_try_enter は、ロックが空いていれば取って true を返し、他のスレッドが持っていれば待たずに false を返す。同じスレッドなら回数を数えて再入する。"
language: ruby
project: "Ruby monitor (標準ライブラリ)"
repo: https://github.com/ruby/monitor
license: "BSD-2-Clause"
copyright: "Copyright (C) 2001 Shugo Maeda <shugo@ruby-lang.org>; Copyright (C) 1993-2013 Yukihiro Matsumoto. All rights reserved."
commit: "b635f1c1df567f65515fac40d423e89d6599a7e6"
file: lib/monitor.rb
lines: [170, 180]
function: "MonitorMixin#mon_try_enter"
difficulty: 2
format: 2
tags: ["並行処理", "ロック不要", "API設計"]
---
## ひとことで

`mon_try_enter` は、ロックを取ってみるメソッドです。取れたら `true` を返し、取れなければ、待たずに `false` を返します。
ほかのスレッドが仕事をしているときに、待つ代わりに別の作業をしたい場面で使えます。
別名の `try_enter` や `try_mon_enter` でも呼べます。

## コード

```ruby:line-numbers=170
  def mon_try_enter
    if @mon_owner != Thread.current
      unless @mon_mutex.try_lock
        return false
      end
      @mon_owner = Thread.current
      @mon_count = 0
    end
    @mon_count += 1
    return true
  end
```

## 前提知識

- **`Mutex`**: Ruby で排他制御に使う、基本のロックです。`try_lock` は、待たずに取ろうとするメソッドです。
- **持ち主（owner）**: いまロックを持っているスレッドです。`Thread.current` で、今動いているスレッドを表せます。
- **カウント（`@mon_count`）**: 同じスレッドが何回ロックを取ったかを記録する数です。解放のたびに 1 ずつ減らされ、0 になったとき本当に解放されます。
- **再入（reentrant）**: 同じスレッドが、すでに持っているロックを、もう一度取れることです。
- **`unless` と `return`**: 条件が偽のときに実行する書き方と、メソッドの結果を早めに返す書き方です。

## 何をしているか

### 1. 持ち主が別なら、ロックを試す

```ruby:line-numbers=171
    if @mon_owner != Thread.current
```

持ち主が今のスレッドでなければ、ほかのスレッドがロックを持っているか、誰も持っていません。
どちらの場合も、まず `try_lock` を試します。

### 2. 取れなければ、すぐに false を返す

```ruby:line-numbers=172
      unless @mon_mutex.try_lock
        return false
      end
```

`try_lock` が失敗したら、待たずに `false` を返します。呼び出し側は、この結果を見て、別の処理に進めます。

### 3. 取れたら、持ち主とカウントを記録する

```ruby:line-numbers=175
      @mon_owner = Thread.current
      @mon_count = 0
```

ロックを取れたら、今のスレッドを持ち主として記録します。カウントは 0 から始めます。

### 4. 再入なら、カウントだけを増やす

```ruby:line-numbers=178
    @mon_count += 1
    return true
```

今のスレッドがすでに持ち主なら、`if` の中は通らず、カウントを 1 増やすだけです。
取れたときも、再入のときも、最後は `true` を返します。

## ここがすごい

### 待たないことを、型ではなく戻り値で伝える

「待たずに試す」という動きが、`false` という戻り値に表れています。例外を使わないので、失敗は普通の判断の結果として扱えます。
呼び出し側は、`if` で素直に分岐できます。

### 持ち主の記録で、再入を区別する

同じスレッドが、もう持っているロックを試すと、`try_lock` は失敗するはずです。
そこで、先に持ち主を比べ、同じなら `try_lock` を通さずにカウントだけ増やします。
これによって、再入が普通のロックと同じように、正しく動きます。

### 解放まで、カウントで数える

カウントが残っているうちは、ロックは解放されません。入れ子になった `synchronize` が、途中で勝手に外さないようにする仕組みです。

## まとめ

- `mon_try_enter` は、待たずにロックを試し、結果を `true` か `false` で返します。
- 持ち主が今のスレッドなら、`try_lock` を通さずに、カウントを増やします。
- 持ち主とカウントを記録しておくことで、再入を安全に扱えます。
- 失敗を例外ではなく戻り値で返すので、呼び出し側は分岐で素直に対応できます。
