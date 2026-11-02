---
title: "ポート番号を、いくつかの情報源から順に探す"
description: "リクエストのポート番号を、Host ヘッダ、転送されたヘッダ、既定の値、サーバーの値の順に探し、最初に見つかったものを使う。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/request.rb
lines: [441, 447]
function: "Rack::Request::Helpers#port"
difficulty: 1
format: 2
tags: [ネットワーク, イディオム, 防御的プログラミング]
---

## ひとことで

`port` は、リクエストの **ポート番号**（例: `:8080` の `8080`）を求めるメソッドです。
Web サーバーの前に別のサーバーや proxy が置かれていると、直接の情報だけでは本当のポートが分かりません。そのためこのメソッドは、いくつかの情報源を **決まった順に** 確かめます。

## コード

```ruby:line-numbers=441
      def port
        if authority = self.authority
          _, _, port = split_authority(authority)
        end

        port || forwarded_port&.last || DEFAULT_PORTS[scheme] || server_port
      end
```

## 前提知識

- **ポート番号**: 1 台のサーバーの中で、サービスを区別するための番号です。HTTP は既定で 80、HTTPS は 443 です。
- **`||`（または）**: 左から順に評価し、最初に真（`nil` 以外）になった値を返します。Ruby の「フォールバック」の書き方です。
- **`&.`（安全なナビゲーション）**: 左側が `nil` なら、そのあとの呼び出しをせず `nil` を返します。
- **`if authority = self.authority`**: 代入した値が `nil` でなければ、中の処理を行います。
- **`_, _, port = ...`**: 配列の中から必要なものだけを変数に入れます。`_` は使わない値を捨てる慣習的な名前です。

## 何をしているか

### 1. Host ヘッダから取り出せるなら、それを使う

```ruby:line-numbers=442
        if authority = self.authority
          _, _, port = split_authority(authority)
        end
```

`authority` は `Host: example.com:8080` のような値です。ポートがあれば、`split_authority` で取り出します。

### 2. 候補を順に試す

```ruby:line-numbers=446
        port || forwarded_port&.last || DEFAULT_PORTS[scheme] || server_port
```

左から順に試し、最初に値があるものを返します。

- `port`: Host から取り出せた値
- `forwarded_port&.last`: proxy が転送したポートの一覧の最後（ある場合）
- `DEFAULT_PORTS[scheme]`: `http` や `https` の既定の番号
- `server_port`: サーバーが知っているポート

## ここがすごい

### 「優先順」が一行で読める

`||` を並べるだけで、どの情報を信じるかの順番が見えます。条件分岐を書くより、判断の順序を読み取りやすくなっています。

### 遅い計算は、必要なときだけ

`||` は左から評価して、値が決まればそこで止まります。Host に書かれていれば、`forwarded_port` や `server_port` の計算は行われません。

### 転送の情報を後から使う

proxy が付けたヘッダ（転送されたポート）は、利用者が直接送ったものとは違う可能性があります。Host の値を最優先にしつつ、無いときだけ転送の値を使うという順番で、どこからの情報かを分けています。

## まとめ

- 複数の情報源から値を探すときは、`||` を優先順に並べると、判断の順番が一目で分かります。
- `&.` を使うと、途中で `nil` になっても安全に続けられます。
- 遅い計算は、左から順に評価される `||` の性質で、必要なときだけ行われます。
