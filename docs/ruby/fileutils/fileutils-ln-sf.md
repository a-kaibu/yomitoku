---
title: "既存のリンクを上書きして、シンボリックリンクを作り直す"
description: "FileUtils.ln_sf は、ln_s に force: true を付けた関数。同じ名前のファイルやリンクが既にあっても、エラーにせず作り直す。"
language: ruby
project: "Ruby fileutils (標準ライブラリ)"
repo: https://github.com/ruby/fileutils
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "445150507c580806e66dc58a066a5dea1e2361ba"
file: lib/fileutils.rb
lines: [755, 758]
function: "FileUtils.ln_sf"
difficulty: 1
format: 2
tags: ["ファイル", "イディオム", "API設計"]
---
## ひとことで

`FileUtils.ln_sf` は、シンボリックリンク（別のファイルを指す目印）を作る関数です。
シェルの `ln -sf` に当たります。
同じ名前のリンクやファイルが既にあっても、エラーにせず、上書きして作り直します。

## コード

```ruby:line-numbers=755
  def ln_sf(src, dest, noop: nil, verbose: nil)
    ln_s src, dest, force: true, noop: noop, verbose: verbose
  end
  module_function :ln_sf
```

## 前提知識

- **シンボリックリンク**: 別のファイルやフォルダを指す、特別な目印です。ファイルの名前として見えますが、中身は元のものを参照します。
- **`ln -s` と `ln -sf`**: `-s` はシンボリックリンクを作るオプション、`-f` は既にあるものを上書きするオプションです。
- **`ln_s`**: 同じ `FileUtils` にある、シンボリックリンクを作る関数です。`ln_sf` は、この関数を呼ぶ薄いラッパーです。
- **`force: true`**: キーワード引数で、既存のものを消してから作る指定です。
- **ラッパー**: 別の関数を、決まった引数で呼び直すだけの関数です。

## 何をしているか

### 1. 引数を、そのまま `ln_s` に渡す

```ruby:line-numbers=756
    ln_s src, dest, force: true, noop: noop, verbose: verbose
```

`src` と `dest` は、リンクの元と、作るリンクの名前です。`noop` と `verbose` も、そのまま渡されます。
`ln_sf` 自身が行うのは、`force: true` を付けることだけです。

### 2. 既存の `dest` を、先に消す

`force: true` が付くと、`ln_s` は、`dest` の場所に同じ名前のものが既にあれば、それを削除してからリンクを作ります。
これがあるので、同じ名前でもう一度作っても、「ファイルが既にある」というエラーになりません。

### 3. モジュールの関数として公開する

```ruby:line-numbers=758
  module_function :ln_sf
```

`module_function` によって、`FileUtils.ln_sf` として直接呼べるようになります。
ふだんはクラスのように使い、必要な場面だけ、この関数を呼ぶ形です。

## ここがすごい

### 1 行の関数で、よく使う操作を名前にする

シンボリックリンクを作るのに、「既にあれば消す」という 2 段階が必要です。
`ln_sf` は、その 2 段階を `force: true` の 1 つにまとめています。
利用者は、リンクを作り直すという意図を、そのまま名前にできます。

### シェルの名前を、そのまま Ruby に持ち込んでいる

`ln -sf` を知っている人は、`ln_sf` と見てすぐに分かります。
新しい名前を考えるのではなく、既に定着している名前を使うことで、学ぶ負担が減っています。

### 薄いラッパーで、重複を避けている

`ln_sf` は、`ln_s` の処理を一切書き直していません。
「上書きする」という違いだけを足し、それ以外は `ln_s` に任せています。同じ処理が 2 か所にある、という事態を避けています。

## まとめ

- `ln_sf` は、シンボリックリンクを作る関数です。既存の同名のものを上書きします。
- 実体は、`ln_s` に `force: true` を付けて呼ぶだけの薄いラッパーです。
- シェルの `ln -sf` と同じ名前と動きなので、覚えやすい関数です。
- 1 行で「作り直す」という意図を表せるのが、この関数の良さです。
