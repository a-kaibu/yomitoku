---
title: "script タグに埋め込んでも安全な JSON にする json_escape"
description: "JSON 文字列の <, >, & を < のような表記に置き換える。意味を変えずに HTML としての危険だけを消す、べき等な変換。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/erb/util.rb
lines: [137, 145]
function: "ERB::Util#json_escape"
difficulty: 2
tags: [セキュリティ, 文字列処理, Unicode]
---

## ひとことで

`json_escape` は、JSON の文字列を **HTML の中に埋め込んでも安全な形** に変換するメソッドです。
`<`、`>`、`&` をそれぞれ `<`、`>`、`&` に置き換えます。
`<script>var user = <%= raw json_escape(user.to_json) %>;</script>` のように、ページの中に JSON を直接書き出すときに使います。

## コード

```ruby:line-numbers=137
    def json_escape(s)
      result = s.to_s.dup
      result.gsub!(">", '\u003e')
      result.gsub!("<", '\u003c')
      result.gsub!("&", '\u0026')
      result.gsub!("\u2028", '\u2028')
      result.gsub!("\u2029", '\u2029')
      s.html_safe? ? result.html_safe : result
    end
```

## 前提知識

- **JSON**: データをやり取りするための文字列の形式です。JavaScript のオブジェクトの書き方とほぼ同じです。
- **`<` の意味**: JSON や JavaScript の文字列の中では、`\u` に続く 4 桁の 16 進数で文字を表せます。`<` は `<` と **同じ文字** として読まれます。
- **XSS（クロスサイトスクリプティング）**: 攻撃者の書いた文字列がページに埋め込まれ、スクリプトとして実行されてしまう脆弱性です。
- **`'>'`（シングルクォート）**: Ruby のシングルクォートの文字列では `\u` が特別扱いされず、`\`、`u`、`0`… という 6 文字の文字列のままになります。ダブルクォートの `" "` は、その 1 文字（行区切り文字）です。
- **`gsub!`**: マッチした部分をすべて置き換えます（自分自身を書き換えます）。
- **`html_safe?` / `html_safe`**: Rails で「HTML としてそのまま出力してよい」という印があるか / 印を付ける、です。

## 何をしているか

### 1. コピーを作る（138 行目）

`to_s.dup` で、元の文字列を書き換えないようにコピーします。

### 2. 危険な文字を置き換える（139〜143 行目）

`{"name":"</script><script>alert(1)</script>"}` という JSON があったとします。そのまま `<script>` の中に書くと、ブラウザは JSON の中の `</script>` を **script タグの終わり** と解釈してしまい、続く `<script>alert(1)` が実行されます。
置き換え後は `{"name":"</script><script>..."}` となり、HTML としてはタグに見えません。でも JavaScript がこの文字列を読むと、`<` は `<` に戻るので、**データの中身は変わりません。**

U+2028、U+2029 は「行区切り」「段落区切り」という特殊な改行文字です。古い JavaScript では文字列の中にこれらがあると構文エラーになったため、こちらも ` ` という表記に置き換えます。

### 3. 印を引き継ぐ（144 行目）

元の文字列が `html_safe` なら、結果にも印を付けて返します。

## ここがすごい

### 意味を変えずに危険だけを消す

HTML エスケープ（`<` を `&lt;` にする）を使うと、script タグの中では `&lt;` が文字どおり `&lt;` のまま JavaScript に渡ってしまい、データが変わります。
`<` は **JSON の文法の中で同じ意味を持つ別の書き方** なので、HTML パーサーの目はごまかしつつ、JavaScript から見たデータはまったく同じです。場所（HTML と JSON）ごとの文法の違いをうまく利用しています。

### 何度かけても同じ（べき等）

置き換え後の文字列には `<`、`>`、`&` が残っていないので、もう一度 `json_escape` しても何も変わりません。127〜136 行目のコメントにあるとおり、すでにエスケープ済みかどうか分からない JSON にも、安心してかけられます。

### 注意書きがはっきりしている

122〜125 行目のコメントで、「正しい JSON 以外に使うと深刻な XSS になる」と警告しています。この変換は JSON の文字列の中にいることを前提にしているので、ただの文字列に使うと意味がありません。道具の前提を明記しているのも大事な点です。

## まとめ

- HTML に JSON を埋め込むときは、`</script>` で抜け出されないよう `<` などを置き換えます。
- `<` は JSON の中では `<` と同じ意味なので、データを壊さずに安全にできます。
- 何度かけても結果が変わらない変換は、安心して重ねがけできます。
- エスケープは「どこに埋め込むか」によって正しい方法が違います。
