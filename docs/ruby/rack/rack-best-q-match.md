---
title: "「一番いい形式」を q の重みで選ぶ best_q_match"
description: "相手が受け取りたい形式の優先度（q）を見て、サーバーが用意できる形式の中から一番よいものを 1 つ選ぶ。ワイルドカードの形式には低い点を付ける。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [226, 237]
function: "Rack::Utils.best_q_match"
difficulty: 2
format: 2
tags: [API設計, ソート, イディオム]
---

## ひとことで

`best_q_match` は、クライアントが受け取りたい形式（`Accept` ヘッダ）と、サーバーが用意できる形式の一覧を比べて、**一番よい形式を 1 つ返す** メソッドです。
`best_q_match("text/html, application/json;q=0.5", %w[application/json text/html])` は `"text/html"` を返します。`text/html` は重みが既定の `1.0` で、`application/json` は `0.5` だからです。
Rack の `ShowExceptions` でも、HTML と JSON のどちらでエラー画面を返すかを決めるために使われています。

## コード

```ruby:line-numbers=226
    def best_q_match(q_value_header, available_mimes)
      values = q_values(q_value_header)

      matches = values.map do |req_mime, quality|
        match = available_mimes.find { |am| Rack::Mime.match?(am, req_mime) }
        next unless match
        [match, quality]
      end.compact.sort_by do |match, quality|
        (match.split('/', 2).count('*') * -10) + quality
      end.last
      matches&.first
    end
```

## 前提知識

- **`q_values`**: 同じファイルにある前の関数です。`Accept` ヘッダを `[値, 重み]` の配列にします（前の記事を参照してください）。
- **`Rack::Mime.match?(am, req_mime)`**: 用意している形式 `am` が、要求された形式 `req_mime` に合うかを調べます。`text/*` のようなワイルドカードも扱います。
- **`find { |x| ... }`**: 条件に合う最初の要素を返します。見つからなければ `nil` です。
- **`next unless match`**: 条件が偽ならこの回を飛ばして次へ進みます。
- **`sort_by`**: ブロックが返す値の小さい順に並べ替えます。
- **`count('*')`**: 文字列の配列の中で `'*'` と等しい要素の数を数えます。
- **`&.`（安全なナビゲーション）**: 左側が `nil` なら、それ以降を呼ばずに `nil` を返します。

## 何をしているか

### 1. 要求ごとに、合う形式を探す

```ruby:line-numbers=227
      values = q_values(q_value_header)

      matches = values.map do |req_mime, quality|
        match = available_mimes.find { |am| Rack::Mime.match?(am, req_mime) }
        next unless match
        [match, quality]
      end.compact.sort_by do |match, quality|
```

`values` の各要求について、用意している形式の中から最初に合うものを探します。合うものがなければ `next` で飛ばすので、結果には入りません。

### 2. 点数を付けて並べる

```ruby:line-numbers=233
      end.compact.sort_by do |match, quality|
        (match.split('/', 2).count('*') * -10) + quality
      end.last
```

点数は「重み」が基本です。さらに、用意している形式の中に `*` が含まれる（ワイルドカードの形式）と、`-10` の減点を受けます。具体的な形式が、ワイルドカードの形式より優先されるようにするためです。

`sort_by` は点数の小さい順に並べるので、最後の要素（`.last`）が一番高い点数です。

### 3. 一番前の形式名を返す

```ruby:line-numbers=236
      matches&.first
```

`.last` が返すのは `[形式, 重み]` の組なので、`first` で形式名だけを取り出します。合うものが 1 つもなければ `nil` です。

## ここがすごい

### 「どれを返すか」の決め方を 1 行の並べ替えに

優先度の比較を `if` で書くと、重みの比較とワイルドカードの扱いが混ざって読みにくくなります。`sort_by` の 1 つの数値にまとめたので、ルールが「点数の式」として 1 か所に書かれています。

### 合わないものを早めに捨てる

`next unless match` で、合わない要求を最初に落としています。後の並べ替えは、本当に使える候補だけを扱います。

### `&.` で「なし」を自然に扱う

候補が 1 つもないとき、`matches` は `nil` になります。`matches&.first` は、その場合に `nil` を返すので、呼び出し側は `nil` かどうかを確かめるだけで済みます。

## まとめ

- 複数の候補から一番よいものを選ぶときは、点数を付けて並べ替え、最後の要素を取るとわかりやすくなります。
- ワイルドカードのような「大まかな一致」には、点数で減点を付けると、具体的なものが優先されます。
- 合わないものは最初に捨てると、後の処理が単純になります。
