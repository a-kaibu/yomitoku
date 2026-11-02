---
title: "公開フォルダの中のパスを、危ないものから先に弾いて一覧にする"
description: "ディレクトリ一覧画面の入り口。URL のパスをデコードし、不正なパスと公開フォルダの外へのパスを先に確かめ、問題がなければ一覧を作る。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/directory.rb
lines: [102, 112]
function: "Rack::Directory#get"
difficulty: 2
format: 2
tags: [セキュリティ, ファイル, 防御的プログラミング]
---

## ひとことで

`get` は、Rack の `Directory` が URL を受け取ったときの **入り口** です。
パスに問題がなければ、公開フォルダの中のファイルの一覧を返します。問題があれば、`400`（不正なパス）か `403`（禁止）を返します。
ファイル配信の安全を守るため、一覧を作る前に危ないパスを必ず弾きます。

## コード

```ruby:line-numbers=102
    def get(env)
      script_name = env[SCRIPT_NAME]
      path_info = Utils.unescape_path(env[PATH_INFO])

      if client_error_response = check_bad_request(path_info) || check_forbidden(path_info)
        client_error_response
      else
        path = ::File.join(@root, path_info)
        list_path(env, path, path_info, script_name)
      end
    end
```

## 前提知識

- **`env[PATH_INFO]`**: リクエストの URL のパス部分です。`%20` のように符号化されていることがあります。
- **`Utils.unescape_path`**: 符号化された文字を元に戻します。`%20` は空白になります。
- **`||`（または）**: 左から試し、最初に値（ここでは応答）が得られたものを返します。
- **`if x = 式`**: 代入した結果が `nil` でなければ真になります。`client_error_response` に応答を入れつつ、判定に使っています。
- **`File.join(@root, path_info)`**: 公開フォルダのパスと、URL のパスをつなぎます。

## 何をしているか

### 1. パスを元に戻す

```ruby:line-numbers=103
      script_name = env[SCRIPT_NAME]
      path_info = Utils.unescape_path(env[PATH_INFO])
```

URL の符号化を解いて、ファイルシステムで使える形にします。

### 2. 危ないパスは先に弾く

```ruby:line-numbers=106
      if client_error_response = check_bad_request(path_info) || check_forbidden(path_info)
        client_error_response
```

`check_bad_request` と `check_forbidden` を順に試します。どちらかが応答を返せば、その応答をそのまま返し、一覧は作りません。

### 3. 問題がなければ一覧を作る

```ruby:line-numbers=109
        path = ::File.join(@root, path_info)
        list_path(env, path, path_info, script_name)
```

公開フォルダと結び付けたパスで、一覧の画面を作ります。

## ここがすごい

### 「先に弾く」を 1 行で

`||` で 2 つの確認をつなぐと、どちらかが問題を見つけた時点で、その応答が返ります。確認の順番がそのまま、読む順番になっています。

### 一覧を作るのは最後

ファイルの一覧を作る処理は、安全を確かめたあとにだけ行われます。危ないパスのために、フォルダの中身を読むことがありません。

### 符号化を先に解く

`..` が `%2e%2e` のように隠されていても、先に解いておけば、後の確認で見逃しにくくなります。

## まとめ

- 入力を扱う入り口では、危ないものを先に弾くと、後の処理を安全に書けます。
- `||` で確認を並べると、順番と結果が一目で分かります。
- 符号化された入力は、確認の前に元に戻しておくと、抜け道を作りにくくなります。
