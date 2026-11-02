---
title: "merge! のブロックを使って入れ子のハッシュを再帰的に合体する"
description: "deep_merge! は、キーが衝突したときに呼ばれる merge! のブロックの中で、値どうしも深く合体できるなら再帰する。たった 10 行の再帰的マージ。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/deep_mergeable.rb
lines: [34, 49]
function: "ActiveSupport::DeepMergeable#deep_merge!"
difficulty: 2
format: 2
tags: [再帰, ハッシュ, データ構造]
---

## ひとことで

`deep_merge` は、ハッシュを **入れ子の中まで合体する** メソッドです。
`{ a: { x: 1 } }.deep_merge({ a: { y: 2 } })` は `{ a: { x: 1, y: 2 } }` になります。ふつうの `merge` だと、`a` の値がまるごと上書きされて `{ a: { y: 2 } }` になってしまいます。
設定ファイルの既定値と、ユーザーの設定を合わせるときなどに使います。

## コード

::: code-group

```ruby:line-numbers=34 [日本語訳]
    def deep_merge(other, &block)
      dup.deep_merge!(other, &block)
    end

    # #deep_merge と同じですが、`self` を書き換えます。
    def deep_merge!(other, &block)
      merge!(other) do |key, this_val, other_val|
        if this_val.is_a?(DeepMergeable) && this_val.deep_merge?(other_val)
          this_val.deep_merge(other_val, &block)
        elsif block_given?
          block.call(key, this_val, other_val)
        else
          other_val
        end
      end
    end
```

```ruby:line-numbers=34 [原文]
    def deep_merge(other, &block)
      dup.deep_merge!(other, &block)
    end

    # Same as #deep_merge, but modifies `self`.
    def deep_merge!(other, &block)
      merge!(other) do |key, this_val, other_val|
        if this_val.is_a?(DeepMergeable) && this_val.deep_merge?(other_val)
          this_val.deep_merge(other_val, &block)
        elsif block_given?
          block.call(key, this_val, other_val)
        else
          other_val
        end
      end
    end
```

:::

## 前提知識

- **`merge!` とブロック**: `h1.merge!(h2) { |key, old, new| ... }` は、`h2` の内容を `h1` に取り込みます。**同じキーが両方にあるときだけ** ブロックが呼ばれ、その戻り値が新しい値になります。ブロックがなければ `h2` の値で上書きです。
- **`DeepMergeable`**: Active Support のモジュールで、`Hash` などに include されています。`deep_merge?(other)` は「相手とも深く合体できるか」を答えるメソッドで、ハッシュでは「相手もハッシュか」を返します。
- **`&block`**: 呼び出し時に渡されたブロックを変数として受け取り、再帰呼び出しにそのまま渡せるようにします。
- **`dup`**: 自分のコピーを作ります。

## 何をしているか

### 1. 非破壊版はコピーして破壊版を呼ぶ

```ruby:line-numbers=34
    def deep_merge(other, &block)
      dup.deep_merge!(other, &block)
    end
```
`deep_merge` は `dup.deep_merge!` するだけです。元のハッシュは変わりません。

### 2. キーが衝突したときの処理

```ruby:line-numbers=40
      merge!(other) do |key, this_val, other_val|
        if this_val.is_a?(DeepMergeable) && this_val.deep_merge?(other_val)
          this_val.deep_merge(other_val, &block)
        elsif block_given?
          block.call(key, this_val, other_val)
        else
          other_val
        end
      end
```
`{ a: { x: 1 }, b: 1 }.deep_merge!({ a: { y: 2 }, b: 2 })` で追ってみます。

- キー `:a`: 両方にあるのでブロックが呼ばれます。`this_val` は `{ x: 1 }`、`other_val` は `{ y: 2 }` です。どちらもハッシュなので、`{ x: 1 }.deep_merge({ y: 2 })` を **再帰的に** 呼び、`{ x: 1, y: 2 }` になります。
- キー `:b`: 値は `1` と `2` です。数値は深く合体できないので、ブロックが渡されていなければ `other_val`（`2`）で上書きします。

### 3. 衝突の解決方法を指定できる

```ruby:line-numbers=43
        elsif block_given?
          block.call(key, this_val, other_val)
```
`deep_merge(other) { |key, a, b| a + b }` のようにブロックを渡すと、合体できない値の衝突をそのブロックで解決します。ブロックは再帰の中にも渡されるので、どの深さでも同じルールが使われます。

## ここがすごい

### 衝突したところだけ再帰する

ハッシュの全キーを自分でループして、「両方にあるか」「両方ハッシュか」を調べる書き方もできます。このコードは、**衝突の検出を `merge!` に任せ**、ブロックの中で「再帰するかどうか」だけを決めています。衝突しないキーは `merge!` がそのまま取り込むので、余計な処理がありません。

### 「合体できるか」を値に聞く

`this_val.is_a?(Hash)` と型で判定するのではなく、`DeepMergeable` を持っているかと `deep_merge?` で判定しています。ハッシュ以外のクラス（Rails の設定オブジェクトなど）も、このモジュールを include すれば深い合体に参加できます。

### 片方だけがハッシュのとき

`{ a: { x: 1 } }.deep_merge({ a: 5 })` のように、片方だけがハッシュの場合、`deep_merge?(5)` は偽になるので、`5` で上書きされます。「合体できないなら新しい方を優先」という、`merge` と同じ自然なルールです。

## まとめ

- `merge!` のブロックは「キーが衝突したときだけ」呼ばれるので、衝突の処理を書く場所として最適です。
- 再帰の判定を「値が合体できるか」にすると、入れ子が何段でも自然に処理できます。
- 受け取ったブロックを再帰呼び出しにも渡すと、どの深さでも同じルールを適用できます。
