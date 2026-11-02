---
title: "既存の変数を壊さない、描画用の束縛を作る"
description: "ERB#new_toplevel は、テンプレートを描画するための新しい束縛を作る。同名の変数が既にある場合は、ブロック内のローカル変数として隠して上書きを防ぐ。"
language: ruby
project: "Ruby ERB (標準ライブラリ)"
repo: https://github.com/ruby/erb
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1999-2000,2002,2003 Masatoshi SEKI"
commit: "944c1923898f63d55ac0efc01561a87fe7780c7d"
file: lib/erb.rb
lines: [1104, 1113]
function: "ERB#new_toplevel"
difficulty: 3
format: 2
tags: ["メタプログラミング", "メモリ管理", "防御的プログラミング"]
---
## ひとことで

`ERB#new_toplevel` は、テンプレートを描画するための **新しい束縛（binding）を作る** 内部メソッドです。
基になるのは、Ruby のトップレベルの束縛（`TOPLEVEL_BINDING`）です。
同じ名前の変数が既にあっても、描画の中では別の変数として隠して、上書きを防ぎます。

## コード

```ruby:line-numbers=1104
  def new_toplevel(vars = nil)
    b = TOPLEVEL_BINDING
    if vars
      vars = vars.select {|v| b.local_variable_defined?(v)}
      unless vars.empty?
        return b.eval("tap {|;#{vars.join(',')}| break binding}")
      end
    end
    b.dup
  end
```

## 前提知識

- **束縛（binding）**: 変数の見える範囲を、オブジェクトとして取り出したものです。`eval` などで、その中のコードを実行できます。
- **`TOPLEVEL_BINDING`**: プログラムの一番外側の束縛です。
- **`dup`**: 束縛を複製します。複製した束縛に変数を足しても、元には影響しません。
- **`tap { |;変数| ... }`**: ブロックの引数の後ろに `;` を書くと、その名前の変数を、ブロックの中だけのローカル変数として宣言します。
- **`eval`**: 文字列のコードを、指定した束縛の中で実行します。

## 何をしているか

### 1. 基になる束縛を選ぶ

```ruby:line-numbers=105
# ```
```

描画に使う基の束縛として、`TOPLEVEL_BINDING` を選びます。

### 2. 同名の変数を、隠すための準備をする

```ruby:line-numbers=106
# template = 'The time is <%= Time.now %>.'
# erb = ERB.new(template)
# erb.result
# # => "The time is 2025-09-09 10:49:26 -0500."
# ```
```

変数名が指定されていれば、基の束縛にもともとある変数だけを選びます。空でなければ、`tap {|;変数名, ...| break binding}` というコードを評価します。

`;` の後ろに書いた名前は、ブロックの中だけの新しい変数になります。その結果、外の同名の変数と混ざらない束縛が、`break binding` で取り出されます。

### 3. 複製した束縛を返す

```ruby:line-numbers=112
# Details:
```

それ以外の場合は、基の束縛を複製して返します。複製なので、これに変数を足しても、トップレベルの束縛は変わりません。

## ここがすごい

### 同名の変数を、隠して守る

テンプレートの変数と、プログラムの変数が同じ名前だと、片方が壊れてしまいます。
`;` の宣言で、描画の中だけの新しい変数にすると、外の変数は元のまま残ります。

### 束縛を取り出す、珍しい書き方

`break binding` は、ブロックの中で作られた束縛を、外へ返す仕掛けです。
普通の変数の渡し方では作れない、独立した束縛を作る工夫です。

### 複製で、副作用を断つ

トップレベルの束縛を直接使うと、描画で足した変数が、以後のすべての描画に残ります。
複製すれば、その心配がなくなります。

## まとめ

- 描画の変数は、外の変数と分けて隠すと、互いの値を壊しません。
- 束縛は複製して使うと、描画ごとの変更が次の描画に残りません。
- 同名の変数を隠す宣言（`;`）を使うと、外の状態を守りながら新しい変数を作れます。
