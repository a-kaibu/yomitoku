---
title: "弱い参照の先が、まだ生きているかを調べる"
description: "WeakRef#weakref_alive? は、弱参照の先のオブジェクトが、まだ GC で回収されていないかを調べる。委譲の情報があれば生きているとみなす。"
language: ruby
project: "Ruby weakref (標準ライブラリ)"
repo: https://github.com/ruby/weakref
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "24ad4dd3c02aab296e173d8d71775c27553a7648"
file: lib/weakref.rb
lines: [56, 58]
function: "WeakRef#weakref_alive?"
difficulty: 2
format: 2
tags: ["メモリ管理", "GC", "API設計"]
---
## ひとことで

`WeakRef#weakref_alive?` は、弱い参照（`WeakRef`）が指しているオブジェクトが、**まだ生きているか** を調べるメソッドです。
弱い参照は、そのオブジェクトを使い続けるための所有を持たず、ほかに参照が無くなれば、Ruby の GC によって回収されてよいものです。
「回収されていないか」を、この関数で確かめられます。

## コード

```ruby:line-numbers=56
  def weakref_alive?
    @@__map.key?(self) or defined?(@delegate_sd_obj)
  end
```

## 前提知識

- **弱い参照（weak reference）**: 相手を指し示すけれど、相手を生かし続ける責任は持たない参照です。キャッシュや、大きなオブジェクトへの後ろ向きの参照に使われます。
- **GC（ガベージコレクション）**: 使われていないメモリを自動的に回収する仕組みです。
- **`@@__map`（クラス変数）**: クラス全体で共有される値です。ここでは、弱参照の記録をまとめて持つ表です。
- **`key?`**: ハッシュにその鍵があるかを調べます。
- **`defined?`**: 変数や定数、インスタンス変数などが定義されているかを、文字列で答えます。
- **`or`**: 左が偽のときだけ右を評価します。

## 何をしているか

### 1. 弱参照の表に、自分が載っているかを調べる

```ruby:line-numbers=57
    @@__map.key?(self) or defined?(@delegate_sd_obj)
```

`@@__map` は、生きている弱参照の記録をまとめた表です。自分（`self`）が表の鍵として残っていれば、先の値はまだ存在しています。

### 2. 委譲の情報があれば、生きているとみなす

```ruby:line-numbers=57
    @@__map.key?(self) or defined?(@delegate_sd_obj)
```

表に無くても、`@delegate_sd_obj` という印が定義されていれば、委譲先の情報が残っているので、生きているとみなします。

## ここがすごい

### 答えを 1 行で出す

2 つの条件を `or` でつなぐだけで、判定を書いています。複雑な処理ではなく、記録の有無を確かめるだけです。

### GC と協調する

Ruby の GC は、いつオブジェクトを回収するかを、利用者に知らせません。
そこで、この関数は、回収の前後で状態を記録する表に頼り、「今どうなっているか」を確かめられるようにしています。

### 弱参照の不確かさを、戻り値で表す

弱参照は、いつ使えなくなるか分かりません。
「使う前に確かめる」という習慣を促すために、このメソッドは存在します。

## まとめ

- 弱参照は、先が回収されていることがあるので、使う前に生きているかを確かめます。
- 生きているかを表す記録を、別に持っておくと、GC の動きに頼らずに判断できます。
- 条件を `or` でつなぐと、いくつかの手がかりから、答えを簡単に出せます。
