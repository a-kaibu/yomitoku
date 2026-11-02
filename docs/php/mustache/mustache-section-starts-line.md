---
title: 区間のタグが行の先頭にあるかを判定する
description: mustache.php の sectionStartsLine は、{{#section}} のような区間の開始タグが、行の先頭に単独で置かれているかを調べます。行の先頭なら、そのタグの行を出力から消して、余計な空行が残らないようにします。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Parser.php
lines: [383, 396]
function: sectionStartsLine
difficulty: 3
format: 2
tags: [パース, 文字列処理, 状態機械]
---
## ひとことで

`sectionStartsLine` は、Mustache の区間（`{{#items}}` のような開始タグ）が、その行の先頭にあるかを判定する関数です。タグが行の中で単独で置かれていれば、その行は見た目に出るべき内容がないので、改行を含めて出力から消します。テンプレートを整った形で書けるようにするための、細かな決まりを支えています。

## コード

```php:line-numbers=383
    private function sectionStartsLine(array $nodes)
    {
        if ($this->lineTokens === 0) {
            return true;
        }

        if ($this->lineTokens !== 1) {
            return false;
        }

        $prev = end($nodes);

        return $prev && $this->tokenIsWhitespace($prev);
    }
```

## 前提知識

- **スタンドアロン行**: Mustache の仕様では、区間のタグだけが行に置かれていれば、その行は出力に残らない、という決まりがあります。タグの行を改行つきで消すことで、HTML の見た目を崩さずに区間を書けます。
- **トークン**: 字句解析で分けた、テキストやタグの単位です。このパーサーは、行の中で数えたトークンの数を `lineTokens` に持っています。
- **`end` 関数**: 配列の最後の要素を返し、内部の位置を最後へ移す関数です。
- **真偽値の判定**: `$prev && ...` のように、値が存在するかを確かめてから、その中身を調べる書き方です。
- **`private` なメソッド**: クラスの外からは呼べず、同じクラスの中だけで使う関数です。

## 何をしているか

### 1. 行の中のトークン数で判断する

```php:line-numbers=385
        if ($this->lineTokens === 0) {
            return true;
        }

        if ($this->lineTokens !== 1) {
            return false;
        }
```

`lineTokens` が 0 なら、そこは行の先頭なので `true` を返します。1 なら、行の中にほかのトークンが 1 つだけあるので、その正体を次に確かめます。2 つ以上あれば、行の途中に別の内容があるので、`false` を返します。

### 2. 直前のノードが空白かを確かめる

```php:line-numbers=393
        $prev = end($nodes);

        return $prev && $this->tokenIsWhitespace($prev);
```

`end($nodes)` で、直前に作られたノードを取り出します。それが空白のテキストであれば、区間のタグは行の先頭とみなせるので `true` を返します。ノードが無い、または空白でなければ `false` になります。

## ここがすごい

- 行の先頭かどうかを、文字列全体を見直さずに、数えたトークンの情報だけで判断しています。字句解析の途中の状態を使うので、効率よく判定できます。
- 直前のノードを見るだけで、「行の先頭に空白だけがあるか」を確かめています。`if` を重ねて、少しずつ条件を狭めていく形になっていて、読みやすくなっています。
- `$prev && ...` の順番で、ノードが無いときに中身を調べない安全な書き方です。`end` が `false` を返す空の配列でも、エラーになりません。
- 区間の空行を消すという、利用者には見えにくい決まりを、数行の判定にまとめています。テンプレートの書き方と出力の見た目を、両立させています。

## まとめ

`sectionStartsLine` は、区間の開始タグが行の先頭に単独で置かれているかを判定する関数です。トークンの数と、直前のノードが空白かを確かめるだけで、この判断を行っています。Mustache の空行の決まりを、少ない条件で正しく表した関数として、読み応えがあります。
