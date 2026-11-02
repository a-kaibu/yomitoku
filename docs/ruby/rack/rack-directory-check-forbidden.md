---
title: "「..」で公開フォルダの外に出ようとするパスを、展開して確かめる"
description: "パスに「..」が含まれるときだけ、実際の絶対パスに展開してから、公開フォルダの中かを調べる。含まれていなければ確かめない。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/directory.rb
lines: [125, 135]
function: "Rack::Directory#check_forbidden"
difficulty: 3
format: 2
tags: [セキュリティ, ファイル, 防御的プログラミング]
---

## ひとことで

`check_forbidden` は、URL のパスが **公開フォルダの外を指していないか** を確かめるメソッドです。
`/../../etc/passwd` のように `..` で外へ出ようとするパスを見つけたら、`403 Forbidden` を返します。
公開フォルダの中なら、`nil` を返して問題なしとします。

## コード

```ruby:line-numbers=125
    def check_forbidden(path_info)
      return unless path_info.include? ".."

      expanded_path = ::File.expand_path(::File.join(@root, path_info))
      return if expanded_path == @root || expanded_path.start_with?(@root_with_separator)

      body = "Forbidden\n"
      [403, { CONTENT_TYPE => "text/plain",
        CONTENT_LENGTH => body.bytesize.to_s,
        "x-cascade" => "pass" }, [body]]
    end
```

## 前提知識

- **`..`**: 1 つ上のフォルダを表すパスの書き方です。何回も重ねると、フォルダの外へ出られます。
- **`File.expand_path(パス)`**: 相対パスや `..` を解いて、完全な絶対パスにします。
- **`start_with?`**: 文字列が指定の文字列で始まるかを調べます。
- **`@root_with_separator`**: 公開フォルダのパスの末尾に区切り文字を付けたものです。ここでは、`/var/www` と `/var/www2` を取り違えないための比較に使います。
- **`return unless 条件`**: 条件が偽のとき、値を返さず（`nil` で）終わります。

## 何をしているか

### 1. `..` がなければ確かめない

```ruby:line-numbers=126
      return unless path_info.include? ".."
```

`..` を含まないパスは、フォルダの外へ出られないとみなして、何もせず終わります。

### 2. 絶対パスに展開する

```ruby:line-numbers=128
      expanded_path = ::File.expand_path(::File.join(@root, path_info))
```

公開フォルダと URL のパスをつなぎ、`..` を解いて完全なパスにします。たとえば `/var/www/../../etc` は `/etc` になります。

### 3. 公開フォルダの中かを確かめる

```ruby:line-numbers=129
      return if expanded_path == @root || expanded_path.start_with?(@root_with_separator)
```

展開したパスが公開フォルダそのもの、または中にあれば、問題なしとして `nil` を返します。

### 4. 外なら 403

```ruby:line-numbers=131
      body = "Forbidden\n"
      [403, { CONTENT_TYPE => "text/plain",
        CONTENT_LENGTH => body.bytesize.to_s,
        "x-cascade" => "pass" }, [body]]
```

外へ出ようとしていれば、403 の応答を返します。

## ここがすごい

### 「..」があるときだけ重い処理をする

`expand_path` はファイルシステムに関わる処理なので、毎回は行いません。`..` があるときだけ展開して比べるので、普通のリクエストの負担が増えません。

### 区切り文字を付けて比べる

`start_with?(@root)` だけだと、`/var/www2/...` が `/var/www` で始まるとみなされてしまいます。末尾に区切りを付けた `@root_with_separator` と比べることで、これを防いでいます。

### 展開してから比べる

文字列の上で `..` を探すだけでは、表記の違いで見逃すかもしれません。実際のパスに展開してから比べるのが、確実な方法です。

## まとめ

- 外へのアクセスを防ぐには、入力を実際のパスに展開してから比べるのが確実です。
- 「前方一致」で比べるときは、区切り文字を付けると、似た名前の別フォルダを誤認しません。
- 危ない可能性があるときだけ重い確認をすると、速さと安全を両立できます。
