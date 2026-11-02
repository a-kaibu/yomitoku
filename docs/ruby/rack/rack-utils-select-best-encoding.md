---
title: "Accept-Encoding の希望から、圧縮方式を 1 つ選ぶ"
description: "Rack::Utils.select_best_encoding は、クライアントの Accept-Encoding の重みと、サーバーが使える方式を照らし合わせ、最も良い圧縮方式を選ぶ。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [273, 315]
function: "Rack::Utils.select_best_encoding"
difficulty: 3
format: 2
tags: ["ネットワーク", "アルゴリズム", "API設計"]
---
## ひとことで

`Rack::Utils.select_best_encoding` は、クライアントの `Accept-Encoding` ヘッダ（「gzip を希望、br は 0.5」のような好みの一覧）と、サーバーが用意できる圧縮方式の一覧を照らし合わせて、**最も良い圧縮方式を 1 つ選ぶ** メソッドです。
該当するものがなければ、圧縮なしの `identity` を返します。
好みの重み（`q` の値）が大きいものを優先し、同じ重みならサーバー側の一覧の順番を優先します。

## コード

::: code-group

```ruby:line-numbers=273 [日本語訳]
    def select_best_encoding(available_encodings, accept_encoding)
      # HTTP/1.1 の仕様（RFC 2616）を参照

      # 先頭の 16 個だけを処理する（長すぎる入力を防ぐ）
      accept_encoding = accept_encoding[0...16]
      expanded_accept_encoding = []
      wildcard_seen = false

      accept_encoding.each do |m, q|
        preference = available_encodings.index(m) || available_encodings.size

        if m == "*"
          unless wildcard_seen
            (available_encodings - accept_encoding.map(&:first)).each do |m2|
              expanded_accept_encoding << [m2, q, preference]
            end
            wildcard_seen = true
          end
        else
          expanded_accept_encoding << [m, q, preference]
        end
      end

      encoding_candidates = expanded_accept_encoding
        .sort do |(_, q1, p1), (_, q2, p2)|
          if r = (q1 <=> q2).nonzero?
            -r
          else
            (p1 <=> p2).nonzero? || 0
          end
        end
        .map!(&:first)

      unless encoding_candidates.include?("identity")
        encoding_candidates.push("identity")
      end

      expanded_accept_encoding.each do |m, q|
        encoding_candidates.delete(m) if q == 0.0
      end

      (encoding_candidates & available_encodings)[0]
    end
```

```ruby:line-numbers=273 [原文]
    def select_best_encoding(available_encodings, accept_encoding)
      # http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html

      # Only process the first 16 encodings
      accept_encoding = accept_encoding[0...16]
      expanded_accept_encoding = []
      wildcard_seen = false

      accept_encoding.each do |m, q|
        preference = available_encodings.index(m) || available_encodings.size

        if m == "*"
          unless wildcard_seen
            (available_encodings - accept_encoding.map(&:first)).each do |m2|
              expanded_accept_encoding << [m2, q, preference]
            end
            wildcard_seen = true
          end
        else
          expanded_accept_encoding << [m, q, preference]
        end
      end

      encoding_candidates = expanded_accept_encoding
        .sort do |(_, q1, p1), (_, q2, p2)|
          if r = (q1 <=> q2).nonzero?
            -r
          else
            (p1 <=> p2).nonzero? || 0
          end
        end
        .map!(&:first)

      unless encoding_candidates.include?("identity")
        encoding_candidates.push("identity")
      end

      expanded_accept_encoding.each do |m, q|
        encoding_candidates.delete(m) if q == 0.0
      end

      (encoding_candidates & available_encodings)[0]
    end
```

:::

## 前提知識

- **Accept-Encoding**: クライアントが、受け取れる圧縮方式とその好みを、`gzip;q=0.8, identity;q=0.5` のように送るヘッダです。
- **`q` の値（重み）**: 0 から 1 の好みの度合いです。省略されたら 1 とみなします。`q=0` は「使わないで」という意味です。
- **`identity`**: 圧縮をしない、という方式です。ほとんどの場合、最後の受け皿として使えます。
- **`index`**: 配列の中で、その値が最初に現れる位置を返します。見つからなければ `nil` です。
- **`sort` と `<=>`**: 比べる規則を渡して、配列を並べ替えます。`<=>` は、大小を `-1`、`0`、`1` で返します。
- **`nonzero?`**: 0 でなければ、その値を返します。0 のときは `nil` です。

## 何をしているか

### 1. 先頭の 16 個だけを見る

::: code-group

```ruby:line-numbers=276 [日本語訳]
      # 先頭の 16 個だけを処理する（長すぎる入力を防ぐ）
      accept_encoding = accept_encoding[0...16]
```

```ruby:line-numbers=276 [原文]
      # Only process the first 16 encodings
      accept_encoding = accept_encoding[0...16]
```

:::

ヘッダに大量の候補が並んでいても、先頭の 16 個だけを扱います。処理量を制限するための上限です。

### 2. `*`（どれでも）を、残りの候補に広げる

```ruby:line-numbers=281
      accept_encoding.each do |m, q|
        preference = available_encodings.index(m) || available_encodings.size

        if m == "*"
          unless wildcard_seen
            (available_encodings - accept_encoding.map(&:first)).each do |m2|
              expanded_accept_encoding << [m2, q, preference]
            end
            wildcard_seen = true
          end
        else
          expanded_accept_encoding << [m, q, preference]
        end
      end
```

各候補について、サーバーの一覧の中での位置（`preference`）を求めます。一覧にない方式なら、一覧の末尾の位置にします。

`*` は、「ほかに指定のないもの」を表します。そこで、まだ明示されていない方式だけを、同じ重みで候補に加えます。`wildcard_seen` で、`*` の展開は 1 回だけにします。

### 3. 重みが大きい順、同じなら一覧の順に並べる

```ruby:line-numbers=296
      encoding_candidates = expanded_accept_encoding
        .sort do |(_, q1, p1), (_, q2, p2)|
          if r = (q1 <=> q2).nonzero?
            -r
          else
            (p1 <=> p2).nonzero? || 0
          end
        end
        .map!(&:first)
```

重み `q` を比べて、大きいものを先にします。重みが同じなら、サーバーの一覧での位置（`p`）が小さい方を先にします。並べ替えが済んだら、方式の名前だけを取り出します。

### 4. `identity` を最後の候補に加え、`q=0` を除く

```ruby:line-numbers=306
      unless encoding_candidates.include?("identity")
        encoding_candidates.push("identity")
      end

      expanded_accept_encoding.each do |m, q|
        encoding_candidates.delete(m) if q == 0.0
      end
```

`identity` が候補になければ、末尾に加えます。そのあと、重みが `0.0` の方式は、使わないという指定なので取り除きます。

### 5. サーバーが用意できるものの、最初の 1 つを返す

```ruby:line-numbers=314
      (encoding_candidates & available_encodings)[0]
```

候補の中で、サーバーが実際に用意できる方式（`available_encodings`）との共通部分を取り、その先頭を返します。

## ここがすごい

### 好みと提供の両方を見て決める

クライアントが好む方式を、サーバーが用意していなければ使えません。
このメソッドは、「好みの順」と「用意できるもの」の共通部分を取ることで、両方を満たす答えだけを選びます。

### `identity` を必ず最後の受け皿にする

どの方式にも合わないときでも、圧縮なしの `identity` が残るので、応答が返せなくなることがありません。
「必ず 1 つは答えがある」という設計です。

### 並べ替えの規則を 2 段にする

重みが同じ方式が複数あるとき、サーバー側の順番で決めるのは、結果を予測しやすくするためです。
`nonzero?` を使って、「重みで決まらなければ位置で決める」と 1 行で書いています。

## まとめ

- 希望の一覧と提供の一覧は、共通部分を取ると、両方を満たす答えが得られます。
- 必ず使える既定の選択肢を用意すると、応答が失敗しなくなります。
- 並べ替えは「第一の基準」と「第二の基準」を分けて書くと、意図が読み取りやすくなります。
