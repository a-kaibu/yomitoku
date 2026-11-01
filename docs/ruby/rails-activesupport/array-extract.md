---
title: "reject! のついでに取り出す Array#extract!"
description: "条件に合う要素を配列から取り除き、取り除いたものを返す。reject! のブロックの中で「集めながら判定する」一石二鳥の書き方。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/extract.rb
lines: [12, 22]
function: "Array#extract!"
difficulty: 2
tags: [イディオム, イテレータ, クロージャ]
---

## ひとことで

`extract!` は、配列から **条件に合う要素を取り除き、取り除いた要素を配列で返す** メソッドです。
`numbers = [1, 2, 3, 4]` のとき `numbers.extract!(&:odd?)` は `[1, 3]` を返し、`numbers` は `[2, 4]` になります。
「抜き取る」と「残す」を一度に行えるのが特徴です。

## コード

```ruby:line-numbers=12
  def extract!
    return to_enum(:extract!) { size } unless block_given?

    extracted_elements = []

    reject! do |element|
      extracted_elements << element if yield(element)
    end

    extracted_elements
  end
```

## 前提知識

- **ブロックと `yield`**: メソッドに渡された `{ |x| ... }` のブロックを、`yield(値)` で実行します。ブロックの最後の式の値が `yield` の戻り値になります。
- **`&:odd?`**: `{ |x| x.odd? }` の省略形です（シンボルをブロックに変える Ruby の記法）。
- **`reject!`**: ブロックが真を返した要素を配列から **取り除く** 破壊的メソッドです。
- **`a << b if 条件`**: 条件が真のときだけ `a` に `b` を追加します。後置 if の式全体は、条件が偽なら `nil`、真なら `a << b` の結果（配列 `a` 自身）になります。
- **真偽**: Ruby では `nil` と `false` だけが偽で、配列などそれ以外はすべて真です。
- **`to_enum(:extract!) { size }`**: ブロックなしで呼ばれたときに、あとからブロックを渡せる「Enumerator」というオブジェクトを返します。`{ size }` は要素数の見積もりを返すブロックです。

## 何をしているか

### 1. ブロックがないとき（13 行目）

`numbers.extract!` のようにブロックなしで呼ばれたら、Enumerator を返します。`numbers.extract!.with_index { |x, i| i.even? }` のように、ほかのメソッドとつなげて使えます。Ruby 標準の `select` や `reject` も同じ振る舞いをします。

### 2. 取り除きながら集める（15〜19 行目）

`[1, 2, 3, 4]` に `&:odd?` を渡した場合で追います。

| 要素 | `yield` の結果 | ブロックの値 | reject! の判断 |
| --- | --- | --- | --- |
| 1 | 真 | `extracted_elements`（配列＝真） | 取り除く |
| 2 | 偽 | `nil`（偽） | 残す |
| 3 | 真 | 配列（真） | 取り除く |
| 4 | 偽 | `nil` | 残す |

18 行目の後置 if は、条件が真のときに要素を `extracted_elements` に追加し、その配列（真の値）を返します。偽のときは `nil` を返します。この値をそのまま `reject!` が「取り除くかどうか」に使います。

### 3. 集めたものを返す（21 行目）

`extracted_elements` は `[1, 3]` です。

## ここがすごい

### 判定と収集を 1 回のループで

素直に書くと、

```ruby
extracted = select { |e| yield(e) }
reject! { |e| yield(e) }
```

のように 2 回ループし、ブロックも 2 回ずつ呼ぶことになります。ブロックが重い処理だったり、呼ぶたびに結果が変わったりすると困ります。
`extract!` は **ブロックを 1 要素につき 1 回だけ** 呼び、その結果で「集める」と「取り除く」を同時に決めています。

### 後置 if の戻り値を利用する

`a << b if cond` の値が「真なら配列、偽なら nil」になる性質をそのまま `reject!` の判定に使っているのが巧妙です。`true`/`false` を明示的に返す必要がなく、1 行で済んでいます。

### 標準ライブラリの慣習に合わせる

ブロックなしで Enumerator を返すのは、Ruby の `select`、`map`、`reject` などと同じ約束です。新しいメソッドでもこの約束を守ると、ほかのメソッドとの組み合わせが自然にできます。

## まとめ

- 「取り除いた要素も欲しい」なら、取り除く処理のブロックの中で集めるとループが 1 回で済みます。
- Ruby の後置 if は式で、偽のときは `nil` になります。これを真偽値として使えます。
- ブロックなしの呼び出しで Enumerator を返すと、標準メソッドと同じように使えます。
