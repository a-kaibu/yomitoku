---
title: "フォルダを中身ごと消す、rm -r の Ruby 版"
description: "FileUtils.rm_r は、フォルダの中身をすべて再帰的に消す。force を付けると存在しないものを無視し、secure を付けると安全な削除方法を使う。"
language: ruby
project: "Ruby fileutils (標準ライブラリ)"
repo: https://github.com/ruby/fileutils
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "445150507c580806e66dc58a066a5dea1e2361ba"
file: lib/fileutils.rb
lines: [1325, 1336]
function: "FileUtils.rm_r"
difficulty: 1
format: 2
tags: ["ファイル", "API設計", "防御的プログラミング"]
---
## ひとことで

`FileUtils.rm_r` は、ファイルやフォルダを、中身ごと再帰的に削除する関数です。
シェルの `rm -r` に当たります。
引数に `force:` と `secure:` を付けると、存在しないものを無視したり、安全な削除方法を使ったりできます。

## コード

```ruby:line-numbers=1325
  def rm_r(list, force: nil, noop: nil, verbose: nil, secure: nil)
    list = fu_list(list)
    fu_output_message "rm -r#{force ? 'f' : ''} #{list.join ' '}" if verbose
    return if noop
    list.each do |path|
      if secure
        remove_entry_secure path, force
      else
        remove_entry path, force
      end
    end
  end
```

## 前提知識

- **再帰的な削除**: フォルダの中にあるものを先に消し、最後にフォルダ自身を消すという考え方です。中にフォルダがあれば、同じ手順をその中でも繰り返します。
- **キーワード引数（`force: nil`）**: 名前付きで値を渡す引数です。値を省略すると `nil` になります。
- **`fu_list`**: 1 つのパスでも、パスの配列でも、同じように扱えるように、配列に整える内部関数です。
- **`noop`（ノーオペレーション）**: 実際には何もせず、どうなるかだけを表示する指定です。
- **`module_function`**: このメソッドを、モジュールの関数として直接呼べるようにする指定です。

## 何をしているか

### 1. 引数を、配列に整える

```ruby:line-numbers=1326
    list = fu_list(list)
```

`rm_r` は、1 つのパスも、複数のパスの配列も受け付けます。`fu_list` で、その形を配列に揃えます。
以降は、常に配列として処理できます。

### 2. 確認用のモードを扱う

```ruby:line-numbers=1328
    return if noop
```

`noop: true` のときは、ここで戻ります。実際には消えず、`verbose` のときに表示されるだけです。
消す前に、どのファイルが対象になるかを確かめるための仕組みです。

### 3. 1 つずつ、削除の方法を選ぶ

```ruby:line-numbers=1329
    list.each do |path|
      if secure
        remove_entry_secure path, force
      else
        remove_entry path, force
      end
    end
```

1 つのパスごとに、`secure` が真なら `remove_entry_secure`、そうでなければ `remove_entry` を呼びます。
`force` は、存在しないパスなどのエラーを無視するかを決めます。

## ここがすごい

### 削除の方式を、引数 1 つで切り替える

安全な削除と、ふつうの削除は、中身の処理が違います。それでも、利用者は `secure: true` と書くだけで選べます。
細かい仕組みを隠して、呼び出し側は意図だけを書けます。

### `noop` と `verbose` で、事故を防ぐ

消す前に、表示だけをして確かめられます。消す対象を見てから、本当に実行する、という流れを簡単に作れます。
大きな削除のときに、この仕組みはとても役立ちます。

### 1 つの入口で、複数の対象を扱う

`fu_list` と `each` によって、1 つでも複数でも、同じ書き方で削除できます。
同じ処理を何度も書かなくて済む、シンプルな設計です。

## まとめ

- `rm_r` は、フォルダの中身をすべて再帰的に削除します。
- `force` を付けると、存在しないパスのエラーを無視します。
- `secure` を付けると、安全な削除方法に切り替わります。
- `noop` と `verbose` で、実際に消す前に、対象を確かめられます。
