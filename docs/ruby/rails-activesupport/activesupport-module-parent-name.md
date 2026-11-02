---
title: "正規表現 1 回で「親モジュールの名前」を切り出す"
description: "\"M::N\" から \"M\" を取り出す module_parent_name。マッチ前の部分を表す $` と、結果のメモ化、凍結されたモジュールへの配慮が詰まっている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/module/introspection.rb
lines: [11, 22]
function: "Module#module_parent_name"
difficulty: 2
format: 2
tags: [正規表現, キャッシュ, メタプログラミング]
---

## ひとことで

`module_parent_name` は、モジュールやクラスの **外側（親）のモジュールの名前** を返すメソッドです。
`ActiveRecord::Base.module_parent_name` は `"ActiveRecord"`、`Foo::Bar::Baz.module_parent_name` は `"Foo::Bar"` になります。
いちばん外側にある `String` のようなクラスでは `nil` を返します。

## コード

```ruby:line-numbers=11
  def module_parent_name
    if defined?(@parent_name)
      @parent_name
    else
      name = self.name
      return if name.nil?

      parent_name = name =~ /::[^:]+\z/ ? -$` : nil
      @parent_name = parent_name unless frozen?
      parent_name
    end
  end
```

## 前提知識

- **名前空間 `::`**: Ruby ではモジュールの中にクラスやモジュールを入れ子にでき、`Foo::Bar` のように `::` でつないで名前を表します。`self.name` はその完全な名前を文字列で返します（名前のない無名モジュールは `nil`）。
- **インスタンス変数 `@parent_name`**: オブジェクトごとに値を覚えておく変数です。クラスやモジュールもオブジェクトなので、インスタンス変数を持てます。
- **`defined?(@parent_name)`**: その変数に一度でも代入されたかを調べます。値が `nil` でも、代入済みなら真になります。
- **`=~` と `$``**: `文字列 =~ 正規表現` でマッチを試します。成功すると、特殊変数 `$`` に **マッチした部分より前の文字列** が入ります。
- **`/::[^:]+\z/`**: 「`::` の後に `:` 以外の文字が 1 つ以上続いて、文字列が終わる」部分、つまり最後の区切りと最後の名前にマッチします。
- **`-文字列`**: 文字列の前の `-` は、凍結（変更禁止）された重複のない文字列を返します。同じ内容の文字列はメモリ上で 1 つにまとめられます。
- **`frozen?`**: そのオブジェクトが凍結されているかを返します。凍結されたオブジェクトにはインスタンス変数を追加できません。

## 何をしているか

### 1. 計算済みならそれを返す

```ruby:line-numbers=12
    if defined?(@parent_name)
      @parent_name
```
一度計算した結果は `@parent_name` に保存してあります。`defined?` で確認し、あればそのまま返します。

### 2. 名前を取り出す

```ruby:line-numbers=15
      name = self.name
      return if name.nil?
```
無名のモジュール（`Module.new` で作ったもの）は名前が `nil` なので、親もわかりません。何も返さずに終わります。

### 3. 最後の `::` より前を取り出す

```ruby:line-numbers=18
      parent_name = name =~ /::[^:]+\z/ ? -$` : nil
```
`"Foo::Bar::Baz"` に `/::[^:]+\z/` をマッチさせると、マッチするのは `"::Baz"` です。その前の部分 `$`` は `"Foo::Bar"` です。それを `-` で凍結した文字列にします。
`"String"` のように `::` を含まなければマッチせず、`nil` になります。

### 4. 覚えてから返す

```ruby:line-numbers=19
      @parent_name = parent_name unless frozen?
      parent_name
```
モジュールが凍結されていなければ、結果を `@parent_name` に保存します。

## ここがすごい

### split しないで済ませる

素直に書くと `name.split("::")[0...-1].join("::")` のように、いったん配列に分けてからつなぎ直すことになります。これだと途中で配列と複数の文字列が作られます。
正規表現で **最後の区切りだけ** を見つけ、その前を `$`` で受け取れば、作られる文字列は 1 つだけです。

### nil もキャッシュできる

`@parent_name ||= ...` という書き方がよく使われますが、それだと結果が `nil`（親がない）のとき毎回計算し直してしまいます。`defined?` を使えば、「`nil` という答えが出た」ことも覚えておけます。

### 凍結されたモジュールで壊れない

凍結されたオブジェクトにインスタンス変数を代入すると `FrozenError` になります。`unless frozen?` で、その場合はキャッシュをあきらめて計算結果だけを返します。速さより、まず落ちないことを優先しています。

### 結果を凍結して共有する

`-$`` で凍結した文字列を返すので、呼び出し側がうっかり書き換えてキャッシュを壊すことがありません。

## まとめ

- 「最後の区切りより前」は、正規表現と `$`` で配列を作らずに取り出せます。
- `nil` も含めて結果をキャッシュしたいときは、`||=` ではなく `defined?` を使います。
- 凍結されたオブジェクトには書き込めないので、キャッシュ前に `frozen?` を確認すると安全です。
- キャッシュとして返す値は凍結しておくと、外から壊されません。
