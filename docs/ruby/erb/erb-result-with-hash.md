---
title: "ハッシュの値を変数にして、テンプレートを描画する"
description: "ERB#result_with_hash は、ハッシュの鍵をローカル変数としてテンプレートに渡し、描画した文字列を返す。値は一時的な束縛の中だけに存在する。"
language: ruby
project: "Ruby ERB (標準ライブラリ)"
repo: https://github.com/ruby/erb
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1999-2000,2002,2003 Masatoshi SEKI"
commit: "944c1923898f63d55ac0efc01561a87fe7780c7d"
file: lib/erb.rb
lines: [1080, 1086]
function: "ERB#result_with_hash"
difficulty: 2
format: 2
tags: ["文字列処理", "メタプログラミング", "API設計"]
---
## ひとことで

`ERB#result_with_hash` は、ハッシュの **鍵と値の組を、テンプレートの中で使えるローカル変数** として、テンプレートを描画するメソッドです。
`ERB.new("Hello, <%= name %>").result_with_hash(name: "Ann")` は `"Hello, Ann"` を返します。
変数は描画のための一時的な場所にだけ存在し、外には漏れません。

## コード

```ruby:line-numbers=1080
  def result_with_hash(hash)
    b = new_toplevel(hash.keys)
    hash.each_pair do |key, value|
      b.local_variable_set(key, value)
    end
    result(b)
  end
```

## 前提知識

- **ERB**: `<%= %>` の印の中に Ruby の式を書いたテンプレートを、描画する仕組みです。
- **`binding`（束縛）**: ある場所の変数の情報を持ったオブジェクトです。ここでは、描画用の変数の置き場所として使います。
- **`local_variable_set`**: 束縛に、名前付きのローカル変数を設定します。
- **`each_pair`**: ハッシュの鍵と値の組を、順に取り出します。
- **`result(b)`**: 与えられた束縛の中で、テンプレートを描画します。

## 何をしているか

### 1. 描画用の束縛を作る

```ruby:line-numbers=81
#     ```
```

`new_toplevel` で、ハッシュの鍵を名前とする変数を持つ、新しい束縛を作ります。鍵は、この束縛の中で隠されて、外の変数と混ざりません。

### 2. 鍵と値を、束縛の変数として設定する

```ruby:line-numbers=82
#
# - [Execution tags][execution tags]:
#   each begins with `'<%'`, ends with `'%>'`; contains Ruby code to be executed:
```

ハッシュの各組について、鍵の名前の変数に値を入れます。これで、テンプレートの中で `name` のように書くと、その値が使われます。

### 3. その束縛で描画する

```ruby:line-numbers=85
#
```

束縛を渡して `result` を呼ぶと、テンプレートが描画され、文字列が返ります。

## ここがすごい

### テンプレートに、名前を付けて値を渡す

テンプレートの中で `<%= name %>` と書くだけで、ハッシュの値を使えます。
文字列の置き換えではなく、Ruby の変数として扱うので、式も計算もそのまま書けます。

### 描画の外に、変数を残さない

描画用の変数は、専用の束縛の中にだけあります。
同じプログラムの他の場所の変数を書き換えることはありません。

### 前もって作られた束縛を使い回さない

毎回新しい束縛を作るので、前の描画の値が残る心配がありません。
描画ごとに、必要な変数だけが見える状態になります。

## まとめ

- テンプレートに値を渡すときは、ハッシュの鍵を変数名にすると、読みやすい書き方になります。
- 一時的な変数は、専用の束縛に閉じ込めると、外の状態を壊しません。
- 描画のたびに新しい束縛を作ると、前回の値が混ざる心配がありません。
