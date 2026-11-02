---
title: "候補のフォルダを順に試して、最初に見つかったファイルを返す"
description: "ファイル名から、実在するファイルの場所を探す。キャッシュを先に見て、絶対パスならそのまま使い、なければ候補のフォルダを順に試す。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/reloader.rb
lines: [88, 101]
function: "Rack::Reloader::Stat#figure_path"
difficulty: 2
format: 2
tags: [ファイル, キャッシュ, 防御的プログラミング]
---

## ひとことで

`figure_path` は、ファイル名から **本当に存在するファイルの場所** を探すメソッドです。
Rack の `Reloader` が、変更されたファイルを見つけて読み直すときに使われます。
見つからなければ `[false, false]` を返します。

## コード

```ruby:line-numbers=88
      def figure_path(file, paths)
        found = @cache[file]
        found = file if !found and Pathname.new(file).absolute?
        found, stat = safe_stat(found)
        return found, stat if found

        paths.find do |possible_path|
          path = ::File.join(possible_path, file)
          found, stat = safe_stat(path)
          return ::File.expand_path(found), stat if found
        end

        return false, false
      end
```

## 前提知識

- **キャッシュ `@cache`**: 前に見つけた場所を覚えておくハッシュです。
- **`Pathname.new(file).absolute?`**: パスが絶対パス（`/` から始まる）かを調べます。
- **`paths.find do ... end`**: 候補の一覧を順に試し、最初に結果が出たものを返します。
- **`return 値, 値`**: 2 つの値をまとめて返します。配列として受け取れます。
- **`File.expand_path`**: パスを完全な形に直します。

## 何をしているか

### 1. キャッシュと絶対パスを確かめる

```ruby:line-numbers=89
        found = @cache[file]
        found = file if !found and Pathname.new(file).absolute?
        found, stat = safe_stat(found)
        return found, stat if found
```

前に見つけた場所があれば、それを使います。なければ、絶対パスのときだけ、そのまま試します。`safe_stat` で本当に通常のファイルかを確かめ、見つかればすぐ返します。

### 2. 候補のフォルダを順に試す

```ruby:line-numbers=94
        paths.find do |possible_path|
          path = ::File.join(possible_path, file)
          found, stat = safe_stat(path)
          return ::File.expand_path(found), stat if found
        end
```

候補の各フォルダとファイル名をつなぎ、順に確かめます。見つかったら、完全なパスにして返します。

### 3. 見つからなければ false

```ruby:line-numbers=100
        return false, false
```

## ここがすごい

### 同じ確認を 1 か所に

「本当にファイルか」を確かめる処理は `safe_stat` にまとめられています。ここでは、キャッシュ、絶対パス、候補のフォルダのどれから来ても、同じ確認を通ります。

### 見つかった時点で終わる

`find` と `return` の組み合わせで、最初の候補が当たったら残りは試しません。ファイルの数が多くても、必要な分だけ確かめます。

### 失敗を値で返す

見つからないときは例外を出さず、`[false, false]` を返します。呼び出し側は、ファイルの有無をふつうの値として扱えます。

## まとめ

- 候補を順に試すときは、`find` で最初の当たりを返すと簡潔です。
- 同じ確認は 1 つの補助メソッドにまとめると、ずれがなくなります。
- 失敗を例外ではなく値で返すと、よくある「見つからない」場合の扱いが楽になります。
