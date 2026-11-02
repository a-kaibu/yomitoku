---
title: "ブロックの実行時間を、CPU と経過時間に分けて測る"
description: "Benchmark.measure は、ブロックの前後でプロセスの CPU 時間と経過時間を記録し、差を Tms という結果にまとめる。"
language: ruby
project: "Ruby benchmark (標準ライブラリ)"
repo: https://github.com/ruby/benchmark
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "025b15c8ed07d150c21e9349f8acb77db85a089a"
file: lib/benchmark.rb
lines: [303, 313]
function: "Benchmark.measure"
difficulty: 2
format: 2
tags: ["ログ", "API設計", "イディオム"]
---
## ひとことで

`Benchmark.measure` は、ブロックを実行するのにかかった時間を測って、結果を `Benchmark::Tms` というオブジェクトで返すメソッドです。
CPU の時間（ユーザー時間・システム時間）と、実際に過ぎた時間（経過時間）を、別々に記録します。
`Benchmark.measure { ... }.real` のように書くと、経過時間だけを取り出せます。

## コード

::: code-group

```ruby:line-numbers=303 [日本語訳]
  def measure(label = "") # 計測したいブロックを yield で実行する
    t0, r0 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
    yield
    t1, r1 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Benchmark::Tms.new(t1.utime  - t0.utime,
                       t1.stime  - t0.stime,
                       t1.cutime - t0.cutime,
                       t1.cstime - t0.cstime,
                       r1 - r0,
                       label)
  end
```

```ruby:line-numbers=303 [原文]
  def measure(label = "") # :yield:
    t0, r0 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
    yield
    t1, r1 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Benchmark::Tms.new(t1.utime  - t0.utime,
                       t1.stime  - t0.stime,
                       t1.cutime - t0.cutime,
                       t1.cstime - t0.cstime,
                       r1 - r0,
                       label)
  end
```

:::

## 前提知識

- **経過時間（実時間、リアルタイム）**: 時計で見て、実際に過ぎた時間です。
- **CPU 時間**: プロセスが CPU を使った時間です。ユーザー時間は、プログラム自身の計算、システム時間は OS に頼んだ作業の時間です。
- **`Process.times`**: 今のプロセスの CPU 時間を、まとめて返します。子プロセスの時間（`cutime` など）も含みます。
- **`Process.clock_gettime(CLOCK_MONOTONIC)`**: 時計の調整に影響されない、単調増加する時刻です。経過時間の計測に向いています。
- **`yield`**: メソッドに渡されたブロックを実行します。

## 何をしているか

### 1. 開始時の時間を記録する

```ruby:line-numbers=304
    t0, r0 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
```

CPU の時間（`Process.times`）と、単調な時刻を、ブロックの前に記録します。

### 2. ブロックを実行する

```ruby:line-numbers=305
    yield
```

`yield` で、測りたい処理を実行します。

### 3. 終了時の時間との差で、結果を作る

```ruby:line-numbers=306
    t1, r1 = Process.times, Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Benchmark::Tms.new(t1.utime  - t0.utime,
                       t1.stime  - t0.stime,
                       t1.cutime - t0.cutime,
                       t1.cstime - t0.cstime,
                       r1 - r0,
                       label)
```

ブロックの後にもう一度記録し、差を取ります。ユーザー時間、システム時間、子プロセスの時間、経過時間、ラベルを `Tms` にまとめて返します。

## ここがすごい

### CPU 時間と経過時間を分ける

処理が遅い理由は、計算が重いのか、待ちが多いのか、で違います。
CPU の時間と経過時間を分けて記録すると、どちらが長いかで、原因を推測できます。

### 時計の選び方

普通の時刻は、時刻合わせで飛ぶことがあります。
`CLOCK_MONOTONIC` は、前に進むだけなので、差を取る計測に向いています。

### 結果をオブジェクトで返す

時間を数値の配列で返すこともできますが、名前付きのオブジェクトにすると、`real` や `utime` のように、読みやすく取り出せます。

## まとめ

- 処理時間の計測は、CPU の時間と経過時間を分けて記録すると、原因が見えやすくなります。
- 計測の基準には、時刻の飛ばない単調な時計を使うと安全です。
- 結果を名前付きのオブジェクトにすると、利用者が必要な値を簡単に取り出せます。
