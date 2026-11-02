---
title: "名前を後ろから 1 段ずつ削って祖先をたどる module_parents"
description: "\"A::B::C\" の外側にあるモジュールを内側から順に集める。文字列を split して pop しながら、それぞれの名前を定数に変換していく。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/module/introspection.rb
lines: [62, 73]
function: "Module#module_parents"
difficulty: 2
format: 2
tags: [メタプログラミング, リフレクション]
---

## ひとことで

`module_parents` は、モジュールの **外側にあるモジュールを、内側から順にすべて** 返すメソッドです。
`A::B::C.module_parents` は `[A::B, A, Object]` になります。
いちばん外側には必ず `Object`（Ruby のトップレベル）が入ります。

## コード

```ruby:line-numbers=62
  def module_parents
    parents = []
    if module_parent_name
      parts = module_parent_name.split("::")
      until parts.empty?
        parents << ActiveSupport::Inflector.constantize(parts * "::")
        parts.pop
      end
    end
    parents << Object unless parents.include? Object
    parents
  end
```

## 前提知識

- **名前空間**: `A::B::C` は「A の中の B の中の C」です。いちばん外側の定数はすべて `Object` の中にあります。
- **`module_parent_name`**: 同じファイルにある、親の名前（`A::B::C` なら `"A::B"`）を返すメソッドです。
- **`split("::")`**: 文字列を `::` で区切って配列にします。`"A::B".split("::")` は `["A", "B"]` です。
- **`parts * "::"`**: 配列に文字列を `*` すると、その文字列で要素をつなぎます（`join` と同じ）。`["A", "B"] * "::"` は `"A::B"` です。
- **`constantize`**: Active Support のメソッドで、`"A::B"` のような文字列から、実際のモジュールオブジェクトを取り出します。
- **`until 条件 ... end`**: 条件が真になるまで繰り返します（`while` の逆）。
- **`pop`**: 配列の最後の要素を取り除きます。

## 何をしているか

### 1. 親の名前を部品に分ける

```ruby:line-numbers=64
    if module_parent_name
      parts = module_parent_name.split("::")
```
`A::B::C` の親の名前は `"A::B"` なので、`parts` は `["A", "B"]` になります。

### 2. 後ろから 1 つずつ削りながら変換

```ruby:line-numbers=66
      until parts.empty?
        parents << ActiveSupport::Inflector.constantize(parts * "::")
        parts.pop
      end
```
1. `parts * "::"` は `"A::B"` → `A::B` を追加 → `pop` して `["A"]`
2. `"A"` → `A` を追加 → `pop` して `[]`
3. 空になったので終わり

`parents` は `[A::B, A]` です。

### 3. 最後に Object を足す

```ruby:line-numbers=71
    parents << Object unless parents.include? Object
```
`[A::B, A, Object]` を返します。親のないモジュールでも `[Object]` になります。

## ここがすごい

### 名前から親を「計算」している

Ruby のモジュールは、自分がどこに入れ子になっているかを直接は覚えていません。そこで **名前の文字列を手がかりに** 親を求めています。`X = A::B` のように別名を付けても、`X.name` は `"A::B"` のままなので、正しく `[A, Object]` が得られます。

### 内側から外側への順番が自然に決まる

文字列の末尾を `pop` で削っていくと、長い名前（内側）から短い名前（外側）の順に処理されます。並べ替えをしなくても、「近い親から遠い親へ」という使いやすい順番になります。

### Object の重複を防ぐ

`parents << Object unless parents.include? Object` は、すでに `Object` が入っていれば追加しません。通常は入っていませんが、名前の付け方によっては定数の解決結果が `Object` になる場合もありえます。最後の 1 行で、結果に重複がないことを保証しています。

### 配列の掛け算でつなぐ

`parts * "::"` は `parts.join("::")` と同じですが、Ruby の古いコードでよく見られる短い書き方です。配列に整数を掛けると繰り返し（`[1] * 3` は `[1, 1, 1]`）、文字列を掛けるとつなぎ合わせになります。

## まとめ

- モジュールの入れ子は、名前の文字列から計算で求められます。
- 末尾を `pop` で削りながら処理すると、「内側から外側へ」の順番になります。
- 結果に必ず含めたい要素は、最後に「なければ追加」とすると重複を防げます。
- `配列 * 文字列` は `join` の別の書き方です。
