---
title: "Accept ヘッダの「q=0.8」を読み取る、小さな構文解析"
description: "HTTP の Accept ヘッダのように「値;q=重み, 値」で並んだ文字列を、値と重みの組の配列にする。重みを省略したときは 1.0 とみなす。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [137, 146]
function: "Rack::Utils.q_values"
difficulty: 1
format: 2
tags: [文字列処理, パース, API設計]
---

## ひとことで

`q_values` は、HTTP ヘッダの `Accept` のように **「値;q=重み」をカンマで並べた文字列** を、`[値, 重み]` の組の配列にするメソッドです。
`"text/html;q=0.8, application/json"` は `[["text/html", 0.8], ["application/json", 1.0]]` になります。
`q`（quality＝優先度）が書かれていなければ、最も高い `1.0` とみなします。

## コード

```ruby:line-numbers=137
    def q_values(q_value_header)
      q_value_header.to_s.split(',').map do |part|
        value, parameters = part.split(';', 2).map(&:strip)
        quality = 1.0
        if parameters && (md = /\Aq=([\d.]+)/.match(parameters))
          quality = md[1].to_f
        end
        [value, quality]
      end
    end
```

## 前提知識

- **HTTP ヘッダと Accept**: ブラウザは「HTML が欲しいが JSON でも良い」のように、受け取れる形式を `Accept` ヘッダに書いて送ります。`q=0.8` は「この形式の優先度は 0.8」という意味です。
- **`split`**: 文字列を区切り文字で分けて配列にします。`"a,b".split(",")` は `["a", "b"]` です。`split(';', 2)` は最大 2 つに分けます。
- **`map(&:strip)`**: 配列の各要素に `strip`（前後の空白を削る）を適用します。`&:strip` は `{ |x| x.strip }` の省略形です。
- **`/\Aq=([\d.]+)/.match(文字列)`**: 文字列の先頭が `q=` で始まり、数字とピリオドが続くかを調べます。`md[1]` は `( )` で囲んだ部分です。
- **`to_f`**: 文字列を小数（浮動小数点数）にします。
- **`do ... end` を `map` に渡す**: 各要素の変換結果を集めた配列が返ります。

## 何をしているか

### 1. カンマで分けて、各要素の値と条件を分ける

`"text/html;q=0.8, application/json"` をカンマで分けると、`"text/html;q=0.8"` と `" application/json"` の 2 つになります。

各要素はさらに `;` で 2 つに分け、前後の空白を取り除きます。

```ruby:line-numbers=139
        value, parameters = part.split(';', 2).map(&:strip)
```

`"text/html;q=0.8"` なら `value` は `"text/html"`、`parameters` は `"q=0.8"` です。

### 2. 重みを読み取る。なければ 1.0

重みの既定値は `1.0` です。`parameters` があり、先頭が `q=` の形なら、その数字を小数にして置き換えます。

```ruby:line-numbers=140
        quality = 1.0
        if parameters && (md = /\Aq=([\d.]+)/.match(parameters))
          quality = md[1].to_f
        end
```

`application/json` には `;` がないので、`parameters` は `nil` で、重みは `1.0` のままです。

### 3. 組にして返す

最後に `[value, quality]` の組を作り、`map` が配列にまとめて返します。

## ここがすごい

### 省略を「既定値 1.0」で表す

「重みが書かれていない＝一番優先」というルールは HTTP の仕様どおりです。コードでは `quality = 1.0` を先に書いておくだけで、`if` が偽のときも自然に既定値が使われます。

### 正規表現は先頭だけを見る

`\A` は文字列の先頭を表します。`text/html;foo=q=0.5` のように、途中に `q=` が現れても読み取らないようにしています。

### 分けてから見る

全体を 1 つの正規表現で読むより、「`;` で分ける」→「先頭の `q=` を見る」と段階に分けた方が、どの部分の処理か読み取りやすくなります。

## まとめ

- ヘッダのような「値;条件」の形式は、区切りで分けてから条件を読むと単純に書けます。
- 省略時の既定値を先に決めておくと、`if` は「書かれていた場合」だけを扱えばよくなります。
- `\A` で先頭に縛ると、意図しない途中の一致を防げます。
